const express = require('express');
const db = require('../db');
const { ApiError, StatusCodes } = require('../errors');
const { orderCreateSchema, orderPatchSchema, opinionCreateSchema } = require('../validators');
const { authenticateJWT, requireRole } = require('../middleware/auth');

const router = express.Router();

const allowedTransitions = {
  NIEZATWIERDZONE: new Set(['ZATWIERDZONE', 'ANULOWANE']),
  ZATWIERDZONE: new Set(['ZREALIZOWANE', 'ANULOWANE']),
  ANULOWANE: new Set([]),
  ZREALIZOWANE: new Set([]),
};

function parsePositiveInt(paramName, value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Niepoprawny identyfikator',
      { param: paramName, value },
      'VALIDATION_ERROR'
    );
  }
  return n;
}

async function getStatusByName(name, q = db) {
  return q('order_statuses').where({ name }).first();
}

async function getStatusById(id, q = db) {
  return q('order_statuses').where({ id }).first();
}

async function getStatusNameById(id, q = db) {
  const s = await getStatusById(id, q);
  return s ? s.name : null;
}

async function getOrderWithItems(orderId, q = db) {
  const order = await q('orders').where({ id: orderId }).first();
  if (!order) return null;

  const statusName = await getStatusNameById(order.status_id, q);

  const items = await q('order_items')
    .select('order_items.*', 'products.name as product_name')
    .join('products', 'products.id', 'order_items.product_id')
    .where({ order_id: orderId })
    .orderBy('order_items.id', 'asc');

  // opinia (albo null)
  const opinion = await q('order_opinions')
    .where({ order_id: orderId })
    .first();

  return { ...order, status: statusName, items, opinion: opinion || null };
}

/**
 * GET /orders
 * opcjonalnie: /orders?user=Jan%20Kowalski
 */
router.get('/', authenticateJWT, requireRole('PRACOWNIK'), async (req, res, next) => {
  try {
    const user = req.query.user?.toString().trim();
    let q = db('orders').select('*').orderBy('id', 'desc');
    if (user) q = q.where({ user_name: user });
    const rows = await q;

    const statuses = await db('order_statuses').select('*');
    const map = new Map(statuses.map((s) => [s.id, s.name]));

    res.json(rows.map((o) => ({ ...o, status: map.get(o.status_id) })));
  } catch (e) {
    next(e);
  }
});

/**
 * GET /orders/status/:value
 * value może być:
 * - ID statusu (np. 1)
 * - nazwa statusu (np. NIEZATWIERDZONE)
 */
router.get('/status/:value', authenticateJWT, requireRole('PRACOWNIK'), async (req, res, next) => {
  try {
    const value = req.params.value;

    let status = null;

    if (/^\d+$/.test(value)) {
      const statusId = Number(value);
      status = await getStatusById(statusId);
      if (!status) {
        throw new ApiError(
          StatusCodes.NOT_FOUND,
          'Nie ma takiego statusu',
          { id: statusId },
          'STATUS_NOT_FOUND'
        );
      }
    } else {
      status = await getStatusByName(value);
      if (!status) {
        throw new ApiError(
          StatusCodes.NOT_FOUND,
          'Nie ma takiego statusu',
          { name: value },
          'STATUS_NOT_FOUND'
        );
      }
    }

    const rows = await db('orders')
      .where({ status_id: status.id })
      .orderBy('id', 'desc');

    res.json(rows.map((o) => ({ ...o, status: status.name })));
  } catch (e) {
    next(e);
  }
});

// GET /orders/my - tylko moje zamówienia
router.get('/my', authenticateJWT, async (req, res, next) => {
  try {
    const rows = await db('orders')
      .where({ user_login: req.user.login })
      .orderBy('id', 'desc');

    const statuses = await db('order_statuses').select('*');
    const map = new Map(statuses.map((s) => [s.id, s.name]));

    res.json(rows.map((o) => ({ ...o, status: map.get(o.status_id) })));
  } catch (e) {
    next(e);
  }
});

/**
 * POST /orders/:id/opinions
 * (3) zwraca całe zamówienie z opinion (już nie null)
 * (4) walidacja id
 */
router.post('/:id/opinions', authenticateJWT, async (req, res, next) => {
  const trx = await db.transaction();
  try {
    const orderId = parsePositiveInt('id', req.params.id);

    const parsed = opinionCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Błędne dane opinii',
        parsed.error.flatten(),
        'VALIDATION_ERROR'
      );
    }

    const order = await trx('orders').where({ id: orderId }).first();
    if (!order) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Nie istnieje zamówienie o podanym id',
        { id: orderId },
        'ORDER_NOT_FOUND'
      );
    }

    // tylko właściciel zamówienia
    if (!order.user_login) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Do tego zamówienia nie można dodać opinii, bo nie jest powiązane z kontem użytkownika',
        { id: orderId },
        'ORDER_NOT_LINKED_TO_USER'
      );
    }

    if (order.user_login !== req.user.login) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        'Nie możesz dodać opinii do cudzego zamówienia',
        { orderId, owner: order.user_login, you: req.user.login },
        'FORBIDDEN'
      );
    }

    // status musi być ANULOWANE albo ZREALIZOWANE
    const statusRow = await trx('order_statuses').where({ id: order.status_id }).first();
    const statusName = statusRow?.name;

    if (statusName !== 'ZREALIZOWANE' && statusName !== 'ANULOWANE') {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Opinię można dodać tylko do zamówienia ZREALIZOWANE lub ANULOWANE',
        { status: statusName },
        'INVALID_ORDER_STATUS'
      );
    }

    // jedna opinia na zamówienie
    const existing = await trx('order_opinions').where({ order_id: orderId }).first();
    if (existing) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Opinia dla tego zamówienia już istnieje',
        { orderId, opinionId: existing.id },
        'OPINION_ALREADY_EXISTS'
      );
    }

    const opinionRow = {
      order_id: orderId,
      rating: parsed.data.rating,
      content: parsed.data.content,
    };

    await trx('order_opinions').insert(opinionRow);
    await trx.commit();

    const updatedOrder = await getOrderWithItems(orderId);
    return res.status(StatusCodes.CREATED).json(updatedOrder);
  } catch (e) {
    await trx.rollback();
    next(e);
  }
});

