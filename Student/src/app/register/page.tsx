'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Autocomplete } from '@/components/ui/Autocomplete';
import Link from 'next/link';
import { searchCities } from '@/data/indianCities';
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
  CheckIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { handleGoogleRegister } from '@/Oauth/google';
import { handleGithubRegister } from '@/Oauth/github';

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
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
  { value: 'Prefer not to say', label: 'Prefer not to say' }
];

export default function RegisterPage() {
  const { refreshUser } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [isOAuthFlow, setIsOAuthFlow] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<'google' | 'github' | null>(null);
  const [oauthData, setOauthData] = useState<{
    email: string;
    firstName: string;
    lastName: string;
    avatar: string;
    idToken: string;
  } | null>(null);

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

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [emailExists, setEmailExists] = useState(false);

  // Real-time validation functions
  const validateField = (name: string, value: string) => {
    const errors: Record<string, string> = { ...validationErrors };

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

      case 'city':
        if (!value.trim()) {
          errors[name] = 'City is required';
        } else {
          delete errors[name];
        }
        break;

      case 'dateOfBirth':
        if (!value) {
          errors[name] = 'Date of birth is required';
        } else {
          const today = new Date();
          const birthDate = new Date(value);

          // Check if date is in the future
          if (birthDate >= today) {
            errors[name] = 'Date of birth cannot be today or in the future';
          } else {
            // Calculate age
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            // Adjust age if birthday hasn't occurred this year yet
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }

            // Check minimum age requirement (13 years for COPPA compliance)
            if (age < 13) {
              errors[name] = 'You must be at least 13 years old to register';
            } else if (age > 120) {
              errors[name] = 'Please enter a valid date of birth';
            } else {
              delete errors[name];
            }
          }
        }
        break;

      case 'gender':
        if (!value) {
          errors[name] = 'Gender is required';
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL!}/student/auth/check-email`, {
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
    const stepFields: Record<number, string[]> = isOAuthFlow
      ? {
          2: ['firstName', 'lastName', 'dateOfBirth', 'gender', 'city', 'phone'],
          3: ['education'],
          4: [] // Summary step - no additional fields required
        }
      : {
          1: ['firstName', 'lastName', 'email', 'phone', 'password', 'confirmPassword'],
          2: ['dateOfBirth', 'gender', 'city'],
          3: ['education'],
          4: [] // Summary step - no additional fields required
        };

    const requiredFields = stepFields[stepNumber] || [];

    // Check if all required fields are filled
    for (const field of requiredFields) {
      const value = (formData as any)[field];
      if (!value || (typeof value === 'string' && !value.trim())) {
        return false;
      }
    }

    // Check if there are any validation errors for this step's fields
    for (const field of requiredFields) {
      if (validationErrors[field]) {
        return false;
      }
    }

    // Additional check for email existence (only for regular flow)
    if (stepNumber === 1 && !isOAuthFlow && emailExists) {
      return false;
    }

    return true;
  };

  const validateStep = (stepNumber: number) => {
    switch(stepNumber) {
      case 1:
        if (isOAuthFlow) return true; // Skip step 1 validation for OAuth

        if (!formData.email) {
          toast.error('Please enter your email address');
          return false;
        }
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
      case 2:
        const requiredFields = isOAuthFlow
          ? ['firstName', 'lastName', 'dateOfBirth', 'gender', 'city', 'phone']
          : ['dateOfBirth', 'gender', 'city'];

        for (const field of requiredFields) {
          if (!(formData as any)[field]) {
            toast.error('Please fill in all required fields');
            return false;
          }
        }

        // Validate phone for OAuth flow
        if (isOAuthFlow) {
          const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
          if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
            toast.error('Please enter a valid phone number');
            return false;
          }
        }
        break;
      case 3:
        if (!formData.education) {
          toast.error('Please select your education level');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleSendOTP = () => {
    // Send registration data and get OTP
    if (isOAuthFlow) {
      handleOAuthRegistration();
    } else {
      sendRegistrationWithOTP();
    }
  };

  const handleOAuthRegistration = async () => {

    if (!oauthData || !oauthProvider) {
      toast.error('OAuth data not found. Please try again.');
      return;
    }

    try {
      setIsLoading(true);

      const registrationData = {
        provider: oauthProvider,
        idToken: oauthData.idToken,
        email: oauthData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        avatar: oauthData.avatar,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        country: formData.country,
        city: formData.city,
        education: formData.education,
        ...(formData.institution && { institution: formData.institution }),
        ...(formData.occupation && { occupation: formData.occupation }),
        ...(formData.company && { company: formData.company }),
      };


      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL!}/student/auth/oauth-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(registrationData),
      });


      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'OAuth registration failed');
      }

      if (response.ok && data.success) {
        toast.success('Registration successful! Welcome aboard!');

        // Refresh auth context to get user data
        await refreshUser();

        // Redirect to homepage
        router.push('/');
      } else {
        throw new Error(data.error?.message || 'Registration failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const sendRegistrationWithOTP = async () => {
    try {
      setIsLoading(true);



      const requestData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      };

      // Only add optional fields if they have values

      if (formData.phone && formData.phone.trim()) {
        requestData.phone = formData.phone;
      } else {
      }

      if (formData.country && formData.country.trim()) {
        requestData.country = formData.country;
      } else {
      }

      if (formData.education && formData.education.trim()) {
        requestData.education = formData.education;
      } else {
      }

      if (formData.dateOfBirth && formData.dateOfBirth.trim()) {
        requestData.dateOfBirth = formData.dateOfBirth;
      } else {
      }

      if (formData.gender && formData.gender.trim()) {
        requestData.gender = formData.gender;
      } else {
      }

      if (formData.city && formData.city.trim()) {
        requestData.city = formData.city;
      } else {
      }

      if (formData.institution && formData.institution.trim()) {
        requestData.institution = formData.institution;
      } else {
      }

      if (formData.occupation && formData.occupation.trim()) {
        requestData.occupation = formData.occupation;
      } else {
      }

      if (formData.company && formData.company.trim()) {
        requestData.company = formData.company;
      } else {
      }



      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL!}/student/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData)
      });


      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Registration failed');
      }

      if (response.ok && data.success) {
        setStep(5); // Move to OTP verification step
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL!}/student/auth/resend-otp`, {
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


      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL!}/student/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();


      if (response.ok && data.success) {
        toast.success('Email verified! Account created successfully.');

        // Account is already created by the backend and JWT cookie is set
        // Refresh the auth context to get the current user data
        await refreshUser();

        // Redirect to homepage
        router.push('/');
      } else {
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

    if (step === 5) {
      // Verify OTP
      await verifyOTP();
    } else if (!validateStep(3)) {
      return;
    }
  };

  const onGoogleRegisterClick = async () => {
    const result = await handleGoogleRegister();

    if (result.success && result.data) {

      // Check if account already exists
      try {

        const requestBody = { email: result.data.email };

        const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL!}/student/auth/check-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(requestBody)
        });


        const checkData = await checkResponse.json();

        // If email exists, log them in instead
        if (!checkResponse.ok && checkData.error?.message?.includes('already exists')) {
          toast.loading('Account exists. Logging you in...');

          // Attempt OAuth login
          const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL!}/student/auth/oauth-login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              provider: 'google',
              email: result.data.email,
              idToken: result.data.idToken
            }),
          });

          const loginData = await loginResponse.json();

          if (loginResponse.ok && loginData.success) {
            toast.dismiss();
            toast.success('Welcome back!');
            await refreshUser();
            router.push('/');
          } else {
            toast.dismiss();
            toast.error('Failed to log in. Please use the login page.');
          }
          return;
        }

        // Email doesn't exist, proceed with registration

        setOauthData(result.data);
        setOauthProvider('google');

        // Pre-fill form data with OAuth info
        setFormData(prev => ({
          ...prev,
          email: result.data!.email,
          firstName: result.data!.firstName,
          lastName: result.data!.lastName || '',
        }));

        // Switch to OAuth registration flow
        setIsOAuthFlow(true);
        setStep(2); // Go to personal info step

        toast.success('Please complete your profile information');
      } catch (error) {
        // If check fails, proceed with registration anyway

        setOauthData(result.data);
        setOauthProvider('google');
        setFormData(prev => ({
          ...prev,
          email: result.data!.email,
          firstName: result.data!.firstName,
          lastName: result.data!.lastName || '',
        }));
        setIsOAuthFlow(true);
        setStep(2);
        toast.success('Please complete your profile information');
      }
    } else {
      toast.error(result.error || 'Failed to sign up with Google');
    }
  };

  const onGithubRegisterClick = async () => {

    const result = await handleGithubRegister();


    if (result.success && result.data) {

      // Check if account already exists
      try {

        const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL!}/student/auth/check-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ email: result.data.email })
        });

        const checkData = await checkResponse.json();

        // If email exists, log them in instead
        if (!checkResponse.ok && checkData.error?.message?.includes('already exists')) {
          toast.loading('Account exists. Logging you in...');

          // Attempt OAuth login

          const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL!}/student/auth/oauth-login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              provider: 'github',
              email: result.data.email,
              idToken: result.data.idToken
            }),
          });

          const loginData = await loginResponse.json();

          if (loginResponse.ok && loginData.success) {
            toast.dismiss();
            toast.success('Welcome back!');
            await refreshUser();
            router.push('/');
          } else {
            toast.dismiss();
            toast.error('Failed to log in. Please use the login page.');
          }
          return;
        }

        // Email doesn't exist, proceed with registration

        setOauthData(result.data);
        setOauthProvider('github');


        // Pre-fill form data with OAuth info
        setFormData(prev => ({
          ...prev,
          email: result.data!.email,
          firstName: result.data!.firstName,
          lastName: result.data!.lastName || '',
        }));

        // Switch to OAuth registration flow
        setIsOAuthFlow(true);
        setStep(2); // Go to personal info step

        toast.success('Please complete your profile information');
      } catch (error) {

        // If check fails, proceed with registration anyway
        setOauthData(result.data);
        setOauthProvider('github');
        setFormData(prev => ({
          ...prev,
          email: result.data!.email,
          firstName: result.data!.firstName,
          lastName: result.data!.lastName || '',
        }));
        setIsOAuthFlow(true);
        setStep(2);
        toast.success('Please complete your profile information');
      }
    } else {
      toast.error(result.error || 'Failed to sign up with GitHub');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] lg:min-h-[calc(100vh-96px)] bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 relative overflow-hidden">
      {/* Decorative Background Elements - Spanning across both sides */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-20 left-20 w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-3xl animate-float-slower"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-purple-400/8 rounded-full blur-3xl animate-float-slow"></div>
      </div>

      <div className="relative z-10 lg:grid lg:grid-cols-2 h-full">
        {/* Left Column - Marketing/Benefits Section (Hidden on mobile/tablet) */}
        <div className="hidden lg:flex lg:flex-col lg:justify-center px-8 xl:px-12 py-3">
          <div className="max-w-md animate-fade-in-left">
            {/* Logo */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-11 w-11 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <span className="text-white font-bold text-lg">C</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">CODiiN</h1>
                  <p className="text-xs text-slate-600">Learn & Grow</p>
                </div>
              </div>
            </div>

            {/* Main Heading */}
            <h2 className="text-2xl xl:text-3xl font-bold text-slate-900 mb-3 leading-tight">
              Start your learning journey today
            </h2>
            <p className="text-sm text-slate-600 mb-5">
              Join thousands of students already learning on our platform and accelerate your career.
            </p>

            {/* Benefits List */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-0.5 text-sm">Expert-led courses</h3>
                  <p className="text-xs text-slate-600">Learn from industry professionals with real-world expertise</p>
                </div>
              </div>

              <div className="flex items-start gap-3 group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-0.5 text-sm">Learn at your own pace</h3>
                  <p className="text-xs text-slate-600">Flexible learning schedule that fits your lifestyle</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Form Section */}
        <div className="flex flex-col justify-center px-3 sm:px-6 lg:px-8 xl:px-10 py-2 sm:py-3">
          <div className="w-full max-w-2xl mx-auto">
            {/* Modern Header with Inline Progress */}
            <div className="mb-2 sm:mb-3 animate-fade-in-up">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 lg:hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 transform hover:scale-105 transition-transform duration-300">
                    <span className="text-white font-bold text-xl">C</span>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                      {step === 5 ? 'Verify Email' : isOAuthFlow ? 'Complete Profile' : 'Create Account'}
                    </h2>
                    <p className="text-xs sm:text-sm lg:text-base text-slate-500 mt-0.5">
                      {step === 5 ? (
                        <>Code sent to <span className="text-blue-600 font-semibold">{formData.email}</span></>
                      ) : isOAuthFlow ? (
                        <>Additional information required</>
                      ) : (
                        <>
                          Have an account?{' '}
                          <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
                            Sign in
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Modern Inline Progress - Only show for regular flow */}
                {step < 5 && !isOAuthFlow && (
                  <div className="hidden sm:flex items-center gap-2">
                    {[1, 2, 3].map((s) => (
                      <div
                        key={s}
                        className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 transform ${
                          step > s
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/40 scale-110'
                            : step === s
                            ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50 scale-110 ring-4 ring-indigo-100'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {step > s ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : s}
                        {step === s && (
                          <div className="absolute inset-0 rounded-full animate-ping bg-indigo-400 opacity-20"></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Modern OAuth Progress */}
                {isOAuthFlow && step < 4 && (
                  <div className="hidden sm:flex items-center gap-2">
                    {[2, 3].map((s, idx) => (
                      <div
                        key={s}
                        className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 transform ${
                          step > s
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/40 scale-110'
                            : step === s
                            ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50 scale-110 ring-4 ring-indigo-100'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {step > s ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : idx + 1}
                        {step === s && (
                          <div className="absolute inset-0 rounded-full animate-ping bg-indigo-400 opacity-20"></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Progress Bar */}
            {step < 4 && !isOAuthFlow && (
              <div className="mb-3 sm:hidden">
                <div className="flex items-center gap-2">
              <div className="flex items-start justify-between">
                {/* Step 1 with Label */}
                <div className="flex flex-col items-center gap-1.5" style={{ flex: '0 0 auto' }}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 shadow-sm ${
                    step > 1
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-green-500/30'
                      : step === 1
                      ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-blue-500/40'
                      : 'bg-white border-2 border-slate-300 text-slate-500'
                  }`}>
                    {step > 1 ? (
                      <CheckIcon className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-bold">1</span>
                    )}
                  </div>
                  <span className={`text-xs font-bold whitespace-nowrap transition-colors duration-300 ${
                    step >= 1 ? 'text-slate-900' : 'text-slate-500'
                  }`}>
                    Basic Info
                  </span>
                </div>

                {/* Connecting line 1-2 */}
                <div className="flex-1 flex items-start pt-3.5 px-2">
                  <div className={`w-full h-1 rounded-full transition-all duration-500 ${
                    step > 1 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-slate-200'
                  }`} />
                </div>

                {/* Step 2 with Label */}
                <div className="flex flex-col items-center gap-1.5" style={{ flex: '0 0 auto' }}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 shadow-sm ${
                    step > 2
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-green-500/30'
                      : step === 2
                      ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-blue-500/40'
                      : 'bg-white border-2 border-slate-300 text-slate-500'
                  }`}>
                    {step > 2 ? (
                      <CheckIcon className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-bold">2</span>
                    )}
                  </div>
                  <span className={`text-xs font-bold whitespace-nowrap transition-colors duration-300 ${
                    step >= 2 ? 'text-slate-900' : 'text-slate-500'
                  }`}>
                    Personal
                  </span>
                </div>

                {/* Connecting line 2-3 */}
                <div className="flex-1 flex items-start pt-3.5 px-2">
                  <div className={`w-full h-1 rounded-full transition-all duration-500 ${
                    step > 2 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-slate-200'
                  }`} />
                </div>

                {/* Step 3 with Label */}
                <div className="flex flex-col items-center gap-1.5" style={{ flex: '0 0 auto' }}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 shadow-sm ${
                    step > 3
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-green-500/30'
                      : step === 3
                      ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-blue-500/40'
                      : 'bg-white border-2 border-slate-300 text-slate-500'
                  }`}>
                    {step > 3 ? (
                      <CheckIcon className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-bold">3</span>
                    )}
                  </div>
                  <span className={`text-xs font-bold whitespace-nowrap transition-colors duration-300 ${
                    step >= 3 ? 'text-slate-900' : 'text-slate-500'
                  }`}>
                    Education
                  </span>
                </div>
                </div>
              </div>
            </div>
            )}

            {/* OAuth Progress Steps */}
            {isOAuthFlow && step < 4 && (
              <div className="mb-3 animate-fade-in-up">
                <div className="relative bg-white/60 backdrop-blur-sm rounded-xl p-3 shadow-md border border-blue-100/50">
              <div className="flex items-start justify-between">
                {/* Step 1: Personal Info with Label */}
                <div className="flex flex-col items-center gap-1" style={{ flex: '0 0 auto' }}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 shadow-sm ${
                    step > 2
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-green-500/30 scale-110'
                      : step === 2
                      ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-blue-500/40 scale-110'
                      : 'bg-white border-2 border-slate-300 text-slate-500'
                  }`}>
                    {step > 2 ? (
                      <CheckIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    ) : (
                      <span className="text-xs sm:text-sm font-bold">1</span>
                    )}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-bold whitespace-nowrap transition-colors duration-300 ${
                    step >= 2 ? 'text-slate-900' : 'text-slate-500'
                  }`}>
                    Personal Info
                  </span>
                </div>

                {/* Connecting line */}
                <div className="flex-1 flex items-start pt-3 sm:pt-3.5 px-1.5 sm:px-2 md:px-3">
                  <div className={`w-full h-0.5 sm:h-1 rounded-full transition-all duration-500 ${
                    step > 2 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-slate-200'
                  }`} />
                </div>

                {/* Step 2: Education with Label */}
                <div className="flex flex-col items-center gap-1.5" style={{ flex: '0 0 auto' }}>
                  <div className={`flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-full transition-all duration-300 shadow-sm ${
                    step > 3
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-green-500/30 scale-110'
                      : step === 3
                      ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-blue-500/40 scale-110'
                      : 'bg-white border-2 border-slate-300 text-slate-500'
                  }`}>
                    {step > 3 ? (
                      <CheckIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    ) : (
                      <span className="text-xs sm:text-sm font-bold">2</span>
                    )}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-bold whitespace-nowrap transition-colors duration-300 ${
                    step >= 3 ? 'text-slate-900' : 'text-slate-500'
                  }`}>
                    Education
                  </span>
                </div>
                </div>
              </div>
            </div>
            )}

            {/* Modern Form Card */}
            <div className="relative group">
              {/* Glow effect on hover */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

              <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden">
                {/* Animated gradient bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-gradient-x"></div>

                {/* Subtle background pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30"></div>

                <div className="relative p-4 sm:p-5">
                <form className="space-y-2 sm:space-y-2.5" onSubmit={handleSubmit}>
                  {/* Step 1: Basic Information */}
                  {step === 1 && (
                    <div className="space-y-2 sm:space-y-2.5">
                      {/* Step Title */}
                      <div className="flex items-center gap-2 sm:gap-3 pb-1.5 border-b border-slate-100">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-slate-900">Basic Information</h3>
                          <p className="text-xs text-slate-500 hidden sm:block">Let's start with your details</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
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
                      className="absolute right-2 top-[26px] sm:right-3 sm:top-9 p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 transition-colors z-20"
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
                      className="absolute right-2 top-[26px] sm:right-3 sm:top-9 p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 transition-colors z-20"
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
              </div>
            )}

                  {/* Step 2: Personal Information */}
                  {step === 2 && (
                    <div className="space-y-2 sm:space-y-2.5">
                      {/* Step Title */}
                      <div className="flex items-center gap-2 sm:gap-3 pb-1.5 border-b border-slate-100">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-slate-900">Personal Details</h3>
                          <p className="text-xs text-slate-500 hidden sm:block">Tell us more about yourself</p>
                        </div>
                      </div>
                {/* Show OAuth user info if in OAuth flow */}
                {isOAuthFlow && oauthData && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-3 mb-2.5">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      {oauthData.avatar ? (
                        <img
                          src={oauthData.avatar}
                          alt="Profile"
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                          }}
                          onLoad={() => {
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-300 flex items-center justify-center">
                          <span className="text-xs text-slate-600">No Avatar</span>
                        </div>
                      )}
                      <div>
                        <p className="text-xs sm:text-sm text-blue-800">{oauthData.email || 'Email from OAuth'}</p>
                        <p className="text-xs text-blue-700">
                          Signed in with {oauthProvider === 'google' ? 'Google' : 'GitHub'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                      {/* Name fields for OAuth flow */}
                      {isOAuthFlow && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
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
                )}

                {/* Phone field for OAuth flow */}
                {isOAuthFlow && (
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
                )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                        <Input
                          label="Date of Birth"
                          name="dateOfBirth"
                          type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    leftIcon={<CalendarIcon className="h-5 w-5" />}
                    error={validationErrors.dateOfBirth}
                    max={new Date().toISOString().split('T')[0]}
                  />

                  <Select
                    label="Gender"
                    name="gender"
                    required
                    value={formData.gender}
                    onChange={handleChange}
                    options={genderOptions}
                    placeholder="Select gender"
                    error={validationErrors.gender}
                  />
                </div>

                <Autocomplete
                  label="City"
                  name="city"
                  required
                  value={formData.city}
                  onChange={(value) => {
                    setFormData(prev => ({ ...prev, city: value }));
                    validateField('city', value);
                  }}
                  onSearch={searchCities}
                  placeholder="Start typing your city..."
                  leftIcon={<MapPinIcon className="h-5 w-5" />}
                  error={validationErrors.city}
                  suggestions={[]}
                  maxSuggestions={10}
                />
              </div>
            )}

                  {/* Step 3: Educational & Professional */}
                  {step === 3 && (
                    <div className="space-y-2 sm:space-y-2.5">
                      {/* Step Title */}
                      <div className="flex items-center gap-2 sm:gap-3 pb-1.5 border-b border-slate-100">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-slate-900">Education & Career</h3>
                          <p className="text-xs text-slate-500 hidden sm:block">Share your academic background</p>
                        </div>
                      </div>
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

            {/* Step 4: Ready to Send OTP / Submit OAuth */}
            {step === 4 && (
              <div className="space-y-2">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-green-50 mb-2">
                    <CheckIcon className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">Almost Done!</h3>
                  <p className="text-xs sm:text-sm text-slate-600">
                    {isOAuthFlow
                      ? 'Please review your information and click "Complete Registration" to finish.'
                      : 'Please review your information and click "Send Verification Code" to complete your registration.'
                    }
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 sm:p-4 space-y-1.5 text-xs sm:text-sm text-slate-900">
                  {isOAuthFlow && oauthData?.avatar && (
                    <div className="flex justify-center mb-2">
                      <img
                        src={oauthData.avatar}
                        alt="Profile"
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-white shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <div><strong>Name:</strong> {formData.firstName} {formData.lastName}</div>
                  <div><strong>Email:</strong> {formData.email}</div>
                  <div><strong>Phone:</strong> {formData.phone}</div>
                  <div><strong>City:</strong> {formData.city}</div>
                  <div><strong>Education:</strong> {formData.education}</div>
                  {formData.institution && <div><strong>Institution:</strong> {formData.institution}</div>}
                  {formData.occupation && <div><strong>Occupation:</strong> {formData.occupation}</div>}
                  {formData.company && <div><strong>Company:</strong> {formData.company}</div>}
                </div>
              </div>
            )}

            {/* Step 5: OTP Verification */}
            {step === 5 && (
              <div className="space-y-3">
                <div className="text-center mb-2">
                  <div className="mx-auto flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-indigo-50 mb-2">
                    <ShieldCheckIcon className="h-7 w-7 sm:h-8 sm:w-8 text-indigo-600" />
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Please enter the 6-digit verification code sent to your email
                  </p>
                </div>

                <div className="flex justify-center space-x-1.5 sm:space-x-2">
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
                          const target = e.target as HTMLInputElement;
                          const prevInput = target.parentElement?.children[index - 1] as HTMLInputElement;
                          prevInput?.focus();
                        }
                      }}
                      className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl font-semibold text-slate-900 border-2 border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                    />
                  ))}
                </div>

                <div className="text-center">
                  <p className="text-xs sm:text-sm text-slate-600">
                    Didn&apos;t receive the code?{' '}
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
            <div className="flex justify-between pt-3 sm:pt-3">
              {step > 1 && step < 4 && (
                <Button
                  type="button"
                  onClick={handlePrevious}
                  variant="outline"
                  size="md"
                  disabled={isOAuthFlow && step === 2}
                >
                  Previous
                </Button>
              )}

              {step === 5 ? (
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
                  onClick={step === 4 ? handleSendOTP : handleNext}
                  disabled={isLoading || !isStepValid(step)}
                  loading={isLoading}
                  className={step === 1 ? 'w-full' : 'ml-auto'}
                  size="md"
                >
                  {isLoading
                    ? 'Processing...'
                    : step === 4
                      ? (isOAuthFlow ? 'Complete Registration' : 'Send Verification Code')
                      : 'Next'
                  }
                </Button>
              )}
            </div>
          </form>

          {step === 1 && (
            <div className="mt-2 sm:mt-3">
              {/* Modern OAuth Divider */}
              <div className="relative my-2 sm:my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs sm:text-sm">
                  <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-white text-slate-500 font-medium rounded-full border border-slate-100">Or continue with</span>
                </div>
              </div>

              {/* OAuth Buttons */}
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                {/* Google Sign Up */}
                <button
                  type="button"
                  onClick={onGoogleRegisterClick}
                  disabled={isLoading}
                  className={`relative flex items-center justify-center px-2 py-2.5 sm:px-3 sm:py-3 border-2 border-slate-200 rounded-xl shadow-sm bg-white overflow-hidden transition-all duration-300 group ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:border-blue-400 hover:-translate-y-0.5 hover:bg-blue-50/50'
                  }`}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                  <svg className="h-4 w-4 sm:h-5 sm:w-5 relative z-10" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm font-semibold text-slate-700 relative z-10">Google</span>
                </button>

                {/* GitHub Sign Up */}
                <button
                  type="button"
                  onClick={onGithubRegisterClick}
                  disabled={isLoading}
                  className={`relative flex items-center justify-center px-2 py-2.5 sm:px-3 sm:py-3 border-2 border-slate-200 rounded-xl shadow-sm bg-white overflow-hidden transition-all duration-300 group ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:border-slate-400 hover:-translate-y-0.5 hover:bg-slate-50'
                  }`}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                  <svg className="h-4 w-4 sm:h-5 sm:w-5 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm font-semibold text-slate-700 relative z-10">GitHub</span>
                </button>
              </div>
            </div>
          )}
        </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}