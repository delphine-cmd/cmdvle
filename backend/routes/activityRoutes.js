// backend/routes/activityRoutes.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to verify JWT and get userId
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Missing auth token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// GET /api/activity-log/:stackId
router.get('/:stackId', authenticate, async (req, res) => {
  const { stackId } = req.params;

  try {
    const stack = await prisma.stack.findUnique({
      where: { id: parseInt(stackId) },
      include: {
        bubble: {
          include: {
            students: true,
            supervisors: true,
            room: true,
          },
        },
      },
    });

    if (!stack) return res.status(404).json({ message: 'Stack not found' });

    const bubble = stack.bubble;
    const isMember = bubble.students.some(s => s.id === req.userId) ||
                     bubble.supervisors.some(s => s.id === req.userId) ||
                     bubble.room?.creatorId === req.userId;

    if (!isMember) {
      return res.status(403).json({ message: 'You are not authorized to view this activity log' });
    }

    const logs = await prisma.activityLog.findMany({
      where: { stackId: parseInt(stackId) },
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        folder: true,
        stack: true,
      },
    });

    const formatted = logs.map(log => ({
      id: log.id,
      userName: log.user.name,
      stackName: log.stack.name,
      folderName: log.folder?.name || '',
      action: log.action,
      timestamp: log.createdAt,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Failed to fetch activity log:', err);
    res.status(500).json({ message: 'Failed to fetch activity log' });
  }
});


export default router;
