// routes/fileRoutes.js

import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { admin, bucket } from '../firebaseAdmin.js';
import logActivity from '../utils/logActivity.js';

const router = express.Router();
const prisma = new PrismaClient();
const storage = multer.memoryStorage();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware to verify token and set req.userId and req.role
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Missing auth token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch (err) {
    console.error('JWT Verification Error:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Create file in a folder
router.post('/:folderId/file', authenticate, async (req, res) => {
  const { name, content } = req.body;
  const { folderId } = req.params;

  try {
    const folder = await prisma.folder.findUnique({
      where: { id: parseInt(folderId) },
      include: { stack: { include: { bubble: { include: { students: true, supervisors: true, room: true } } } } },
    });

    if (!folder) return res.status(404).json({ message: 'Folder not found' });

    const bubble = folder.stack.bubble;
    const isMember = bubble.students.some(s => s.id === req.userId) ||
                     bubble.supervisors.some(s => s.id === req.userId) ||
                     bubble.room?.creatorId === req.userId;
    if (!isMember) return res.status(403).json({ message: 'Not authorized' });

    const file = await prisma.file.create({
      data: {
        name,
        content: content || '',
        folderId: parseInt(folderId),
        creatorId: req.userId,
        bubbleId: bubble.id,
        filePath: `/folders/${folderId}/${name}`,
      },
    });

    res.status(201).json(file);
  } catch (err) {
    console.error('Create File Error:', err);
    res.status(500).json({ message: 'Failed to create file' });
  }
});
// Upload file to a folder (Firebase Storage)
router.post('/:folderId/upload', authenticate, upload.single('file'), async (req, res) => {
  const { folderId } = req.params;
  const { name } = req.body;
  const uploadedFile = req.file;

  if (!uploadedFile) return res.status(400).json({ message: 'No file uploaded' });

  try {
    const folder = await prisma.folder.findUnique({
      where: { id: parseInt(folderId) },
      include: {
        stack: { include: { bubble: { include: { students: true, supervisors: true, room: true } } } },
      },
    });

    if (!folder) return res.status(404).json({ message: 'Folder not found' });

    const bubble = folder.stack.bubble;
    const isMember = bubble.students.some(s => s.id === req.userId) ||
                     bubble.supervisors.some(s => s.id === req.userId) ||
                     bubble.room?.creatorId === req.userId;

    if (!isMember) return res.status(403).json({ message: 'Not authorized' });

    const fileName = name || uploadedFile.originalname; // Ensures fileName is always set
    const destination = `folders/${folderId}/${fileName}`;
    const fileRef = bucket.file(destination);

    try {
  await fileRef.save(uploadedFile.buffer, {
    metadata: {
      contentType: uploadedFile.mimetype,
    },
  });
  await fileRef.makePublic();
} catch (uploadErr) {
  console.error('Error uploading to Firebase:', uploadErr);
  return res.status(500).json({ message: 'Failed to upload file to Firebase' });
}

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

    const newFile = await prisma.file.create({
  data: {
    name: fileName,
    content: '', // Firebase stores it, no need to store content
    folderId: parseInt(folderId),
    creatorId: req.userId,
    bubbleId: bubble.id,
    filePath: publicUrl, // Save public URL here
  },
});

await logActivity({
  userId: req.userId,
  stackId: folder.stackId,
  folderId: folder.id,
  action: 'push',
});

res.status(201).json(newFile);

  } catch (err) {
    console.error('Firebase Upload Error:', err);
    res.status(500).json({ message: 'Failed to upload file to Firebase' });
  }
});


// Get all files in folder
router.get('/:folderId/files', authenticate, async (req, res) => {
  const { folderId } = req.params;

  try {
    const files = await prisma.file.findMany({
      where: { folderId: parseInt(folderId) },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: true, // Make sure creator info is included
      },
    });

    // Format the response to include creatorName, creationDate, and creationTime
    const formattedFiles = files.map(file => ({
      ...file,
      creatorName: file.creator.name, // Add creator's name
      creationDate: file.createdAt.toISOString().split('T')[0], // Date (YYYY-MM-DD)
      creationTime: file.createdAt.toISOString().split('T')[1].split('.')[0], // Time (HH:MM:SS)
    }));

    res.json(formattedFiles);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch files' });
  }
});


// Get a single file by ID
router.get('/file/:fileId', authenticate, async (req, res) => {
  try {
    const fileId = parseInt(req.params.fileId);
    console.log('➡️ Fetching file with ID:', fileId);

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { creator: true },
    });

    if (!file) {
      console.warn('⚠️ File not found in DB');
      return res.status(404).json({ message: 'File not found' });
    }

    console.log('✅ File found:', file);
let contentBase64 = null;


const extension = path.extname(file.name).slice(1).toLowerCase();

const spreadsheetExtensions = ['xlsx', 'xls', 'csv'];

if (
  file.filePath?.includes('https://storage.googleapis.com') &&
  spreadsheetExtensions.includes(extension)
) {
  const firebasePath = file.filePath.split(`/${bucket.name}/`)[1];
  try {
    const [fileBuffer] = await bucket.file(firebasePath).download();
    contentBase64 = fileBuffer.toString('base64');
  } catch (err) {
    console.error('🔥 Error reading file from Firebase:', err.message);
  }
}

    const fileDetails = {
      ...file,
      creatorName: file.creator?.name || 'Unknown',
      creationDate: file.createdAt?.toISOString().split('T')[0] || '',
      creationTime: file.createdAt?.toISOString().split('T')[1]?.split('.')[0] || '',
    contentBase64,
    };

    res.json(fileDetails);
  } catch (err) {
    console.error('🔥 Error in GET /file/:fileId:', err);
    res.status(500).json({ message: 'Failed to fetch file', error: err.message });
  }
});


