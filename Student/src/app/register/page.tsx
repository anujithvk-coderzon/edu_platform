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
    console.log('🎯 [OAuth Registration] Starting OAuth registration process...');

    if (!oauthData || !oauthProvider) {
      console.error('❌ [OAuth Registration] Missing OAuth data or provider');
      console.log('   - oauthData:', oauthData);
      console.log('   - oauthProvider:', oauthProvider);
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

      console.log('📦 [OAuth Registration] Registration data prepared:');
      console.log('   - provider:', registrationData.provider);
      console.log('   - email:', registrationData.email);
      console.log('   - firstName:', registrationData.firstName);
      console.log('   - lastName:', registrationData.lastName);
      console.log('   - avatar:', registrationData.avatar);
      console.log('   - phone:', registrationData.phone);
      console.log('   - Full data:', registrationData);

      console.log('📡 [OAuth Registration] Sending registration request to backend...');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL!}/student/auth/oauth-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(registrationData),
      });

      console.log('📡 [OAuth Registration] Response status:', response.status);
      console.log('📡 [OAuth Registration] Response OK:', response.ok);

      const data = await response.json();
      console.log('📡 [OAuth Registration] Response data:', data);

      if (!response.ok) {
        console.error('❌ [OAuth Registration] Registration failed');
        console.error('   - Status:', response.status);
        console.error('   - Error message:', data.error?.message);
        console.error('   - Full error:', data.error);
        throw new Error(data.error?.message || 'OAuth registration failed');
      }

      if (response.ok && data.success) {
        console.log('✅ [OAuth Registration] Registration successful!');
        console.log('📋 [OAuth Registration] Response data:', data.data);
        toast.success('Registration successful! Welcome aboard!');

        // Refresh auth context to get user data
        console.log('🔄 [OAuth Registration] Refreshing user data...');
        await refreshUser();

        // Redirect to homepage
        console.log('🏠 [OAuth Registration] Redirecting to homepage...');
        router.push('/');
      } else {
        console.error('❌ [OAuth Registration] Unexpected response format');
        throw new Error(data.error?.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('❌ [OAuth Registration] Error caught:', error);
      toast.error(error.message || 'Failed to complete registration. Please try again.');
    } finally {
      setIsLoading(false);
      console.log('🏁 [OAuth Registration] Process completed');
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const sendRegistrationWithOTP = async () => {
    try {
      setIsLoading(true);

      console.log('📤 Sending registration data with OTP request');
      const requestData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        country: formData.country,
        education: formData.education
      };

      // Only add optional fields if they have values
      if (formData.dateOfBirth && formData.dateOfBirth.trim()) {
        requestData.dateOfBirth = formData.dateOfBirth;
      }
      if (formData.gender && formData.gender.trim()) {
        requestData.gender = formData.gender;
      }
      if (formData.city && formData.city.trim()) {
        requestData.city = formData.city;
      }
      if (formData.institution && formData.institution.trim()) {
        requestData.institution = formData.institution;
      }
      if (formData.occupation && formData.occupation.trim()) {
        requestData.occupation = formData.occupation;
      }
      if (formData.company && formData.company.trim()) {
        requestData.company = formData.company;
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
      console.log('Google User Data:', result.data);
      console.log('Google Avatar URL:', result.data.avatar);

      // Check if account already exists
      try {
        console.log('📧 Checking email:', result.data.email);
        console.log('📧 Email type:', typeof result.data.email);
        console.log('📧 Email length:', result.data.email?.length);

        const requestBody = { email: result.data.email };
        console.log('📦 Request body:', JSON.stringify(requestBody));

        const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL!}/student/auth/check-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(requestBody)
        });

        console.log('📡 Check email response status:', checkResponse.status);

        const checkData = await checkResponse.json();
        console.log('📡 Check email response data:', checkData);

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
        console.log('🔧 [Google OAuth] About to set oauthData with:', result.data);
        console.log('🔧 [Google OAuth] Avatar value:', result.data.avatar);
        console.log('🔧 [Google OAuth] Avatar type:', typeof result.data.avatar);
        console.log('🔧 [Google OAuth] Avatar length:', result.data.avatar?.length);
        console.log('🔧 [Google OAuth] Avatar is truthy:', !!result.data.avatar);

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
        console.error('Email check error:', error);
        // If check fails, proceed with registration anyway
        console.log('🔧 [Google OAuth - Catch] About to set oauthData with:', result.data);
        console.log('🔧 [Google OAuth - Catch] Avatar value:', result.data.avatar);
        console.log('🔧 [Google OAuth - Catch] Avatar type:', typeof result.data.avatar);
        console.log('🔧 [Google OAuth - Catch] Avatar length:', result.data.avatar?.length);
        console.log('🔧 [Google OAuth - Catch] Avatar is truthy:', !!result.data.avatar);

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
      console.error('Google OAuth Error:', result.error);
      toast.error(result.error || 'Failed to sign up with Google');
    }
  };

  const onGithubRegisterClick = async () => {
    console.log('🎯 [Register Page] GitHub Register button clicked');

    const result = await handleGithubRegister();

    console.log('📬 [Register Page] handleGithubRegister result:', result);

    if (result.success && result.data) {
      console.log('✅ [Register Page] GitHub OAuth successful');
      console.log('📋 [Register Page] Received data:', result.data);
      console.log('✉️ [Register Page] EMAIL FROM GITHUB:', result.data.email);
      console.log('👤 [Register Page] Name:', result.data.firstName, result.data.lastName);
      console.log('🖼️ [Register Page] Avatar:', result.data.avatar);

      // Check if account already exists
      try {
        console.log('🔍 [Register Page] Checking if email exists...');
        console.log('📧 [Register Page] Checking email:', result.data.email);

        const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL!}/student/auth/check-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ email: result.data.email })
        });

        console.log('📡 [Register Page] Email check response status:', checkResponse.status);
        const checkData = await checkResponse.json();
        console.log('📡 [Register Page] Email check response data:', checkData);

        // If email exists, log them in instead
        if (!checkResponse.ok && checkData.error?.message?.includes('already exists')) {
          console.log('⚠️ [Register Page] Email already exists, attempting login...');
          toast.loading('Account exists. Logging you in...');

          // Attempt OAuth login
          console.log('🔐 [Register Page] Sending OAuth login request...');
          console.log('📧 [Register Page] Login email:', result.data.email);

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

          console.log('📡 [Register Page] OAuth login response status:', loginResponse.status);
          const loginData = await loginResponse.json();
          console.log('📡 [Register Page] OAuth login response data:', loginData);

          if (loginResponse.ok && loginData.success) {
            console.log('✅ [Register Page] Login successful');
            toast.dismiss();
            toast.success('Welcome back!');
            await refreshUser();
            router.push('/');
          } else {
            console.log('❌ [Register Page] Login failed');
            toast.dismiss();
            toast.error('Failed to log in. Please use the login page.');
          }
          return;
        }

        // Email doesn't exist, proceed with registration
        console.log('✅ [Register Page] Email available, proceeding with registration');
        console.log('💾 [Register Page] Storing OAuth data:', result.data);

        setOauthData(result.data);
        setOauthProvider('github');

        console.log('📝 [Register Page] Pre-filling form data with:');
        console.log('   - email:', result.data.email);
        console.log('   - firstName:', result.data.firstName);
        console.log('   - lastName:', result.data.lastName);

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

        console.log('🎉 [Register Page] Moved to step 2 for profile completion');
        toast.success('Please complete your profile information');
      } catch (error) {
        console.error('❌ [Register Page] Email check error:', error);
        console.log('⚠️ [Register Page] Proceeding with registration anyway');

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
      console.error('❌ [Register Page] GitHub OAuth failed');
      console.error('❌ [Register Page] Error:', result.error);
      toast.error(result.error || 'Failed to sign up with GitHub');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-4 sm:py-6 md:py-8 px-3 sm:px-4 lg:px-6">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-5 md:mb-6">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl sm:text-2xl">C</span>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-900">
            {step === 5 ? 'Verify Your Email' : isOAuthFlow ? 'Complete Your Profile' : 'Create your account'}
          </h2>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-600">
            {step === 5 ? (
              <>We&apos;ve sent a verification code to {formData.email}</>
            ) : isOAuthFlow ? (
              <>Please provide additional information to complete your registration</>
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
        {step < 4 && !isOAuthFlow && (
          <div className="mb-4 sm:mb-5 md:mb-6 px-2 sm:px-3 md:px-4">
            {/* Progress Bar */}
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                {/* Step 1 */}
                <div className="flex flex-col items-center relative z-10" style={{ flex: '0 0 auto' }}>
                  <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all duration-300 ${
                    step > 1
                      ? 'bg-green-600 border-green-600 text-white'
                      : step === 1
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-slate-300 text-slate-500'
                  }`}>
                    {step > 1 ? (
                      <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <span className="text-xs sm:text-sm font-medium">1</span>
                    )}
                  </div>
                </div>

                {/* Connecting line 1-2 */}
                <div className="flex-1 flex items-center px-2 sm:px-4">
                  <div className={`w-full h-0.5 sm:h-1 transition-all duration-300 ${
                    step > 1 ? 'bg-green-600' : 'bg-slate-200'
                  }`} />
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center relative z-10" style={{ flex: '0 0 auto' }}>
                  <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all duration-300 ${
                    step > 2
                      ? 'bg-green-600 border-green-600 text-white'
                      : step === 2
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-slate-300 text-slate-500'
                  }`}>
                    {step > 2 ? (
                      <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <span className="text-xs sm:text-sm font-medium">2</span>
                    )}
                  </div>
                </div>

                {/* Connecting line 2-3 */}
                <div className="flex-1 flex items-center px-2 sm:px-4">
                  <div className={`w-full h-0.5 sm:h-1 transition-all duration-300 ${
                    step > 2 ? 'bg-green-600' : 'bg-slate-200'
                  }`} />
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center relative z-10" style={{ flex: '0 0 auto' }}>
                  <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all duration-300 ${
                    step > 3
                      ? 'bg-green-600 border-green-600 text-white'
                      : step === 3
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-slate-300 text-slate-500'
                  }`}>
                    {step > 3 ? (
                      <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <span className="text-xs sm:text-sm font-medium">3</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Labels */}
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center pr-2 sm:pr-0">
                  <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${step >= 1 ? 'text-slate-900' : 'text-slate-500'}`}>
                    Basic Info
                  </span>
                </div>
                <div className="flex-1 text-center px-2 sm:px-0">
                  <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${step >= 2 ? 'text-slate-900' : 'text-slate-500'}`}>
                    Personal
                  </span>
                </div>
                <div className="flex-1 text-center pl-2 sm:pl-0">
                  <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${step >= 3 ? 'text-slate-900' : 'text-slate-500'}`}>
                    Education
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OAuth Progress Steps */}
        {isOAuthFlow && step < 4 && (
          <div className="mb-4 sm:mb-5 md:mb-6 px-2 sm:px-3 md:px-4">
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                {/* Step 1: Personal Info */}
                <div className="flex flex-col items-center relative z-10" style={{ flex: '0 0 auto' }}>
                  <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all duration-300 ${
                    step > 2
                      ? 'bg-green-600 border-green-600 text-white'
                      : step === 2
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-slate-300 text-slate-500'
                  }`}>
                    {step > 2 ? (
                      <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <span className="text-xs sm:text-sm font-medium">1</span>
                    )}
                  </div>
                </div>

                {/* Connecting line */}
                <div className="flex-1 flex items-center px-2 sm:px-4">
                  <div className={`w-full h-0.5 sm:h-1 transition-all duration-300 ${
                    step > 2 ? 'bg-green-600' : 'bg-slate-200'
                  }`} />
                </div>

                {/* Step 2: Education */}
                <div className="flex flex-col items-center relative z-10" style={{ flex: '0 0 auto' }}>
                  <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all duration-300 ${
                    step > 3
                      ? 'bg-green-600 border-green-600 text-white'
                      : step === 3
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-slate-300 text-slate-500'
                  }`}>
                    {step > 3 ? (
                      <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <span className="text-xs sm:text-sm font-medium">2</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Labels */}
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${step >= 2 ? 'text-slate-900' : 'text-slate-500'}`}>
                    Personal Info
                  </span>
                </div>
                <div className="flex-1 text-center">
                  <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${step >= 3 ? 'text-slate-900' : 'text-slate-500'}`}>
                    Education
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 py-4 sm:py-5 md:py-6 px-3 sm:px-4 md:px-6 lg:px-8">
          <form className="space-y-3 sm:space-y-4 md:space-y-5" onSubmit={handleSubmit}>
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="space-y-2.5 sm:space-y-3 md:space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-3.5">
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
              <div className="space-y-2.5 sm:space-y-3 md:space-y-3.5">
                {/* Show OAuth user info if in OAuth flow */}
                {isOAuthFlow && oauthData && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 sm:p-3 mb-2.5 sm:mb-3">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      {oauthData.avatar ? (
                        <img
                          src={oauthData.avatar}
                          alt="Profile"
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            console.error('🖼️ [Avatar] Image failed to load:', oauthData.avatar);
                            console.error('🖼️ [Avatar] Error event:', e);
                          }}
                          onLoad={() => {
                            console.log('✅ [Avatar] Image loaded successfully:', oauthData.avatar);
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-300 flex items-center justify-center">
                          <span className="text-xs text-slate-600">No Avatar</span>
                        </div>
                      )}
                      <div>
                        <p className="text-xs sm:text-sm text-slate-600">{oauthData.email || 'Email from OAuth'}</p>
                        <p className="text-xs text-slate-500">
                          Signed in with {oauthProvider === 'google' ? 'Google' : 'GitHub'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Name fields for OAuth flow */}
                {isOAuthFlow && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-3.5">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-3.5">
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
              <div className="space-y-2.5 sm:space-y-3 md:space-y-3.5">
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
              <div className="space-y-2.5 sm:space-y-3 md:space-y-3.5">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-full bg-green-50 mb-2 sm:mb-3">
                    <CheckIcon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-green-600" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1 sm:mb-2">Almost Done!</h3>
                  <p className="text-xs sm:text-sm text-slate-600">
                    {isOAuthFlow
                      ? 'Please review your information and click "Complete Registration" to finish.'
                      : 'Please review your information and click "Send Verification Code" to complete your registration.'
                    }
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-2.5 sm:p-3 md:p-4 space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  {isOAuthFlow && oauthData?.avatar && (
                    <div className="flex justify-center mb-2 sm:mb-3">
                      <img
                        src={oauthData.avatar}
                        alt="Profile"
                        className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full border-2 border-white shadow-sm"
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
              <div className="space-y-3 sm:space-y-4 md:space-y-5">
                <div className="text-center mb-3 sm:mb-4">
                  <div className="mx-auto flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full bg-indigo-50 mb-2 sm:mb-3">
                    <ShieldCheckIcon className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 text-indigo-600" />
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 mb-2 sm:mb-3">
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
                      className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl md:text-2xl font-semibold border-2 border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none"
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
            <div className="flex justify-between pt-2 sm:pt-3 md:pt-4">
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
            <>
              {/* OAuth Divider */}
              <div className="relative my-3 sm:my-4 md:my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs sm:text-sm">
                  <span className="px-3 sm:px-4 bg-white text-slate-500">Or sign up with</span>
                </div>
              </div>

              {/* OAuth Buttons */}
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5 md:gap-3">
                {/* Google Sign Up */}
                <button
                  type="button"
                  onClick={onGoogleRegisterClick}
                  disabled={isLoading}
                  className={`flex items-center justify-center px-2 sm:px-3 py-2 sm:py-2.5 border border-slate-300 rounded-lg shadow-sm bg-white hover:bg-slate-50 transition-all duration-200 ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
                  }`}
                >
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
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
                  <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm font-medium text-slate-700">Google</span>
                </button>

                {/* GitHub Sign Up */}
                <button
                  type="button"
                  onClick={onGithubRegisterClick}
                  disabled={isLoading}
                  className={`flex items-center justify-center px-2 sm:px-3 py-2 sm:py-2.5 border border-slate-300 rounded-lg shadow-sm bg-white hover:bg-slate-50 transition-all duration-200 ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
                  }`}
                >
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm font-medium text-slate-700">GitHub</span>
                </button>
              </div>

              {/* Terms */}
              <div className="mt-3 sm:mt-4 md:mt-5">
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}