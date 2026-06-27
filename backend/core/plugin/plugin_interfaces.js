/**
 * Booza Think Platform OS - Plugin & Product Lifecycle Interface (Phase 6-4)
 */

class PluginInterface {
  constructor(pluginId, version) {
    this.pluginId = pluginId;
    this.version = version;
    this.state = 'UNLOADED'; // 'UNLOADED', 'LOADED', 'ACTIVE', 'ERROR'
  }

  // 1. 플러그인 초기화 및 엔진 바인딩
  async onLoad(platformContext) {
    console.log(`[Plugin Load] Initializing plugin: ${this.pluginId} v${this.version}`);
    this.state = 'LOADED';
    return true;
  }

  // 2. 서비스 마켓플레이스 활성화 기동
  async onEnable() {
    console.log(`[Plugin Enable] Activating plugin functionality: ${this.pluginId}`);
    this.state = 'ACTIVE';
    return true;
  }

  // 3. 서비스 비활성화
  async onDisable() {
    console.log(`[Plugin Disable] Deactivating plugin functionality: ${this.pluginId}`);
    this.state = 'LOADED';
    return true;
  }

  // 4. 플러그인 완전 언로드 (GC 대상화)
  async onUnload() {
    console.log(`[Plugin Unload] Releasing plugin resources: ${this.pluginId}`);
    this.state = 'UNLOADED';
    return true;
  }
}

class ProductPluginWrapper extends PluginInterface {
  constructor(productId, name, config = {}) {
    super(productId, config.version || '1.0.0');
    this.name = name;
    this.config = config;
  }

  async onEnable() {
    await super.onEnable();
    console.log(`[Product Plugin] Product '${this.name}' has been plugged into the platform layout.`);
    return true;
  }
}

module.exports = {
  PluginInterface,
  ProductPluginWrapper
};
