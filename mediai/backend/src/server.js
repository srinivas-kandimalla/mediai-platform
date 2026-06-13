import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import logger from './utils/logger.js';
import { errorHandler } from './middleware/error.js';
import { setSocketIO } from './services/notificationService.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import bedRoutes from './routes/bedRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

const app = express();
const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust in production
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

setSocketIO(io);

// Socket.io Connection Handlers
io.on('connection', (socket) => {
  logger.info(`🔌 Socket connected: ${socket.id}`);

  // User-specific room registration
  socket.on('register_user', (userId) => {
    socket.join(`user:${userId}`);
    logger.info(`👤 Socket ${socket.id} joined room: user:${userId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log Requests
app.use((req, res, next) => {
  logger.info(`[${req.method}] ${req.url}`);
  next();
});

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Node.js REST API is fully operational',
    timestamp: new Date().toISOString()
  });
});

// Demo Seed Endpoint (secured by secret header - for demo/portfolio use only)
app.post('/api/seed-demo', async (req, res) => {
  const secret = req.headers['x-seed-secret'];
  if (secret !== 'mediai-demo-2026') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  try {
    const { default: prisma } = await import('./config/db.js');
    // Clean all records
    await prisma.notification.deleteMany();
    await prisma.alert.deleteMany();
    await prisma.bed.deleteMany();
    await prisma.resource.deleteMany();
    await prisma.staffSchedule.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.eHR.deleteMany();
    await prisma.labReport.deleteMany();
    await prisma.diseasePrediction.deleteMany();
    await prisma.treatmentRecommendation.deleteMany();
    await prisma.patientOutcome.deleteMany();
    await prisma.patient.deleteMany();
    await prisma.doctor.deleteMany();
    await prisma.chatSession.deleteMany();
    await prisma.user.deleteMany();

    const hashedPassword = await bcrypt.hash('M3diAI_SecureP@ss2026!', 12);

    // Admin
    await prisma.user.create({ data: { name: 'Chief Admin Officer', email: 'admin@mediai.org', password: hashedPassword, role: 'ADMIN', isActive: true } });

    // Patient
    const patientUser = await prisma.user.create({
      data: {
        name: 'James Carter', email: 'patient@mediai.org', password: hashedPassword, role: 'PATIENT', isActive: true,
        patient: { create: { age: 42, gender: 'Male', bloodGroup: 'O+', weight: 78.5, height: 180, allergies: 'Penicillin', medicalHistory: 'Mild Hypertension 2024', familyHistory: 'Father has Type 2 Diabetes', insuranceDetails: 'UnitedHealth Platinum #9923-A' } }
      },
      include: { patient: true }
    });

    // Doctors
    const doctorsData = [
      { name: 'Sarah Jenkins', email: 'doctor@mediai.org', specialization: 'Cardiologist & Critical Care', department: 'Cardiology', experience: 12, qualification: 'MBBS, MD (Harvard)', licenseNumber: 'LIC-772938-US' },
      { name: 'Robert Chen', email: 'robert.chen@mediai.org', specialization: 'Primary Care & Internal Medicine', department: 'General Medicine', experience: 8, qualification: 'MD (Johns Hopkins)', licenseNumber: 'LIC-111111-US' },
      { name: 'Elena Rostova', email: 'elena.rostova@mediai.org', specialization: 'Critical Care Specialist', department: 'ICU', experience: 15, qualification: 'MD, PhD (Stanford)', licenseNumber: 'LIC-222222-US' },
      { name: 'Marcus Vance', email: 'marcus.vance@mediai.org', specialization: 'Trauma & Emergency Care', department: 'Emergency Wards', experience: 10, qualification: 'MBBS, MD (Yale)', licenseNumber: 'LIC-333333-US' },
      { name: 'Aisha Rahman', email: 'aisha.rahman@mediai.org', specialization: 'Respiratory & Pulmonary', department: 'Pulmonology', experience: 9, qualification: 'MD (Toronto)', licenseNumber: 'LIC-444444-US' },
    ];

    let cardiologyDocId;
    for (const doc of doctorsData) {
      const d = await prisma.user.create({
        data: {
          name: doc.name, email: doc.email, password: hashedPassword, role: 'DOCTOR', isActive: true,
          doctor: { create: { specialization: doc.specialization, department: doc.department, experience: doc.experience, qualification: doc.qualification, licenseNumber: doc.licenseNumber, availableSlots: JSON.stringify([new Date(Date.now() + 86400000).toISOString(), new Date(Date.now() + 172800000).toISOString()]) } }
        },
        include: { doctor: true }
      });
      if (doc.department === 'Cardiology') cardiologyDocId = d.doctor.id;
    }

    // Beds
    const wards = [{ type: 'GENERAL', count: 12, occ: 4 }, { type: 'ICU', count: 6, occ: 3 }, { type: 'EMERGENCY', count: 8, occ: 5 }, { type: 'PRIVATE', count: 4, occ: 1 }];
    for (const w of wards) {
      for (let i = 1; i <= w.count; i++) {
        const occ = i <= w.occ;
        await prisma.bed.create({ data: { wardType: w.type, isOccupied: occ, patientId: occ ? patientUser.patient.id : null, reservedUntil: occ ? new Date(Date.now() + 259200000) : null } });
      }
    }

    // Resources
    await prisma.resource.createMany({ data: [{ resourceType: 'VENTILATOR', totalUnits: 10, availableUnits: 6 }, { resourceType: 'OXYGEN', totalUnits: 100, availableUnits: 45 }, { resourceType: 'EQUIPMENT', totalUnits: 30, availableUnits: 22 }] });

    // Appointment
    await prisma.appointment.create({ data: { patientId: patientUser.patient.id, doctorId: cardiologyDocId, scheduledAt: new Date(Date.now() + 86400000), status: 'CONFIRMED', notes: 'Routine cardiovascular checkup.' } });

    // Predictions
    await prisma.diseasePrediction.createMany({ data: [
      { patientId: patientUser.patient.id, symptoms: JSON.stringify(['cough', 'fever']), inputs: JSON.stringify({ age: 42, bmi: 24.2 }), predictedDisease: 'Common Cold', riskScore: 0.35, severityLevel: 'MILD', modelUsed: 'RandomForest-v1', createdAt: new Date(Date.now() - 345600000) },
      { patientId: patientUser.patient.id, symptoms: JSON.stringify(['chest tightness', 'shortness of breath']), inputs: JSON.stringify({ age: 42, bloodPressure: '142/95' }), predictedDisease: 'Mild Hypertension', riskScore: 0.68, severityLevel: 'MODERATE', modelUsed: 'RandomForest-v1', createdAt: new Date(Date.now() - 172800000) },
      { patientId: patientUser.patient.id, symptoms: JSON.stringify(['fatigue', 'headache']), inputs: JSON.stringify({ age: 42 }), predictedDisease: 'Fatigue & Dehydration', riskScore: 0.48, severityLevel: 'MILD', modelUsed: 'RandomForest-v1' },
    ]});

    // Alert
    await prisma.alert.create({ data: { patientId: patientUser.patient.id, alertType: 'CRITICAL', message: 'Elevated blood pressure 142/95 mmHg. Monitor closely.', isResolved: false } });

    // Patient Outcome
    await prisma.patientOutcome.create({ data: { patientId: patientUser.patient.id, recoveryProbability: 0.88, icuRequired: false, readmissionRisk: 0.15, mortalityRisk: 0.02, expectedStayDays: 4 } });

    logger.info('✅ Demo database seeded successfully via API endpoint');
    return res.status(200).json({
      success: true,
      message: '✅ Demo database seeded successfully!',
      credentials: {
        admin: { email: 'admin@mediai.org', password: 'M3diAI_SecureP@ss2026!', role: 'ADMIN' },
        patient: { email: 'patient@mediai.org', password: 'M3diAI_SecureP@ss2026!', role: 'PATIENT' },
        doctor: { email: 'doctor@mediai.org', password: 'M3diAI_SecureP@ss2026!', role: 'DOCTOR' },
      }
    });
  } catch (err) {
    logger.error('Demo seed error:', err);
    return res.status(500).json({ success: false, message: 'Seeding failed', error: err.message });
  }
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/beds', bedRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/analytics', analyticsRoutes);

// Global Error Handler
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Handle graceful shutdowns
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});
