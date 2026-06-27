/**
 * Booza Think Kernel - Logging Engine
 */

class LoggingEngine {
  log(level, category, message, details = {}) {
    const timestamp = new Date().toISOString();
    const logObj = { timestamp, level, category, message, details };
    
    // Print to stdout standard log format
    console.log(`[${timestamp}] [${level}] [${category}] ${message}`);
    
    return logObj;
  }

  info(category, message, details = {}) {
    return this.log('INFO', category, message, details);
  }

  warn(category, message, details = {}) {
    return this.log('WARN', category, message, details);
  }

  error(category, message, details = {}) {
    return this.log('ERROR', category, message, details);
  }
}

const logger = new LoggingEngine();

module.exports = {
  LoggingEngine,
  logger
};
