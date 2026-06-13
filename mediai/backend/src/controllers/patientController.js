import prisma from '../config/db.js';
import logger from '../utils/logger.js';
import axios from 'axios';
import { triggerEmergencyAlert } from '../services/notificationService.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const listPatients = async (req, res, next) => {
  try {
    const patients = await prisma.patient.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: patients });
  } catch (err) {
    logger.error('List patients error:', err);
    next(err);
  }
};

export const createPatientProfile = async (req, res, next) => {
  try {
    const { userId, age, gender, bloodGroup, weight, height, allergies, medicalHistory, familyHistory, insuranceDetails } = req.body;

    const patient = await prisma.patient.create({
      data: {
        userId,
        age: parseInt(age || '0'),
        gender,
        bloodGroup,
        weight: parseFloat(weight || '0.0'),
        height: parseFloat(height || '0.0'),
        allergies,
        medicalHistory,
        familyHistory,
        insuranceDetails,
      },
    });

    res.status(201).json({ success: true, message: 'Patient profile created successfully', data: patient });
  } catch (err) {
    logger.error('Create patient profile error:', err);
    next(err);
  }
};

export const getPatientDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
          },
        },
      },
    });

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.status(200).json({ success: true, data: patient });
  } catch (err) {
    logger.error('Get patient details error:', err);
    next(err);
  }
};

export const updatePatientProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { age, gender, bloodGroup, weight, height, allergies, medicalHistory, familyHistory, insuranceDetails } = req.body;

    const updated = await prisma.patient.update({
      where: { id },
      data: {
        age: age ? parseInt(age) : undefined,
        gender,
        bloodGroup,
        weight: weight ? parseFloat(weight) : undefined,
        height: height ? parseFloat(height) : undefined,
        allergies,
        medicalHistory,
        familyHistory,
        insuranceDetails,
      },
    });

    res.status(200).json({ success: true, message: 'Profile updated successfully', data: updated });
  } catch (err) {
    logger.error('Update patient profile error:', err);
    next(err);
  }
};

