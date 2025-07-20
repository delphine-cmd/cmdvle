import express from 'express';
import {
  requestPasswordReset,
  verifyPasswordReset,
  resetPassword
} from '../controllers/resetController.js';

const router = express.Router();

// Step 1: Request reset
router.post('/request', requestPasswordReset);

// Step 2: Validate token via GET (e.g. when user clicks link in email)
router.get('/:token', verifyPasswordReset);

// Step 3: Submit new password (frontend form → backend)
router.post('/reset-password', resetPassword);

export default router;