/**
 * GET /orders/:id
 * (4) walidacja id
 */
router.get('/:id', authenticateJWT, async (req, res, next) => {
  try {
    const id = parsePositiveInt('id', req.params.id);
    const full = await getOrderWithItems(id);

    if (!full) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        'Zamówienie nie istnieje',
        { id },
        'ORDER_NOT_FOUND'
      );
    }

    // KLIENT widzi tylko swoje zamówienia
    if (req.user.role === 'KLIENT') {
      if (!full.user_login) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          'To zamówienie nie jest powiązane z kontem użytkownika',
          { id },
          'FORBIDDEN'
        );
      }
      if (full.user_login !== req.user.login) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          'Nie możesz wyświetlić cudzego zamówienia',
          { id },
          'FORBIDDEN'
        );
      }
    }

    res.json(full);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /orders
 */
router.post('/', authenticateJWT, requireRole('KLIENT', 'PRACOWNIK'), async (req, res, next) => {
  const trx = await db.transaction();
  try {
    const parsed = orderCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Błędne dane zamówienia',
        parsed.error.flatten(),
        'VALIDATION_ERROR'
      );
    }

    // brak duplikatów product_id w items
    const ids = parsed.data.items.map((i) => i.product_id);
    const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);
    if (duplicates.length) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Duplikaty produktów w pozycjach zamówienia. Każdy product_id może wystąpić tylko raz.',
        { duplicate_product_ids: [...new Set(duplicates)] },
        'VALIDATION_ERROR'
      );
    }

    // sprawdź istnienie produktów
    const productIds = [...new Set(ids)];
    const existing = await trx('products').whereIn('id', productIds).select('id');
    const existingSet = new Set(existing.map((r) => r.id));
    const missing = productIds.filter((id) => !existingSet.has(id));
    if (missing.length) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Zamówienie zawiera nieistniejące produkty',
        { missing_product_ids: missing },
        'PRODUCT_NOT_FOUND'
      );
    }

    const initialStatus = await trx('order_statuses')
      .where({ name: 'NIEZATWIERDZONE' })
      .first();

    if (!initialStatus) {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Brak statusu NIEZATWIERDZONE w bazie',
        null,
        'CONFIG_ERROR'
      );
    }

    const orderRow = {
      approved_at: null,
      status_id: initialStatus.id,
      user_name: parsed.data.user_name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      address: parsed.data.address,
      user_login: req.user.login,
    };

    const [orderId] = await trx('orders').insert(orderRow);

    const itemRows = parsed.data.items.map((it) => ({
      order_id: orderId,
      product_id: it.product_id,
      quantity: it.quantity,
      unit_price: it.unit_price,
      vat_rate: it.vat_rate ?? null,
      discount: it.discount ?? null,
    }));

    await trx('order_items').insert(itemRows);
    await trx.commit();

    const created = await getOrderWithItems(orderId);
    res.status(StatusCodes.CREATED).json(created);
  } catch (e) {
    await trx.rollback();
    next(e);
  }
});

/**
 * PATCH /orders/:id
 * (4) walidacja id
 */
router.patch('/:id', authenticateJWT, requireRole('PRACOWNIK'), async (req, res, next) => {
  const trx = await db.transaction();
  try {
    const id = parsePositiveInt('id', req.params.id);

    const order = await trx('orders').where({ id }).first();
    if (!order) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        'Nie ma zamówienia o takim id',
        { id },
        'ORDER_NOT_FOUND'
      );
    }

    const parsed = orderPatchSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Błędny format JSON PATCH',
        parsed.error.flatten(),
        'VALIDATION_ERROR'
      );
    }

    const newStatusName = parsed.data.value;
    const newStatus = await trx('order_statuses').where({ name: newStatusName }).first();
    if (!newStatus) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        'Nie ma takiego statusu',
        { status: newStatusName },
        'STATUS_NOT_FOUND'
      );
    }

    const currentStatusName = await getStatusNameById(order.status_id, trx);
    if (!currentStatusName) {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Zamówienie ma niepoprawny status_id',
        { status_id: order.status_id },
        'DATA_ERROR'
      );
    }

    const allowed = allowedTransitions[currentStatusName];
    if (!allowed || !allowed.has(newStatusName)) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Niepoprawna zmiana statusu zamówienia',
        { from: currentStatusName, to: newStatusName, allowed: [...(allowed || [])] },
        'INVALID_STATUS_TRANSITION'
      );
    }

    const update = { status_id: newStatus.id };

    if (newStatusName === 'ZATWIERDZONE') update.approved_at = trx.fn.now();

    await trx('orders').where({ id }).update(update);
    await trx.commit();

    const updated = await getOrderWithItems(id);
    res.json(updated);
  } catch (e) {
    await trx.rollback();
    next(e);
  }
});

module.exports = router;
