import express from 'express';
import {
  createPatientProfile,
  getPatientDetails,
  updatePatientProfile,
  getPatientEHR,
  uploadLabReport,
  getPatientLabReports,
  getPatientPredictions,
  getPatientAppointments,
  getPatientNotifications,
} from '../controllers/patientController.js';
import { verifyToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.post('/', createPatientProfile); // Can be called during user signup flow
router.get('/:id', verifyToken, getPatientDetails);
router.put('/:id', verifyToken, updatePatientProfile);
router.get('/:id/ehr', verifyToken, getPatientEHR);
router.post('/:id/lab-reports', verifyToken, uploadLabReport);
router.get('/:id/lab-reports', verifyToken, getPatientLabReports);
router.get('/:id/predictions', verifyToken, getPatientPredictions);
router.get('/:id/appointments', verifyToken, getPatientAppointments);
router.get('/:id/notifications', verifyToken, getPatientNotifications);

export default router;
