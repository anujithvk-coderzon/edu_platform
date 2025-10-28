import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { randomUUID } from 'crypto';
import prisma from '../DB/DB_Config';
import { generateOTP, storeOTP, verifyOTP, sendVerificationEmail, StudentWelcomeEmail, StoreForgetOtp, VerifyForgetOtp, ForgetPasswordMail, ClearForgetOtp } from '../utils/EmailVerification';
import { Upload_Files, Delete_File } from '../utils/CDN_management';
import { Upload_Files_Stream } from '../utils/CDN_streaming';
import { Upload_Files_Local } from '../utils/localStorage';
import { recalculateAndUpdateProgress } from '../utils/progressCalculator';

// ===== UTILITY FUNCTIONS =====
const generateToken = (studentId: string, sessionToken: string) => {
  return jwt.sign(
    { id: studentId, type: 'student', sessionToken },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );
};

// ===== STUDENT AUTH CONTROLLERS =====

export const CheckEmail = async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { message: 'Please provide a valid email address', details: errors.array() }
    });
  }

  const { email } = req.body;
  const existingStudent = await prisma.student.findUnique({ where: { email } });

  if (existingStudent) {
    return res.status(400).json({
      success: false,
      error: { message: 'An account with this email already exists' }
    });
  }

  res.status(200).json({
    success: true,
    message: 'Email is available',
    data: { email, available: true }
  });
};

export const VerifyEmail = async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { message: 'Please provide a valid email address', details: errors.array() }
    });
  }

  const { email } = req.body;
  const existingStudent = await prisma.student.findUnique({ where: { email } });

  if (existingStudent) {
    return res.status(400).json({
      success: false,
      error: { message: 'An account with this email already exists' }
    });
  }

  const otp = generateOTP();
  storeOTP(email, otp, null);
  const emailResult = await sendVerificationEmail(email, otp);

  if (!emailResult.success) {
    return res.status(500).json({
      success: false,
      error: { message: emailResult.error || 'Failed to send verification email. Please try again.' }
    });
  }

  res.status(200).json({
    success: true,
    message: 'Verification code sent to your email. Please check your inbox.',
    data: { email }
  });
};

export const VerifyOtpEmail = async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { message: 'Validation failed', details: errors.array() }
    });
  }

  const { email, otp } = req.body;
  const verification = verifyOTP(email, otp);

  if (!verification.valid) {
    return res.status(400).json({
      success: false,
      error: { message: verification.message || 'Invalid or expired OTP. Please try again.' }
    });
  }

  res.status(200).json({
    success: true,
    message: 'Email verified successfully! You can now complete your registration.',
    data: { email, verified: true }
  });
};

export const RegisterStudent = async (req: express.Request, res: express.Response) => {
  console.log('📥 RegisterStudent - Received request body:', JSON.stringify(req.body, null, 2));

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Validation errors:', JSON.stringify(errors.array(), null, 2));
    return res.status(400).json({
      success: false,
      error: { message: 'Validation failed', details: errors.array() }
    });
  }

  console.log('✅ Validation passed, proceeding with registration...');

  const {
    email, password, firstName, lastName, phone, dateOfBirth,
    gender, country, city, education, institution, occupation, company
  } = req.body;

  const existingStudent = await prisma.student.findUnique({ where: { email } });
  if (existingStudent) {
    return res.status(400).json({
      success: false,
      error: { message: 'Student already exists with this email' }
    });
  }

  const otp = generateOTP();
  const hashedPassword = await bcrypt.hash(password, 12);

  const userData = {
    email, password: hashedPassword, firstName, lastName,
    phone: phone || null, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
    gender: gender || null, country: country || null, city: city || null,
    education: education || null, institution: institution || null,
    occupation: occupation || null, company: company || null,
  };

  storeOTP(email, otp, userData);
  const emailResult = await sendVerificationEmail(email, otp);

  if (!emailResult.success) {
    return res.status(500).json({
      success: false,
      error: { message: emailResult.error || 'Failed to send verification email. Please try again.' }
    });
  }

  res.status(200).json({
    success: true,
    message: 'OTP sent to your email. Please verify to complete registration.',
    data: { email }
  });
};

export const VerifyOtp = async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { message: 'Validation failed', details: errors.array() }
    });
  }

  const { email, otp } = req.body;
  const verification = verifyOTP(email, otp);

  if (!verification.valid) {
    return res.status(400).json({
      success: false,
      error: { message: verification.message || 'Invalid or expired OTP. Please try again.' }
    });
  }

  const userData = verification.userData;

  // Generate session token for single active session control
  const sessionToken = randomUUID();
  const clientIP = req.ip || req.headers['x-forwarded-for'] || 'unknown';

  const student = await prisma.student.create({
    data: {
      ...userData,
      activeSessionToken: sessionToken,
      lastLoginAt: new Date(),
      lastLoginIP: clientIP as string
    },
    select: {
      id: true, email: true, firstName: true, lastName: true, phone: true,
      dateOfBirth: true, gender: true, country: true, city: true,
      education: true, institution: true, occupation: true, company: true,
      avatar: true, createdAt: true
    }
  });

  const token = generateToken(student.id, sessionToken);
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('student_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  try {
    await StudentWelcomeEmail(userData.email, userData.firstName);
  } catch (error) {
    console.error('⚠️ Welcome email error but registration continues:', error);
  }

  res.status(201).json({
    success: true,
    message: 'Email verified successfully. Account created!',
    data: { user: student, token }
  });
};

