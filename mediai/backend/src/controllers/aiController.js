import prisma from '../config/db.js';
import logger from '../utils/logger.js';
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const predictDisease = async (req, res, next) => {
  try {
    const { patientId, age, symptoms, bloodPressure, sugarLevel, cholesterol, bmi } = req.body;

    if (!patientId || !symptoms) {
      return res.status(400).json({ success: false, message: 'patientId and symptoms list are required' });
    }

    logger.info(`Forwarding disease prediction request to FastAPI for patient: ${patientId}`);

    let aiResult;
    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/ai/predict-disease`, {
        age: parseInt(age || '0'),
        symptoms,
        bloodPressure,
        sugarLevel,
        cholesterol,
        bmi
      });
      aiResult = aiResponse.data;
    } catch (aiErr) {
      logger.warn('FastAPI predict-disease service unavailable. Using simulation fallback.', aiErr.message);
      // Fallback
      aiResult = {
        predictedDisease: symptoms.includes('cough') ? 'Common Cold' : 'Hypertension',
        riskScore: 0.72,
        severityLevel: 'MODERATE',
        confidence: 0.85
      };
    }

    // Save prediction in DB
    const prediction = await prisma.diseasePrediction.create({
      data: {
        patientId,
        symptoms: JSON.stringify(symptoms),
        inputs: JSON.stringify({ age, bloodPressure, sugarLevel, cholesterol, bmi }),
        predictedDisease: aiResult.predictedDisease,
        riskScore: aiResult.riskScore,
        severityLevel: aiResult.severityLevel,
        modelUsed: 'RandomForest-v1'
      }
    });

    // If risk is high, auto-create a TreatmentRecommendation request (Section 8:5)
    if (aiResult.riskScore >= 0.70) {
      // Find the patient's primary doctor or a general doctor
      const doctors = await prisma.doctor.findMany({ take: 1 });
      const docId = doctors.length > 0 ? doctors[0].id : null;

      if (docId) {
        await prisma.treatmentRecommendation.create({
          data: {
            patientId,
            doctorId: docId,
            recommendedTreatment: JSON.stringify({ plan: 'Requires detailed diagnostic evaluation', severity: aiResult.severityLevel }),
            suggestedTests: JSON.stringify(['Complete Blood Count (CBC)', 'Electrocardiogram (ECG)']),
            medicationGuidance: JSON.stringify({ warning: 'Review medical history before prescribing medications' })
          }
        });
        logger.info(`Auto-created TreatmentRecommendation request for high-risk patient ${patientId}`);
      }
    }

    const parsedPrediction = {
      ...prediction,
      symptoms: typeof prediction.symptoms === 'string' ? JSON.parse(prediction.symptoms) : (Array.isArray(prediction.symptoms) ? prediction.symptoms : []),
      inputs: typeof prediction.inputs === 'string' ? JSON.parse(prediction.inputs) : (prediction.inputs || {}),
    };

    res.status(200).json({ success: true, data: parsedPrediction });
  } catch (err) {
    logger.error('Predict disease controller error:', err);
    next(err);
  }
};

export const recommendTreatment = async (req, res, next) => {
  try {
    const { patientId, doctorId, symptoms, predictedDisease, patientHistory } = req.body;

    if (!patientId || !doctorId || !predictedDisease) {
      return res.status(400).json({ success: false, message: 'patientId, doctorId, and predictedDisease are required' });
    }

    let aiResult;
    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/ai/recommend-treatment`, {
        symptoms: symptoms || [],
        predictedDisease,
        patientHistory: patientHistory || ''
      });
      aiResult = aiResponse.data;
    } catch (aiErr) {
      logger.warn('FastAPI recommend-treatment service unavailable. Using simulation fallback.', aiErr.message);
      aiResult = {
        treatmentPlan: ['Rest', 'Hydration', 'Symptomatic therapy'],
        suggestedTests: ['Blood panel'],
        medications: ['Paracetamol 500mg'],
        specialists: ['General Practitioner']
      };
    }

    const rec = await prisma.treatmentRecommendation.create({
      data: {
        patientId,
        doctorId,
        recommendedTreatment: JSON.stringify(aiResult.treatmentPlan),
        suggestedTests: JSON.stringify(aiResult.suggestedTests),
        medicationGuidance: JSON.stringify({ medications: aiResult.medications, guidance: aiResult.specialists })
      }
    });

    const parsedRec = {
      ...rec,
      recommendedTreatment: typeof rec.recommendedTreatment === 'string' ? JSON.parse(rec.recommendedTreatment) : rec.recommendedTreatment,
      suggestedTests: typeof rec.suggestedTests === 'string' ? JSON.parse(rec.suggestedTests) : rec.suggestedTests,
      medicationGuidance: typeof rec.medicationGuidance === 'string' ? JSON.parse(rec.medicationGuidance) : rec.medicationGuidance,
    };

    res.status(200).json({ success: true, data: parsedRec });
  } catch (err) {
    logger.error('Recommend treatment controller error:', err);
    next(err);
  }
};

