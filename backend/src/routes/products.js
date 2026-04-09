const express = require('express');
const db = require('../db');
const { ApiError, StatusCodes } = require('../errors');
const { productCreateSchema, productUpdateSchema } = require('../validators');
const { authenticateJWT, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const rows = await db('products')
      .select('products.*', 'categories.name as category_name')
      .join('categories', 'categories.id', 'products.category_id')
      .orderBy('products.id', 'asc');
    res.json(rows);
  } catch (e) { next(e); }
});

const { generateSeoHtml } = require('../services/seo');

// GET /products/:id/seo-description
router.get('/:id/seo-description', async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const product = await db('products')
      .select('products.*', 'categories.name as category_name')
      .join('categories', 'categories.id', 'products.category_id')
      .where('products.id', id)
      .first();

    if (!product) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Produkt nie istnieje', { id }, 'PRODUCT_NOT_FOUND');
    }

    const cached = await db('product_seo_descriptions').where({ product_id: id }).first();
    if (cached?.html) {
      return res.type('html').send(cached.html);
    }

    const html = await generateSeoHtml(product);

    await db('product_seo_descriptions')
      .insert({ product_id: id, html })
      .onConflict('product_id')
      .merge({ html, updated_at: db.fn.now() });

    return res.type('html').send(html);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const row = await db('products')
      .select('products.*', 'categories.name as category_name')
      .join('categories', 'categories.id', 'products.category_id')
      .where('products.id', id)
      .first();

    if (!row) throw new ApiError(StatusCodes.NOT_FOUND, 'Produkt nie istnieje', { id }, 'PRODUCT_NOT_FOUND');
    res.json(row);
  } catch (e) { next(e); }
});

router.post('/', authenticateJWT, requireRole('PRACOWNIK'), async (req, res, next) => {
  try {
    const parsed = productCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Błędne dane produktu', parsed.error.flatten(), 'VALIDATION_ERROR');
    }

    const cat = await db('categories').where({ id: parsed.data.category_id }).first();
    if (!cat) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Nie istnieje taka kategoria', { category_id: parsed.data.category_id }, 'CATEGORY_NOT_FOUND');
    }

    const [newId] = await db('products').insert(parsed.data);
    const created = await db('products').where({ id: newId }).first();
    res.status(StatusCodes.CREATED).json(created);
  } catch (e) { next(e); }
});

router.put('/:id', authenticateJWT, requireRole('PRACOWNIK'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const exists = await db('products').where({ id }).first();
    if (!exists) throw new ApiError(StatusCodes.NOT_FOUND, 'Nie ma produktu o takim id', { id }, 'PRODUCT_NOT_FOUND');

    const parsed = productUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Błędne dane aktualizacji produktu', parsed.error.flatten(), 'VALIDATION_ERROR');
    }

    if (parsed.data.category_id) {
      const cat = await db('categories').where({ id: parsed.data.category_id }).first();
      if (!cat) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Nie istnieje taka kategoria', { category_id: parsed.data.category_id }, 'CATEGORY_NOT_FOUND');
      }
    }

    await db('products').where({ id }).update(parsed.data);
    const updated = await db('products').where({ id }).first();
    res.json(updated);
  } catch (e) { next(e); }
});

module.exports = router;
