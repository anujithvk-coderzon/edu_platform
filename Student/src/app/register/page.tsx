'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
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
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const educationLevels = [
  'High School',
  'Associate Degree',
  'Bachelor\'s Degree',
  'Master\'s Degree',
  'Doctorate',
  'Professional Certification',
  'Other'
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
          toast.error('Password must be at least 6 characters long');
          return false;
        }
        // Phone number validation
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
        // Submit form on step 3
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-br from-indigo-200 to-pink-200 rounded-full blur-3xl opacity-30"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10">
        <div className="flex justify-center mb-8">
          <div className="h-20 w-20 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300 group">
            <span className="text-white font-bold text-3xl group-hover:scale-110 transition-transform duration-300">🎓</span>
          </div>
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent text-center mb-4">
          Join CoderZone! ✨
        </h1>
        <p className="text-lg text-slate-600 font-medium text-center">
          🚀 Start your learning journey today! Already have an account?{' '}
          <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700 transition-colors duration-200">
            Sign in here
          </Link>
        </p>

        {/* Progress Bar */}
        <div className="mt-12 mb-8 bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-4">
            {[
              { num: 1, icon: '👤', label: 'Basic Info' },
              { num: 2, icon: '📍', label: 'Personal' },
              { num: 3, icon: '🎓', label: 'Education' }
            ].map((item, index) => (
              <div key={item.num} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${
                  item.num <= step
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-110'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  <span className="text-xl">{item.num <= step ? '✅' : item.icon}</span>
                </div>
                {index < 2 && (
                  <div className={`flex-1 h-2 mx-4 rounded-full transition-all duration-500 ${
                    item.num < step ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-center">
            <div className="flex-1">
              <span className={`text-sm font-bold transition-colors ${
                step >= 1 ? 'text-blue-600' : 'text-slate-500'
              }`}>📝 Basic Info</span>
            </div>
            <div className="flex-1">
              <span className={`text-sm font-bold transition-colors ${
                step >= 2 ? 'text-blue-600' : 'text-slate-500'
              }`}>🏠 Personal</span>
            </div>
            <div className="flex-1">
              <span className={`text-sm font-bold transition-colors ${
                step >= 3 ? 'text-blue-600' : 'text-slate-500'
              }`}>🎯 Education</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl relative z-10">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 py-10 px-8 hover:shadow-3xl transition-all duration-300">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-900">
                      First name *
                    </label>
                    <div className="mt-1 relative">
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-400 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="John"
                      />
                      <UserIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-900">
                      Last name *
                    </label>
                    <div className="mt-1 relative">
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
                        className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-400 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Doe"
                      />
                      <UserIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                    Email address *
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-400 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="john@example.com"
                    />
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-900">
                    Phone Number *
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-400 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+1 234 567 8900"
                    />
                    <PhoneIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-900">
                    Password *
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-md placeholder-gray-400 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="••••••••"
                    />
                    <LockClosedIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900">
                    Confirm password *
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-md placeholder-gray-400 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="••••••••"
                    />
                    <LockClosedIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Personal Information */}
            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-900">
                      Date of Birth <span className="text-black font-normal">(Optional)</span>
                    </label>
                    <div className="mt-1 relative">
                      <input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-400 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <CalendarIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-900">
                      Gender <span className="text-black font-normal">(Optional)</span>
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-900">
                    Country *
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="country"
                      name="country"
                      type="text"
                      required
                      value={formData.country}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-400 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="United States"
                    />
                    <GlobeAltIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-900">
                    City <span className="text-black font-normal">(Optional)</span>
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="city"
                      name="city"
                      type="text"
                      value={formData.city}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-400 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="New York"
                    />
                    <MapPinIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Educational & Professional Background */}
            {step === 3 && (
              <>
                <div>
                  <label htmlFor="education" className="block text-sm font-medium text-gray-900">
                    Highest Education Level *
                  </label>
                  <div className="mt-1 relative">
                    <select
                      id="education"
                      name="education"
                      required
                      value={formData.education}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Education Level</option>
                      {educationLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                    <AcademicCapIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label htmlFor="institution" className="block text-sm font-medium text-gray-900">
                    Educational Institution <span className="text-black font-normal">(Optional)</span>
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="institution"
                      name="institution"
                      type="text"
                      value={formData.institution}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-400 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="University/College Name"
                    />
                    <AcademicCapIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label htmlFor="occupation" className="block text-sm font-medium text-gray-900">
                    Current Occupation <span className="text-black font-normal">(Optional)</span>
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="occupation"
                      name="occupation"
                      type="text"
                      value={formData.occupation}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-400 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Software Developer, Student"
                    />
                    <BriefcaseIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-900">
                    Company/Organization <span className="text-black font-normal">(Optional)</span>
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="company"
                      name="company"
                      type="text"
                      value={formData.company}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-400 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Company Name"
                    />
                    <BriefcaseIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>
              </>
            )}


            {/* Navigation Buttons */}
            <div className="flex justify-between">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Previous
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                disabled={isLoading}
                className="ml-auto py-2 px-6 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  step === 3 ? 'Create Account' : 'Next'
                )}
              </button>
            </div>
          </form>

          {step === 1 && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-black">By signing up, you agree to our</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <div className="text-xs text-black">
                  <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                    Privacy Policy
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}