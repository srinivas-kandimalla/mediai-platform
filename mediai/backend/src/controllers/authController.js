import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import redisClient from '../config/redis.js';
import logger from '../utils/logger.js';
import { sendEmail } from '../services/notificationService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, ...profileDetails } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Missing required registration fields' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email address already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and profile in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
        },
      });

      if (role === 'PATIENT') {
        await tx.patient.create({
          data: {
            userId: newUser.id,
            age: profileDetails.age ? parseInt(profileDetails.age) : 0,
            gender: profileDetails.gender || 'Unknown',
            bloodGroup: profileDetails.bloodGroup || 'Unknown',
            weight: profileDetails.weight ? parseFloat(profileDetails.weight) : 0.0,
            height: profileDetails.height ? parseFloat(profileDetails.height) : 0.0,
            allergies: profileDetails.allergies || 'None',
            medicalHistory: profileDetails.medicalHistory || 'None',
            familyHistory: profileDetails.familyHistory || 'None',
            insuranceDetails: profileDetails.insuranceDetails || 'None',
          },
        });
      } else if (role === 'DOCTOR') {
        await tx.doctor.create({
          data: {
            userId: newUser.id,
            specialization: profileDetails.specialization || 'General',
            department: profileDetails.department || 'General Medicine',
            experience: profileDetails.experience ? parseInt(profileDetails.experience) : 0,
            qualification: profileDetails.qualification || 'MBBS',
            licenseNumber: profileDetails.licenseNumber || `LIC-${Date.now()}`,
            availableSlots: JSON.stringify(profileDetails.availableSlots || []),
          },
        });
      }

      return newUser;
    });

    logger.info(`User registered successfully: ${user.id} (${user.role})`);

    // Send welcome email
    await sendEmail(
      user.email,
      'Welcome to MediAI Platform',
      `Hello ${user.name},\n\nThank you for registering on the MediAI Patient & Resource Management portal as a ${user.role}.\n\nBest Regards,\nThe MediAI Team`
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    logger.error('Registration controller error:', err);
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or inactive account' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    logger.info(`User logged in: ${user.id} (${user.role})`);

    // Determine relevant profile ID to return to the frontend for ease of routing
    let profileId = null;
    if (user.role === 'PATIENT') profileId = user.patient?.id;
    if (user.role === 'DOCTOR') profileId = user.doctor?.id;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileId,
        },
      },
    });
  } catch (err) {
    logger.error('Login controller error:', err);
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      // Blacklist token in Redis for the remaining session time (e.g. 24 hours = 86400s)
      await redisClient.set(`blacklist:${token}`, 'true', { EX: 86400 });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    logger.error('Logout controller error:', err);
    next(err);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({ success: false, message: 'Access token required for refresh' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Invalid token structure' });
    }

    // Generate new token
    const newToken = jwt.sign(
      { userId: decoded.userId, role: decoded.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      data: { token: newToken },
      message: 'Token refreshed successfully',
    });
  } catch (err) {
    logger.error('Token refresh error:', err);
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Old and new passwords are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    logger.info(`Password updated for user: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (err) {
    logger.error('Change password error:', err);
    next(err);
  }
};
