import express from 'express';
import {
  bookAppointment,
  getAppointmentDetails,
  updateAppointmentStatus,
  rescheduleAppointment,
} from '../controllers/appointmentController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', verifyToken, bookAppointment);
router.get('/:id', verifyToken, getAppointmentDetails);
router.put('/:id/status', verifyToken, updateAppointmentStatus);
router.put('/:id/reschedule', verifyToken, rescheduleAppointment);

export default router;
