'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';

interface ForgotPasswordState {
  step: 'email' | 'otp' | 'reset';
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<ForgotPasswordState>({
    step: 'email',
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!state.email) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      const response = await api.auth.forgotPassword({ email: state.email });

      if (response.success) {
        toast.success('Password reset code sent to your email!');
        setState(prev => ({ ...prev, step: 'otp' }));
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!state.otp) {
      toast.error('Please enter the OTP code');
      return;
    }

    try {
      setLoading(true);
      const response = await api.auth.verifyForgotPasswordOtp({
        email: state.email,
        otp: state.otp
      });

      if (response.success) {
        toast.success('OTP verified! You can now reset your password.');
        setState(prev => ({ ...prev, step: 'reset' }));
      }
    } catch (error: any) {
      toast.error(error.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!state.newPassword || !state.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (state.newPassword !== state.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (state.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      const response = await api.auth.resetPassword({
        email: state.email,
        otp: state.otp,
        newPassword: state.newPassword
      });

      if (response.success) {
        toast.success('Password reset successfully! You can now login.');
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const renderEmailStep = () => (
    <form onSubmit={handleSendOtp} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={state.email}
            onChange={(e) => setState(prev => ({ ...prev, email: e.target.value }))}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter your email address"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Send Reset Code'}
        </button>
      </div>
    </form>
  );

  const renderOtpStep = () => (
    <form onSubmit={handleVerifyOtp} className="space-y-6">
      <div>
        <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
          Enter the 6-digit code sent to your email
        </label>
        <div className="mt-1">
          <input
            id="otp"
            name="otp"
            type="text"
            required
            maxLength={6}
            value={state.otp}
            onChange={(e) => setState(prev => ({ ...prev, otp: e.target.value }))}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-center text-lg tracking-wider"
            placeholder="000000"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Check your email ({state.email}) for the verification code
        </p>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying...' : 'Verify Code'}
        </button>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setState(prev => ({ ...prev, step: 'email', otp: '' }))}
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          Back to email
        </button>
      </div>
    </form>
  );

  const renderResetStep = () => (
    <form onSubmit={handleResetPassword} className="space-y-6">
      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
          New Password
        </label>
        <div className="mt-1">
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            value={state.newPassword}
            onChange={(e) => setState(prev => ({ ...prev, newPassword: e.target.value }))}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter new password"
          />
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm New Password
        </label>
        <div className="mt-1">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            value={state.confirmPassword}
            onChange={(e) => setState(prev => ({ ...prev, confirmPassword: e.target.value }))}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Confirm new password"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </div>
    </form>
  );

  const getStepTitle = () => {
    switch (state.step) {
      case 'email':
        return 'Reset your password';
      case 'otp':
        return 'Verify your email';
      case 'reset':
        return 'Set new password';
      default:
        return 'Reset your password';
    }
  };

  const getStepDescription = () => {
    switch (state.step) {
      case 'email':
        return 'Enter your email address and we\'ll send you a code to reset your password.';
      case 'otp':
        return 'Enter the verification code we sent to your email address.';
      case 'reset':
        return 'Choose a new password for your account.';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {getStepTitle()}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {getStepDescription()}
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                state.step === 'email' ? 'bg-indigo-600 text-white' :
                ['otp', 'reset'].includes(state.step) ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <div className={`w-8 h-1 ${
                ['otp', 'reset'].includes(state.step) ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                state.step === 'otp' ? 'bg-indigo-600 text-white' :
                state.step === 'reset' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <div className={`w-8 h-1 ${
                state.step === 'reset' ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                state.step === 'reset' ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                3
              </div>
            </div>
          </div>

          {/* Step content */}
          {state.step === 'email' && renderEmailStep()}
          {state.step === 'otp' && renderOtpStep()}
          {state.step === 'reset' && renderResetStep()}
        </div>

        <div className="text-center">
          <Link href="/login" className="text-sm text-indigo-600 hover:text-indigo-500">
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}