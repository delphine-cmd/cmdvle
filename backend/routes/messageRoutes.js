// backend/routes/messageRoutes.js
import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

router.post('/', async (req, res) => {
  const { text, senderId, roomId, bubbleId } = req.body;

  if (!text || !senderId || (!roomId && !bubbleId)) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const newMessage = await prisma.message.create({
      data: {
        text,
        senderId,
        roomId: roomId || undefined,
        bubbleId: bubbleId || undefined,
      },
      include: {
        sender: true,
      },
    });

    res.status(201).json({
  text: newMessage.text,
  senderId: newMessage.senderId,
  senderName: newMessage.sender.name,
  timestamp: newMessage.timestamp,
});

  } catch (err) {
    console.error('❌ Error saving message:', err);
    res.status(500).json({ message: 'Failed to save message' });
  }
});


// GET /api/messages?roomId=1 OR ?bubbleId=2
router.get('/', async (req, res) => {
  const { roomId, bubbleId } = req.query;

  if (!roomId && !bubbleId) {
    return res.status(400).json({ message: 'roomId or bubbleId required' });
  }

  try {
    const messages = await prisma.message.findMany({
      where: {
        ...(roomId ? { roomId: parseInt(roomId) } : {}),
        ...(bubbleId ? { bubbleId: parseInt(bubbleId) } : {}),
      },
      include: {
        sender: true,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    res.json(messages);
  } catch (err) {
    console.error('❌ Error fetching messages:', err);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});


export default router;
