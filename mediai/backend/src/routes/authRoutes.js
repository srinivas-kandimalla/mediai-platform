import express from 'express';
import { register, login, logout, refreshToken, changePassword } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.put('/change-password', verifyToken, changePassword);

export default router;
