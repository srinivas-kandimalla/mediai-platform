import nodemailer from 'nodemailer';
import twilio from 'twilio';
import logger from '../utils/logger.js';
import prisma from '../config/db.js';

let ioInstance = null;

// Initialize Nodemailer transporter
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } catch (err) {
    logger.warn('Failed to configure email transporter. Email notifications will be mocked.', err);
  }
}

// Initialize Twilio client
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  } catch (err) {
    logger.warn('Failed to initialize Twilio client. SMS notifications will be mocked.', err);
  }
}

export const setSocketIO = (io) => {
  ioInstance = io;
};

export const sendEmail = async (to, subject, body) => {
  logger.info(`Sending email to: ${to} | Subject: ${subject}`);
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"MediAI Portal" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text: body,
        html: `<p>${body.replace(/\n/g, '<br>')}</p>`,
      });
      return true;
    } catch (err) {
      logger.error('Nodemailer error:', err);
      return false;
    }
  } else {
    logger.info(`[MOCK EMAIL] TO: ${to} | SUBJECT: ${subject} | BODY: ${body}`);
    return true;
  }
};

export const sendSMS = async (to, body) => {
  logger.info(`Sending SMS to: ${to} | Content: ${body}`);
  if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
    try {
      await twilioClient.messages.create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
      });
      return true;
    } catch (err) {
      logger.error('Twilio SMS error:', err);
      return false;
    }
  } else {
    logger.info(`[MOCK SMS] TO: ${to} | CONTENT: ${body}`);
    return true;
  }
};

export const sendPushNotification = async (userId, title, body) => {
  try {
    // Record notification in DB
    await prisma.notification.create({
      data: {
        userId,
        title,
        body,
        channel: 'PUSH',
      },
    });

    if (ioInstance) {
      // Emit to specific user's socket room
      ioInstance.to(`user:${userId}`).emit('notification', { title, body, sentAt: new Date() });
    }
    logger.info(`Push notification sent and logged for User: ${userId}`);
    return true;
  } catch (err) {
    logger.error('Push notification save/emit error:', err);
    return false;
  }
};

export const triggerEmergencyAlert = async (patientId, alertType, message) => {
  try {
    // Create Alert entry
    const alert = await prisma.alert.create({
      data: {
        patientId,
        alertType,
        message,
        isResolved: false,
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
    });

    logger.warn(`🚨 EMERGENCY ALERT TRIGGERED: ${alertType} - ${message}`);

    // Emit live to all connected doctors/admins rooms
    if (ioInstance) {
      ioInstance.emit('emergency_alert', alert);
      ioInstance.emit('bed_update', { message: `Bed status updated due to emergency alert for patient: ${alert.patient.user.name}` });
    }

    // Attempt email to patient
    if (alert.patient.user.email) {
      await sendEmail(
        alert.patient.user.email,
        `MediAI Critical Alert: ${alertType}`,
        `Hello ${alert.patient.user.name},\nA critical alert has been logged for you: ${message}. The medical team has been notified.`
      );
    }

    // Mock/Real SMS to emergency contact or patient
    // Send to a simulated emergency phone number
    await sendSMS('+15555555555', `MediAI Alert: CRITICAL status for patient ${alert.patient.user.name}: ${message}`);

    return alert;
  } catch (err) {
    logger.error('Emergency alert trigger failed:', err);
    throw err;
  }
};

export const broadcastBedAvailability = (bed) => {
  if (ioInstance) {
    ioInstance.emit('bed_availability_update', bed);
  }
};
