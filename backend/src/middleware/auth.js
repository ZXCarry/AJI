const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
const { ApiError, StatusCodes } = require('../errors');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function authenticateJWT(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [type, token] = header.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Brak tokenu Bearer w nagłówku Authorization', null, 'UNAUTHORIZED');
    }

    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = payload; // { sub, login, role }
    next();
  } catch (e) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Niepoprawny lub wygasły token', { hint: e.message }, 'UNAUTHORIZED'));
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Brak uwierzytelnienia', null, 'UNAUTHORIZED'));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(StatusCodes.FORBIDDEN, 'Brak uprawnień do tej operacji', { role: req.user.role }, 'FORBIDDEN'));
    }
    next();
  };
}

async function storeRefreshToken(userId, refreshToken, expiresAt, trx = db) {
  const token_hash = hashToken(refreshToken);
  await trx('refresh_tokens').insert({
    user_id: userId,
    token_hash,
    expires_at: expiresAt,
  });
  return token_hash;
}

async function revokeRefreshToken(tokenHash, replacedByHash = null, trx = db) {
  await trx('refresh_tokens')
    .where({ token_hash: tokenHash })
    .update({
      revoked_at: trx.fn.now(),
      replaced_by_token_hash: replacedByHash,
    });
}

module.exports = {
  authenticateJWT,
  requireRole,
  hashToken,
  storeRefreshToken,
  revokeRefreshToken,
};