export const ResendOtp = async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { message: 'Validation failed', details: errors.array() }
    });
  }

  const { email } = req.body;
  const otp = generateOTP();
  const emailResult = await sendVerificationEmail(email, otp);

  if (!emailResult.success) {
    return res.status(500).json({
      success: false,
      error: { message: emailResult.error || 'Failed to send verification email. Please try again.' }
    });
  }

  res.status(200).json({
    success: true,
    message: 'New OTP sent to your email.',
    data: { email }
  });
};

// ===== OAUTH CONTROLLERS =====

export const OAuthRegister = async (req: express.Request, res: express.Response) => {
  const {
    provider, email, firstName, lastName, avatar,
    phone, dateOfBirth, gender, country, city,
    education, institution, occupation, company
  } = req.body;

  // Validate required fields
  if (!provider || !email || !firstName || !lastName) {
    return res.status(400).json({
      success: false,
      error: { message: 'Provider, email, first name, and last name are required' }
    });
  }

  // Check if student already exists
  const existingStudent = await prisma.student.findUnique({ where: { email } });
  if (existingStudent) {
    return res.status(400).json({
      success: false,
      error: { message: 'An account with this email already exists' }
    });
  }

  // Generate session token for single active session control
  const sessionToken = randomUUID();
  const clientIP = req.ip || req.headers['x-forwarded-for'] || 'unknown';

  // Create student account (no password for OAuth users)
  const student = await prisma.student.create({
    data: {
      email,
      password: null, // OAuth users don't have password
      firstName,
      lastName,
      avatar: avatar || null,
      phone: phone || null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender: gender || null,
      country: country || null,
      city: city || null,
      education: education || null,
      institution: institution || null,
      occupation: occupation || null,
      company: company || null,
      isVerified: true, // OAuth users are automatically verified
      activeSessionToken: sessionToken,
      lastLoginAt: new Date(),
      lastLoginIP: clientIP as string
    },
    select: {
      id: true, email: true, firstName: true, lastName: true, phone: true,
      dateOfBirth: true, gender: true, country: true, city: true,
      education: true, institution: true, occupation: true, company: true,
      avatar: true, createdAt: true, isVerified: true
    }
  });

  // Generate JWT token
  const token = generateToken(student.id, sessionToken);
  const isProduction = process.env.NODE_ENV === 'production';

  // Set cookie
  res.cookie('student_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Send welcome email
  try {
    await StudentWelcomeEmail(email, firstName);
  } catch (error) {
    console.error('⚠️ Welcome email error but registration continues:', error);
  }

  console.log('✅ OAuth Registration successful:', {
    provider,
    email,
    studentId: student.id,
    timestamp: new Date().toISOString()
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful! Welcome aboard!',
    data: { user: student, token }
  });
};

export const OAuthLogin = async (req: express.Request, res: express.Response) => {
  const { provider, idToken } = req.body;

  // Extract email from the idToken payload (we trust the frontend for now)
  // In production with Firebase Admin SDK, you'd verify the token and extract email
  // For now, we'll get email from the decoded token on frontend

  // We need to get the email somehow - let's accept it in the request
  // The frontend will send it after OAuth
  let email = req.body.email;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: { message: 'Email is required' }
    });
  }

  // Find student by email
  const student = await prisma.student.findUnique({ where: { email } });

  if (!student) {
    return res.status(404).json({
      success: false,
      error: { message: 'Account not found. Please register first.' }
    });
  }

  // Check if student is blocked by admin
  if (student.blocked) {
    return res.status(403).json({
      success: false,
      error: { message: 'Your account has been blocked by the administrator. Please contact support for assistance.' }
    });
  }

  if (!student.isActive) {
    return res.status(403).json({
      success: false,
      error: { message: 'Account is deactivated' }
    });
  }

  // Generate new session token (invalidates previous sessions)
  const sessionToken = randomUUID();
  const clientIP = req.ip || req.headers['x-forwarded-for'] || 'unknown';

  console.log('🔐 OAuth Login:', {
    provider,
    email: student.email,
    newSessionToken: sessionToken.substring(0, 12) + '...',
    clientIP,
    timestamp: new Date().toISOString()
  });

  // Update student with new session token
  await prisma.student.update({
    where: { id: student.id },
    data: {
      activeSessionToken: sessionToken,
      lastLoginAt: new Date(),
      lastLoginIP: clientIP as string
    }
  });

  // Generate JWT token
  const token = generateToken(student.id, sessionToken);
  const isProduction = process.env.NODE_ENV === 'production';

  // Set cookie
  res.cookie('student_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(200).json({
    success: true,
    message: 'Login successful!',
    data: {
      user: {
        id: student.id,
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
        avatar: student.avatar,
        phone: student.phone,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        country: student.country,
        city: student.city,
        education: student.education,
        institution: student.institution,
        occupation: student.occupation,
        company: student.company,
        isVerified: student.isVerified,
        createdAt: student.createdAt,
        hasPassword: !!student.password
      },
      token
    }
  });
};

