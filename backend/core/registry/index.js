const fs = require('fs');
const path = require('path');
global.WebSocket = global.WebSocket || require('ws');

async function loadModules(app) {
  const loadedServices = [];
  const loadedLegacy = [];
  const loadedPlugins = [];
  const failedPlugins = [];
  const seenIds = new Set();

  // Helper to safely load schema
  const initSchema = async (modulePath, folderName) => {
    const schemaPath = path.join(modulePath, 'db_schema.js');
    if (fs.existsSync(schemaPath)) {
      try {
        const { initModuleDb } = require(schemaPath);
        if (typeof initModuleDb === 'function') {
          await initModuleDb();
        }
      } catch (err) {
        console.error(`[Platform Registry] DB init failed for ${folderName}:`, err.message);
      }
    }
  };

  // 1. Scan and load modules from backend/service/
  const serviceDir = path.join(__dirname, '..', '..', 'service');
  if (fs.existsSync(serviceDir)) {
    const list = fs.readdirSync(serviceDir);
    for (const folderName of list) {
      const modulePath = path.join(serviceDir, folderName);
      if (fs.statSync(modulePath).isDirectory()) {
        const serviceId = folderName === 'church' ? 'church_think' : `${folderName}_think`;
        
        if (seenIds.has(serviceId)) {
          console.warn(`[Platform Registry] Duplicate service ID warning: ${serviceId}. Skipping.`);
          continue;
        }
        seenIds.add(serviceId);

        await initSchema(modulePath, folderName);

        const entryPath = path.join(modulePath, 'index.js');
        if (fs.existsSync(entryPath)) {
          try {
            const router = require(entryPath);
            app.use(`/api/services/${folderName}`, router);
            loadedServices.push(folderName);
          } catch (err) {
            console.error(`[Platform Registry] Failed to mount service ${folderName}:`, err.message);
          }
        }
      }
    }
  }

  // 2. Scan and load legacy modules from backend/modules/
  const modulesDir = path.join(__dirname, '..', '..', 'modules');
  if (fs.existsSync(modulesDir)) {
    const list = fs.readdirSync(modulesDir);
    for (const folderName of list) {
      const modulePath = path.join(modulesDir, folderName);
      if (fs.statSync(modulePath).isDirectory()) {
        const legacyId = folderName === 'accounting' ? 'church_think' : folderName;

        // Bypassed if already loaded as core service (duplication check)
        if (seenIds.has(legacyId)) {
          // Still register the router path `/api/modules/...` but using the same routing cache
          const entryPath = path.join(modulePath, 'index.js');
          if (fs.existsSync(entryPath)) {
            try {
              const router = require(entryPath);
              app.use(`/api/modules/${folderName}`, router);
              loadedLegacy.push(folderName);
            } catch (err) {
              console.error(`[Platform Registry] Failed to mount legacy module ${folderName}:`, err.message);
            }
          }
          continue;
        }
        seenIds.add(legacyId);

        await initSchema(modulePath, folderName);

        const entryPath = path.join(modulePath, 'index.js');
        if (fs.existsSync(entryPath)) {
          try {
            const router = require(entryPath);
            app.use(`/api/modules/${folderName}`, router);
            loadedLegacy.push(folderName);
          } catch (err) {
            console.error(`[Platform Registry] Failed to mount legacy module ${folderName}:`, err.message);
          }
        }
      }
    }
  }

  // 3. Scan and load plugins from backend/plugins/services/
  const pluginsDir = path.join(__dirname, '..', '..', 'plugins', 'services');
  if (fs.existsSync(pluginsDir)) {
    const list = fs.readdirSync(pluginsDir);
    for (const folderName of list) {
      const pluginPath = path.join(pluginsDir, folderName);
      if (fs.statSync(pluginPath).isDirectory()) {
        try {
          // Load manifest.json
          const manifestPath = path.join(pluginPath, 'manifest.json');
          if (!fs.existsSync(manifestPath)) {
            throw new Error(`manifest.json not found in plugin: ${folderName}`);
          }

          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          const pluginId = manifest.id || folderName;

          if (!manifest.enabled) {
            console.log(`[Platform Registry] Plugin ${pluginId} is disabled.`);
            continue;
          }

          if (seenIds.has(pluginId)) {
            console.warn(`[Platform Registry] Duplicate plugin ID warning: ${pluginId}. Skipping.`);
            continue;
          }
          seenIds.add(pluginId);

          // Initialize schema if db_schema.js exists
          await initSchema(pluginPath, folderName);

          // Load plugin router
          const entryPath = path.join(pluginPath, 'index.js');
          if (!fs.existsSync(entryPath)) {
            throw new Error(`index.js not found in plugin: ${folderName}`);
          }

          const router = require(entryPath);
          app.use(`/api/plugins/${pluginId}`, router);
          loadedPlugins.push(pluginId);
        } catch (err) {
          console.error(`[Platform Registry] Failed to load plugin ${folderName}:`, err.message);
          failedPlugins.push(`${folderName} (${err.message})`);
        }
      }
    }
  }

  // 4. Print Loading Summary
  console.log('\n========================================');
  console.log(' Booza Think OS Service Load Summary');
  console.log('========================================');
  console.log('Loaded services:');
  if (loadedServices.length > 0) {
    loadedServices.forEach(s => console.log(`  * ${s}`));
  } else {
    console.log('  * (none)');
  }

  console.log('Loaded legacy modules:');
  if (loadedLegacy.length > 0) {
    loadedLegacy.forEach(m => console.log(`  * ${m}`));
  } else {
    console.log('  * (none)');
  }

  console.log('Loaded plugins:');
  if (loadedPlugins.length > 0) {
    loadedPlugins.forEach(p => console.log(`  * ${p}`));
  } else {
    console.log('  * (none)');
  }

  console.log('Failed plugins:');
  if (failedPlugins.length > 0) {
    failedPlugins.forEach(f => console.log(`  * ${f}`));
  } else {
    console.log('  * 없음');
  }
  console.log('========================================\n');

  return {
    loadedServices,
    loadedLegacy,
    loadedPlugins,
    failedPlugins
  };
}

module.exports = {
  loadModules
};
