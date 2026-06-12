import prisma from '../config/db.js';
import logger from '../utils/logger.js';
import { triggerEmergencyAlert } from '../services/notificationService.js';

export const getAlerts = async (req, res, next) => {
  try {
    const alerts = await prisma.alert.findMany({
      include: {
        patient: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { notifiedAt: 'desc' },
    });

    res.status(200).json({ success: true, data: alerts });
  } catch (err) {
    logger.error('Get alerts error:', err);
    next(err);
  }
};

export const manualTriggerAlert = async (req, res, next) => {
  try {
    const { patientId, alertType, message } = req.body;

    if (!patientId || !alertType || !message) {
      return res.status(400).json({ success: false, message: 'patientId, alertType, and message are required' });
    }

    const alert = await triggerEmergencyAlert(patientId, alertType, message);

    res.status(201).json({ success: true, message: 'Emergency alert triggered successfully', data: alert });
  } catch (err) {
    logger.error('Manual trigger alert error:', err);
    next(err);
  }
};

export const resolveAlert = async (req, res, next) => {
  try {
    const { id } = req.params;

    const alert = await prisma.alert.update({
      where: { id },
      data: { isResolved: true },
    });

    logger.info(`Alert ${id} marked as resolved by staff.`);

    res.status(200).json({ success: true, message: 'Alert resolved successfully', data: alert });
  } catch (err) {
    logger.error('Resolve alert error:', err);
    next(err);
  }
};
