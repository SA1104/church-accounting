/**
 * Booza Think Platform OS - ai.js Proxy Re-export & Legacy Stubs
 */
const aiProviderSdk = require('./ai/index.js');

// Legacy stubs to support optional Queue Worker and SSE features
function addSseClient(res) {
  console.log('[Queue] Mock addSseClient called.');
}

function removeSseClient(res) {
  console.log('[Queue] Mock removeSseClient called.');
}

function startQueueWorker() {
  console.log('[Queue] Mock startQueueWorker called. Queue is optional and skipped.');
}

async function reprocessAttachment(attachmentId) {
  console.log(`[Queue] Mock reprocessAttachment called for ID: ${attachmentId}`);
}

module.exports = {
  ...aiProviderSdk,
  addSseClient,
  removeSseClient,
  startQueueWorker,
  reprocessAttachment
};
