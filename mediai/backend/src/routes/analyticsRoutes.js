import express from 'express';
import {
  getAdminDashboardStats,
  getDoctorDashboardStats,
  getPatientDashboardStats,
  generateReports,
} from '../controllers/analyticsController.js';
import { verifyToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/admin-dashboard', verifyToken, authorizeRoles('ADMIN'), getAdminDashboardStats);
router.get('/doctor-dashboard/:id', verifyToken, authorizeRoles('DOCTOR', 'ADMIN'), getDoctorDashboardStats);
router.get('/patient-dashboard/:id', verifyToken, getPatientDashboardStats);
router.get('/reports/:type', verifyToken, authorizeRoles('ADMIN'), generateReports);

export default router;
