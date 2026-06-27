/**
 * Booza Think Platform OS - Monitoring System Stub
 */

function getSystemMetrics() {
  return {
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    timestamp: Date.now()
  };
}

module.exports = {
  getSystemMetrics
};
