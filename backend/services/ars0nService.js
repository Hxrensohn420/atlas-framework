/**
 * Ars0n OSINT Service (Stub)
 * TODO: Implement OSINT scanning
 */

async function getAllJobs(userId) {
  console.log('[OSINT] getAllJobs called for user:', userId);
  return [];
}

async function startScan(options) {
  console.log('[OSINT] startScan called with:', options);
  return { jobId: 1, status: 'started' };
}

async function getJobStatus(jobId, userId) {
  console.log('[OSINT] getJobStatus called:', jobId);
  throw new Error('OSINT service not implemented yet');
}

async function getFindings(jobId, userId) {
  console.log('[OSINT] getFindings called:', jobId);
  return [];
}

async function stopJob(jobId, userId) {
  console.log('[OSINT] stopJob called:', jobId);
  return true;
}

async function getActiveJobs(userId) {
  console.log('[OSINT] getActiveJobs called for user:', userId);
  return [];
}

module.exports = {
  getAllJobs,
  startScan,
  getJobStatus,
  getFindings,
  stopJob,
  getActiveJobs
};
