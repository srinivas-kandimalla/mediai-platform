import express from 'express';
import {
  getAlerts,
  manualTriggerAlert,
  resolveAlert,
} from '../controllers/alertController.js';
import { verifyToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, getAlerts);
router.post('/trigger', verifyToken, manualTriggerAlert);
router.put('/:id/resolve', verifyToken, authorizeRoles('ADMIN', 'STAFF', 'DOCTOR'), resolveAlert);

export default router;
