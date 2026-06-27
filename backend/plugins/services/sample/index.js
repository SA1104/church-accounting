/**
 * Booza Think Platform OS - Sample Plugin Router
 */
const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    plugin: 'sample',
    status: 'ok'
  });
});

module.exports = router;
