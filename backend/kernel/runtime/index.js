/**
 * Booza Think Operating System - Platform Runtime Kernel Core
 */
const { serviceLocator } = require('../container/index.js');
const { eventBus } = require('../eventbus/index.js');
const { config } = require('../configuration/index.js');
const { registry } = require('../registry/index.js');
const { pluginManager } = require('../plugin/index.js');
const { security } = require('../security/index.js');
const { billing } = require('../billing/index.js');
const { usage } = require('../usage/index.js');
const { logger } = require('../logging/index.js');
const { monitor } = require('../monitoring/index.js');

class PlatformRuntime {
  constructor() {
    this.initialized = false;
    this.bootTime = null;
  }

  async boot() {
    if (this.initialized) return;
    
    console.log('================================================================');
    console.log('         BOOZA THINK OS - DECISION INTELLIGENCE OPERATING SYSTEM  ');
    console.log('================================================================');
    
    this.bootTime = new Date();
    
    // 1. Register Kernel Services to Service Locator (TEAM F)
    serviceLocator.register('config', config);
    serviceLocator.register('eventBus', eventBus);
    serviceLocator.register('registry', registry);
    serviceLocator.register('pluginManager', pluginManager);
    serviceLocator.register('security', security);
    serviceLocator.register('billing', billing);
    serviceLocator.register('usage', usage);
    serviceLocator.register('logger', logger);
    serviceLocator.register('monitor', monitor);

    // 2. Load Core Dependencies
    logger.info('SYSTEM', 'Kernel booting successfully completed.');
    this.initialized = true;
    
    // Publish boot event
    eventBus.publish('platform:booted', { timestamp: this.bootTime });
  }

  async getStatus() {
    const health = await monitor.getSystemHealth();
    return {
      os_name: 'Booza Think OS',
      kernel_version: '1.0.0',
      uptime_seconds: Math.floor((Date.now() - this.bootTime) / 1000),
      health: health.status,
      checks: health.checks
    };
  }
}

// Global runtime instance
const platformRuntime = new PlatformRuntime();

module.exports = {
  PlatformRuntime,
  runtime: platformRuntime
};
