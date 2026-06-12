import prisma from '../config/db.js';
import logger from '../utils/logger.js';

export const createDoctorProfile = async (req, res, next) => {
  try {
    const { userId, specialization, department, experience, qualification, licenseNumber, availableSlots } = req.body;

    const doctor = await prisma.doctor.create({
      data: {
        userId,
        specialization,
        department,
        experience: parseInt(experience || '0'),
        qualification,
        licenseNumber,
        availableSlots: JSON.stringify(availableSlots || []),
      },
    });

    res.status(201).json({ success: true, message: 'Doctor profile created successfully', data: doctor });
  } catch (err) {
    logger.error('Create doctor profile error:', err);
    next(err);
  }
};

export const listDoctors = async (req, res, next) => {
  try {
    const { specialization, department, search } = req.query;

    const filters = {};
    if (specialization) {
      filters.specialization = { contains: specialization };
    }
    if (department) {
      filters.department = { contains: department };
    }
    if (search) {
      filters.user = {
        name: { contains: search },
      };
    }

    const doctors = await prisma.doctor.findMany({
      where: filters,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const parsedDoctors = doctors.map(d => ({
      ...d,
      availableSlots: typeof d.availableSlots === 'string' ? JSON.parse(d.availableSlots) : (Array.isArray(d.availableSlots) ? d.availableSlots : [])
    }));

    res.status(200).json({ success: true, data: parsedDoctors });
  } catch (err) {
    logger.error('List doctors error:', err);
    next(err);
  }
};

export const getDoctorProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    const parsedDoctor = {
      ...doctor,
      availableSlots: typeof doctor.availableSlots === 'string' ? JSON.parse(doctor.availableSlots) : (Array.isArray(doctor.availableSlots) ? doctor.availableSlots : [])
    };

    res.status(200).json({ success: true, data: parsedDoctor });
  } catch (err) {
    logger.error('Get doctor profile error:', err);
    next(err);
  }
};

export const updateAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { availableSlots } = req.body; // Array of ISO timestamp strings

    if (!Array.isArray(availableSlots)) {
      return res.status(400).json({ success: false, message: 'availableSlots must be an array of ISO string timestamps' });
    }

    const updated = await prisma.doctor.update({
      where: { id },
      data: {
        availableSlots: JSON.stringify(availableSlots),
      },
    });

    res.status(200).json({ success: true, message: 'Availability slots updated successfully', data: updated });
  } catch (err) {
    logger.error('Update availability error:', err);
    next(err);
  }
};

export const getDoctorAppointments = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointments = await prisma.appointment.findMany({
      where: { doctorId: id },
      include: {
        patient: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    res.status(200).json({ success: true, data: appointments });
  } catch (err) {
    logger.error('Get doctor appointments error:', err);
    next(err);
  }
};

export const getAssignedPatients = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Assigned patients can be found through appointments booked with this doctor
    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { appointments: { some: { doctorId: id } } },
          { ehrs: { some: { doctorId: id } } }
        ]
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    res.status(200).json({ success: true, data: patients });
  } catch (err) {
    logger.error('Get assigned patients error:', err);
    next(err);
  }
};
