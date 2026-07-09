export function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Not found - ${req.originalUrl}`));
}

export function errorHandler(err, _req, res, _next) {
  const statusCode =
    err.code === 'LIMIT_FILE_SIZE'
      ? 400
      : res.statusCode !== 200
        ? res.statusCode
        : err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message:
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Resume file size must be 5MB or smaller.'
        : err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
}
