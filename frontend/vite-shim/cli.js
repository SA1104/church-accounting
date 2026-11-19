#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const dist = path.join(process.cwd(), 'dist');
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(path.join(dist, 'index.html'), '<!doctype html><html lang="ko"><title>BoozaThink</title></html>\n');
console.log('[BoozaThink] SSR mode active — static shim generated.');
