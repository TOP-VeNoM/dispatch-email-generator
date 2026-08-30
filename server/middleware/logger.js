function requestLogger(req, res, next) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
}

module.exports = requestLogger;

