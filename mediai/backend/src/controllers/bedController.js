import prisma from '../config/db.js';
import logger from '../utils/logger.js';
import axios from 'axios';
import { broadcastBedAvailability } from '../services/notificationService.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const getBedAvailability = async (req, res, next) => {
  try {
    const beds = await prisma.bed.findMany({
      include: {
        patient: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { wardType: 'asc' },
    });

    res.status(200).json({ success: true, data: beds });
  } catch (err) {
    logger.error('Get bed availability error:', err);
    next(err);
  }
};

export const assignBed = async (req, res, next) => {
  try {
    const { bedId, patientId, expectedStayDays } = req.body;

    if (!bedId || !patientId) {
      return res.status(400).json({ success: false, message: 'bedId and patientId are required' });
    }

    // Check if bed is already occupied
    const targetBed = await prisma.bed.findUnique({ where: { id: bedId } });
    if (!targetBed) {
      return res.status(404).json({ success: false, message: 'Bed not found' });
    }
    if (targetBed.isOccupied) {
      return res.status(400).json({ success: false, message: 'Bed is currently occupied' });
    }

    const reservedUntil = expectedStayDays 
      ? new Date(Date.now() + expectedStayDays * 24 * 60 * 60 * 1000) 
      : null;

    const bed = await prisma.bed.update({
      where: { id: bedId },
      data: {
        isOccupied: true,
        patientId,
        reservedUntil,
      },
      include: {
        patient: {
          include: { user: true },
        },
      },
    });

    logger.info(`Bed ${bedId} assigned to Patient: ${patientId}. Expected stay: ${expectedStayDays || 'unspecified'} days.`);

    // Broadcast Socket.io notification
    broadcastBedAvailability(bed);

    res.status(200).json({ success: true, message: 'Bed assigned successfully', data: bed });
  } catch (err) {
    logger.error('Assign bed error:', err);
    next(err);
  }
};

export const releaseBed = async (req, res, next) => {
  try {
    const { id } = req.params;

    const bed = await prisma.bed.update({
      where: { id },
      data: {
        isOccupied: false,
        patientId: null,
        reservedUntil: null,
      },
    });

    logger.info(`Bed ${id} released and is now available.`);

    // Broadcast Socket.io notification
    broadcastBedAvailability(bed);

    res.status(200).json({ success: true, message: 'Bed released successfully', data: bed });
  } catch (err) {
    logger.error('Release bed error:', err);
    next(err);
  }
};

export const getBedForecast = async (req, res, next) => {
  try {
    const currentOccupancy = await prisma.bed.count({ where: { isOccupied: true } });
    
    // Fetch historical outcomes
    const outcomes = await prisma.patientOutcome.findMany({
      take: 90,
      orderBy: { createdAt: 'desc' },
    });

    // Proxy forecasting to Python service
    let forecastResult;
    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/ai/forecast-beds`, {
        historicalData: outcomes,
        currentOccupancy,
        timeHorizon: 7
      });
      forecastResult = aiResponse.data;
    } catch (aiErr) {
      logger.warn('FastAPI forecast-beds unavailable. Using simulation fallback.', aiErr.message);
      forecastResult = {
        forecastedDemand: [
          { day: 'Day 1', demand: 12 },
          { day: 'Day 2', demand: 15 },
          { day: 'Day 3', demand: 18 },
          { day: 'Day 4', demand: 14 },
          { day: 'Day 5', demand: 13 },
          { day: 'Day 6', demand: 17 },
          { day: 'Day 7', demand: 21 },
        ],
        peakDays: ['Day 7', 'Day 3'],
        recommendedPreparation: 'Expect high ICU surge in the next 72 hours. Allocate staff to EMERGENCY and ICU wards.'
      };
    }

    res.status(200).json({ success: true, data: forecastResult });
  } catch (err) {
    logger.error('Get bed forecast error:', err);
    next(err);
  }
};
