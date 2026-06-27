/**
 * Booza Think Platform OS - simulation Router
 */
const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    engine: 'simulation',
    status: 'ok'
  });
});

router.post('/execute', async (req, res) => {
  res.json({
    engine: 'simulation',
    result: 'stub execute successful'
  });
});

module.exports = router;
