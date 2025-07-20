import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { initSocket } from "./socket/index.js"; 
import authRoutes from "./routes/authRoutes.js";
import avatarRoutes from './routes/avatarRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import bubbleRoutes from './routes/bubbleRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import stackRoutes from './routes/stackRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import activityRoutes from './routes/activityRoutes.js';




dotenv.config();

const app = express();
const server = http.createServer(app);

// ✅ Middleware
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

//API routes
app.use("/api", authRoutes);
app.use('/api/student', avatarRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bubbles', bubbleRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/bubbles', stackRoutes);  
app.use('/api/stacks', folderRoutes);
app.use('/api/activity-log', activityRoutes);


// Socket setup
initSocket(server);

// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
