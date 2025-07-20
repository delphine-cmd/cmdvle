import express from 'express';
import {
  addUser,
  verifyEmail,
  setPassword,
  loginUser,
  getUserFromToken
} from '../controllers/authController.js';
import {
  requestPasswordReset,
  verifyPasswordReset
} from '../controllers/resetController.js';
import verifyAdmin from '../middleware/authMiddleware.js'; // middleware that checks admin token

const router = express.Router();

// Public routes (no auth needed)
router.post('/login', loginUser);
router.get('/verify-email/:token', verifyEmail);
router.post('/set-password', setPassword);

// Admin-only route to add users
router.post('/admin/add-user', verifyAdmin, addUser);

// Route to get user info from token
router.get('/verify', getUserFromToken);

// Password reset routes
router.post('/request-password-reset', requestPasswordReset);
router.get('/reset-password/:token', verifyPasswordReset);

export default router;