// Update file name/content
router.put('/file/:fileId', authenticate, async (req, res) => {
  const { name, content } = req.body;
  const { fileId } = req.params;

  try {
    // Find the file
    const file = await prisma.file.findUnique({
      where: { id: parseInt(fileId) },
      include: {
        accessRequests: true, // Include access requests
      },
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if the file is locked and if the user has access
    if (file.isLocked) {
      const request = file.accessRequests.find(
        (req) => req.requesterId === req.userId && req.status === 'approved'
      );
      if (!request) {
        return res.status(403).json({ message: 'File is locked. Access not approved' });
      }
    }

    // If the file is unlocked or access is granted, proceed with the update
    const updatedFile = await prisma.file.update({
      where: { id: parseInt(fileId) },
      data: {
        name,
        content,
        updatedAt: new Date(),
      },
    });

    res.json(updatedFile);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update file' });
  }
});


// Delete file
router.delete('/file/:fileId', authenticate, async (req, res) => {
  const { fileId } = req.params;

  try {
    const file = await prisma.file.findUnique({
      where: { id: parseInt(fileId) },
      include: { accessRequests: true }, // Include access requests
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // If the file is locked, check if the user has access
    if (file.isLocked) {
      const request = file.accessRequests.find(
        (req) => req.requesterId === req.userId && req.status === 'approved'
      );
      if (!request && req.userId !== file.creatorId) {
        const creator = await prisma.user.findUnique({
          where: { id: file.creatorId },
        });

        return res.status(403).json({
          message: `File is locked by ${creator.name}. Request access to proceed.`,
        });
      }
    }

    // Only the creator or an admin can delete the file
    if (file.creatorId !== req.userId && req.role !== 'admin') {
      return res.status(403).json({ message: 'You do not have permission to delete this file' });
    }

    // Delete from Firebase Storage if filePath is a Firebase URL
if (file.filePath && file.filePath.includes('https://storage.googleapis.com')) {
  const firebasePath = file.filePath.split(`/${bucket.name}/`)[1]; // Extract path from full URL
  if (firebasePath) {
    try {
      await bucket.file(firebasePath).delete();
      console.log('Deleted file from Firebase Storage:', firebasePath);
    } catch (firebaseErr) {
      console.error('Failed to delete from Firebase Storage:', firebaseErr.message);
    }
  }
}

    // Delete the file
    await prisma.file.delete({ where: { id: parseInt(fileId) } });
    res.json({ message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete file' });
  }
});

// Lock or unlock file
router.put('/file/:fileId/lock', authenticate, async (req, res) => {
  const { isLocked } = req.body;
  const { fileId } = req.params;

  try {
    const file = await prisma.file.findUnique({
      where: { id: parseInt(fileId) },
      include: { accessRequests: true },
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Only the creator can lock/unlock the file
    if (file.creatorId !== req.userId) {
      return res.status(403).json({ message: 'You do not have permission to modify this file' });
    }

    // If unlocking, ensure there are no pending access requests
    if (!isLocked && file.accessRequests.some((req) => req.status === 'pending')) {
      return res.status(400).json({ message: 'Cannot unlock file while access requests are pending' });
    }

    // Update lock status
    const updatedFile = await prisma.file.update({
      where: { id: parseInt(fileId) },
      data: { isLocked },
    });

    res.json(updatedFile);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update lock status' });
  }
});

// Create an access request for a locked file
router.post('/file/:fileId/access-request', authenticate, async (req, res) => {
  const { fileId } = req.params;

  try {
    const file = await prisma.file.findUnique({
      where: { id: parseInt(fileId) },
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // File must be locked to request access
    if (!file.isLocked) {
      return res.status(400).json({ message: 'File is not locked' });
    }

    // Check if access has already been requested
    const existingRequest = await prisma.accessRequest.findFirst({
      where: { fileId: parseInt(fileId), requesterId: req.userId },
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Access request already exists' });
    }

    // Create the access request
    const accessRequest = await prisma.accessRequest.create({
      data: {
        fileId: parseInt(fileId),
        requesterId: req.userId,
        status: 'pending', // Default status is pending
      },
    });

    res.status(201).json(accessRequest);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create access request' });
  }
});

// Rename file in Firebase and DB
router.put('/file/:fileId/rename', authenticate, async (req, res) => {
  const { fileId } = req.params;
  const { newName } = req.body;

  try {
    const file = await prisma.file.findUnique({ where: { id: parseInt(fileId) } });
    if (!file) return res.status(404).json({ message: 'File not found' });

    if (!file.filePath || !file.filePath.includes(bucket.name)) {
      return res.status(400).json({ message: 'File does not exist in Firebase' });
    }

    const oldPath = file.filePath.split(`/${bucket.name}/`)[1];
    const newPath = oldPath.replace(path.basename(oldPath), newName);

    // Copy the file in Firebase
    await bucket.file(oldPath).copy(bucket.file(newPath));
    // Delete the old file
    await bucket.file(oldPath).delete();

    const newPublicUrl = `https://storage.googleapis.com/${bucket.name}/${newPath}`;

    // Update the file record in the database
    const updatedFile = await prisma.file.update({
      where: { id: parseInt(fileId) },
      data: {
        name: newName,
        filePath: newPublicUrl,
        updatedAt: new Date(),
      },
    });

    res.json(updatedFile);
  } catch (err) {
    console.error('Rename Error:', err.message);
    res.status(500).json({ message: 'Failed to rename file' });
  }
});


// Move file to a different folder
router.put('/file/:fileId/move', authenticate, async (req, res) => {
  const { newFolderId } = req.body;
  const { fileId } = req.params;

  try {
    const file = await prisma.file.update({
      where: { id: parseInt(fileId) },
      data: { folderId: parseInt(newFolderId) },
    });
    res.json(file);
  } catch (err) {
    res.status(500).json({ message: 'Failed to move file' });
  }
});

// PUT /api/files/file/:fileId/access-request/:requestId → Approve or deny an access request
router.put('/file/:fileId/access-request/:requestId', authenticate, async (req, res) => {
  const { fileId, requestId } = req.params;
  const { status } = req.body; // 'approved' or 'denied'

  try {
    // Ensure the status is either 'approved' or 'denied'
    if (!['approved', 'denied'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Find the access request
    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id: parseInt(requestId) },
      include: { file: true },
    });

    if (!accessRequest) {
      return res.status(404).json({ message: 'Access request not found' });
    }

    // Ensure that the user is authorized to change the request status (file owner or admin)
    if (req.userId !== accessRequest.file.creatorId && req.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to approve/deny this request' });
    }

    // Update the request status
    const updatedRequest = await prisma.accessRequest.update({
      where: { id: parseInt(requestId) },
      data: { status },
    });

    res.json(updatedRequest);
  } catch (err) {
    console.error('Error updating access request:', err);
    res.status(500).json({ message: 'Error updating access request' });
  }
});

export default router;
