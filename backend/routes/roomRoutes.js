// routes/roomRoutes.js

import express from 'express';
import { PrismaClient } from '@prisma/client';
import verifyLecturer from '../middleware/verifyLecturer.js';
import verifyStudent from '../middleware/verifyStudent.js';




function formatNameFromEmail(email) {
  const localPart = email.split('@')[0];

  if (localPart.includes('.')) {
    // Case: delphine.mawuli → Delphine Mawuli
    const [first, last] = localPart.split('.');
    return `${capitalize(first)} ${capitalize(last)}`;
  } else {
    // Case: emmanuelSadabor → Emmanuel S. Adabor
    const firstName = localPart.match(/^[a-z]+/i)?.[0] || '';
    const lastName = localPart.substring(firstName.length);
    const middleInitial = lastName[0]?.toUpperCase() + '.' || '';
    const lastNameRest = lastName.slice(1);
    return `${capitalize(firstName)} ${middleInitial} ${capitalize(lastNameRest)}`.trim();
  }
}

function capitalize(word) {
  if (!word) return '';
  return word[0].toUpperCase() + word.slice(1).toLowerCase();
}



const router = express.Router();
const prisma = new PrismaClient();

// ========================
// LECTURER ROUTES
// ========================

// POST /api/rooms/create - Lecturer creates a new room
router.post('/create', verifyLecturer, async (req, res) => {
  try {
    const { titles, name, courseName, courseCode, accessKey, supervisorKey } = req.body;
    const creatorId = req.user.id; // ✅ Attach logged-in lecturer

    const newRoom = await prisma.room.create({
      data: {
        titles: Array.isArray(titles) ? titles.join(',') : titles,
        name,
        courseName,
        courseCode,
        accessKey,
        supervisorKey,
        creatorId,
      },
    });

    return res.status(201).json({
      message: 'Room created successfully!',
      room: newRoom,
    });
  } catch (error) {
    console.error('Error creating room:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET /api/rooms/my-rooms - Lecturer fetches rooms they created
router.get('/my-rooms', verifyLecturer, async (req, res) => {
  const lecturerId = req.user.id;

  try {
    const myRooms = await prisma.room.findMany({
      where: { creatorId: lecturerId },
      orderBy: { createdAt: 'desc' },
    });

    const rooms = await Promise.all(
  myRooms.map(async (room) => {
    const supervisors = await prisma.supervisedRoom.findMany({
      where: { roomId: room.id },
      include: { supervisor: true },
    });

    return {
      ...room,
      titles: room.titles ? room.titles.split(',') : [],
      supervisors: supervisors.map(s => ({
        email: s.supervisor.email,
        name: formatNameFromEmail(s.supervisor.email),
      })),
    };
  })
);

    return res.json(rooms);
  } catch (error) {
    console.error('Error fetching lecturer rooms:', error);
    return res.status(500).json({ message: 'Failed to fetch lecturer rooms.' });
  }
});

// PUT /api/rooms/:id - Update room info
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    let { titles, ...rest } = req.body;

    if (Array.isArray(titles)) {
      titles = titles.join(',');
    }

    const updatedRoom = await prisma.room.update({
      where: { id: parseInt(id) },
      data: {
        titles,
        ...rest,
      },
    });

    return res.json({
      message: 'Room updated successfully!',
      room: updatedRoom,
    });
  } catch (error) {
    console.error('Error updating room:', error);
    return res.status(500).json({ message: 'Failed to update room' });
  }
});

// DELETE /api/rooms/:id - Delete a room
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedRoom = await prisma.room.delete({
      where: { id: parseInt(id) }
    });

    return res.json({
      message: 'Room deleted successfully!',
      room: deletedRoom
    });
  } catch (error) {
    console.error('Error deleting room:', error);
    return res.status(500).json({ message: 'Failed to delete room' });
  }
});

// GET /api/rooms/all - (⚠️ Optional: temporary/testing) fetch all rooms
router.get('/all', async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const roomsWithTitlesArray = rooms.map(room => ({
      ...room,
      titles: room.titles ? room.titles.split(',') : [],
    }));

    return res.json(roomsWithTitlesArray);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return res.status(500).json({ message: 'Failed to fetch rooms' });
  }
});

// ========================
// STUDENT ROUTES
// ========================

// POST /api/rooms/join - Student joins a room using access key
router.post('/join', verifyStudent, async (req, res) => {
  const { accessKey } = req.body;
  const studentId = req.user.id;

  if (!accessKey) {
    return res.status(400).json({ message: 'Access key is required.' });
  }

  try {
    const room = await prisma.room.findFirst({
      where: { accessKey },
    });

    if (!room) {
      return res.status(404).json({ message: 'Invalid access key.' });
    }

    const alreadyJoined = await prisma.joinedRoom.findFirst({
      where: {
        studentId,
        roomId: room.id,
      },
    });

    if (alreadyJoined) {
      return res.status(400).json({ message: 'You already joined this room.' });
    }

    const joined = await prisma.joinedRoom.create({
      data: {
        studentId,
        roomId: room.id,
      },
    });

    return res.status(201).json({ message: 'Room joined successfully.', joined });
  } catch (error) {
    console.error('Error joining room:', error);
    return res.status(500).json({ message: 'Failed to join room.' });
  }
});

