// src/socket.js
import { io } from "socket.io-client";

const studentId = localStorage.getItem("studentId"); // make sure this is saved after login

export const socket = io("http://localhost:4000", {
  withCredentials: true,
  auth: { studentId },
});
