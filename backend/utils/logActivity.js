// backend/utils/logActivity.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Logs a user action to the ActivityLog table.
 * 
 * @param {Object} params
 * @param {number} params.userId - ID of the user performing the action
 * @param {number} params.stackId - ID of the stack
 * @param {number} [params.folderId] - Optional folder ID
 * @param {string} params.action - e.g. "push", "delete", "rename"
 */
const logActivity = async ({ userId, stackId, folderId = null, action }) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        stackId,
        folderId,
        action,
      },
    });
  } catch (err) {
    console.error(' Activity logging failed:', err.message);
  }
};

export default logActivity;