// GET /api/rooms/joined - Student fetches rooms they have joined
router.get('/joined', verifyStudent, async (req, res) => {
  const studentId = req.user.id;

  try {
    const joinedRooms = await prisma.joinedRoom.findMany({
      where: { studentId },
      include: {
        room: true,
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    const rooms = await Promise.all(
      joinedRooms.map(async (j) => {
        const supervisors = await prisma.supervisedRoom.findMany({
          where: { roomId: j.room.id },
          include: { supervisor: true },
        });

        return {
          ...j.room,
          titles: j.room.titles ? j.room.titles.split(',') : [],
          supervisors: supervisors.map(s => ({
            email: s.supervisor.email,
            name: formatNameFromEmail(s.supervisor.email)
          })),
        };
      })
    );

    return res.json(rooms);
  } catch (error) {
    console.error('Error fetching joined rooms:', error);
    return res.status(500).json({ message: 'Failed to fetch joined rooms.' });
  }
});


// ========================
// SUPERVISOR ROUTES
// ========================

// POST /api/rooms/supervise - Lecturer joins a room as supervisor using supervisorKey
router.post('/supervise', verifyLecturer, async (req, res) => {
  const { supervisorKey } = req.body;
  const supervisorId = req.user.id;

  if (!supervisorKey) {
    return res.status(400).json({ message: 'Supervisor key is required.' });
  }

  try {
    const room = await prisma.room.findFirst({
      where: { supervisorKey },
    });

    if (!room) {
      return res.status(404).json({ message: 'Invalid supervisor key.' });
    }

    const alreadySupervising = await prisma.supervisedRoom.findFirst({
      where: {
        roomId: room.id,
        supervisorId,
      },
    });

    if (alreadySupervising) {
      return res.status(400).json({ message: 'You are already supervising this room.' });
    }

    await prisma.supervisedRoom.create({
      data: {
        roomId: room.id,
        supervisorId,
      },
    });

    return res.status(200).json({ message: 'Successfully joined as supervisor', room });
  } catch (error) {
    console.error('Error joining as supervisor:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});
// GET /api/rooms/supervised - Fetch rooms a lecturer is supervising
router.get('/supervised', verifyLecturer, async (req, res) => {
  const lecturerId = req.user.id;

  try {
    const supervised = await prisma.supervisedRoom.findMany({
      where: {
        supervisorId: lecturerId,
      },
      include: {
        room: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const rooms = await Promise.all(
      supervised.map(async (entry) => {
        const supervisors = await prisma.supervisedRoom.findMany({
          where: { roomId: entry.room.id },
          include: { supervisor: true },
        });

        return {
          ...entry.room,
          titles: entry.room.titles ? entry.room.titles.split(',') : [],
          supervisors: supervisors.map(s => ({
            email: s.supervisor.email,
            name: formatNameFromEmail(s.supervisor.email),
          })),
        };
      })
    );

    res.json(rooms);
  } catch (err) {
    console.error('Error fetching supervised rooms:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/rooms/by-id/:id - Fetch a single room by ID
router.get('/by-id/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const room = await prisma.room.findUnique({
  where: { id: parseInt(id) },
  include: {
    joinedBy: {
      include: {
        student: true,
      },
    },
  },
});


    if (!room) return res.status(404).json({ message: 'Room not found.' });

    const supervisors = await prisma.supervisedRoom.findMany({
      where: { roomId: room.id },
      include: { supervisor: true },
    });

    return res.json({
  ...room,
  joinedBy: room.joinedBy,
  title: room.titles ? room.titles.split(',').join(' ') : '',
  lecturerName: room.name || '',
  supervisors: supervisors.map(s => ({
    id: s.supervisor.id,
    email: s.supervisor.email,
    name: formatNameFromEmail(s.supervisor.email),
  })),
});


  } catch (err) {
    console.error('Error fetching room by ID:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/rooms/:roomId/participants - Fetch lecturer, supervisors, and students in a room
router.get('/:roomId/participants', async (req, res) => {
  const { roomId } = req.params;

  try {
    const room = await prisma.room.findUnique({
      where: { id: parseInt(roomId) },
      include: { creator: true },
    });

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const supervisorLinks = await prisma.supervisedRoom.findMany({
      where: { roomId: parseInt(roomId) },
      include: { supervisor: true },
    });

    const supervisors = supervisorLinks.map(link => ({
      id: link.supervisor.id,
      name: link.supervisor.name || formatNameFromEmail(link.supervisor.email),
      email: link.supervisor.email,
      online: true, // fake for now
    }));

    const joined = await prisma.joinedRoom.findMany({
      where: { roomId: parseInt(roomId) },
      include: { student: true },
    });

    const students = joined.map(entry => ({
      id: entry.student.id,
      name: entry.student.name || formatNameFromEmail(entry.student.email),
      email: entry.student.email,
      online: false, // fake for now
    }));

    const lecturer = {
      id: room.creator?.id,
      title: room.titles ? room.titles.split(',').join(' ') : '',
      name: room.creator?.name || '',
    };

    return res.json({ lecturer, supervisors, students });
  } catch (error) {
    console.error('Error fetching participants:', error);
    return res.status(500).json({ message: 'Failed to fetch participants' });
  }
});



export default router;
