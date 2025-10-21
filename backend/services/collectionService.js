/**
 * Collection Service (Stub)
 * TODO: Implement data collection jobs
 */

async function getAllJobs(userId) {
  console.log('[Collection] getAllJobs called for user:', userId);
  return [];
}

async function createJob(options) {
  console.log('[Collection] createJob called with:', options);
  return { jobId: 1, status: 'created' };
}

async function getResults(jobId, userId) {
  console.log('[Collection] getResults called:', jobId);
  return [];
}

async function exportResults(jobId, format, userId) {
  console.log('[Collection] exportResults called:', jobId, format);
  return '{}';
}

async function getActiveJobs(userId) {
  console.log('[Collection] getActiveJobs called for user:', userId);
  return [];
}

module.exports = {
  getAllJobs,
  createJob,
  getResults,
  exportResults,
  getActiveJobs
};
