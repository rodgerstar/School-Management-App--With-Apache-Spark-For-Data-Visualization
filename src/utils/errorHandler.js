const formatError = (err) => {
  // 1. Mongoose Validation Errors (missing fields, wrong types, etc.)
  if (err.name === 'ValidationError') {
    const details = {};
    Object.keys(err.errors).forEach((key) => {
      details[key] = err.errors[key].message;
    });
    return { status: 400, message: 'Validation failed', details };
  }

  // 2. Duplicate Key Error (E11000) - handles all Mongoose/MongoDB variations
  if (err.code === 11000 || (err.name === 'MongoServerError' && err.code === 11000)) {
    const details = {};

    // Preferred: Use keyValue (always reliable when present)
    if (err.keyValue) {
      const field = Object.keys(err.keyValue)[0];
      const value = err.keyValue[field];
      details[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' is already in use`;
    } else {
      // Fallback: Parse from errmsg (older versions)
      const match = err.errmsg?.match(/dup key: { [^:]*: ?"([^"]+)" }/);
      if (match) {
        details.email = `Email '${match[1]}' is already in use`;
      }
    }

    return { status: 409, message: 'Duplicate entry', details };
  }

  // 3. Invalid ID (CastError)
  if (err.name === 'CastError') {
    return { status: 400, message: 'Invalid ID format' };
  }

  // 4. Fallback
  console.error('Unhandled error:', err);
  return { status: 500, message: 'Internal server error' };
};

const globalErrorHandler = (err, req, res, next) => {
    console.log('GLOBAL ERROR HANDLER TRIGGERED!');
  const { status = 500, message, details } = formatError(err);

  res.status(status).json({
    error: message,
    ...(details && { details })
  });
};

module.exports = { globalErrorHandler };