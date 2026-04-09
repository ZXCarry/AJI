require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { errorResponse, StatusCodes, ApiError } = require('./errors');

const productsRouter = require('./routes/products');
const categoriesRouter = require('./routes/categories');
const ordersRouter = require('./routes/orders');
const statusesRouter = require('./routes/statuses');
const authRouter = require('./routes/auth');
const initRouter = require('./routes/init');

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

app.use('/products', productsRouter);
app.use('/categories', categoriesRouter);
app.use('/orders', ordersRouter);
app.use('/status', statusesRouter);
app.use('/', authRouter);
app.use('/init', initRouter);

// 404
app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    error: { code: 'NOT_FOUND', message: 'Nie znaleziono zasobu', details: { path: req.path } },
  });
});

// error handler
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(errorResponse(err));
  }
  console.error(err);
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    error: { code: 'INTERNAL_ERROR', message: 'Błąd serwera', details: null },
  });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`API działa na http://localhost:${port}`));