export const LoginStudent = async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { message: 'Validation failed', details: errors.array() }
    });
  }

  const { email, password } = req.body;
  const student = await prisma.student.findUnique({ where: { email } });

  if (!student) {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid email or password' }
    });
  }

  // Check if student is blocked by admin
  if (student.blocked) {
    return res.status(403).json({
      success: false,
      error: { message: 'Your account has been blocked by the administrator. Please contact support for assistance.' }
    });
  }

  // Check if this is an OAuth user (no password)
  if (!student.password) {
    return res.status(401).json({
      success: false,
      error: { message: 'This account uses social login. Please sign in with Google or GitHub.' }
    });
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, student.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid email or password' }
    });
  }

  if (!student.isActive) {
    return res.status(403).json({
      success: false,
      error: { message: 'Account is deactivated' }
    });
  }

  // Generate new session token (invalidates previous sessions)
  const sessionToken = randomUUID();
  const clientIP = req.ip || req.headers['x-forwarded-for'] || 'unknown';

  console.log('🔐 Login:', {
    email: student.email,
    newSessionToken: sessionToken.substring(0, 12) + '...',
    clientIP,
    timestamp: new Date().toISOString()
  });

  // Update student with new session token
  await prisma.student.update({
    where: { id: student.id },
    data: {
      activeSessionToken: sessionToken,
      lastLoginAt: new Date(),
      lastLoginIP: clientIP as string
    }
  });

  const token = generateToken(student.id, sessionToken);
  const isProduction = process.env.NODE_ENV === 'production';

  console.log('🎫 JWT generated with sessionToken:', sessionToken.substring(0, 12) + '...');

  res.cookie('student_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const { password: studentPassword, ...studentWithoutPassword } = student;
  res.json({
    success: true,
    data: {
      user: {
        ...studentWithoutPassword,
        hasPassword: !!studentPassword
      },
      token
    }
  });
};

export const LogoutStudent = async (req: express.Request, res: express.Response) => {
  const token = req.cookies.student_token;

  // Clear session token from database if authenticated
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      await prisma.student.update({
        where: { id: decoded.id },
        data: { activeSessionToken: null }
      });
    } catch (error) {
      // Token invalid, just clear cookie
    }
  }

  const isProduction = process.env.NODE_ENV === 'production';

  res.clearCookie('student_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/'
  });
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

export const ForgotPassword = async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { message: 'Please provide a valid email address', details: errors.array() }
    });
  }

  const { email } = req.body;
  const student = await prisma.student.findUnique({ where: { email } });

  if (!student) {
    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset code.',
      data: { email }
    });
  }

  const otp = generateOTP();
  StoreForgetOtp(email, otp);
  const emailResult = await ForgetPasswordMail(email, otp);

  if (!emailResult.success) {
    return res.status(500).json({
      success: false,
      error: { message: emailResult.error || 'Failed to send password reset email. Please try again.' }
    });
  }

  res.status(200).json({
    success: true,
    message: 'Password reset code sent to your email. Please check your inbox.',
    data: { email }
  });
};

export const VerifyForgotPasswordOtp = async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { message: 'Validation failed', details: errors.array() }
    });
  }

  const { email, otp } = req.body;
  const verification = VerifyForgetOtp(email, otp);

  if (!verification.valid) {
    return res.status(400).json({
      success: false,
      error: { message: verification.message || 'Invalid or expired OTP. Please try again.' }
    });
  }

  res.status(200).json({
    success: true,
    message: 'OTP verified successfully! You can now reset your password.',
    data: { email, otpVerified: true }
  });
};

export const ResetPassword = async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { message: 'Validation failed', details: errors.array() }
    });
  }

  const { email, otp, newPassword } = req.body;
  const verification = VerifyForgetOtp(email, otp);

  if (!verification.valid) {
    return res.status(400).json({
      success: false,
      error: { message: verification.message || 'Invalid or expired OTP. Please request a new password reset.' }
    });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  const updatedStudent = await prisma.student.update({
    where: { email },
    data: { password: hashedPassword },
    select: { id: true, email: true, firstName: true, lastName: true }
  });

  ClearForgetOtp(email);

  res.status(200).json({
    success: true,
    message: 'Password reset successfully! You can now login with your new password.',
    data: { email: updatedStudent.email, firstName: updatedStudent.firstName }
  });
};

export const GetCurrentUser = async (req: express.Request, res: express.Response) => {
  const token = req.cookies.student_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Access denied. No token provided.' }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    if (decoded.type !== 'student') {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid token type.' }
      });
    }

    const student = await prisma.student.findUnique({
      where: { id: decoded.id },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        avatar: true, phone: true, dateOfBirth: true, gender: true,
        city: true, education: true, institution: true,
        occupation: true, company: true,
        isVerified: true, createdAt: true, updatedAt: true,
        activeSessionToken: true, // Include for debugging
        password: true // Need to check if password exists (for OAuth users)
      }
    });

    if (!student) {
      return res.status(401).json({
        success: false,
        error: { message: 'Student not found.' }
      });
    }

    // Validate session token (redundant check - middleware already does this)
    if (decoded.sessionToken && student.activeSessionToken !== decoded.sessionToken) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Session expired. You have been logged in from another device.',
          debug: process.env.NODE_ENV === 'development' ? {
            jwtSession: decoded.sessionToken?.substring(0, 8) + '...',
            dbSession: student.activeSessionToken?.substring(0, 8) + '...'
          } : undefined
        }
      });
    }

    const { activeSessionToken, password, ...studentWithoutSession } = student;
    res.json({
      success: true,
      data: {
        user: {
          ...studentWithoutSession,
          hasPassword: !!password // OAuth users have null password
        }
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token.' }
    });
  }
};

export const UpdateProfile = async (req: express.Request, res: express.Response) => {
  const token = req.cookies.student_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Access denied. No token provided.' }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    if (decoded.type !== 'student') {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid token type.' }
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const updates: any = {};
    const {
      firstName,
      lastName,
      avatar,
      phone,
      dateOfBirth,
      gender,
      country,
      city,
      education,
      institution,
      occupation,
      company
    } = req.body;

    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (avatar !== undefined) updates.avatar = avatar;
    if (phone !== undefined) updates.phone = phone;
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (gender !== undefined) updates.gender = gender;
    if (country !== undefined) updates.country = country;
    if (city !== undefined) updates.city = city;
    if (education !== undefined) updates.education = education;
    if (institution !== undefined) updates.institution = institution;
    if (occupation !== undefined) updates.occupation = occupation;
    if (company !== undefined) updates.company = company;

    const student = await prisma.student.update({
      where: { id: decoded.id },
      data: updates,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        country: true,
        city: true,
        education: true,
        institution: true,
        occupation: true,
        company: true,
        updatedAt: true,
        password: true
      }
    });

    const { password, ...studentWithoutPassword } = student;
    res.json({
      success: true,
      data: {
        user: {
          ...studentWithoutPassword,
          hasPassword: !!password
        }
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token.' }
    });
  }
};

