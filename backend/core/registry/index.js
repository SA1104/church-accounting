const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, '..', '..', 'modules');

async function loadModules(app) {
  if (!fs.existsSync(modulesDir)) {
    fs.mkdirSync(modulesDir, { recursive: true });
    return [];
  }

  const list = fs.readdirSync(modulesDir);
  const loadedModules = [];

  for (const folderName of list) {
    const modulePath = path.join(modulesDir, folderName);
    const stat = fs.statSync(modulePath);

    if (stat.isDirectory()) {
      console.log(`[Platform Registry] Loading module: ${folderName}...`);

      // 1. Initialize module database schema if db_schema.js exists
      const schemaPath = path.join(modulePath, 'db_schema.js');
      if (fs.existsSync(schemaPath)) {
        try {
          const { initModuleDb } = require(schemaPath);
          if (typeof initModuleDb === 'function') {
            await initModuleDb();
            console.log(`[Platform Registry] DB initialized for module: ${folderName}`);
          }
        } catch (err) {
          console.error(`[Platform Registry] Database migration failed for module ${folderName}:`, err);
        }
      }

      // 2. Load module router (index.js)
      const entryPath = path.join(modulePath, 'index.js');
      if (fs.existsSync(entryPath)) {
        try {
          const router = require(entryPath);
          app.use(`/api/modules/${folderName}`, router);
          console.log(`[Platform Registry] Mounted routes for module: ${folderName} at /api/modules/${folderName}`);
          loadedModules.push(folderName);
        } catch (err) {
          console.error(`[Platform Registry] Failed to mount router for module ${folderName}:`, err);
        }
      } else {
        console.warn(`[Platform Registry] Main entry 'index.js' missing in module: ${folderName}`);
      }
    }
  }

  return loadedModules;
}

module.exports = {
  loadModules
};
