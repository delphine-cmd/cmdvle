import prisma from '../utils/prismaClient.js';

const onlineUserIds = new Set();

export function handleRoomSocket(io, socket) {
  const { userId } = socket.handshake.auth || {};

  if (!userId) {
    console.log("❌ No userId in handshake");
    return;
  }

  const id = Number(userId);
  onlineUserIds.add(id);
  console.log(`✅ User ${id} connected`);

// Join chat room
socket.on('join-room', (roomKey) => {
  socket.join(roomKey);
  console.log(`📥 User ${id} joined room ${roomKey}`);
});


  prisma.onlineStatus.upsert({
    where: { userId: id },
    update: { isOnline: true },
    create: { userId: id, isOnline: true },
  }).catch(console.error);

  io.emit("online-users", Array.from(onlineUserIds));

  socket.on("disconnect", async () => {
    console.log(`⚠️ User ${id} disconnected`);
    onlineUserIds.delete(id);

    await prisma.onlineStatus.update({
      where: { userId: id },
      data: { isOnline: false },
    });

    io.emit("online-users", Array.from(onlineUserIds));
  });


// Handle incoming messages and save to DB
socket.on('message', async (msg) => {
  console.log("📨 Received message from client:", msg); // ← ADD THIS LINE

  const { text, roomKey, senderId, timestamp } = msg;

  const isBubble = roomKey.startsWith('bubble-');
  const bubbleId = isBubble ? parseInt(roomKey.split('-')[1]) : null;
  const roomId = !isBubble ? parseInt(roomKey.split('-')[1]) : null;

  try {
    const saved = await prisma.message.create({
      data: {
        text,
        timestamp: new Date(timestamp),
        sender: { connect: { id: senderId } },
        ...(bubbleId ? { bubble: { connect: { id: bubbleId } } } : {}),
        ...(roomId ? { room: { connect: { id: roomId } } } : {}),
      },
      include: {
        sender: true, // includes name
      },
    });

    io.to(roomKey).emit('message', {
      text: saved.text,
      senderId: saved.senderId,
      senderName: saved.sender.name, // ✅ actual name
      timestamp: saved.timestamp,
    });

  } catch (err) {
    console.error('❌ Error saving message:', err);
  }
});

// ✅ Typing indicator handler
socket.on('typing', ({ roomKey, senderName }) => {
socket.to(roomKey).emit('typing', { senderName });

});


socket.on('stop-typing', ({ roomKey }) => {
  socket.to(roomKey).emit('stop-typing');
});

}
