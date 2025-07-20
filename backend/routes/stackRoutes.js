// routes/stackRoutes.js

import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken'; // Ensure this is only imported once

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/bubbles/:bubbleId/stack → Create a stack for the specified bubble
router.post('/:bubbleId/stack', async (req, res) => {
  const { bubbleId } = req.params;
  const { name } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Missing auth token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Check if user is a student or supervisor in this bubble
    const bubble = await prisma.bubble.findUnique({
      where: { id: parseInt(bubbleId) },
      include: { students: true, supervisors: true },
    });

    if (!bubble) {
      return res.status(404).json({ message: 'Bubble not found' });
    }

    const room = await prisma.room.findUnique({
  where: { id: bubble.roomId },
});

const isMember = bubble.students.some(student => student.id === userId) || 
                 bubble.supervisors.some(supervisor => supervisor.id === userId) ||
                 room?.creatorId === userId;

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this bubble' });
    }

    // Create a stack for this bubble
    const newStack = await prisma.stack.create({
      data: {
        name,
        bubbleId: parseInt(bubbleId), // No unique constraint
      },
    });

    return res.status(201).json(newStack);
  } catch (error) {
    console.error('❌ Error creating stack:', error);
    return res.status(500).json({ message: 'Failed to create stack' });
  }
});

// PUT /api/bubbles/:bubbleId/stack/:stackId → Update stack info
router.put('/:bubbleId/stack/:stackId', async (req, res) => {
  const { bubbleId, stackId } = req.params;
  const { name } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Missing auth token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Check if user is a student or supervisor in this bubble
    const bubble = await prisma.bubble.findUnique({
      where: { id: parseInt(bubbleId) },
      include: { students: true, supervisors: true },
    });

    if (!bubble) {
      return res.status(404).json({ message: 'Bubble not found' });
    }

    const room = await prisma.room.findUnique({
  where: { id: bubble.roomId },
});

const isMember = bubble.students.some(student => student.id === userId) || 
                 bubble.supervisors.some(supervisor => supervisor.id === userId) ||
                 room?.creatorId === userId;


    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this bubble' });
    }

    // Update the stack
    const updatedStack = await prisma.stack.update({
      where: { id: parseInt(stackId) },
      data: { name },
    });

    return res.status(200).json(updatedStack);
  } catch (error) {
    console.error('❌ Error updating stack:', error);
    return res.status(500).json({ message: 'Failed to update stack' });
  }
});

// DELETE /api/bubbles/:bubbleId/stack/:stackId → Delete a stack for the specified bubble
router.delete('/:bubbleId/stack/:stackId', async (req, res) => {
  const { bubbleId, stackId } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Missing auth token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Check if user is a student or supervisor in this bubble
    const bubble = await prisma.bubble.findUnique({
      where: { id: parseInt(bubbleId) },
      include: { students: true, supervisors: true },
    });

    if (!bubble) {
      return res.status(404).json({ message: 'Bubble not found' });
    }

    const room = await prisma.room.findUnique({
  where: { id: bubble.roomId },
});

const isMember = bubble.students.some(student => student.id === userId) || 
                 bubble.supervisors.some(supervisor => supervisor.id === userId) ||
                 room?.creatorId === userId;


    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this bubble' });
    }

    // Delete the stack
    await prisma.stack.delete({
      where: { id: parseInt(stackId) },
    });

    return res.status(200).json({ message: 'Stack deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting stack:', error);
    return res.status(500).json({ message: 'Failed to delete stack' });
  }
});

// GET /api/bubbles/:bubbleId/stack/:stackId → Fetch a specific stack details
router.get('/:bubbleId/stack/:stackId', async (req, res) => {
  const { bubbleId, stackId } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Missing auth token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Check if user is a student or supervisor in this bubble
    const bubble = await prisma.bubble.findUnique({
      where: { id: parseInt(bubbleId) },
      include: { students: true, supervisors: true },
    });

    if (!bubble) {
      return res.status(404).json({ message: 'Bubble not found' });
    }

    const room = await prisma.room.findUnique({
  where: { id: bubble.roomId },
});

const isMember = bubble.students.some(student => student.id === userId) || 
                 bubble.supervisors.some(supervisor => supervisor.id === userId) ||
                 room?.creatorId === userId;


    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this bubble' });
    }

    // Fetch stack details
    const stack = await prisma.stack.findUnique({
      where: { id: parseInt(stackId) },
      include: {
        projects: true,
      },
    });

    if (!stack) {
      return res.status(404).json({ message: 'Stack not found' });
    }

    return res.json(stack);
  } catch (error) {
    console.error('❌ Error fetching stack details:', error);
    return res.status(500).json({ message: 'Failed to fetch stack' });
  }
});

// GET /api/bubbles/:bubbleId/stacks → Fetch all stacks for a specific bubble
router.get('/:bubbleId/stacks', async (req, res) => {
  const { bubbleId } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Missing auth token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Check if user is a student or supervisor in this bubble
    const bubble = await prisma.bubble.findUnique({
      where: { id: parseInt(bubbleId) },
      include: { students: true, supervisors: true },
    });

    if (!bubble) {
      return res.status(404).json({ message: 'Bubble not found' });
    }

    const room = await prisma.room.findUnique({
  where: { id: bubble.roomId },
});

const isMember = bubble.students.some(student => student.id === userId) || 
                 bubble.supervisors.some(supervisor => supervisor.id === userId) ||
                 room?.creatorId === userId;


    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this bubble' });
    }

    // Fetch all stacks for this bubble
    const stacks = await prisma.stack.findMany({
      where: { bubbleId: parseInt(bubbleId) },
    });

    return res.json(stacks);
  } catch (error) {
    console.error('❌ Error fetching stacks:', error);
    return res.status(500).json({ message: 'Failed to fetch stacks' });
  }
});


export default router;
