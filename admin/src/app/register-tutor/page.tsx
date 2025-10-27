'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import toast from 'react-hot-toast';
import { ADMIN_API_URL } from '../../config/env';
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import './animations.css';

export default function RegisterTutorPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Basic Info + Email, 2: OTP, 3: Password
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    otp: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [capsLockActive, setCapsLockActive] = useState(false);

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'firstName':
      case 'lastName':
        if (!value.trim()) {
          newErrors[name] = `${name === 'firstName' ? 'First' : 'Last'} name is required`;
        } else if (value.length < 2) {
          newErrors[name] = `Must be at least 2 characters`;
        } else {
          delete newErrors[name];
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
          newErrors[name] = 'Email is required';
        } else if (!emailRegex.test(value)) {
          newErrors[name] = 'Invalid email address';
        } else {
          delete newErrors[name];
        }
        break;

      case 'password':
        if (!value) {
          newErrors[name] = 'Password is required';
        } else if (value.length < 6) {
          newErrors[name] = 'Must be at least 6 characters';
        } else {
          delete newErrors[name];
        }
        break;

      case 'confirmPassword':
        if (!value) {
          newErrors[name] = 'Please confirm your password';
        } else if (value !== formData.password) {
          newErrors[name] = 'Passwords do not match';
        } else {
          delete newErrors[name];
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockActive(true);
    } else {
      setCapsLockActive(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    validateField('firstName', formData.firstName);
    validateField('lastName', formData.lastName);
    validateField('email', formData.email);

    if (Object.keys(errors).length > 0 || !formData.firstName || !formData.lastName || !formData.email) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${ADMIN_API_URL}/auth/tutor/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Verification code sent to your email!');
        setStep(2);
      } else {
        toast.error(data.error?.message || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.otp || formData.otp.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${ADMIN_API_URL}/auth/tutor/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Email verified successfully!');
        setStep(3);
      } else {
        toast.error(data.error?.message || 'Invalid or expired OTP');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password fields
    validateField('password', formData.password);
    validateField('confirmPassword', formData.confirmPassword);

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (Object.keys(errors).length > 0) {
      toast.error('Please fix all errors before submitting');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${ADMIN_API_URL}/auth/tutor/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Registration request submitted successfully! You will be notified once approved.');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        toast.error(data.error?.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-3xl animate-float-slower"></div>
        <div className="absolute top-40 right-40 w-80 h-80 bg-purple-400/8 rounded-full blur-3xl animate-float-slow"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-3 sm:px-4 py-6 sm:py-8">
        <div className="w-full max-w-md">
          {/* Logo & Brand */}
          <div className="text-center mb-4 sm:mb-5 animate-fade-in-up">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="h-12 w-12 sm:h-14 sm:w-14 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30 animate-glow">
                <AcademicCapIcon className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">CODiiN</h1>
                <p className="text-xs sm:text-sm text-indigo-600 font-semibold">Tutor Portal</p>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">
              Join Our Team
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              {step === 1 && 'Create your tutor account'}
              {step === 2 && 'Verify your email address'}
              {step === 3 && 'Set your secure password'}
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-4 sm:mb-5 animate-fade-in-up">
            <div className="flex items-start justify-between px-2 sm:px-4">
              {/* Step 1: Basic Info */}
              <div className="flex flex-col items-center gap-1.5 sm:gap-2" style={{ flex: '0 0 auto' }}>
                <div
                  className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 transform ${
                    step > 1
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/40 scale-110'
                      : step === 1
                      ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50 scale-110 ring-4 ring-indigo-100'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {step > 1 ? (
                    <CheckIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  ) : (
                    1
                  )}
                  {step === 1 && (
                    <div className="absolute inset-0 rounded-full animate-ping bg-indigo-400 opacity-20"></div>
                  )}
                </div>
                <span className={`text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap ${step >= 1 ? 'text-slate-900' : 'text-slate-500'}`}>
                  Basic Info
                </span>
              </div>

              {/* Connecting line 1-2 */}
              <div className="flex-1 flex items-start pt-4 sm:pt-4.5 px-1.5 sm:px-2">
                <div className={`w-full h-1 rounded-full transition-all duration-500 ${
                  step > 1 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-slate-200'
                }`} />
              </div>

              {/* Step 2: Verify */}
              <div className="flex flex-col items-center gap-1.5 sm:gap-2" style={{ flex: '0 0 auto' }}>
                <div
                  className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 transform ${
                    step > 2
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/40 scale-110'
                      : step === 2
                      ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50 scale-110 ring-4 ring-indigo-100'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {step > 2 ? (
                    <CheckIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  ) : (
                    2
                  )}
                  {step === 2 && (
                    <div className="absolute inset-0 rounded-full animate-ping bg-indigo-400 opacity-20"></div>
                  )}
                </div>
                <span className={`text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap ${step >= 2 ? 'text-slate-900' : 'text-slate-500'}`}>
                  Verify
                </span>
              </div>

              {/* Connecting line 2-3 */}
              <div className="flex-1 flex items-start pt-4 sm:pt-4.5 px-1.5 sm:px-2">
                <div className={`w-full h-1 rounded-full transition-all duration-500 ${
                  step > 2 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-slate-200'
                }`} />
              </div>

              {/* Step 3: Password */}
              <div className="flex flex-col items-center gap-1.5 sm:gap-2" style={{ flex: '0 0 auto' }}>
                <div
                  className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 transform ${
                    step > 3
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/40 scale-110'
                      : step === 3
                      ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50 scale-110 ring-4 ring-indigo-100'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {step > 3 ? (
                    <CheckIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  ) : (
                    3
                  )}
                  {step === 3 && (
                    <div className="absolute inset-0 rounded-full animate-ping bg-indigo-400 opacity-20"></div>
                  )}
                </div>
                <span className={`text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap ${step >= 3 ? 'text-slate-900' : 'text-slate-500'}`}>
                  Password
                </span>
              </div>
            </div>
          </div>

          {/* Modern Form Card */}
          <div className="relative group">
            {/* Glow effect on hover */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

            <Card className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden">
              {/* Animated gradient bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-gradient-x"></div>

              {/* Card Header */}
              <CardHeader className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-3 sm:p-4 md:p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 bg-white/10 rounded-full filter blur-3xl opacity-30 animate-pulse-subtle"></div>
                <div className="absolute bottom-0 left-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-full filter blur-2xl opacity-30"></div>
                <div className="relative z-10">
                  <CardTitle className="text-lg sm:text-xl md:text-2xl text-white font-extrabold leading-tight">
                    {step === 1 && 'Basic Information'}
                    {step === 2 && 'Verify Email'}
                    {step === 3 && 'Set Password'}
                  </CardTitle>
                  <CardDescription className="text-blue-100 mt-0.5 sm:mt-1 text-xs font-medium">
                    {step === 1 && 'Enter your details to get started'}
                    {step === 2 && 'Check your email for verification code'}
                    {step === 3 && 'Create a secure password'}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 md:p-6 bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30">
                {/* Step 1: Basic Info + Email */}
                {step === 1 && (
                  <form onSubmit={handleSendOTP} className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <Input
                        label="First Name"
                        name="firstName"
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="John"
                        leftIcon={<UserIcon className="h-5 w-5" />}
                        error={errors.firstName}
                      />

                      <Input
                        label="Last Name"
                        name="lastName"
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Doe"
                        leftIcon={<UserIcon className="h-5 w-5" />}
                        error={errors.lastName}
                      />
                    </div>

                    <div className="relative">
                      <Input
                        label="Email Address"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your.email@example.com"
                        leftIcon={<EnvelopeIcon className="h-5 w-5" />}
                        error={errors.email}
                      />
                      {formData.email && !errors.email && (
                        <CheckCircleIcon className="absolute right-2 top-9 sm:right-3 sm:top-10 h-4 w-4 sm:h-5 sm:w-5 text-green-500 z-20" />
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      size="sm"
                      className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-95 relative overflow-hidden group"
                    >
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      <span className="relative flex items-center justify-center gap-2">
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <EnvelopeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span>Send Verification Code</span>
                          </>
                        )}
                      </span>
                    </Button>

                    <div className="text-center text-xs sm:text-sm text-slate-600 pt-2">
                      Already have an account?{' '}
                      <Link href="/login" className="text-indigo-600 hover:text-indigo-500 font-semibold">
                        Login here
                      </Link>
                    </div>
                  </form>
                )}

                {/* Step 2: OTP Verification */}
                {step === 2 && (
                  <form onSubmit={handleVerifyOTP} className="space-y-3 sm:space-y-4">
                    <div className="text-center mb-4">
                      <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-indigo-50 mb-3">
                        <ShieldCheckIcon className="h-6 w-6 sm:h-7 sm:w-7 text-indigo-600" />
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600">
                        Enter the 6-digit code sent to
                      </p>
                      <p className="text-sm sm:text-base font-semibold text-indigo-600">{formData.email}</p>
                    </div>

                    <Input
                      label="Verification Code"
                      name="otp"
                      type="text"
                      required
                      maxLength={6}
                      value={formData.otp}
                      onChange={handleChange}
                      placeholder="Enter 6-digit code"
                      className="text-center text-xl sm:text-2xl tracking-widest font-bold"
                    />
                    <p className="text-xs text-slate-500 text-center">
                      Check your email inbox and spam folder
                    </p>

                    <div className="flex gap-2 sm:gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(1)}
                        size="sm"
                        className="flex-1"
                      >
                        Back
                      </Button>

                      <Button
                        type="submit"
                        disabled={loading}
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 relative overflow-hidden group"
                      >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        <span className="relative flex items-center justify-center gap-2">
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                              <span>Verifying...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                              <span>Verify Email</span>
                            </>
                          )}
                        </span>
                      </Button>
                    </div>
                  </form>
                )}

                {/* Step 3: Set Password */}
                {step === 3 && (
                  <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4">
                      <p className="text-xs sm:text-sm text-blue-800">
                        <strong className="font-bold">Welcome, {formData.firstName}!</strong>
                        <br />
                        Create a secure password to complete your registration.
                      </p>
                    </div>

                    <div className="relative">
                      {capsLockActive && (
                        <div className="absolute -top-8 right-0 flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-md z-20">
                          <ExclamationTriangleIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="text-xs font-medium">Caps Lock is on</span>
                        </div>
                      )}
                      <Input
                        label="Password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={formData.password}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Minimum 6 characters"
                        leftIcon={<LockClosedIcon className="h-5 w-5" />}
                        error={errors.password}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-[50%] -translate-y-1/2 sm:right-3 p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 transition-colors z-20"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-4 w-4 text-slate-500" />
                        ) : (
                          <EyeIcon className="h-4 w-4 text-slate-500" />
                        )}
                      </button>
                    </div>

                    <div className="relative">
                      <Input
                        label="Confirm Password"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Re-enter your password"
                        leftIcon={<LockClosedIcon className="h-5 w-5" />}
                        error={errors.confirmPassword}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-[50%] -translate-y-1/2 sm:right-3 p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 transition-colors z-20"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="h-4 w-4 text-slate-500" />
                        ) : (
                          <EyeIcon className="h-4 w-4 text-slate-500" />
                        )}
                      </button>
                    </div>

                    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
                      <p className="text-xs text-yellow-800">
                        <strong className="font-bold">Note:</strong> Your account will be reviewed by an admin. You&apos;ll receive a welcome email once your account is activated.
                      </p>
                    </div>

                    <div className="flex gap-2 sm:gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(2)}
                        size="sm"
                        className="flex-1"
                      >
                        Back
                      </Button>

                      <Button
                        type="submit"
                        disabled={loading}
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-95 relative overflow-hidden group"
                      >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        <span className="relative flex items-center justify-center gap-2">
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                              <span>Submitting...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                              <span>Complete Registration</span>
                            </>
                          )}
                        </span>
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
