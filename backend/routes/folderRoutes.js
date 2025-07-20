import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/stacks/:stackId/folder → Create a new folder for the stack
router.post('/:stackId/folder', async (req, res) => {
  const { stackId } = req.params;  // Ensure stackId is being correctly received from params
  const { name, creatorId, parentId } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Missing auth token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const stack = await prisma.stack.findUnique({
      where: { id: parseInt(stackId) },  // Ensure stackId is used here
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

    if (!stack) {
      return res.status(404).json({ message: 'Stack not found' });
    }

    // Check if bubble exists
    const bubble = stack.bubble;
    if (!bubble) {
      return res.status(404).json({ message: 'Bubble not found for this stack' });
    }

    const isMember = (bubble?.students?.some(student => student.id === userId)) || 
                     (bubble?.supervisors?.some(supervisor => supervisor.id === userId)) ||
                     (bubble?.room?.creatorId === userId); 

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this bubble' });
    }

    // Create a new folder
    const newFolder = await prisma.folder.create({
  data: {
    name,
    stackId: parseInt(stackId),
    creatorId: creatorId || userId,
    parentId: parentId ? parseInt(parentId) : null,
  },
});


    return res.status(201).json(newFolder);
  } catch (error) {
    console.error('❌ Error creating folder:', error);
    return res.status(500).json({ message: 'Failed to create folder', error: error.message });
  }
});


// GET /api/stacks/:stackId/folders → Fetch all folders for a specific stack
router.get('/:stackId/folders', async (req, res) => {
  const { stackId } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Missing auth token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const stack = await prisma.stack.findUnique({
      where: { id: parseInt(stackId) },
      include: { bubble: { include: { students: true, supervisors: true, room: true } } },
    });

    if (!stack) {
      return res.status(404).json({ message: 'Stack not found' });
    }

    // Check if bubble exists
    const bubble = stack.bubble;
    if (!bubble) {
      return res.status(404).json({ message: 'Bubble not found for this stack' });
    }

    // Check if the user is a member of the bubble (either as a student, supervisor, or creator of the room)
    const isMember = (bubble?.students?.some(student => student.id === userId)) || 
                     (bubble?.supervisors?.some(supervisor => supervisor.id === userId)) ||
                     (bubble?.room?.creatorId === userId); // Access room here

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this bubble' });
    }

    // Fetch all folders
    const folders = await prisma.folder.findMany({
      where: { stackId: parseInt(stackId) },
    });

    return res.status(200).json(folders);
  } catch (error) {
    console.error('❌ Error fetching folders:', error);
    return res.status(500).json({ message: 'Failed to fetch folders', error: error.message });
  }
});

// PUT /api/stacks/:stackId/folder/:folderId → Update folder name
router.put('/:stackId/folder/:folderId', async (req, res) => {
  const { stackId, folderId } = req.params;
  const { name } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Missing auth token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const stack = await prisma.stack.findUnique({
      where: { id: parseInt(stackId) },
      include: { bubble: { include: { students: true, supervisors: true, room: true } } },
    });

    if (!stack) {
      return res.status(404).json({ message: 'Stack not found' });
    }

    // Check if bubble exists
    const bubble = stack.bubble;
    if (!bubble) {
      return res.status(404).json({ message: 'Bubble not found for this stack' });
    }

    // Check if the user is a member of the bubble
    const isMember = (bubble?.students?.some(student => student.id === userId)) || 
                     (bubble?.supervisors?.some(supervisor => supervisor.id === userId)) ||
                     (bubble?.room?.creatorId === userId);

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this bubble' });
    }

    // Update the folder
    const updatedFolder = await prisma.folder.update({
      where: { id: parseInt(folderId) },
      data: { name },
    });

    return res.status(200).json(updatedFolder);
  } catch (error) {
    console.error('❌ Error updating folder:', error);
    return res.status(500).json({ message: 'Failed to update folder', error: error.message });
  }
});

// DELETE /api/stacks/:stackId/folder/:folderId → Delete a folder
router.delete('/:stackId/folder/:folderId', async (req, res) => {
  const { stackId, folderId } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Missing auth token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const stack = await prisma.stack.findUnique({
      where: { id: parseInt(stackId) },
      include: { bubble: { include: { students: true, supervisors: true, room: true } } },
    });

    if (!stack) {
      return res.status(404).json({ message: 'Stack not found' });
    }

    // Check if bubble exists
    const bubble = stack.bubble;
    if (!bubble) {
      return res.status(404).json({ message: 'Bubble not found for this stack' });
    }

    // Check if the user is a member of the bubble
    const isMember = (bubble?.students?.some(student => student.id === userId)) || 
                     (bubble?.supervisors?.some(supervisor => supervisor.id === userId)) ||
                     (bubble?.room?.creatorId === userId);

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this bubble' });
    }

    // Delete the folder
    await prisma.folder.delete({
      where: { id: parseInt(folderId) },
    });

    return res.status(200).json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting folder:', error);
    return res.status(500).json({ message: 'Failed to delete folder', error: error.message });
  }
});

export default router;
