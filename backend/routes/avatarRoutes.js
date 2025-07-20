import express from 'express';
import { updateAvatar, getAvatar } from '../controllers/avatarController.js';
import verifyStudent from '../middleware/verifyStudent.js'; // ✅ now matches correct path

const router = express.Router();

router.put('/avatar', verifyStudent, updateAvatar);
router.get('/avatar', verifyStudent, getAvatar);

export default router;