export const ChangePassword = async (req: express.Request, res: express.Response) => {
  const token = req.cookies.student_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Access denied. No token provided.' }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    if (decoded.type !== 'student') {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid token type.' }
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      });
    }

    const { currentPassword, newPassword } = req.body;
    const student = await prisma.student.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, password: true, firstName: true, lastName: true }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: { message: 'Student not found.' }
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, student.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: { message: 'Current password is incorrect.' }
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await prisma.student.update({
      where: { id: student.id },
      data: { password: hashedNewPassword }
    });

    res.json({
      success: true,
      message: 'Password changed successfully!'
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token.' }
    });
  }
};

export const UploadStudentAvatar = async (req: express.Request, res: express.Response) => {
  const token = req.cookies.student_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Access denied. No token provided.' }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    if (decoded.type !== 'student') {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid token type.' }
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No avatar file uploaded' }
      });
    }

    const currentStudent = await prisma.student.findUnique({
      where: { id: decoded.id },
      select: { avatar: true }
    });

    let avatarUrl: string | null = null;

    if (process.env.NODE_ENV === 'development' || !process.env.BUNNY_API_KEY) {
      console.log('📂 Using local storage for avatar');
      avatarUrl = await Upload_Files_Local('avatars', req.file);
    } else {
      console.log('☁️ Using Bunny CDN storage for avatar');
      avatarUrl = await Upload_Files('avatars', req.file);
    }

    if (currentStudent?.avatar) {
      try {
        console.log('🗑️ Deleting old avatar from CDN:', currentStudent.avatar);
        await Delete_File(currentStudent.avatar);
      } catch (error) {
        console.error('❌ Error deleting old avatar:', error);
      }
    }

    if (!avatarUrl) {
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to upload avatar to storage' }
      });
    }

    const student = await prisma.student.update({
      where: { id: decoded.id },
      data: { avatar: avatarUrl },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        avatar: true, updatedAt: true
      }
    });

    res.json({
      success: true,
      data: { url: avatarUrl, user: student },
      message: 'Avatar uploaded successfully'
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token.' }
    });
  }
};

// ===== COURSES CONTROLLERS =====
export const GetAllCourses = async (req: express.Request, res: express.Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 12;
  const category = req.query.category as string;
  const level = req.query.level as string;
  const search = req.query.search as string;
  const priceRange = req.query.price as string;
  const sortBy = req.query.sort as string || 'newest';
  const skip = (page - 1) * limit;

  const where: any = { status: 'PUBLISHED', isPublic: true };

  if (category) {
    where.category = { name: { contains: category, mode: 'insensitive' } };
  }
  if (level) {
    where.level = level;
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (priceRange) {
    switch (priceRange) {
      case 'free':
        where.price = 0;
        break;
      case '0-50':
        where.price = { gt: 0, lte: 50 };
        break;
      case '50-100':
        where.price = { gt: 50, lte: 100 };
        break;
      case '100+':
        where.price = { gt: 100 };
        break;
    }
  }

  // Determine sort order
  let orderBy: any = { createdAt: 'desc' }; // default: newest
  switch (sortBy) {
    case 'price-asc':
      orderBy = { price: 'asc' };
      break;
    case 'price-desc':
      orderBy = { price: 'desc' };
      break;
    case 'rating':
      // For rating sort, we'll handle this after fetching since it's computed
      orderBy = { createdAt: 'desc' };
      break;
    case 'newest':
    default:
      orderBy = { createdAt: 'desc' };
      break;
  }

  // Get user ID if authenticated
  let studentId: string | null = null;
  const token = req.cookies.student_token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      if (decoded.type === 'student') {
        studentId = decoded.id;
      }
    } catch (error) {
      // Token invalid or expired
    }
  }

  // For rating sort, we need to fetch ALL courses, calculate ratings, sort, then paginate
  // For other sorts, we can paginate at the database level
  const shouldFetchAll = sortBy === 'rating';

  // Fetch courses and total count
  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      select: {
        id: true, title: true, description: true, thumbnail: true,
        price: true, level: true, duration: true, status: true,
        isPublic: true, creatorId: true, tutorName: true, createdAt: true,
        creator: {
          select: { id: true, firstName: true, lastName: true, avatar: true }
        },
        tutor: {
          select: { id: true, firstName: true, lastName: true, avatar: true }
        },
        category: {
          select: { id: true, name: true }
        },
        _count: {
          select: { enrollments: true, reviews: true, materials: true }
        }
      },
      skip: shouldFetchAll ? undefined : skip,
      take: shouldFetchAll ? undefined : limit,
      orderBy
    }),
    prisma.course.count({ where })
  ]);

  const courseIds = courses.map(c => c.id);

  // Batch fetch ratings for all courses in ONE query
  const ratingsData = await prisma.review.groupBy({
    by: ['courseId'],
    where: { courseId: { in: courseIds } },
    _avg: { rating: true }
  });
  const ratingsMap = new Map(ratingsData.map(r => [r.courseId, r._avg.rating || 0]));

  // Batch fetch enrollments and reviews for this student (if logged in) - run in parallel
  let enrollmentsMap = new Map();
  let reviewsMap = new Map();

  if (studentId) {
    const [enrollments, reviews] = await Promise.all([
      prisma.enrollment.findMany({
        where: {
          studentId,
          courseId: { in: courseIds }
        },
        select: {
          courseId: true,
          status: true,
          progressPercentage: true,
          hasNewContent: true
        }
      }),
      prisma.review.findMany({
        where: {
          studentId,
          courseId: { in: courseIds }
        },
        select: {
          courseId: true
        }
      })
    ]);

    enrollmentsMap = new Map(enrollments.map(e => [e.courseId, e]));
    reviewsMap = new Map(reviews.map(r => [r.courseId, true]));
  }

  // Combine all data efficiently
  let coursesWithAvgRating = courses.map((course) => {
    const enrollment = enrollmentsMap.get(course.id);
    return {
      ...course,
      averageRating: ratingsMap.get(course.id) || 0,
      isEnrolled: !!enrollment,
      enrollmentStatus: enrollment?.status,
      progressPercentage: enrollment?.progressPercentage || 0,
      hasReviewed: reviewsMap.get(course.id) || false,
      hasNewContent: enrollment?.hasNewContent || false
    };
  });

  // Apply rating sort if requested (since it's a computed field)
  if (sortBy === 'rating') {
    coursesWithAvgRating.sort((a, b) => b.averageRating - a.averageRating);
    // Apply pagination AFTER sorting
    coursesWithAvgRating = coursesWithAvgRating.slice(skip, skip + limit);
  }

  res.json({
    success: true,
    data: {
      courses: coursesWithAvgRating,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    }
  });
};

