import prisma from '../config/db.js';
import logger from '../utils/logger.js';
import { sendEmail, sendSMS } from '../services/notificationService.js';

export const bookAppointment = async (req, res, next) => {
  try {
    const { patientId, doctorId, scheduledAt, notes } = req.body;

    if (!patientId || !doctorId || !scheduledAt) {
      return res.status(400).json({ success: false, message: 'Missing required appointment fields' });
    }

    const scheduledDate = new Date(scheduledAt);

    // Validate Doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { user: true },
    });

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Optional slot checking: availableSlots is a JSON array
    const slots = typeof doctor.availableSlots === 'string' ? JSON.parse(doctor.availableSlots) : (Array.isArray(doctor.availableSlots) ? doctor.availableSlots : []);
    const targetISO = scheduledDate.toISOString();
    // Allow booking if slot matches (or for dev ease, if slots are empty, let booking pass)
    if (slots.length > 0 && !slots.includes(targetISO)) {
      return res.status(400).json({ success: false, message: 'Selected time slot is not available' });
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        scheduledAt: scheduledDate,
        status: 'PENDING',
        notes,
      },
      include: {
        patient: { include: { user: true } },
      },
    });

    logger.info(`Appointment booked: ${appointment.id} (Status: PENDING)`);

    // Notify Doctor via Email/SMS
    await sendEmail(
      doctor.user.email,
      'New Appointment Request',
      `Hello Dr. ${doctor.user.name},\n\nYou have a new appointment booking request from ${appointment.patient.user.name} for ${scheduledDate.toLocaleString()}. Please log in to confirm or reschedule.\n\nBest,\nMediAI Support`
    );

    res.status(201).json({
      success: true,
      message: 'Appointment request submitted successfully',
      data: appointment,
    });
  } catch (err) {
    logger.error('Book appointment error:', err);
    next(err);
  }
};

export const getAppointmentDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { include: { user: { select: { name: true, email: true } } } },
        doctor: { include: { user: { select: { name: true, email: true } } } },
      },
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.status(200).json({ success: true, data: appointment });
  } catch (err) {
    logger.error('Get appointment details error:', err);
    next(err);
  }
};

export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // CONFIRMED, CANCELLED, COMPLETED

    if (!['CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment status' });
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
      },
    });

    logger.info(`Appointment ${id} status updated to ${status}`);

    // Send notifications to Patient
    const timeStr = new Date(appointment.scheduledAt).toLocaleString();
    if (status === 'CONFIRMED') {
      await sendEmail(
        appointment.patient.user.email,
        'Appointment Confirmed',
        `Dear ${appointment.patient.user.name},\n\nYour appointment with Dr. ${appointment.doctor.user.name} on ${timeStr} has been CONFIRMED.\n\nThank you,\nMediAI`
      );
      await sendSMS('+15555555555', `MediAI: Your appointment with Dr. ${appointment.doctor.user.name} on ${timeStr} is CONFIRMED.`);
    } else if (status === 'CANCELLED') {
      await sendEmail(
        appointment.patient.user.email,
        'Appointment Cancelled',
        `Dear ${appointment.patient.user.name},\n\nYour appointment with Dr. ${appointment.doctor.user.name} on ${timeStr} has been CANCELLED.\n\nThank you,\nMediAI`
      );
    }

    res.status(200).json({
      success: true,
      message: `Appointment status updated to ${status}`,
      data: appointment,
    });
  } catch (err) {
    logger.error('Update appointment status error:', err);
    next(err);
  }
};

export const rescheduleAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { scheduledAt } = req.body;

    if (!scheduledAt) {
      return res.status(400).json({ success: false, message: 'New scheduled time is required' });
    }

    const newDate = new Date(scheduledAt);

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        scheduledAt: newDate,
        status: 'PENDING', // Reset to pending for approval
      },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
      },
    });

    const timeStr = newDate.toLocaleString();
    await sendEmail(
      appointment.doctor.user.email,
      'Appointment Rescheduled',
      `Dr. ${appointment.doctor.user.name},\n\nThe appointment with ${appointment.patient.user.name} has been rescheduled to ${timeStr} and is pending your approval.\n\nMediAI`
    );

    res.status(200).json({
      success: true,
      message: 'Appointment rescheduled, pending approval',
      data: appointment,
    });
  } catch (err) {
    logger.error('Reschedule appointment error:', err);
    next(err);
  }
};
