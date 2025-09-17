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
  CheckIcon
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
  const { register } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const validateStep = (stepNumber: number) => {
    switch(stepNumber) {
      case 1:
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
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
        if (!formData.country) {
          toast.error('Please select your country');
          return false;
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
      if (step === 3) {
        handleSubmit(new Event('submit') as any);
      } else {
        setStep(step + 1);
      }
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(3)) return;

    try {
      setIsLoading(true);
      await register({
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
      });
      toast.success('Account created successfully!');
      router.push('/');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
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
            Create your account
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </p>
        </div>

        {/* Progress Steps */}
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

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              {step > 1 && (
                <Button
                  type="button"
                  onClick={handlePrevious}
                  variant="outline"
                  size="md"
                >
                  Previous
                </Button>
              )}

              <Button
                type="button"
                onClick={handleNext}
                disabled={isLoading}
                loading={isLoading}
                className={step === 1 ? 'w-full' : 'ml-auto'}
                size="md"
              >
                {isLoading ? 'Creating account...' : step === 3 ? 'Create Account' : 'Next'}
              </Button>
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