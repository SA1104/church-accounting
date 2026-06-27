const fs = require('fs');
const path = require('path');

async function loadModules(app) {
  const loaded = new Set();

  // 1. Scan and load modules from backend/service/
  const serviceDir = path.join(__dirname, '..', '..', 'service');
  if (fs.existsSync(serviceDir)) {
    const list = fs.readdirSync(serviceDir);
    for (const folderName of list) {
      const modulePath = path.join(serviceDir, folderName);
      if (fs.statSync(modulePath).isDirectory()) {
        console.log(`[Platform Registry] Loading service: ${folderName}...`);

        // Initialize schema if db_schema.js exists
        const schemaPath = path.join(modulePath, 'db_schema.js');
        if (fs.existsSync(schemaPath)) {
          try {
            const { initModuleDb } = require(schemaPath);
            if (typeof initModuleDb === 'function') {
              await initModuleDb();
            }
          } catch (err) {
            console.error(`[Platform Registry] DB init failed for service ${folderName}:`, err);
          }
        }

        // Load module router
        const entryPath = path.join(modulePath, 'index.js');
        if (fs.existsSync(entryPath)) {
          try {
            const router = require(entryPath);
            app.use(`/api/services/${folderName}`, router);
            console.log(`[Platform Registry] Mounted service: ${folderName} at /api/services/${folderName}`);
            loaded.add(`service:${folderName}`);
          } catch (err) {
            console.error(`[Platform Registry] Failed to mount service ${folderName}:`, err);
          }
        }
      }
    }
  }

  // 2. Scan and load modules from backend/modules/
  const modulesDir = path.join(__dirname, '..', '..', 'modules');
  if (fs.existsSync(modulesDir)) {
    const list = fs.readdirSync(modulesDir);
    for (const folderName of list) {
      const modulePath = path.join(modulesDir, folderName);
      if (fs.statSync(modulePath).isDirectory()) {
        console.log(`[Platform Registry] Loading module: ${folderName}...`);

        // Initialize schema if db_schema.js exists
        const schemaPath = path.join(modulePath, 'db_schema.js');
        if (fs.existsSync(schemaPath)) {
          try {
            const { initModuleDb } = require(schemaPath);
            if (typeof initModuleDb === 'function') {
              await initModuleDb();
            }
          } catch (err) {
            console.error(`[Platform Registry] DB init failed for module ${folderName}:`, err);
          }
        }

        // Load module router
        const entryPath = path.join(modulePath, 'index.js');
        if (fs.existsSync(entryPath)) {
          try {
            const router = require(entryPath);
            app.use(`/api/modules/${folderName}`, router);
            console.log(`[Platform Registry] Mounted module: ${folderName} at /api/modules/${folderName}`);
            loaded.add(`module:${folderName}`);
          } catch (err) {
            console.error(`[Platform Registry] Failed to mount module ${folderName}:`, err);
          }
        }
      }
    }
  }

  return Array.from(loaded);
}

module.exports = {
  loadModules
};
