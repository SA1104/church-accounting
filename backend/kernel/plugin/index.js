/**
 * Booza Think Kernel - Plugin Manager
 */

class PluginManager {
  constructor() {
    this.plugins = new Map();
  }

  async loadPlugin(pluginId, pluginInstance) {
    console.log(`[Kernel PluginManager] Loading plugin: ${pluginId}`);
    try {
      if (typeof pluginInstance.onLoad === 'function') {
        await pluginInstance.onLoad(this);
      }
      this.plugins.set(pluginId, pluginInstance);
      return true;
    } catch (err) {
      console.error(`[Kernel PluginManager] Failed to load plugin: ${pluginId}`, err);
      return false;
    }
  }

  async enablePlugin(pluginId) {
    if (!this.plugins.has(pluginId)) {
      throw new Error(`Plugin not loaded: ${pluginId}`);
    }
    const plugin = this.plugins.get(pluginId);
    if (typeof plugin.onEnable === 'function') {
      await plugin.onEnable();
    }
    console.log(`[Kernel PluginManager] Enabled plugin: ${pluginId}`);
  }

  async disablePlugin(pluginId) {
    if (!this.plugins.has(pluginId)) return;
    const plugin = this.plugins.get(pluginId);
    if (typeof plugin.onDisable === 'function') {
      await plugin.onDisable();
    }
    console.log(`[Kernel PluginManager] Disabled plugin: ${pluginId}`);
  }

  getPlugin(pluginId) {
    return this.plugins.get(pluginId);
  }

  getActivePlugins() {
    return Array.from(this.plugins.keys());
  }
}

const pluginManager = new PluginManager();

module.exports = {
  PluginManager,
  pluginManager
};
