/**
 * Booza Think Platform OS - Decision Engine Controller Stub
 */
const express = require('express');
const router = express.Router();

const { evaluateMetrics } = require('./evaluator');
const { generateRecommendations } = require('./recommender');
const { checkAlerts } = require('./alerter');

router.get('/health', (req, res) => {
  res.json({
    engine: 'decision',
    status: 'ok'
  });
});

router.post('/evaluate', (req, res) => {
  const { serviceId, data } = req.body;
  
  const evalResult = evaluateMetrics(serviceId || 'unknown', data || {});
  const recommendResult = generateRecommendations(serviceId || 'unknown', evalResult.score);
  const alertResult = checkAlerts(serviceId || 'unknown', data || {});

  res.json({
    score: evalResult.score,
    opinion: 'Decision Engine Phase 1 stub response',
    hasAlert: alertResult.hasAlert,
    isHeld: alertResult.isHeld,
    recommendations: recommendResult
  });
});

module.exports = router;
