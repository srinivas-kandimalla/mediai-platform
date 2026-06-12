import express from 'express';
import {
  createDoctorProfile,
  listDoctors,
  getDoctorProfile,
  updateAvailability,
  getDoctorAppointments,
  getAssignedPatients,
} from '../controllers/doctorController.js';
import { verifyToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.post('/', createDoctorProfile);
router.get('/', verifyToken, listDoctors);
router.get('/:id', verifyToken, getDoctorProfile);
router.put('/:id/availability', verifyToken, authorizeRoles('DOCTOR'), updateAvailability);
router.get('/:id/appointments', verifyToken, getDoctorAppointments);
router.get('/:id/patients', verifyToken, getAssignedPatients);

export default router;
