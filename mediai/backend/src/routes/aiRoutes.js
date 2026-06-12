import express from 'express';
import {
  predictDisease,
  recommendTreatment,
  predictOutcome,
  analyzeReportProxy,
  chatbotResponse,
} from '../controllers/aiController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/predict-disease', verifyToken, predictDisease);
router.post('/recommend-treatment', verifyToken, recommendTreatment);
router.post('/predict-outcome', verifyToken, predictOutcome);
router.post('/analyze-report', verifyToken, analyzeReportProxy);
router.post('/chatbot', verifyToken, chatbotResponse);

export default router;
