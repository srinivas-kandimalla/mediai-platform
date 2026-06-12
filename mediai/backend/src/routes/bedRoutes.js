import express from 'express';
import {
  getBedAvailability,
  assignBed,
  releaseBed,
  getBedForecast,
} from '../controllers/bedController.js';
import { verifyToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/availability', verifyToken, getBedAvailability);
router.post('/assign', verifyToken, authorizeRoles('ADMIN', 'STAFF'), assignBed);
router.put('/:id/release', verifyToken, authorizeRoles('ADMIN', 'STAFF', 'DOCTOR'), releaseBed);
router.get('/forecast', verifyToken, authorizeRoles('ADMIN'), getBedForecast);

export default router;
