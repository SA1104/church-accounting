/**
 * Booza Think Operating System - Kernel Main Exports Aggregator
 */

const { runtime } = require('./runtime/index.js');
const { serviceLocator } = require('./container/index.js');
const { eventBus } = require('./eventbus/index.js');
const { config } = require('./configuration/index.js');
const { registry } = require('./registry/index.js');
const { pluginManager } = require('./plugin/index.js');
const { security } = require('./security/index.js');
const { billing } = require('./billing/index.js');
const { usage } = require('./usage/index.js');
const { logger } = require('./logging/index.js');
const { monitor } = require('./monitoring/index.js');

module.exports = {
  runtime,
  serviceLocator,
  eventBus,
  config,
  registry,
  pluginManager,
  security,
  billing,
  usage,
  logger,
  monitor
};
