/**
 * Booza Think Platform OS - Distribution Publisher Stub
 */

async function publish(content) {
  console.log('[Publisher] Publishing content...');
  return { status: 'SUCCESS', publishId: 'pub_stub_123' };
}

async function preview(content) {
  return { previewUrl: 'http://localhost/preview' };
}

async function schedule(content, time) {
  return { scheduleId: 'sched_stub_123', time };
}

async function cancel(scheduleId) {
  return { cancelled: true };
}

async function status(publishId) {
  return { status: 'PUBLISHED' };
}

module.exports = {
  publish,
  preview,
  schedule,
  cancel,
  status
};
