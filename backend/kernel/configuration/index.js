/**
 * Booza Think Kernel - Configuration Manager
 */

class ConfigurationManager {
  constructor() {
    this.configs = new Map();
    // Load default env configurations
    this.configs.set('port', process.env.PORT || 5000);
    this.configs.set('env', process.env.NODE_ENV || 'development');
    this.configs.set('supabaseUrl', process.env.SUPABASE_URL || 'https://your-supabase.supabase.co');
    this.configs.set('featureFlags', {
      enableAiAssistance: true,
      enableOcrAutoParsing: true,
      enableDynamicApprovalLines: true,
      enableMarketplaceToggles: true
    });
  }

  get(key, fallback = null) {
    if (this.configs.has(key)) {
      return this.configs.get(key);
    }
    return fallback;
  }

  set(key, value) {
    console.log(`[Kernel Configuration] Setting key: ${key}`);
    this.configs.set(key, value);
  }

  isFeatureEnabled(flagName) {
    const flags = this.get('featureFlags') || {};
    return !!flags[flagName];
  }
}

const configManager = new ConfigurationManager();

module.exports = {
  ConfigurationManager,
  config: configManager
};
