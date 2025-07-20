// routes/bubbleRoutes.js

import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken'; // Ensure this is only imported once

const router = express.Router();
const prisma = new PrismaClient();

router.get('/:roomId', async (req, res) => {
  const { roomId } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Missing auth token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const roomIdNum = parseInt(roomId);

    // Check if user is a supervisor in this room
    const isSupervisor = await prisma.supervisedRoom.findFirst({
      where: {
        roomId: roomIdNum,
        supervisorId: userId,
      },
    });

    const allBubbles = await prisma.bubble.findMany({
      where: { roomId: roomIdNum },
      include: {
        students: true,
        supervisors: true,
      },
    });

    const filteredBubbles = isSupervisor
      ? allBubbles.filter(bubble =>
          bubble.supervisors.some(s => s.id === userId)
        )
      : allBubbles;

    return res.json(filteredBubbles);
  } catch (error) {
    console.error('❌ Error in GET /bubbles/:roomId:', error);
    return res.status(500).json({ message: 'Failed to fetch bubbles' });
  }
});



router.post('/:roomId', async (req, res) => {
  const { roomId } = req.params;
  const incomingBubbles = req.body.bubbles;
 // Expecting raw array of bubbles

  console.log('📥 Incoming bubble payload:', JSON.stringify(incomingBubbles, null, 2));

  if (!Array.isArray(incomingBubbles)) {
  return res.status(400).json({ message: "'bubbles' must be an array" });
}

  try {
    const roomIdNum = parseInt(roomId);

    // 1. Fetch existing bubbles in this room
    const existingBubbles = await prisma.bubble.findMany({
      where: { roomId: roomIdNum },
      include: { students: true },
    });

    const assignedStudentIds = new Set(
      existingBubbles.flatMap(b => b.students.map(s => s.id))
    );

    // 2. Check if incoming students are already assigned
    for (const bubble of incomingBubbles) {
      for (const student of bubble.students) {
        const studentId = student.id || student; // handle both object or id
        if (assignedStudentIds.has(studentId)) {
          return res.status(400).json({
            message: `Student with ID ${studentId} is already in a bubble.`,
          });
        }
      }
    }

    // 3. Create new bubbles
    const createdBubbles = await Promise.all(
      incomingBubbles.map(bubble =>
        prisma.bubble.create({
          data: {
            name: bubble.name,
            roomId: roomIdNum,
            students: {
              connect: bubble.students.map(s => ({ id: s.id || s })),
            },
            supervisors: {
              connect: bubble.supervisors.map(s => ({ id: s.id || s })),
            },
          },
        })
      )
    );

    console.log('✅ Saved bubbles:', createdBubbles);
    res.status(201).json(createdBubbles);
  } catch (error) {
    console.error('❌ Error creating bubbles:', error);
    res.status(500).json({ message: 'Failed to create bubbles' });
  }
});


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

    const isMember = bubble.students.some(student => student.id === userId) || 
                     bubble.supervisors.some(supervisor => supervisor.id === userId);

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this bubble' });
    }

    // Create a stack for this bubble
    const newStack = await prisma.stack.create({
      data: {
        name,
        bubbleId: parseInt(bubbleId),
      },
    });

    return res.status(201).json(newStack);
  } catch (error) {
    console.error('❌ Error creating stack:', error);
    return res.status(500).json({ message: 'Failed to create stack' });
  }
});




router.put('/:bubbleId', async (req, res) => {
  const { bubbleId } = req.params;
  const { students, supervisors } = req.body;

  try {
    const updated = await prisma.bubble.update({
      where: { id: parseInt(bubbleId) },
      data: {
        students: {
          set: students.map(id => ({ id })), 
        },
        supervisors: {
          set: supervisors.map(id => ({ id })),
        },
      },
      include: {
        students: true,
        supervisors: true,
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error('❌ Error updating bubble:', error);
    return res.status(500).json({ message: 'Failed to update bubble' });
  }
});


// PATCH /api/bubbles/:bubbleId → update students/supervisors in a bubble
router.patch('/:bubbleId', async (req, res) => {
  const { bubbleId } = req.params;
  const { students, supervisors } = req.body;

  if (!Array.isArray(students) || !Array.isArray(supervisors)) {
    return res.status(400).json({ message: "'students' and 'supervisors' must be arrays." });
  }

  try {
    const updatedBubble = await prisma.bubble.update({
      where: { id: parseInt(bubbleId) },
      data: {
        students: {
          set: students.map(id => ({ id })),
        },
        supervisors: {
          set: supervisors.map(id => ({ id })),
        },
      },
      include: {
        students: true,
        supervisors: true,
      },
    });

    return res.json(updatedBubble);
  } catch (error) {
    console.error('❌ Error updating bubble:', error);
    return res.status(500).json({ message: 'Failed to update bubble' });
  }
});


// PUT /api/bubbles/:roomId/:bubbleId
router.put('/:roomId/:bubbleId', async (req, res) => {
  const { roomId, bubbleId } = req.params;
  const { students, supervisors } = req.body;

  try {
    const updatedBubble = await prisma.bubble.update({
      where: { id: parseInt(bubbleId) },
      data: {
        students: {
          set: students.map(id => ({ id })),
        },
        supervisors: {
          set: supervisors.map(id => ({ id })),
        },
      },
      include: {
        students: true,
        supervisors: true,
      },
    });

    res.json(updatedBubble);
  } catch (err) {
    console.error('❌ Error updating bubble:', err);
    res.status(500).json({ message: 'Failed to update bubble' });
  }
});

// GET /api/bubble/:bubbleId → Get a single bubble with students and supervisors
router.get('/single/:bubbleId', async (req, res) => {
  const { bubbleId } = req.params;

  try {
    const bubble = await prisma.bubble.findUnique({
      where: { id: parseInt(bubbleId) },
      include: {
        students: true,
        supervisors: true,
      },
    });

    if (!bubble) {
      return res.status(404).json({ message: "Bubble not found" });
    }

    res.json(bubble);
  } catch (error) {
    console.error("❌ Error fetching bubble:", error);
    res.status(500).json({ message: "Failed to fetch bubble" });
  }
});





export default router;
