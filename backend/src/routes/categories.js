const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const rows = await db('categories').select('*').orderBy('id', 'asc');
    res.json(rows);
  } catch (e) { next(e); }
});

module.exports = router;