export const GetAllCategories = async (req: express.Request, res: express.Response) => {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: {
          courses: {
            where: { status: 'PUBLISHED', isPublic: true }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  res.json({
    success: true,
    data: { categories }
  });
};

export const GetCourseById = async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const token = req.cookies.student_token;

  try {
    const course = await prisma.course.findUnique({
      where: { id, status: 'PUBLISHED', isPublic: true },
      select: {
        id: true, title: true, description: true, thumbnail: true,
        price: true, level: true, duration: true, tutorName: true,
        requirements: true, prerequisites: true,
        creator: {
          select: { id: true, firstName: true, lastName: true, avatar: true }
        },
        tutor: {
          select: { id: true, firstName: true, lastName: true, avatar: true }
        },
        modules: {
          include: {
            materials: {
              select: {
                id: true, title: true, description: true, type: true, orderIndex: true
              },
              orderBy: { orderIndex: 'asc' }
            }
          },
          orderBy: { orderIndex: 'asc' }
        },
        reviews: {
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, avatar: true }
            }
          },
          orderBy: { createdAt: 'desc' }, take: 10
        },
        _count: {
          select: { enrollments: true, materials: true, reviews: true }
        }
      }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found' }
      });
    }

    let isEnrolled = false;
    let hasReviewed = false;
    let enrollmentStatus = null;
    let progressPercentage = 0;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
        const userId = decoded.id;

        const enrollment = await prisma.enrollment.findUnique({
          where: { studentId_courseId: { studentId: userId, courseId: id } }
        });

        isEnrolled = !!enrollment;
        if (enrollment) {
          enrollmentStatus = enrollment.status;
          progressPercentage = enrollment.progressPercentage;
        }

        const userReview = await prisma.review.findUnique({
          where: { courseId_studentId: { courseId: id, studentId: userId } }
        });

        hasReviewed = !!userReview;
      } catch (tokenError) {
        // Invalid token, continue with defaults
      }
    }

    const reviews = await prisma.review.findMany({
      where: { courseId: id },
      select: { rating: true }
    });

    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    const courseWithRating = {
      ...course,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      isEnrolled, hasReviewed, enrollmentStatus, progressPercentage
    };

    res.json({
      success: true,
      data: { course: courseWithRating }
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch course' }
    });
  }
};

