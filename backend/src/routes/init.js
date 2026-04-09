const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');

const db = require('../db');
const { ApiError, StatusCodes } = require('../errors');
const { productCreateSchema } = require('../validators');
const { authenticateJWT, requireRole } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(express.text({ type: ['text/csv', 'application/csv'], limit: '5mb' }));

function toNumber(v) {
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') return NaN;
  // przecinek jako separator dziesiętny
  const normalized = v.replace(',', '.').trim();
  return Number(normalized);
}

async function loadCategoriesMap(trx) {
  const categories = await trx('categories').select('id', 'name');
  const byId = new Map(categories.map(c => [Number(c.id), c]));
  const byName = new Map(categories.map(c => [String(c.name).toLowerCase(), c]));
  return { byId, byName };
}

function normalizeProductRow(raw, categoriesMap) {
  // dopuszczamy:
  // - category_id (liczba)
  // - albo category_name (tekst), wtedy mapujemy do id
  let category_id = raw.category_id;

  if (category_id !== undefined && category_id !== null && category_id !== '') {
    category_id = Number(category_id);
  } else if (raw.category_name) {
    const c = categoriesMap.byName.get(String(raw.category_name).toLowerCase().trim());
    category_id = c ? Number(c.id) : NaN;
  } else {
    category_id = NaN;
  }

  return {
    name: raw.name ?? raw.nazwa,
    description: raw.description ?? raw.opis,
    unit_price: toNumber(raw.unit_price ?? raw.cena ?? raw.price),
    unit_weight: toNumber(raw.unit_weight ?? raw.waga ?? raw.weight),
    category_id,
  };
}

function parseCsvToObjects(csvText) {
  return parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });
}

router.post(
  '/',
  authenticateJWT,
  requireRole('PRACOWNIK'),
  upload.single('file'),
  async (req, res, next) => {
    const trx = await db.transaction();
    try {
      // 1) jeśli są już produkty -> błąd
      const countRes = await trx('products').count({ cnt: '*' }).first();
      const cnt = Number(countRes?.cnt ?? 0);
      if (cnt > 0) {
        throw new ApiError(
          StatusCodes.CONFLICT,
          'Inicjalizacja zablokowana: w bazie istnieją już produkty',
          { products_count: cnt },
          'INIT_NOT_ALLOWED'
        );
      }

      // 2) Pobierz dane wejściowe (JSON lub CSV)
      let rawItems = null;

      // a) plik
      if (req.file && req.file.buffer) {
        const text = req.file.buffer.toString('utf8');
        const trimmed = text.trim();

        // Wykrywanie po treści
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        rawItems = JSON.parse(trimmed);
        } else {
        rawItems = parseCsvToObjects(text);
        }
      } else {
        // b) JSON body
        if (req.is('application/json')) {
          rawItems = Array.isArray(req.body) ? req.body : (req.body?.products ?? null);
        }
        // c) CSV jako tekst w body
        if (!rawItems && (req.is('text/csv') || req.is('application/csv'))) {
          rawItems = parseCsvToObjects(req.body);
        }
      }

      if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'Brak danych do inicjalizacji. Prześlij JSON (array lub {products:[]}) albo CSV.',
          null,
          'VALIDATION_ERROR'
        );
      }

      // 3) Walidacja + mapowanie kategorii
      const categoriesMap = await loadCategoriesMap(trx);

      const normalized = [];
      const errors = [];

      rawItems.forEach((row, idx) => {
        const p = normalizeProductRow(row, categoriesMap);

        const parsed = productCreateSchema.safeParse(p);
        if (!parsed.success) {
          errors.push({
            row: idx + 1,
            message: 'Błędne dane produktu',
            details: parsed.error.flatten(),
            raw: row,
          });
          return;
        }

        // walidacja istnienia kategorii
        if (!categoriesMap.byId.has(parsed.data.category_id)) {
          errors.push({
            row: idx + 1,
            message: 'Nie istnieje kategoria dla produktu',
            details: { category_id: parsed.data.category_id, category_name: row.category_name ?? null },
            raw: row,
          });
          return;
        }

        normalized.push(parsed.data);
      });

      if (errors.length) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'Inicjalizacja przerwana: dane wejściowe zawierają błędy',
          { errors },
          'VALIDATION_ERROR'
        );
      }

      // 4) Insert
      await trx('products').insert(normalized);
      await trx.commit();

      return res.status(StatusCodes.OK).json({
        ok: true,
        message: 'Zainicjalizowano produkty w bazie',
        inserted: normalized.length,
      });
    } catch (e) {
      await trx.rollback();
      next(e);
    }
  }
);

module.exports = router;
