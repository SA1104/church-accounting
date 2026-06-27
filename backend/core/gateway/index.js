/**
 * Booza Think Platform OS - API Gateway Middleware Stub
 */

function gatewayLogger(req, res, next) {
  console.log(`[Platform Gateway] Incoming Request: ${req.method} ${req.originalUrl}`);
  next();
}

module.exports = {
  gatewayLogger
};