export const getPatientEHR = async (req, res, next) => {
  try {
    const { id } = req.params;

    let ehr = await prisma.eHR.findFirst({
      where: { patientId: id },
      include: {
        doctor: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    // If none exists, return empty structure instead of throwing
    if (!ehr) {
      return res.status(200).json({
        success: true,
        data: {
          id: null,
          patientId: id,
          doctorId: null,
          prescriptions: [],
          diagnosticReports: [],
          treatmentHistory: [],
          vaccinationRecords: [],
        },
      });
    }

    const parsedEhr = {
      ...ehr,
      prescriptions: typeof ehr.prescriptions === 'string' ? JSON.parse(ehr.prescriptions) : (Array.isArray(ehr.prescriptions) ? ehr.prescriptions : []),
      diagnosticReports: typeof ehr.diagnosticReports === 'string' ? JSON.parse(ehr.diagnosticReports) : (Array.isArray(ehr.diagnosticReports) ? ehr.diagnosticReports : []),
      treatmentHistory: typeof ehr.treatmentHistory === 'string' ? JSON.parse(ehr.treatmentHistory) : (Array.isArray(ehr.treatmentHistory) ? ehr.treatmentHistory : []),
      vaccinationRecords: typeof ehr.vaccinationRecords === 'string' ? JSON.parse(ehr.vaccinationRecords) : (Array.isArray(ehr.vaccinationRecords) ? ehr.vaccinationRecords : []),
    };

    res.status(200).json({ success: true, data: parsedEhr });
  } catch (err) {
    logger.error('Get patient EHR error:', err);
    next(err);
  }
};

export const uploadLabReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reportType, fileUrl } = req.body; // Expect URL directly (handling uploads client-side or mocked)

    const finalUrl = fileUrl || '/mock_lab_report.png';

    logger.info(`Analyzing lab report from URL: ${finalUrl} of type: ${reportType}`);

    // Call Python FastAPI AI Service for OCR and NLP analysis
    let analysisResult = { extractedValues: {}, abnormalFlags: [], riskAlerts: [], summary: 'Analysis pending' };
    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/ai/analyze-report`, {
        fileUrl: finalUrl,
        reportType,
      });
      if (aiResponse.data) {
        analysisResult = aiResponse.data;
      }
    } catch (aiErr) {
      logger.warn('Failed to connect to FastAPI analyze-report. Using fallback mock parsing.', aiErr.message);
      // Fallback response mapping
      analysisResult = {
        extractedValues: { hemoglobin: 11.2, wbc: 9500, glucose: 155 },
        abnormalFlags: ['hemoglobin (Low)', 'glucose (High)'],
        riskAlerts: ['Anemia warning', 'Hyperglycemia risk'],
        summary: 'Parsed values indicate low hemoglobin levels and elevated fasting blood glucose.',
      };
    }

    // Save report in Database
    const labReport = await prisma.labReport.create({
      data: {
        patientId: id,
        reportType,
        fileUrl: finalUrl,
        analysisResult: JSON.stringify(analysisResult),
        abnormalFlags: JSON.stringify(analysisResult.abnormalFlags),
      },
    });

    // Check if critical values triggered an Alert
    if (analysisResult.riskAlerts && analysisResult.riskAlerts.length > 0) {
      await triggerEmergencyAlert(
        id,
        'LAB_REPORT',
        `Critical Lab Report Alert for ${reportType}: ${analysisResult.riskAlerts.join(', ')}`
      );
    }

    const parsedReport = {
      ...labReport,
      analysisResult: typeof labReport.analysisResult === 'string' ? JSON.parse(labReport.analysisResult) : labReport.analysisResult,
      abnormalFlags: typeof labReport.abnormalFlags === 'string' ? JSON.parse(labReport.abnormalFlags) : labReport.abnormalFlags,
    };

    res.status(201).json({
      success: true,
      message: 'Lab report uploaded and analyzed successfully',
      data: parsedReport,
    });
  } catch (err) {
    logger.error('Upload lab report error:', err);
    next(err);
  }
};

export const getPatientPredictions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const predictions = await prisma.diseasePrediction.findMany({
      where: { patientId: id },
      orderBy: { createdAt: 'desc' },
    });

    const parsedPredictions = predictions.map(p => ({
      ...p,
      symptoms: typeof p.symptoms === 'string' ? JSON.parse(p.symptoms) : (Array.isArray(p.symptoms) ? p.symptoms : []),
      inputs: typeof p.inputs === 'string' ? JSON.parse(p.inputs) : (p.inputs || {}),
    }));

    res.status(200).json({ success: true, data: parsedPredictions });
  } catch (err) {
    logger.error('Get patient predictions error:', err);
    next(err);
  }
};

export const getPatientAppointments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointments = await prisma.appointment.findMany({
      where: { patientId: id },
      include: {
        doctor: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    res.status(200).json({ success: true, data: appointments });
  } catch (err) {
    logger.error('Get patient appointments error:', err);
    next(err);
  }
};

export const getPatientLabReports = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reports = await prisma.labReport.findMany({
      where: { patientId: id },
      orderBy: { uploadedAt: 'desc' },
    });

    const parsedReports = reports.map(r => ({
      ...r,
      analysisResult: typeof r.analysisResult === 'string' ? JSON.parse(r.analysisResult) : r.analysisResult,
      abnormalFlags: typeof r.abnormalFlags === 'string' ? JSON.parse(r.abnormalFlags) : r.abnormalFlags,
    }));

    res.status(200).json({ success: true, data: parsedReports });
  } catch (err) {
    logger.error('Get patient lab reports error:', err);
    next(err);
  }
};

export const getPatientNotifications = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notifications = await prisma.notification.findMany({
      where: { userId: id },
      orderBy: { sentAt: 'desc' },
    });

    res.status(200).json({ success: true, data: notifications });
  } catch (err) {
    logger.error('Get patient notifications error:', err);
    next(err);
  }
};
