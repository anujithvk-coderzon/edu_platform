'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import toast from 'react-hot-toast';
import { ADMIN_API_URL } from '../../config/env';

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

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Sending OTP to:', formData.email);
      console.log('API URL:', `${ADMIN_API_URL}/auth/tutor/verify-email`);

      const response = await fetch(`${ADMIN_API_URL}/auth/tutor/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        toast.success('Verification code sent to your email!');
        setStep(2);
      } else {
        toast.error(data.error?.message || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
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

      if (data.success) {
        toast.success('Email verified successfully!');
        setStep(3);
      } else {
        toast.error(data.error?.message || 'Invalid or expired OTP');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
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

      if (data.success) {
        toast.success('Tutor registration request submitted successfully! Your account will be activated by an admin.');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        toast.error(data.error?.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            🎓 Tutor Registration
          </h1>
          <p className="text-slate-600 text-sm">
            {step === 1 && 'Enter your details to get started'}
            {step === 2 && 'Enter the verification code sent to your email'}
            {step === 3 && 'Set your password'}
          </p>
        </div>

        {/* Step 1: Basic Info + Email */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  First Name
                </label>
                <Input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Last Name
                </label>
                <Input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@example.com"
                className="w-full"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Sending...' : 'Send Verification Code'}
            </Button>

            <div className="text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:underline">
                Login here
              </Link>
            </div>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Verification Code
              </label>
              <Input
                type="text"
                required
                maxLength={6}
                value={formData.otp}
                onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                placeholder="Enter 6-digit code"
                className="w-full text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-slate-500 mt-2">
                Check your email for the verification code
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Verifying...' : 'Verify Email'}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="w-full"
            >
              Back
            </Button>
          </form>
        )}

        {/* Step 3: Set Password */}
        {step === 3 && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Welcome, {formData.firstName}!</strong>
                <br />
                Create a password to complete your registration.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <Input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimum 6 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirm Password
              </label>
              <Input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Re-enter your password"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> Your account will be reviewed by an admin. You'll receive a welcome email once your account is activated.
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Submitting...' : 'Complete Registration'}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(2)}
              className="w-full"
            >
              Back
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
