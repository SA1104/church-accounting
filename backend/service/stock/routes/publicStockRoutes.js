const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { 
  checkSchema,
  getHealth, 
  searchInstruments, 
  getInstrumentDetail, 
  getDailyBars, 
  getSnapshots, 
  getKoreaMarketLatest 
} = require('../controllers/publicStockController');

const router = express.Router();

// Public Data API Rate Limiter (60 requests per minute)
const publicDataLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' }, meta: { status: 'ERROR' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// Health Endpoint is NOT strictly limited to allow uptime monitoring, 
// but we can apply a very loose limiter to prevent pure abuse
const healthLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 600,
  message: { error: { code: 'TOO_MANY_REQUESTS' }, meta: { status: 'ERROR' } }
});

router.get('/health', healthLimiter, getHealth);

// All other endpoints require the schema to be ready and are strictly rate limited
router.use(publicDataLimiter);

router.get('/instruments', searchInstruments);
router.get('/instruments/:stockCode', getInstrumentDetail);
router.get('/instruments/:stockCode/daily-bars', getDailyBars);
router.get('/instruments/:stockCode/snapshots', getSnapshots);
router.get('/markets/korea/latest', getKoreaMarketLatest);

module.exports = router;
