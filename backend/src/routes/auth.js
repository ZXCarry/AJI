const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { ApiError, StatusCodes } = require('../errors');
const { hashToken, storeRefreshToken, revokeRefreshToken } = require('../middleware/auth');

const router = express.Router();

function signAccessToken(user) {
  return jwt.sign(
    { login: user.login, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { subject: String(user.id), expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h' }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { login: user.login, role: user.role, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { subject: String(user.id), expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

function jwtExpToDate(decoded) {
  // decoded.exp w sekundach
  return new Date(decoded.exp * 1000);
}

// POST /login  {login, password}
router.post('/login', async (req, res, next) => {
  const trx = await db.transaction();
  try {
    const { login, password } = req.body || {};
    if (!login || !password) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Brak login lub hasło', null, 'VALIDATION_ERROR');
    }

    const user = await trx('users').where({ login }).first();
    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Niepoprawny login lub hasło', null, 'INVALID_CREDENTIALS');
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Niepoprawny login lub hasło', null, 'INVALID_CREDENTIALS');
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    const decodedRefresh = jwt.decode(refreshToken);
    const expiresAt = jwtExpToDate(decodedRefresh);

    await storeRefreshToken(user.id, refreshToken, expiresAt, trx);

    await trx.commit();

    res.status(StatusCodes.OK).json({
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h',
      role: user.role,
      login: user.login,
    });
  } catch (e) {
    await trx.rollback();
    next(e);
  }
});

// POST /register  {login, password}
router.post('/register', async (req, res, next) => {
  try {
    const { login, password } = req.body || {};

    if (!login || !password) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Brak login lub hasło', null, 'VALIDATION_ERROR');
    }

    const normalizedLogin = String(login).trim();
    if (normalizedLogin.length < 3 || normalizedLogin.length > 100) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Login musi mieć od 3 do 100 znaków',
        { login: normalizedLogin },
        'VALIDATION_ERROR'
      );
    }

    if (String(password).length < 6) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Hasło musi mieć co najmniej 6 znaków',
        null,
        'VALIDATION_ERROR'
      );
    }

    const existing = await db('users').where({ login: normalizedLogin }).first();
    if (existing) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        'Taki login jest już zajęty',
        { login: normalizedLogin },
        'LOGIN_TAKEN'
      );
    }

    const password_hash = await bcrypt.hash(String(password), 10);

    const [id] = await db('users').insert({
      login: normalizedLogin,
      password_hash,
      role: 'KLIENT',
    });

    return res.status(StatusCodes.CREATED).json({
      ok: true,
      message: 'Konto utworzone. Zaloguj się.',
      user: { id, login: normalizedLogin, role: 'KLIENT' },
    });
  } catch (e) {
    next(e);
  }
});


// POST /token/refresh  {refreshToken}
router.post('/token/refresh', async (req, res, next) => {
  const trx = await db.transaction();
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Brak refreshToken w body', null, 'VALIDATION_ERROR');
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (e) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Niepoprawny lub wygasły refresh token', { hint: e.message }, 'UNAUTHORIZED');
    }

    if (payload.type !== 'refresh') {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'To nie jest refresh token', null, 'UNAUTHORIZED');
    }

    const userId = Number(payload.sub);
    const tokenHash = hashToken(refreshToken);

    const tokenRow = await trx('refresh_tokens').where({ token_hash: tokenHash }).first();
    if (!tokenRow) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token nie istnieje (np. został cofnięty)', null, 'UNAUTHORIZED');
    }
    if (tokenRow.revoked_at) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token został cofnięty', null, 'UNAUTHORIZED');
    }
    if (new Date(tokenRow.expires_at) <= new Date()) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token wygasł', null, 'UNAUTHORIZED');
    }

    const user = await trx('users').where({ id: userId }).first();
    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Użytkownik nie istnieje', null, 'UNAUTHORIZED');
    }

    // ROTACJA refresh tokena: wydajemy nowy i cofamy stary
    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    const decodedNewRefresh = jwt.decode(newRefreshToken);
    const newExpiresAt = jwtExpToDate(decodedNewRefresh);

    const newHash = await storeRefreshToken(user.id, newRefreshToken, newExpiresAt, trx);
    await revokeRefreshToken(tokenHash, newHash, trx);

    await trx.commit();

    res.status(StatusCodes.OK).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h',
    });
  } catch (e) {
    await trx.rollback();
    next(e);
  }
});

module.exports = router;
