/**
 * Booza Think Platform OS - Media Engine Controller Stub
 */
const express = require('express');
const router = express.Router();

const { generateReport } = require('./generators/report');
const { generateBlog } = require('./generators/blog');
const { generateShorts } = require('./generators/shorts');
const { generateYouTube } = require('./generators/youtube');
const { generateSNS } = require('./generators/sns');

router.get('/health', (req, res) => {
  res.json({
    engine: 'media',
    status: 'ok'
  });
});

router.post('/generate', (req, res) => {
  const { channelType, data } = req.body;

  let result;
  switch (String(channelType).toUpperCase()) {
    case 'REPORT':
      result = generateReport(data || {});
      break;
    case 'BLOG':
      result = generateBlog(data || {});
      break;
    case 'SHORTS':
      result = generateShorts(data || {});
      break;
    case 'YOUTUBE':
      result = generateYouTube(data || {});
      break;
    case 'SNS':
      result = generateSNS(data || {});
      break;
    default:
      result = {
        title: 'Media Engine Phase 1 Stub',
        body: 'This is a placeholder script.',
        visualSuggestion: 'Simple text card animation'
      };
  }

  res.json({
    channelType: channelType || 'SHORTS',
    title: result.title,
    body: result.body,
    visualSuggestion: result.visualSuggestion
  });
});

module.exports = router;
