import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing records
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

  // 2. Create Admin Account
  const adminUser = await prisma.user.create({
    data: {
      name: 'Chief Admin Officer',
      email: 'admin@mediai.org',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`✅ Admin account seeded: ${adminUser.email}`);

  // 3. Create Patient Account & Profile
  const patientUser = await prisma.user.create({
    data: {
      name: 'James Carter',
      email: 'patient@mediai.org',
      password: hashedPassword,
      role: 'PATIENT',
      isActive: true,
      patient: {
        create: {
          age: 42,
          gender: 'Male',
          bloodGroup: 'O+',
          weight: 78.5,
          height: 180,
          allergies: 'Penicillin, Sulfonamides',
          medicalHistory: 'Mild Hypertension diagnosed in 2024',
          familyHistory: 'Father has Type 2 Diabetes',
          insuranceDetails: 'UnitedHealth Platinum Care #9923-A',
        },
      },
    },
    include: {
      patient: true,
    },
  });
  console.log(`✅ Patient account seeded: ${patientUser.email}`);

  // 4. Create Doctor Accounts & Profiles
  const doctorsData = [
    {
      name: 'Sarah Jenkins',
      email: 'doctor@mediai.org',
      specialization: 'Cardiologist & Critical Care',
      department: 'Cardiology',
      experience: 12,
      qualification: 'MBBS, MD (Harvard Medical)',
      licenseNumber: 'LIC-772938-US',
    },
    {
      name: 'Robert Chen',
      email: 'robert.chen@mediai.org',
      specialization: 'Primary Care & Internal Medicine',
      department: 'General Medicine',
      experience: 8,
      qualification: 'MD (Johns Hopkins)',
      licenseNumber: 'LIC-111111-US',
    },
    {
      name: 'Elena Rostova',
      email: 'elena.rostova@mediai.org',
      specialization: 'Critical Care Specialist',
      department: 'ICU',
      experience: 15,
      qualification: 'MD, PhD (Stanford Medical)',
      licenseNumber: 'LIC-222222-US',
    },
    {
      name: 'Marcus Vance',
      email: 'marcus.vance@mediai.org',
      specialization: 'Trauma & Emergency Care',
      department: 'Emergency Wards',
      experience: 10,
      qualification: 'MBBS, MD (Yale Medicine)',
      licenseNumber: 'LIC-333333-US',
    },
    {
      name: 'Aisha Rahman',
      email: 'aisha.rahman@mediai.org',
      specialization: 'Respiratory & Pulmonary Disease',
      department: 'Pulmonology',
      experience: 9,
      qualification: 'MD (Toronto Faculty of Medicine)',
      licenseNumber: 'LIC-444444-US',
    }
  ];

  let cardiologyDocId;
  for (const doc of doctorsData) {
    const createdUser = await prisma.user.create({
      data: {
        name: doc.name,
        email: doc.email,
        password: hashedPassword,
        role: 'DOCTOR',
        isActive: true,
        doctor: {
          create: {
            specialization: doc.specialization,
            department: doc.department,
            experience: doc.experience,
            qualification: doc.qualification,
            licenseNumber: doc.licenseNumber,
            availableSlots: JSON.stringify([
              new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            ]),
          },
        },
      },
      include: {
        doctor: true,
      },
    });
    if (doc.department === 'Cardiology') {
      cardiologyDocId = createdUser.doctor.id;
    }
    console.log(`✅ Doctor account seeded: ${createdUser.email} (${doc.department})`);
  }

  // 5. Seed Beds across Wards
  const bedWards = [
    { type: 'GENERAL', count: 12, occupiedCount: 4 },
    { type: 'ICU', count: 6, occupiedCount: 3 },
    { type: 'EMERGENCY', count: 8, occupiedCount: 5 },
    { type: 'PRIVATE', count: 4, occupiedCount: 1 },
  ];

  for (const ward of bedWards) {
    for (let i = 1; i <= ward.count; i++) {
      const isOccupied = i <= ward.occupiedCount;
      await prisma.bed.create({
        data: {
          wardType: ward.type,
          isOccupied: isOccupied,
          patientId: isOccupied ? patientUser.patient.id : null,
          reservedUntil: isOccupied ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : null,
        },
      });
    }
  }
  console.log('✅ Wards beds seeded successfully.');

  // 6. Seed Equipment Resources
  const initialResources = [
    { type: 'VENTILATOR', total: 10, available: 6 },
    { type: 'OXYGEN', total: 100, available: 45 },
    { type: 'EQUIPMENT', total: 30, available: 22 },
  ];

  for (const res of initialResources) {
    await prisma.resource.create({
      data: {
        resourceType: res.type,
        totalUnits: res.total,
        availableUnits: res.available,
      },
    });
  }
  console.log('✅ Inventory assets seeded successfully.');

  // 7. Seed Initial Health Outcomes for trends
  await prisma.patientOutcome.create({
    data: {
      patientId: patientUser.patient.id,
      recoveryProbability: 0.88,
      icuRequired: false,
      readmissionRisk: 0.15,
      mortalityRisk: 0.02,
      expectedStayDays: 4,
    },
  });

  // 8. Seed Initial Appointments for James Carter
  const apptDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
  await prisma.appointment.create({
    data: {
      patientId: patientUser.patient.id,
      doctorId: cardiologyDocId,
      scheduledAt: apptDate,
      status: 'CONFIRMED',
      notes: 'Routine cardiovascular checkup and prescription renewal.',
    },
  });
  console.log('✅ Mock appointments seeded.');

  // 9. Seed Initial Disease Predictions for James Carter
  await prisma.diseasePrediction.create({
    data: {
      patientId: patientUser.patient.id,
      symptoms: JSON.stringify(['cough', 'fever']),
      inputs: JSON.stringify({ age: 42, bloodPressure: '125/82', sugarLevel: 95, cholesterol: 190, bmi: 24.2 }),
      predictedDisease: 'Common Cold',
      riskScore: 0.35,
      severityLevel: 'MILD',
      modelUsed: 'RandomForest-v1',
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    },
  });
  await prisma.diseasePrediction.create({
    data: {
      patientId: patientUser.patient.id,
      symptoms: JSON.stringify(['chest tightness', 'shortness of breath']),
      inputs: JSON.stringify({ age: 42, bloodPressure: '142/95', sugarLevel: 105, cholesterol: 220, bmi: 24.2 }),
      predictedDisease: 'Mild Hypertension',
      riskScore: 0.68,
      severityLevel: 'MODERATE',
      modelUsed: 'RandomForest-v1',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  });
  await prisma.diseasePrediction.create({
    data: {
      patientId: patientUser.patient.id,
      symptoms: JSON.stringify(['fatigue', 'headache']),
      inputs: JSON.stringify({ age: 42, bloodPressure: '130/85', sugarLevel: 100, cholesterol: 205, bmi: 24.2 }),
      predictedDisease: 'Fatigue & Dehydration',
      riskScore: 0.48,
      severityLevel: 'MILD',
      modelUsed: 'RandomForest-v1',
      createdAt: new Date(), // Today
    },
  });
  console.log('✅ Mock predictions seeded.');

  // 10. Seed Active Emergency Alert for James Carter
  await prisma.alert.create({
    data: {
      patientId: patientUser.patient.id,
      alertType: 'CRITICAL',
      message: 'Elevated blood pressure detected during screening (142/95 mmHg). Please monitor closely.',
      isResolved: false,
    },
  });
  console.log('✅ Mock active emergencies seeded.');

  console.log('🌱 Seeding process complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
