// Express error-handling middleware requires 4 parameters: (err, req, res, next)
function errorHandler(err, req, res, next) {
  console.error("❌ Error caught by errorHandler:", err.message);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    error: err.message || "Something went wrong on the server.",
  });
}

module.exports = errorHandler;

