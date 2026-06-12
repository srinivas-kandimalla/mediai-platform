import express from 'express';
import {
  listResources,
  updateResourceUnits,
  getResourceForecast,
} from '../controllers/resourceController.js';
import { verifyToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, listResources);
router.put('/:id', verifyToken, authorizeRoles('ADMIN'), updateResourceUnits);
router.get('/forecast', verifyToken, authorizeRoles('ADMIN'), getResourceForecast);

export default router;