// ===== ENROLLMENT CONTROLLERS =====
export const GetMyEnrollments = async (req: express.Request, res: express.Response) => {
  const token = req.cookies.student_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Access denied. No token provided.' }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    const userId = decoded.id;

    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 8;
    const skip = (page - 1) * limit;

    // Get total count
    const totalEnrollments = await prisma.enrollment.count({
      where: { studentId: userId }
    });

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: userId },
      select: {
        id: true, status: true, enrolledAt: true, completedAt: true, progressPercentage: true, hasNewContent: true,
        course: {
          select: {
            id: true, title: true, description: true, thumbnail: true,
            price: true, level: true, duration: true, tutorName: true,
            creator: {
              select: { id: true, firstName: true, lastName: true, avatar: true }
            },
            _count: {
              select: { enrollments: true, materials: true, reviews: true }
            }
          }
        }
      },
      orderBy: { enrolledAt: 'desc' },
      skip,
      take: limit
    });

    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enrollment) => {
        const avgRating = await prisma.review.aggregate({
          where: { courseId: enrollment.course.id },
          _avg: { rating: true }
        });

        const userReview = await prisma.review.findUnique({
          where: { courseId_studentId: { courseId: enrollment.course.id, studentId: userId } }
        });

        // Get existing materials for this course
        const existingMaterials = await prisma.material.findMany({
          where: { courseId: enrollment.course.id },
          select: { id: true }
        });
        const existingMaterialIds = new Set(existingMaterials.map(m => m.id));

        const progressRecords = await prisma.progress.findMany({
          where: { studentId: userId, courseId: enrollment.course.id }
        });

        const totalTimeSpent = progressRecords.reduce((total, record) => total + (record.timeSpent || 0), 0);
        // Only count progress for materials that still exist
        const completedMaterials = progressRecords.filter(record =>
          record.isCompleted && record.materialId !== null && existingMaterialIds.has(record.materialId)
        ).length;

        const courseDurationMinutes = (enrollment.course?.duration || 10) * 60;
        const estimatedTimeSpent = totalTimeSpent > 0 ? totalTimeSpent :
          (enrollment.progressPercentage > 0 ?
            Math.floor((enrollment.progressPercentage / 100) * courseDurationMinutes) : 0);

        return {
          ...enrollment,
          hasReviewed: !!userReview,
          totalTimeSpent: estimatedTimeSpent,
          completedMaterials,
          course: {
            ...enrollment.course,
            averageRating: avgRating._avg.rating || 0
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        enrollments: enrichedEnrollments,
        pagination: {
          total: totalEnrollments,
          page,
          limit,
          pages: Math.ceil(totalEnrollments / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token.' }
    });
  }
};

export const EnrollInCourse = async (req: express.Request, res: express.Response) => {
  const token = req.cookies.student_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Access denied. No token provided.' }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    const userId = decoded.id;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Course ID is required' }
      });
    }

    const course = await prisma.course.findFirst({
      where: { id: courseId, status: 'PUBLISHED', isPublic: true }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found or not available for enrollment' }
      });
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: userId, courseId: courseId } }
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        error: { message: 'Already enrolled in this course' }
      });
    }

    const enrollment = await prisma.enrollment.create({
      data: { studentId: userId, courseId: courseId, progressPercentage: 0, status: 'ACTIVE' },
      include: {
        course: {
          select: { id: true, title: true, thumbnail: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: { enrollment },
      message: 'Successfully enrolled in course'
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to enroll in course' }
    });
  }
};

export const GetEnrollmentProgress = async (req: express.Request, res: express.Response) => {
  const token = req.cookies.student_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Access denied. No token provided.' }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    const userId = decoded.id;
    const { courseId } = req.params;

    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: userId, courseId } }
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: { message: 'Enrollment not found' }
      });
    }

    const [materials, progressRecords] = await Promise.all([
      prisma.material.findMany({
        where: { courseId },
        select: {
          id: true, title: true, description: true, type: true,
          fileUrl: true, content: true, moduleId: true, orderIndex: true,
          module: {
            select: { id: true, title: true, description: true, orderIndex: true }
          }
        },
        orderBy: [{ module: { orderIndex: 'asc' } }, { orderIndex: 'asc' }]
      }),
      prisma.progress.findMany({
        where: { studentId: userId, courseId }
      })
    ]);

    const progressMap = new Map(progressRecords.map(p => [p.materialId, p]));

    const materialsWithProgress = materials.map(material => ({
      ...material,
      fileUrl: material.fileUrl && material.fileUrl.startsWith('/uploads/')
        ? `${process.env.BACKEND_URL || 'http://localhost:4000'}${material.fileUrl}`
        : material.fileUrl,
      progress: progressMap.get(material.id) || null
    }));

    const [assignments, assignmentSubmissions] = await Promise.all([
      prisma.assignment.findMany({
        where: { courseId },
        select: {
          id: true, title: true, description: true,
          dueDate: true, maxScore: true, createdAt: true
        },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.assignmentSubmission.findMany({
        where: { studentId: userId, assignment: { courseId } },
        select: {
          id: true, assignmentId: true, submittedAt: true,
          status: true, score: true, feedback: true
        }
      })
    ]);

    const submissionMap = new Map(assignmentSubmissions.map(s => [s.assignmentId, s]));

    const assignmentsWithSubmissions = assignments.map(assignment => ({
      ...assignment,
      submission: submissionMap.get(assignment.id) || null
    }));

    const totalMaterials = materials.length;
    // Only count completed materials that still exist (filter out deleted materials)
    const existingMaterialIds = new Set(materials.map(m => m.id));
    const completedMaterials = progressRecords.filter(p =>
      p.isCompleted && existingMaterialIds.has(p.materialId)
    ).length;
    const totalAssignments = assignments.length;
    const submittedAssignments = assignmentSubmissions.length;
    const totalTimeSpent = progressRecords.reduce((sum, p) => sum + p.timeSpent, 0);

    const totalItems = totalMaterials + totalAssignments;
    const completedItems = completedMaterials + submittedAssignments;
    const overallProgressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    res.json({
      success: true,
      data: {
        enrollment: { ...enrollment, progressPercentage: overallProgressPercentage },
        materials: materialsWithProgress,
        assignments: assignmentsWithSubmissions,
        stats: {
          totalMaterials, completedMaterials, totalAssignments,
          submittedAssignments, progressPercentage: overallProgressPercentage, totalTimeSpent
        }
      }
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token.' }
    });
  }
};

// ===== MATERIAL CONTROLLERS =====
export const GetMaterialById = async (req: express.Request, res: express.Response) => {
  const token = req.cookies.student_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Access denied. No token provided.' }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    const studentId = decoded.id;
    const { id } = req.params;

    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        course: {
          select: { id: true, title: true, creatorId: true }
        }
      }
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        error: { message: 'Material not found' }
      });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: studentId, courseId: material.courseId } }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        error: { message: 'You must be enrolled in this course to access materials' }
      });
    }

    await prisma.progress.upsert({
      where: { studentId_courseId_materialId: { studentId: studentId, courseId: material.courseId, materialId: material.id } },
      update: { lastAccessed: new Date(), timeSpent: { increment: 1 } },
      create: { studentId: studentId, courseId: material.courseId, materialId: material.id, lastAccessed: new Date(), timeSpent: 1 }
    });

    const processedMaterial = {
      ...material,
      fileUrl: material.fileUrl && material.fileUrl.startsWith('/uploads/')
        ? `${process.env.BACKEND_URL || 'http://localhost:4000'}${material.fileUrl}`
        : material.fileUrl
    };

    res.json({
      success: true,
      data: { material: processedMaterial }
    });
  } catch (error) {
    console.error('Error fetching material:', error);
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token.' }
    });
  }
};

