/**
 * VPN Service (Stub)
 * TODO: Implement VPN node management
 */

async function getAllNodes(userId) {
  console.log('[VPN] getAllNodes called for user:', userId);
  return [];
}

async function deployNodes(options) {
  console.log('[VPN] deployNodes called with:', options);
  return [];
}

async function getConfig(nodeId, userId) {
  console.log('[VPN] getConfig called:', nodeId);
  throw new Error('VPN service not implemented yet');
}

async function getQRCode(nodeId, userId) {
  console.log('[VPN] getQRCode called:', nodeId);
  throw new Error('VPN service not implemented yet');
}

async function deleteNode(nodeId, userId) {
  console.log('[VPN] deleteNode called:', nodeId);
  return true;
}

module.exports = {
  getAllNodes,
  deployNodes,
  getConfig,
  getQRCode,
  deleteNode
};
