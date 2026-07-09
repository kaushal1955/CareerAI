import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

export const allowRoles = (...allowedRoles) =>
  asyncHandler(async (req, res, next) => {
    if (!req.userId) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const user = await User.findById(req.userId);

    if (!user) {
      res.status(404);
      throw new Error('User record not found.');
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403);
      throw new Error('You do not have permission to access this resource.');
    }

    req.dbUser = user;
    next();
  });
