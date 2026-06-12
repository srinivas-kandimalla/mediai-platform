import express from 'express';
import {
  getStaffSchedules,
  generateOptimalSchedule,
  updateShift,
} from '../controllers/staffController.js';
import { verifyToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/schedules', verifyToken, getStaffSchedules);
router.post('/schedules/generate', verifyToken, authorizeRoles('ADMIN'), generateOptimalSchedule);
router.put('/schedules/:id', verifyToken, authorizeRoles('ADMIN'), updateShift);

export default router;
