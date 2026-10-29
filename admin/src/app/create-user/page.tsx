'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';
import {
  UserPlusIcon,
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  KeyIcon,
  UserIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface CreateUserFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'Admin' | 'Tutor';
}

export default function CreateUserPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateUserFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'Tutor'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.auth.register(formData);

      if (response.success) {
        setSuccess(`${formData.role} account created successfully!`);
        // Reset form
        setFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          role: 'Tutor'
        });
      } else {
        setError(response.error?.message || 'Failed to create user account');
      }
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
      console.error('Create user error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA]">
      {/* Hero Header with Gradient */}
      <div className="bg-[#1D4ED8] pt-8 pb-32 sm:pb-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center ring-2 ring-white/30">
              <UserPlusIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Create User Account</h1>
              <p className="text-[#DBE7FE] text-sm sm:text-base mt-1">Add new admin or tutor to the platform</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 sm:-mt-32 pb-12">

        {/* Success Alert */}
        {success && (
          <div className="mb-6 bg-[#ECFDF3] border-l-4 border-[#47CD89] p-4 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-[#47CD89] mt-0.5 flex-shrink-0" />
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-[#05603A]">{success}</p>
              </div>
              <button
                onClick={() => setSuccess(null)}
                className="ml-3 text-[#17B26A] hover:text-[#079455]"
              >
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-[#FEF3F2] border-l-4 border-[#F97066] p-4 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start">
              <XCircleIcon className="h-5 w-5 text-[#F97066] mt-0.5 flex-shrink-0" />
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-[#912018]">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-3 text-[#F04438] hover:text-[#B42318]"
              >
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-[#DDE3EA] overflow-hidden">
            <div className="bg-[#EFF4FF] px-6 py-4 border-b border-[#DDE3EA]">
              <h3 className="text-lg font-semibold text-[#0F172A] flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5 text-[#1D4ED8]" />
                User Role
              </h3>
              <p className="text-sm text-[#475569] mt-1">Select the role for this account</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    formData.role === 'Tutor'
                      ? 'border-[#1D4ED8] bg-[#EFF4FF] shadow-md'
                      : 'border-[#DDE3EA] hover:border-[#A4BCFC] hover:bg-[#F6F8FA]'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="Tutor"
                    checked={formData.role === 'Tutor'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      formData.role === 'Tutor' ? 'bg-[#1D4ED8]' : 'bg-[#DDE3EA]'
                    }`}>
                      <UserIcon className={`h-5 w-5 ${formData.role === 'Tutor' ? 'text-white' : 'text-[#475569]'}`} />
                    </div>
                    <div>
                      <p className={`font-semibold ${formData.role === 'Tutor' ? 'text-[#1E3A8A]' : 'text-[#0F172A]'}`}>
                        Tutor
                      </p>
                      <p className="text-xs text-[#475569]">Content creator</p>
                    </div>
                  </div>
                  {formData.role === 'Tutor' && (
                    <CheckCircleIcon className="absolute top-3 right-3 h-5 w-5 text-[#1D4ED8]" />
                  )}
                </label>

                <label
                  className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    formData.role === 'Admin'
                      ? 'border-[#1D4ED8] bg-[#EFF4FF] shadow-md'
                      : 'border-[#DDE3EA] hover:border-[#A4BCFC] hover:bg-[#F6F8FA]'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="Admin"
                    checked={formData.role === 'Admin'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      formData.role === 'Admin' ? 'bg-[#1D4ED8]' : 'bg-[#DDE3EA]'
                    }`}>
                      <ShieldCheckIcon className={`h-5 w-5 ${formData.role === 'Admin' ? 'text-white' : 'text-[#475569]'}`} />
                    </div>
                    <div>
                      <p className={`font-semibold ${formData.role === 'Admin' ? 'text-[#1E3A8A]' : 'text-[#0F172A]'}`}>
                        Admin
                      </p>
                      <p className="text-xs text-[#475569]">Full access</p>
                    </div>
                  </div>
                  {formData.role === 'Admin' && (
                    <CheckCircleIcon className="absolute top-3 right-3 h-5 w-5 text-[#1D4ED8]" />
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Personal Information Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-[#DDE3EA] overflow-hidden">
            <div className="bg-[#F6F8FA] px-6 py-4 border-b border-[#DDE3EA]">
              <h3 className="text-lg font-semibold text-[#0F172A] flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-[#475569]" />
                Personal Information
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-[#334155] mb-2">
                    First Name <span className="text-[#F04438]">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-[#C7D2DE] rounded-xl text-[#0F172A] focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8] outline-none transition-all"
                    placeholder="Enter first name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-[#334155] mb-2">
                    Last Name <span className="text-[#F04438]">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-[#C7D2DE] rounded-xl text-[#0F172A] focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8] outline-none transition-all"
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Account Credentials Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-[#DDE3EA] overflow-hidden">
            <div className="bg-[#EFF4FF] px-6 py-4 border-b border-[#DDE3EA]">
              <h3 className="text-lg font-semibold text-[#0F172A] flex items-center gap-2">
                <KeyIcon className="h-5 w-5 text-[#1D4ED8]" />
                Account Credentials
              </h3>
              <p className="text-sm text-[#475569] mt-1">Login details for the new account</p>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#334155] mb-2">
                  Email Address <span className="text-[#F04438]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-[#94A3B8]" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-4 py-3 border border-[#C7D2DE] rounded-xl text-[#0F172A] focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8] outline-none transition-all"
                    placeholder="user@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#334155] mb-2">
                  Password <span className="text-[#F04438]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-[#94A3B8]" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-12 py-3 border border-[#C7D2DE] rounded-xl text-[#0F172A] focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8] outline-none transition-all"
                    placeholder="Enter password (min. 6 characters)"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#94A3B8] hover:text-[#475569] transition-colors"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <div className="mt-3 bg-[#EFF4FF] border border-[#C7D7FE] rounded-xl p-3">
                  <p className="text-xs font-semibold text-[#1E3A8A] mb-1">Password Requirements:</p>
                  <ul className="space-y-1 text-xs text-[#1E40AF]">
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="h-3.5 w-3.5 text-[#1D4ED8]" />
                      Minimum 6 characters
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="h-3.5 w-3.5 text-[#1D4ED8]" />
                      Use a strong, unique password
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#1D4ED8] hover:from-[#1E40AF] hover:to-[#1E40AF] text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating Account...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <UserPlusIcon className="h-5 w-5" />
                  <span>Create {formData.role} Account</span>
                </div>
              )}
            </Button>
            <Button
              type="button"
              onClick={() => router.push('/')}
              className="sm:w-auto px-8 bg-white border-2 border-[#C7D2DE] text-[#334155] hover:bg-[#F6F8FA] py-3 rounded-xl font-semibold transition-all"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