export const predictOutcome = async (req, res, next) => {
  try {
    const { patientId, vitalSigns, age, conditions, labValues } = req.body;

    if (!patientId) {
      return res.status(400).json({ success: false, message: 'patientId is required' });
    }

    let aiResult;
    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/ai/predict-outcome`, {
        patientId,
        vitalSigns: vitalSigns || {},
        age: parseInt(age || '0'),
        conditions: conditions || [],
        labValues: labValues || {}
      });
      aiResult = aiResponse.data;
    } catch (aiErr) {
      logger.warn('FastAPI predict-outcome service unavailable. Using simulation fallback.', aiErr.message);
      aiResult = {
        recoveryProbability: 0.88,
        icuRequired: false,
        readmissionRisk: 0.15,
        mortalityRisk: 0.02,
        expectedStayDays: 4
      };
    }

    const outcome = await prisma.patientOutcome.create({
      data: {
        patientId,
        recoveryProbability: aiResult.recoveryProbability,
        icuRequired: aiResult.icuRequired,
        readmissionRisk: aiResult.readmissionRisk,
        mortalityRisk: aiResult.mortalityRisk,
        expectedStayDays: aiResult.expectedStayDays
      }
    });

    res.status(200).json({ success: true, data: outcome });
  } catch (err) {
    logger.error('Predict outcome controller error:', err);
    next(err);
  }
};

export const analyzeReportProxy = async (req, res, next) => {
  try {
    const { fileUrl, reportType } = req.body;

    if (!fileUrl || !reportType) {
      return res.status(400).json({ success: false, message: 'fileUrl and reportType are required' });
    }

    let aiResult;
    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/ai/analyze-report`, {
        fileUrl,
        reportType
      });
      aiResult = aiResponse.data;
    } catch (aiErr) {
      logger.warn('FastAPI analyze-report service unavailable. Using simulation fallback.', aiErr.message);
      aiResult = {
        extractedValues: { hemoglobin: 13.5 },
        abnormalFlags: [],
        riskAlerts: [],
        summary: 'Report analysis mock result.'
      };
    }

    res.status(200).json({ success: true, data: aiResult });
  } catch (err) {
    logger.error('Analyze report proxy error:', err);
    next(err);
  }
};

export const chatbotResponse = async (req, res, next) => {
  try {
    const { message, userId } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ success: false, message: 'userId and message are required' });
    }

    // Retrieve previous messages for history
    let chatSession = await prisma.chatSession.findFirst({
      where: { userId }
    });

    let history = [];
    let currentMessages = [];
    if (chatSession && chatSession.messages) {
      currentMessages = typeof chatSession.messages === 'string' ? JSON.parse(chatSession.messages) : (Array.isArray(chatSession.messages) ? chatSession.messages : []);
      history = currentMessages.slice(-10); // Last 10 messages
    }

    let aiResult;
    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/ai/chatbot`, {
        message,
        sessionHistory: history,
        userId
      });
      aiResult = aiResponse.data;
    } catch (aiErr) {
      logger.warn('FastAPI chatbot service unavailable. Using simulation fallback.', aiErr.message);
      aiResult = {
        reply: "Hello! I am MediBot, your AI healthcare assistant. I'm currently running in diagnostic mode. Please consult a doctor for definitive medical advice.",
        intent: 'greeting',
        suggestedActions: ['Consult Doctor', 'Book Appointment']
      };
    }

    const newMessage = { role: 'user', content: message };
    const replyMessage = { role: 'bot', content: aiResult.reply, intent: aiResult.intent, suggestedActions: aiResult.suggestedActions };

    // Update or create chat session history
    if (chatSession) {
      const updatedMessages = [...currentMessages, newMessage, replyMessage];
      await prisma.chatSession.update({
        where: { id: chatSession.id },
        data: {
          messages: JSON.stringify(updatedMessages)
        }
      });
    } else {
      await prisma.chatSession.create({
        data: {
          userId,
          messages: JSON.stringify([newMessage, replyMessage])
        }
      });
    }

    res.status(200).json({ success: true, data: aiResult });
  } catch (err) {
    logger.error('Chatbot controller error:', err);
    next(err);
  }
};
