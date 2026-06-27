/**
 * Booza Think Core SDK - Product & Onboarding Framework (Phase 7)
 */
const db = require('../db/index.js');
const { registry } = require('../../kernel/index.js');

class ProductInterface {
  constructor(productId, config = {}) {
    this.productId = productId;
    this.config = config;
    this.state = 'UNINSTALLED'; // 'UNINSTALLED', 'INSTALLED', 'RUNNING'
  }

  async onInstall() {
    console.log(`[Product SDK] Installing product: ${this.productId}`);
    this.state = 'INSTALLED';
    return true;
  }

  async onStart() {
    console.log(`[Product SDK] Starting product: ${this.productId}`);
    this.state = 'RUNNING';
    return true;
  }

  async onStop() {
    console.log(`[Product SDK] Stopping product: ${this.productId}`);
    this.state = 'INSTALLED';
    return true;
  }
}

class ProductLoader {
  async loadManifest(manifestObj) {
    console.log(`[Product SDK] Parsing product manifest: ${manifestObj.id}`);
    const required = ['id', 'name', 'version', 'routes', 'permissions', 'menus', 'engines', 'plugins', 'capabilities'];
    for (const f of required) {
      if (manifestObj[f] === undefined) {
        throw new Error(`[Product SDK] Invalid product manifest. Missing: ${f}`);
      }
    }
    
    // Register product to database registry (TEAM F)
    await registry.register(
      'PRODUCT',
      manifestObj.id,
      manifestObj.name,
      manifestObj.version,
      'PLATFORM_ADMIN',
      {
        routes: manifestObj.routes,
        permissions: manifestObj.permissions,
        menus: manifestObj.menus,
        engines: manifestObj.engines,
        plugins: manifestObj.plugins,
        capabilities: manifestObj.capabilities
      }
    );

    return true;
  }
}

const productLoader = new ProductLoader();

module.exports = {
  ProductInterface,
  ProductLoader,
  productLoader
};
