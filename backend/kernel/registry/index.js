/**
 * Booza Think Kernel - Registry Manager
 */
const db = require('../../core/db/index.js');

class RegistryManager {
  async register(type, key, name, version = '1.0.0', owner = 'PLATFORM_ADMIN', config = {}) {
    console.log(`[Kernel Registry] Registering: ${type} -> ${key} (${name})`);
    try {
      await db.query.run(`
        INSERT INTO platform_registries (registry_type, item_key, item_name, version, owner, config, enabled)
        VALUES (?, ?, ?, ?, ?, ?, true)
        ON CONFLICT (registry_type, item_key) DO UPDATE
        SET item_name = EXCLUDED.item_name, version = EXCLUDED.version, config = EXCLUDED.config, updated_at = CURRENT_TIMESTAMP
      `, [type.toUpperCase(), key, name, version, owner, JSON.stringify(config)]);
      return true;
    } catch (err) {
      console.error(`[Kernel Registry] Failed to register: ${key}`, err);
      return false;
    }
  }

  async getRegistry(type) {
    try {
      return await db.query.all(`
        SELECT * FROM platform_registries
        WHERE registry_type = ? AND enabled = true
        ORDER BY item_key ASC
      `, [type.toUpperCase()]);
    } catch (err) {
      console.error(`[Kernel Registry] Failed to fetch registry of type: ${type}`, err);
      return [];
    }
  }

  async isEnabled(type, key) {
    try {
      const row = await db.query.get(`
        SELECT enabled FROM platform_registries
        WHERE registry_type = ? AND item_key = ?
      `, [type.toUpperCase(), key]);
      return row ? !!row.enabled : false;
    } catch (err) {
      console.error(`[Kernel Registry] Failed to check status for: ${type}/${key}`, err);
      return false;
    }
  }
}

const registryManager = new RegistryManager();

module.exports = {
  RegistryManager,
  registry: registryManager
};
