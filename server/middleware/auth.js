import { verifyToken } from '../utils/token.js';

export function protect(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401);
    return next(new Error('Unauthorized'));
  }

  try {
    req.userId = verifyToken(token);
    next();
  } catch (error) {
    res.status(401);
    next(new Error('Invalid or expired session. Please log in again.'));
  }
}

export function getAuthContext(req) {
  if (!req.userId) {
    const error = new Error('Unauthorized');
    error.statusCode = 401;
    throw error;
  }

  return { userId: req.userId };
}
