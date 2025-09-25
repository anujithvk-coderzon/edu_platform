'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import Link from 'next/link';
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  PhoneIcon,
  CalendarIcon,
  MapPinIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  GlobeAltIcon,
  CheckIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const educationLevels = [
  { value: 'high-school', label: 'High School' },
  { value: 'associate', label: 'Associate Degree' },
  { value: 'bachelor', label: "Bachelor's Degree" },
  { value: 'master', label: "Master's Degree" },
  { value: 'doctorate', label: 'Doctorate' },
  { value: 'certification', label: 'Professional Certification' },
  { value: 'other', label: 'Other' }
];

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer-not', label: 'Prefer not to say' }
];

export default function RegisterPage() {
  const { register, refreshUser } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const [formData, setFormData] = useState({
    // Basic Information (Step 1)
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',

    // Personal Information (Step 2)
    dateOfBirth: '',
    gender: '',
    country: '',
    city: '',

    // Educational & Professional (Step 3)
    education: '',
    institution: '',
    occupation: '',
    company: ''
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [emailExists, setEmailExists] = useState(false);

  // Real-time validation functions
  const validateField = (name: string, value: string) => {
    const errors = { ...validationErrors };

    switch (name) {
      case 'firstName':
      case 'lastName':
        if (!value.trim()) {
          errors[name] = `${name === 'firstName' ? 'First' : 'Last'} name is required`;
        } else if (value.length < 2) {
          errors[name] = `${name === 'firstName' ? 'First' : 'Last'} name must be at least 2 characters`;
        } else {
          delete errors[name];
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
          errors[name] = 'Email is required';
        } else if (!emailRegex.test(value)) {
          errors[name] = 'Please enter a valid email address';
        } else {
          delete errors[name];
          // Check if email exists
          checkEmailExists(value);
        }
        break;

      case 'phone':
        const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
        if (!value) {
          errors[name] = 'Phone number is required';
        } else if (!phoneRegex.test(value.replace(/\s/g, ''))) {
          errors[name] = 'Please enter a valid phone number';
        } else {
          delete errors[name];
        }
        break;

      case 'password':
        if (!value) {
          errors[name] = 'Password is required';
        } else if (value.length < 6) {
          errors[name] = 'Password must be at least 6 characters';
        } else {
          delete errors[name];
        }
        // Also validate confirm password if it exists
        if (formData.confirmPassword) {
          validateField('confirmPassword', formData.confirmPassword);
        }
        break;

      case 'confirmPassword':
        if (!value) {
          errors[name] = 'Please confirm your password';
        } else if (value !== formData.password) {
          errors[name] = 'Passwords do not match';
        } else {
          delete errors[name];
        }
        break;

      case 'country':
        if (!value.trim()) {
          errors[name] = 'Country is required';
        } else {
          delete errors[name];
        }
        break;

      case 'education':
        if (!value) {
          errors[name] = 'Education level is required';
        } else {
          delete errors[name];
        }
        break;
    }

    setValidationErrors(errors);
  };

  const checkEmailExists = async (email: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/student'}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.message?.includes('already exists')) {
          setEmailExists(true);
          setValidationErrors(prev => ({
            ...prev,
            email: 'An account with this email already exists'
          }));
        }
      } else {
        setEmailExists(false);
      }
    } catch (error) {
      // Ignore network errors for email checking
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Real-time validation
    validateField(name, value);
  };

  const isStepValid = (stepNumber: number) => {
    const stepFields = {
      1: ['firstName', 'lastName', 'email', 'phone', 'password', 'confirmPassword'],
      2: ['country'],
      3: ['education']
    };

    const requiredFields = stepFields[stepNumber] || [];

    // Check if all required fields are filled
    for (const field of requiredFields) {
      if (!formData[field] || (typeof formData[field] === 'string' && !formData[field].trim())) {
        return false;
      }
    }

    // Check if there are any validation errors for this step's fields
    for (const field of requiredFields) {
      if (validationErrors[field]) {
        return false;
      }
    }

    // Additional check for email existence
    if (stepNumber === 1 && emailExists) {
      return false;
    }

    return true;
  };

  const validateStep = (stepNumber: number) => {
    switch(stepNumber) {
      case 1:
        if (!formData.email) {
          toast.error('Please enter your email address');
          return false;
        }
        break;
      case 2:
        if (!formData.firstName || !formData.lastName || !formData.phone) {
          toast.error('Please fill in all required fields');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match');
          return false;
        }
        if (formData.password.length < 6) {
          toast.error('Password must be at least 6 characters');
          return false;
        }
        const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
        if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
          toast.error('Please enter a valid phone number');
          return false;
        }
        break;
      case 3:
        if (!formData.country) {
          toast.error('Please select your country');
          return false;
        }
        break;
      case 4:
        if (!formData.education) {
          toast.error('Please select your education level');
          return false;
        }
        break;
    }
    return true;
  };

  const sendEmailVerification = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/student'}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email: formData.email })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOtpSent(true);
        setStep(step + 1); // Move to OTP verification
        toast.success('Verification code sent to your email. Please check your inbox.');
        startResendTimer();
      } else {
        throw new Error(data.error?.message || 'Failed to send verification email');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send verification email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const completeRegistration = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/student'}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth || undefined,
          gender: formData.gender || undefined,
          country: formData.country,
          city: formData.city || undefined,
          education: formData.education,
          institution: formData.institution || undefined,
          occupation: formData.occupation || undefined,
          company: formData.company || undefined,
          emailVerified: 'true'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Account created successfully!');
        await register(data.data.user);
        router.push('/');
      } else {
        throw new Error(data.error?.message || 'Failed to create account');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step === 3) {
        // Send registration data and get OTP
        sendRegistrationWithOTP();
      } else {
        setStep(step + 1);
      }
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const sendRegistrationWithOTP = async () => {
    try {
      setIsLoading(true);

      console.log('📤 Sending registration data with OTP request');
      const requestData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        country: formData.country,
        city: formData.city || undefined,
        education: formData.education,
        institution: formData.institution || undefined,
        occupation: formData.occupation || undefined,
        company: formData.company || undefined
      };

      console.log('📤 Request data:', requestData);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/student'}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      console.log('📥 Registration response:', data);

      if (response.ok && data.success) {
        setOtpSent(true);
        setStep(4); // Move to OTP verification step
        toast.success('OTP sent to your email. Please check your inbox.');
        startResendTimer();
      } else {
        throw new Error(data.error?.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startResendTimer = () => {
    setResendTimer(60); // 60 seconds
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resendOTP = async () => {
    if (resendTimer > 0) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/student'}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('New OTP sent to your email.');
        startResendTimer();
      } else {
        throw new Error(data.error?.message || 'Failed to resend OTP');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setIsLoading(true);

      const requestBody = {
        email: formData.email,
        otp: otp
      };

      console.log('🚀 Frontend sending OTP verification request:');
      console.log('   Email:', requestBody.email);
      console.log('   OTP:', requestBody.otp);
      console.log('   OTP length:', requestBody.otp?.length);
      console.log('   OTP type:', typeof requestBody.otp);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/student'}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      console.log('📨 Backend response:');
      console.log('   Status:', response.status);
      console.log('   OK:', response.ok);
      console.log('   Data:', data);

      if (response.ok && data.success) {
        toast.success('Email verified! Account created successfully.');

        // Account is already created by the backend and JWT cookie is set
        // Refresh the auth context to get the current user data
        await refreshUser();

        // Redirect to homepage
        router.push('/');
      } else {
        console.log('❌ Backend error response:');
        console.log('   Full error object:', JSON.stringify(data, null, 2));
        console.log('   Error message:', data.error?.message);
        console.log('   Error details:', data.error?.details);
        throw new Error(data.error?.message || 'Invalid OTP');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 4) {
      // Verify OTP
      await verifyOTP();
    } else if (!validateStep(3)) {
      return;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">C</span>
            </div>
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">
            {step === 4 ? 'Verify Your Email' : 'Create your account'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {step === 4 ? (
              <>We've sent a verification code to {formData.email}</>
            ) : (
              <>
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>

        {/* Progress Steps */}
        {step < 4 && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex items-center flex-1">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                    step > num
                      ? 'bg-green-600 border-green-600 text-white'
                      : step === num
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-slate-300 text-slate-500'
                  }`}>
                    {step > num ? (
                      <CheckIcon className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">{num}</span>
                    )}
                  </div>
                  {num < 3 && (
                    <div className={`flex-1 h-1 mx-2 transition-all duration-300 ${
                      step > num ? 'bg-green-600' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className={`text-xs font-medium ${step >= 1 ? 'text-slate-900' : 'text-slate-500'}`}>
                Basic Info
              </span>
              <span className={`text-xs font-medium ${step >= 2 ? 'text-slate-900' : 'text-slate-500'}`}>
                Personal
              </span>
              <span className={`text-xs font-medium ${step >= 3 ? 'text-slate-900' : 'text-slate-500'}`}>
                Education
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Form Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 py-8 px-6 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    leftIcon={<UserIcon className="h-5 w-5" />}
                    error={validationErrors.firstName}
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
                    error={validationErrors.lastName}
                  />
                </div>

                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  leftIcon={<EnvelopeIcon className="h-5 w-5" />}
                  error={validationErrors.email}
                />

                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 234 567 8900"
                  leftIcon={<PhoneIcon className="h-5 w-5" />}
                  error={validationErrors.phone}
                />

                <div className="relative">
                  <Input
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    leftIcon={<LockClosedIcon className="h-5 w-5" />}
                    error={validationErrors.password}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-9 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
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
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    leftIcon={<LockClosedIcon className="h-5 w-5" />}
                    error={validationErrors.confirmPassword}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-9 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-4 w-4 text-slate-500" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-slate-500" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Personal Information */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Date of Birth (Optional)"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    leftIcon={<CalendarIcon className="h-5 w-5" />}
                  />

                  <Select
                    label="Gender (Optional)"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    options={genderOptions}
                    placeholder="Select gender"
                  />
                </div>

                <Input
                  label="Country"
                  name="country"
                  type="text"
                  required
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="United States"
                  leftIcon={<GlobeAltIcon className="h-5 w-5" />}
                  error={validationErrors.country}
                />

                <Input
                  label="City (Optional)"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="New York"
                  leftIcon={<MapPinIcon className="h-5 w-5" />}
                />
              </div>
            )}

            {/* Step 3: Educational & Professional */}
            {step === 3 && (
              <div className="space-y-4">
                <Select
                  label="Highest Education Level"
                  name="education"
                  required
                  value={formData.education}
                  onChange={handleChange}
                  options={educationLevels}
                  placeholder="Select education level"
                  error={validationErrors.education}
                />

                <Input
                  label="Educational Institution (Optional)"
                  name="institution"
                  type="text"
                  value={formData.institution}
                  onChange={handleChange}
                  placeholder="University/College Name"
                  leftIcon={<AcademicCapIcon className="h-5 w-5" />}
                />

                <Input
                  label="Current Occupation (Optional)"
                  name="occupation"
                  type="text"
                  value={formData.occupation}
                  onChange={handleChange}
                  placeholder="e.g., Software Developer"
                  leftIcon={<BriefcaseIcon className="h-5 w-5" />}
                />

                <Input
                  label="Company/Organization (Optional)"
                  name="company"
                  type="text"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Company Name"
                  leftIcon={<BriefcaseIcon className="h-5 w-5" />}
                />
              </div>
            )}

            {/* Step 4: OTP Verification */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-indigo-50 mb-4">
                    <ShieldCheckIcon className="h-10 w-10 text-indigo-600" />
                  </div>
                  <p className="text-sm text-slate-600 mb-4">
                    Please enter the 6-digit verification code sent to your email
                  </p>
                </div>

                <div className="flex justify-center space-x-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength={1}
                      value={otp[index] || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value) {
                          const newOtp = otp.split('');
                          newOtp[index] = value;
                          setOtp(newOtp.join(''));

                          // Auto-focus next input
                          if (index < 5 && value) {
                            const nextInput = e.target.parentElement?.children[index + 1] as HTMLInputElement;
                            nextInput?.focus();
                          }
                        } else {
                          // Handle backspace
                          const newOtp = otp.split('');
                          newOtp[index] = '';
                          setOtp(newOtp.join(''));
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otp[index] && index > 0) {
                          const prevInput = e.target.parentElement?.children[index - 1] as HTMLInputElement;
                          prevInput?.focus();
                        }
                      }}
                      className="w-12 h-12 text-center text-2xl font-semibold border-2 border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                    />
                  ))}
                </div>

                <div className="text-center">
                  <p className="text-sm text-slate-600">
                    Didn't receive the code?{' '}
                    {resendTimer > 0 ? (
                      <span className="text-slate-500">Resend in {resendTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={resendOTP}
                        className="text-indigo-600 hover:text-indigo-500 font-medium"
                        disabled={isLoading}
                      >
                        Resend OTP
                      </button>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              {step > 1 && step < 4 && (
                <Button
                  type="button"
                  onClick={handlePrevious}
                  variant="outline"
                  size="md"
                >
                  Previous
                </Button>
              )}

              {step === 4 ? (
                <Button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  loading={isLoading}
                  className="w-full"
                  size="md"
                >
                  {isLoading ? 'Verifying...' : 'Verify & Create Account'}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isLoading || !isStepValid(step)}
                  loading={isLoading}
                  className={step === 1 ? 'w-full' : 'ml-auto'}
                  size="md"
                >
                  {isLoading ? 'Processing...' : step === 3 ? 'Send Verification Code' : 'Next'}
                </Button>
              )}
            </div>
          </form>

          {step === 1 && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-slate-500">
                    By signing up, you agree to our
                  </span>
                </div>
              </div>

              <div className="mt-4 text-center text-xs">
                <Link href="/terms" className="text-indigo-600 hover:text-indigo-500">
                  Terms of Service
                </Link>
                {' and '}
                <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500">
                  Privacy Policy
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}