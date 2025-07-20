// socket/stackHandlers.js
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const yDocs = new Map(); // In-memory storage

export function handleStackSocket(io, socket) {
  const { userId } = socket.handshake.auth || {};

  if (!userId) {
    console.log("❌ No userId for stack socket");
    return;
  }

  // ✅ Join a file's live editing room
  socket.on('join-file', (fileId) => {
    const room = `file-${fileId}`;
    socket.join(room);
    console.log(`📥 User ${userId} joined ${room}`);

    if (!yDocs.has(fileId)) {
      yDocs.set(fileId, new Y.Doc());
    }

    const doc = yDocs.get(fileId);

    // ✅ Broadcast updates to others in room
    socket.on('doc-update', (update) => {
      Y.applyUpdate(doc, update);
      socket.to(room).emit('doc-update', update);
    });
  });

  // ✅ Leave room (optional)
  socket.on('leave-file', (fileId) => {
    socket.leave(`file-${fileId}`);
  });
}