export const CompleteMaterial = async (req: express.Request, res: express.Response) => {
  const token = req.cookies.student_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Access denied. No token provided.' }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    const studentId = decoded.id;
    const { id } = req.params;

    const material = await prisma.material.findUnique({
      where: { id },
      select: {
        id: true, courseId: true,
        course: { select: { id: true, title: true } }
      }
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        error: { message: 'Material not found' }
      });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: studentId, courseId: material.courseId } }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        error: { message: 'You must be enrolled in this course to complete materials' }
      });
    }

    await prisma.progress.upsert({
      where: { studentId_courseId_materialId: { studentId: studentId, courseId: material.courseId, materialId: material.id } },
      update: { isCompleted: true, lastAccessed: new Date() },
      create: { studentId: studentId, courseId: material.courseId, materialId: material.id, isCompleted: true, lastAccessed: new Date() }
    });

    // Use centralized progress calculator
    const stats = await recalculateAndUpdateProgress(studentId, material.courseId);

    res.json({
      success: true,
      data: {
        progressPercentage: stats.progressPercentage,
        isCompleted: true,
        totalItems: stats.totalItems,
        completedItems: stats.completedItems
      }
    });
  } catch (error) {
    console.error('Error marking material complete:', error);
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token.' }
    });
  }
};

export const TestFileAccess = async (req: express.Request, res: express.Response) => {
  const { filename } = req.params;
  const filePath = `/uploads/${filename}`;
  const fullUrl = `${process.env.BACKEND_URL || 'http://localhost:4000'}${filePath}`;

  res.json({
    success: true,
    data: { filename, relativePath: filePath, fullUrl, message: 'File URL constructed successfully' }
  });
};

// ===== REVIEW CONTROLLERS =====
export const SubmitReview = async (req: express.Request, res: express.Response) => {
  const token = req.cookies.student_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Access denied. No token provided.' }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    const studentId = decoded.id;
    const { courseId, rating, comment } = req.body;

    if (!courseId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: { message: 'Course ID and rating (1-5) are required' }
      });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: studentId, courseId } }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        error: { message: 'You must be enrolled in this course to review it' }
      });
    }

    const review = await prisma.review.upsert({
      where: { courseId_studentId: { courseId, studentId: studentId } },
      update: { rating, comment: comment || null },
      create: { courseId, studentId: studentId, rating, comment: comment || null }
    });

    res.json({
      success: true,
      data: { review },
      message: 'Review submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to submit review' }
    });
  }
};

export const GetCourseReviews = async (req: express.Request, res: express.Response) => {
  const { courseId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  try {
    // Fetch paginated reviews and total count in parallel
    const [reviews, totalReviews] = await Promise.all([
      prisma.review.findMany({
        where: { courseId },
        include: {
          student: {
            select: { firstName: true, lastName: true, avatar: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.review.count({ where: { courseId } })
    ]);

    // Calculate average rating and distribution from total reviews (not paginated)
    const allReviews = await prisma.review.findMany({
      where: { courseId },
      select: { rating: true }
    });

    const averageRating = allReviews.length > 0
      ? allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length
      : 0;

    const ratingDistribution = {
      5: allReviews.filter(r => r.rating === 5).length,
      4: allReviews.filter(r => r.rating === 4).length,
      3: allReviews.filter(r => r.rating === 3).length,
      2: allReviews.filter(r => r.rating === 2).length,
      1: allReviews.filter(r => r.rating === 1).length
    };

    res.json({
      success: true,
      data: {
        reviews,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
        ratingDistribution,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalReviews / limit),
          hasMore: page < Math.ceil(totalReviews / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch reviews' }
    });
  }
};

export const GetMyReview = async (req: express.Request, res: express.Response) => {
  const token = req.cookies.student_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Access denied. No token provided.' }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    const studentId = decoded.id;
    const { courseId } = req.params;

    const review = await prisma.review.findUnique({
      where: { courseId_studentId: { courseId, studentId: studentId } }
    });

    res.json({
      success: true,
      data: { review }
    });
  } catch (error) {
    console.error('Error fetching user review:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch review' }
    });
  }
};

// ===== ASSIGNMENT CONTROLLERS =====
export const GetCourseAssignments = async (req: express.Request, res: express.Response) => {
  const token = req.cookies.student_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Access denied. No token provided.' }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    const studentId = decoded.id;
    const { courseId } = req.params;

    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: studentId, courseId } }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        error: { message: 'You are not enrolled in this course.' }
      });
    }

    const assignments = await prisma.assignment.findMany({
      where: { courseId },
      include: {
        submissions: {
          where: { studentId },
          select: {
            id: true, status: true, score: true,
            submittedAt: true, gradedAt: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      success: true,
      data: { assignments }
    });
  } catch (error) {
    console.error('Get course assignments error:', error);
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token.' }
    });
  }
};

