import prisma from '../config/db.js';
import logger from '../utils/logger.js';

export const getAdminDashboardStats = async (req, res, next) => {
  try {
    const totalPatients = await prisma.patient.count();
    const totalDoctors = await prisma.doctor.count();
    
    // Bed counts
    const totalBeds = await prisma.bed.count();
    const occupiedBeds = await prisma.bed.count({ where: { isOccupied: true } });
    const bedOccupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

    // Active critical alerts
    const activeAlerts = await prisma.alert.count({ where: { isResolved: false } });

    // Resource inventory levels
    const resources = await prisma.resource.findMany();

    // Appt outcomes counts
    const appointmentsCount = await prisma.appointment.count();

    // Simulated revenue based on completed appointments
    const completedAppts = await prisma.appointment.count({ where: { status: 'COMPLETED' } });
    const simulatedRevenue = completedAppts * 150.00; // Flat fee estimation

    // Group predictions count by disease
    const diseaseSummary = await prisma.diseasePrediction.groupBy({
      by: ['predictedDisease'],
      _count: {
        id: true,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalPatients,
          totalDoctors,
          occupiedBeds,
          totalBeds,
          bedOccupancyRate: parseFloat(bedOccupancyRate.toFixed(1)),
          activeAlerts,
          simulatedRevenue,
          appointmentsCount,
        },
        resources,
        diseaseSummary: diseaseSummary.map(d => ({
          disease: d.predictedDisease,
          count: d._count.id
        }))
      }
    });
  } catch (err) {
    logger.error('Admin dashboard stats error:', err);
    next(err);
  }
};

export const getDoctorDashboardStats = async (req, res, next) => {
  try {
    const { id } = req.params; // Doctor ID

    const doctor = await prisma.doctor.findUnique({ where: { id } });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const appointmentsCount = await prisma.appointment.count({ where: { doctorId: id } });
    const pendingAppointments = await prisma.appointment.count({ where: { doctorId: id, status: 'PENDING' } });
    
    const assignedPatientsCount = await prisma.patient.count({
      where: {
        appointments: { some: { doctorId: id } }
      }
    });

    const activeCriticalAlerts = await prisma.alert.count({
      where: {
        isResolved: false,
        patient: {
          appointments: { some: { doctorId: id } }
        }
      }
    });

    // Fetch next 5 scheduled appointments
    const upcomingAppointments = await prisma.appointment.findMany({
      where: { doctorId: id, status: 'CONFIRMED' },
      include: {
        patient: { include: { user: { select: { name: true } } } }
      },
      take: 5,
      orderBy: { scheduledAt: 'asc' }
    });

    res.status(200).json({
      success: true,
      data: {
        appointmentsCount,
        pendingAppointments,
        assignedPatientsCount,
        activeCriticalAlerts,
        upcomingAppointments,
      }
    });
  } catch (err) {
    logger.error('Doctor dashboard stats error:', err);
    next(err);
  }
};

export const getPatientDashboardStats = async (req, res, next) => {
  try {
    const { id } = req.params; // Patient ID

    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const appointmentsCount = await prisma.appointment.count({ where: { patientId: id } });
    const predictionsCount = await prisma.diseasePrediction.count({ where: { patientId: id } });
    
    const activeAlerts = await prisma.alert.count({
      where: { patientId: id, isResolved: false }
    });

    // Get health outcomes (stay days, recovery score, readmission etc.)
    const healthOutcomes = await prisma.patientOutcome.findFirst({
      where: { patientId: id },
      orderBy: { createdAt: 'desc' }
    });

    // Recent 5 predictions to draw trends
    const recentPredictions = await prisma.diseasePrediction.findMany({
      where: { patientId: id },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: {
        appointmentsCount,
        predictionsCount,
        activeAlerts,
        healthOutcomes,
        recentPredictions: recentPredictions.map(p => ({
          date: p.createdAt,
          disease: p.predictedDisease,
          riskScore: p.riskScore,
          severity: p.severityLevel
        }))
      }
    });
  } catch (err) {
    logger.error('Patient dashboard stats error:', err);
    next(err);
  }
};

export const generateReports = async (req, res, next) => {
  try {
    const { type } = req.params; // e.g., 'admissions', 'diseases', 'resources'

    let reportData = [];
    if (type === 'admissions') {
      reportData = await prisma.patientOutcome.findMany({
        include: {
          patient: { include: { user: { select: { name: true } } } }
        }
      });
    } else if (type === 'diseases') {
      reportData = await prisma.diseasePrediction.findMany({
        include: {
          patient: { include: { user: { select: { name: true } } } }
        }
      });
    } else {
      reportData = await prisma.resource.findMany();
    }

    res.status(200).json({
      success: true,
      message: `Report for ${type} generated successfully`,
      data: reportData
    });
  } catch (err) {
    logger.error('Generate reports error:', err);
    next(err);
  }
};