export const SubmitAssignment = async (req: express.Request, res: express.Response) => {
  const token = req.cookies.student_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Access denied. No token provided.' }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    const studentId = decoded.id;
    const { assignmentId } = req.params;
    const { content, fileUrl } = req.body;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: {
          include: {
            enrollments: { where: { studentId: studentId } }
          }
        }
      }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: { message: 'Assignment not found.' }
      });
    }

    if (assignment.course.enrollments.length === 0) {
      return res.status(403).json({
        success: false,
        error: { message: 'You are not enrolled in this course.' }
      });
    }

    const existingSubmission = await prisma.assignmentSubmission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId } }
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        error: { message: 'You have already submitted this assignment.' }
      });
    }

    if (assignment.dueDate && new Date() > assignment.dueDate) {
      return res.status(400).json({
        success: false,
        error: { message: 'Assignment due date has passed.' }
      });
    }

    const submission = await prisma.assignmentSubmission.create({
      data: {
        content: content || '',
        fileUrl: fileUrl || null,
        assignmentId, studentId,
        status: 'SUBMITTED'
      },
      include: {
        assignment: {
          select: { title: true, maxScore: true, dueDate: true }
        }
      }
    });

    // Get existing material IDs to filter out progress for deleted materials
    const existingMaterials = await prisma.material.findMany({
      where: { courseId: assignment.courseId },
      select: { id: true }
    });
    const existingMaterialIds = existingMaterials.map(m => m.id);

    const [totalMaterials, completedMaterials, totalAssignments, submittedAssignments] = await Promise.all([
      Promise.resolve(existingMaterials.length),
      prisma.progress.count({
        where: {
          studentId: studentId,
          courseId: assignment.courseId,
          isCompleted: true,
          materialId: { in: existingMaterialIds } // Only count progress for existing materials
        }
      }),
      prisma.assignment.count({ where: { courseId: assignment.courseId } }),
      prisma.assignmentSubmission.count({ where: { studentId, assignment: { courseId: assignment.courseId } } })
    ]);

    const totalItems = totalMaterials + totalAssignments;
    const completedItems = completedMaterials + submittedAssignments;
    const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    await prisma.enrollment.update({
      where: { studentId_courseId: { studentId: studentId, courseId: assignment.courseId } },
      data: {
        progressPercentage,
        ...(progressPercentage === 100 && { completedAt: new Date(), status: 'COMPLETED' })
      }
    });

    res.status(201).json({
      success: true,
      data: {
        submission,
        progressUpdate: { progressPercentage, totalItems, completedItems }
      }
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to submit assignment.' }
    });
  }
};

export const GetAssignmentSubmission = async (req: express.Request, res: express.Response) => {
  const token = req.cookies.student_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Access denied. No token provided.' }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    const studentId = decoded.id;
    const { assignmentId } = req.params;

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId } },
      include: {
        assignment: {
          select: { title: true, maxScore: true, dueDate: true }
        }
      }
    });

    res.json({
      success: true,
      data: { submission }
    });
  } catch (error) {
    console.error('Get assignment submission error:', error);
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token.' }
    });
  }
};

export const UploadAssignmentFile = async (req: express.Request, res: express.Response) => {
  const token = req.cookies.student_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Access denied. No token provided.' }
    });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET as string);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No assignment file uploaded' }
      });
    }

    let fileUrl: string | null = null;

    if (process.env.NODE_ENV === 'development' || !process.env.BUNNY_API_KEY) {
      console.log('📂 Using local storage for development');
      fileUrl = await Upload_Files_Local('assignments', req.file);
    } else {
      console.log('☁️ Using Bunny CDN storage for assignments');
      fileUrl = req.file.size > 20 * 1024 * 1024
        ? await Upload_Files_Stream('assignments', req.file)
        : await Upload_Files('assignments', req.file);
    }

    if (!fileUrl) {
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to upload assignment file to storage' }
      });
    }

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        fileUrl: fileUrl
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token.' }
    });
  }
};

// ===== DEBUG SESSION ENDPOINT =====
export const DebugSessionInfo = async (req: express.Request, res: express.Response) => {
  const token = req.cookies.student_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'No token provided' }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    const student = await prisma.student.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        activeSessionToken: true,
        lastLoginAt: true,
        lastLoginIP: true
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: { message: 'Student not found' }
      });
    }

    const sessionMatch = student.activeSessionToken === decoded.sessionToken;

    res.json({
      success: true,
      data: {
        studentId: student.id,
        email: student.email,
        jwtSessionToken: decoded.sessionToken?.substring(0, 12) + '...',
        dbSessionToken: student.activeSessionToken?.substring(0, 12) + '...',
        sessionMatch: sessionMatch,
        lastLoginAt: student.lastLoginAt,
        lastLoginIP: student.lastLoginIP,
        message: sessionMatch
          ? 'Session is valid ✓'
          : 'Session mismatch - You have been logged in from another device!'
      }
    });
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token', details: error.message }
    });
  }
};

// ===== PLATFORM STATISTICS =====
export const GetPlatformStats = async (req: express.Request, res: express.Response) => {
  try {
    const courses = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        enrollments: {
          select: { studentId: true, enrolledAt: true }
        },
        reviews: {
          select: { rating: true }
        },
        _count: {
          select: { enrollments: true, reviews: true }
        }
      }
    });

    const uniqueStudentIds = new Set<string>();
    let totalEnrollments = 0;

    courses.forEach(course => {
      course.enrollments.forEach(enrollment => {
        uniqueStudentIds.add(enrollment.studentId);
        totalEnrollments++;
      });
    });

    const totalUniqueStudents = uniqueStudentIds.size;

    let totalRatings = 0;
    let totalReviews = 0;

    courses.forEach(course => {
      if (course.reviews.length > 0) {
        const courseRating = course.reviews.reduce((sum, review) => sum + review.rating, 0);
        totalRatings += courseRating;
        totalReviews += course.reviews.length;
      }
    });

    const averageRating = totalReviews > 0 ? totalRatings / totalReviews : 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentEnrollments = courses.reduce((count, course) => {
      return count + course.enrollments.filter(e =>
        new Date(e.enrolledAt) > thirtyDaysAgo
      ).length;
    }, 0);

    const stats = {
      totalCourses: courses.length,
      totalStudents: totalUniqueStudents,
      totalEnrollments: totalEnrollments,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: totalReviews,
      recentActivity: recentEnrollments,
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Platform stats error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch platform statistics' }
    });
  }
};