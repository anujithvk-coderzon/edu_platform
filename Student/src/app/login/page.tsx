'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import {
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import './animations.css';
import { handleGoogleLogin } from '@/Oauth/google';
import { handleGithubLogin } from '@/Oauth/github';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const [loginData, setLoginData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimer, setBlockTimer] = useState(0);
  const { login, loading, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();

  // Destructure for easier access
  const { email, password } = loginData;

  // Check for session expired query parameter
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('session_expired') === 'true') {
      toast.error('Your session has expired. You have been logged in from another device.', {
        duration: 5000,
        icon: '🔒'
      });
      // Clear the query parameter
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // Handle block timer countdown
  useEffect(() => {
    if (blockTimer > 0) {
      const timer = setTimeout(() => setBlockTimer(blockTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (blockTimer === 0 && isBlocked) {
      setIsBlocked(false);
      setLoginAttempts(0);
    }
  }, [blockTimer, isBlocked]);

  // Detect caps lock
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.getModifierState) {
        setCapsLockActive(e.getModifierState('CapsLock'));
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('keyup', handleKeyPress);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('keyup', handleKeyPress);
    };
  }, []);

  // Don't render login form if already authenticated
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <LockClosedIcon className="h-8 w-8 text-blue-600 animate-pulse" />
            </div>
          </div>
          <p className="text-gray-900 mt-4 text-lg font-medium">Authenticating...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if account is temporarily blocked
    if (isBlocked) {
      toast.error(`Too many failed attempts. Please wait ${blockTimer} seconds.`);
      return;
    }

    // Clear previous errors
    setErrors({});

    // Enhanced validation
    const newErrors: LoginErrors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await login(email, password);
      toast.success('Login successful! Redirecting...');
      router.push('/');
    } catch (error:any) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      // Block after 3 failed attempts
      if (newAttempts >= 3) {
        setIsBlocked(true);
        setBlockTimer(30); // 30 seconds block
        setErrors({ general: 'Too many failed attempts. Account temporarily locked.' });
        toast.error('Too many failed attempts. Please wait 30 seconds.');
      } else {
        const errorMessage = error.message || 'Invalid credentials. Please try again.';
        setErrors({ general: errorMessage });
        toast.error(`Login failed. ${3 - newAttempts} attempts remaining.`);
      }
    }
  };

  const onGoogleLoginClick = async () => {
    try {
      const result = await handleGoogleLogin();

      if (result.success && result.data) {
        console.log('Google Login Data:', result.data);

        // Attempt OAuth login with backend
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
          toast.success('Welcome back!');
          await refreshUser();
          router.push('/');
        } else {
          // Check for specific error messages
          const errorMessage = loginData.error?.message || 'Login failed';

          // Check if account is blocked
          if (errorMessage.toLowerCase().includes('blocked')) {
            toast.error(errorMessage, { duration: 6000 });
          } else if (loginResponse.status === 404) {
            // Account doesn't exist, redirect to registration
            toast.error('Account not found. Please register first.');
            router.push('/register');
          } else {
            // Other errors
            toast.error(errorMessage);
          }
        }
      } else {
        console.error('Google OAuth Error:', result.error);
        toast.error(result.error || 'Failed to sign in with Google');
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Failed to sign in with Google. Please try again.');
    }
  };

  const onGithubLoginClick = async () => {
    try {
      const result = await handleGithubLogin();

      if (result.success && result.data) {
        console.log('GitHub Login Data:', result.data);

        // Attempt OAuth login with backend
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
          toast.success('Welcome back!');
          await refreshUser();
          router.push('/');
        } else {
          // Check for specific error messages
          const errorMessage = loginData.error?.message || 'Login failed';

          // Check if account is blocked
          if (errorMessage.toLowerCase().includes('blocked')) {
            toast.error(errorMessage, { duration: 6000 });
          } else if (loginResponse.status === 404) {
            // Account doesn't exist, redirect to registration
            toast.error('Account not found. Please register first.');
            router.push('/register');
          } else {
            // Other errors
            toast.error(errorMessage);
          }
        }
      } else {
        console.error('GitHub OAuth Error:', result.error);
        toast.error(result.error || 'Failed to sign in with GitHub');
      }
    } catch (error) {
      console.error('GitHub login error:', error);
      toast.error('Failed to sign in with GitHub. Please try again.');
    }
  };


  return (
    <div className="h-[calc(100vh-4rem)] sm:h-[calc(100vh-4.5rem)] md:h-[calc(100vh-5rem)] lg:h-[calc(100vh-6rem)] flex items-center justify-center relative bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>

      {/* Floating Gradient Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-float-slow"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-float-slower"></div>

      {/* Main Container */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 h-full flex items-center">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full">

          {/* Left Side - Branding */}
          <div className="hidden lg:block space-y-8 animate-fade-in-left">
            {/* Logo & Brand */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl blur-lg opacity-50"></div>
                  <div className="relative h-16 w-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <BookOpenIcon className="h-9 w-9 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">CODiiN</h1>
                  <p className="text-sm text-gray-600 font-medium">Learning Platform</p>
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
                  Welcome back to
                  <span className="block mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    your learning journey
                  </span>
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Access your courses, track your progress, and continue building your skills in programming and technology.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full flex items-center justify-center animate-fade-in-right">
            <div className="w-full max-w-md">

              {/* Mobile Logo */}
              <div className="lg:hidden text-center mb-3 sm:mb-4">
                <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-1 sm:mb-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg sm:rounded-xl blur-md sm:blur-lg opacity-40"></div>
                    <div className="relative h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                      <BookOpenIcon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </div>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">CODiiN</h1>
                </div>
              </div>

              {/* Login Card */}
              <Card className="relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 backdrop-blur-2xl shadow-[0_20px_70px_rgba(59,130,246,0.3),0_0_0_1px_rgba(255,255,255,0.8)] border-0 rounded-2xl sm:rounded-[2rem] overflow-hidden">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 via-indigo-400/5 to-purple-400/5 animate-pulse-subtle"></div>

                {/* Top accent with animated gradient */}
                <div className="absolute top-0 left-0 right-0 h-1 sm:h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-gradient-x"></div>

                {/* Decorative corner elements - hidden on mobile */}
                <div className="hidden sm:block absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-[5rem] blur-2xl"></div>
                <div className="hidden sm:block absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-tr-[5rem] blur-2xl"></div>

                <CardHeader className="px-3 sm:px-5 md:px-6 pt-3 sm:pt-4 pb-2 sm:pb-3 space-y-0.5 relative">
                  <CardTitle className="text-lg sm:text-xl md:text-2xl font-semibold bg-gradient-to-r from-gray-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent leading-tight">
                    Welcome back! 👋
                  </CardTitle>
                  <CardDescription className="text-[11px] sm:text-xs md:text-sm text-gray-600 font-normal leading-snug sm:leading-relaxed">
                    Sign in to access your <span className="text-blue-600 font-medium">personalized</span> learning dashboard
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-3 sm:px-5 md:px-6 pb-3 sm:pb-4 md:pb-5 relative">
                  <form className="space-y-2.5 sm:space-y-3 md:space-y-3.5" onSubmit={handleSubmit}>

                    {/* Error or Block Message */}
                    {(errors.general || isBlocked) && (
                      <div className={`relative ${
                        isBlocked ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-l-3 sm:border-l-4 border-amber-500' : 'bg-gradient-to-r from-red-50 to-rose-50 border-l-3 sm:border-l-4 border-red-500'
                      } rounded-lg p-1.5 sm:p-2 md:p-2.5 flex items-start space-x-1.5 sm:space-x-2 animate-shake shadow-sm`}>
                        <div className={`${isBlocked ? 'bg-amber-500' : 'bg-red-500'} rounded-full p-0.5 sm:p-1 mt-0.5`}>
                          <ExclamationTriangleIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white flex-shrink-0" />
                        </div>
                        <div className="flex-1">
                          <p className={`text-[10px] sm:text-xs font-semibold ${
                            isBlocked ? 'text-amber-900' : 'text-red-900'
                          }`}>
                            {isBlocked ? `Account temporarily locked. Please wait ${blockTimer} seconds.` : errors.general}
                          </p>
                          {loginAttempts > 0 && !isBlocked && (
                            <p className="text-[10px] sm:text-xs text-red-700 mt-0.5 font-medium">
                              {3 - loginAttempts} attempt{3 - loginAttempts !== 1 ? 's' : ''} remaining
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Email Field */}
                    <div className="space-y-0.5 sm:space-y-1">
                      <label htmlFor="email" className="text-xs sm:text-sm font-medium text-gray-700">
                        Email address
                      </label>
                      <div className="relative group">
                        {/* Glow effect on focus - hidden on mobile for performance */}
                        <div className="hidden sm:block absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl opacity-0 group-focus-within:opacity-20 blur transition duration-300"></div>

                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-2 sm:pl-2.5 md:pl-4 flex items-center pointer-events-none">
                            <div className="relative">
                              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                              </svg>
                            </div>
                          </div>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) =>
                              setLoginData((prev) => ({ ...prev, email: e.target.value }))
                            }
                            disabled={isBlocked}
                            error={errors.email}
                            className={`w-full h-9 sm:h-10 md:h-11 bg-white border-2 ${
                              errors.email ? 'border-red-400 focus:border-red-500 focus:ring-2 sm:focus:ring-4 focus:ring-red-100 shadow-red-100' :
                              email && !errors.email ? 'border-green-400 focus:border-green-500 focus:ring-2 sm:focus:ring-4 focus:ring-green-100 shadow-green-100 bg-green-50/20' :
                              'border-gray-200 focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 shadow-blue-50'
                            } rounded-lg sm:rounded-xl pl-8 sm:pl-9 md:pl-12 pr-8 sm:pr-9 md:pr-12 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-all duration-300 font-medium shadow-sm sm:shadow-md hover:shadow-md sm:hover:shadow-lg ${
                              isBlocked ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:border-blue-300'
                            }`}
                          />
                          {email && !errors.email && (
                            <div className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full p-0.5 sm:p-1 shadow-md sm:shadow-lg shadow-green-200 animate-in fade-in zoom-in duration-300">
                                <CheckCircleIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {errors.email && (
                        <p className="text-[10px] sm:text-xs text-red-600 flex items-center space-x-1 sm:space-x-1.5 font-semibold animate-in slide-in-from-left duration-200">
                          <ExclamationTriangleIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          <span>{errors.email}</span>
                        </p>
                      )}
                    </div>

                    {/* Password Field */}
                    <div className="space-y-0.5 sm:space-y-1">
                      <div className="flex items-center justify-between">
                        <label htmlFor="password" className="text-xs sm:text-sm font-medium text-gray-700">
                          Password
                        </label>
                        {capsLockActive && (
                          <div className="flex items-center space-x-0.5 sm:space-x-1 text-amber-800 bg-gradient-to-r from-amber-100 to-orange-100 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-amber-300 sm:border-2 shadow-sm sm:shadow-md animate-pulse">
                            <ExclamationTriangleIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            <span className="text-[8px] sm:text-[10px] font-bold uppercase">Caps</span>
                          </div>
                        )}
                      </div>
                      <div className="relative group">
                        {/* Glow effect on focus - hidden on mobile for performance */}
                        <div className="hidden sm:block absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-0 group-focus-within:opacity-20 blur transition duration-300"></div>

                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-2 sm:pl-2.5 md:pl-4 flex items-center pointer-events-none">
                            <div className="relative">
                              <LockClosedIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-300" />
                              <div className="hidden sm:block absolute -inset-1 bg-blue-500/20 rounded-full opacity-0 group-focus-within:opacity-100 blur-sm transition duration-300"></div>
                            </div>
                          </div>
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) =>
                              setLoginData((prev) => ({ ...prev, password: e.target.value }))
                            }
                            disabled={isBlocked}
                            error={errors.password}
                            className={`w-full h-9 sm:h-10 md:h-11 bg-white border-2 ${
                              errors.password ? 'border-red-400 focus:border-red-500 focus:ring-2 sm:focus:ring-4 focus:ring-red-100' :
                              'border-gray-200 focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100'
                            } rounded-lg sm:rounded-xl pl-8 sm:pl-9 md:pl-12 pr-9 sm:pr-10 md:pr-14 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-all duration-300 font-medium shadow-sm sm:shadow-md hover:shadow-md sm:hover:shadow-lg ${
                              isBlocked ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:border-blue-300'
                            }`}
                          />
                          <button
                            type="button"
                            className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-all duration-300 focus:outline-none p-1 sm:p-1.5 rounded-lg hover:bg-blue-50 active:scale-95"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeSlashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            ) : (
                              <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                      {errors.password && (
                        <p className="text-[10px] sm:text-xs text-red-600 flex items-center space-x-1 sm:space-x-1.5 font-semibold animate-in slide-in-from-left duration-200">
                          <ExclamationTriangleIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          <span>{errors.password}</span>
                        </p>
                      )}
                    </div>

                    {/* Forgot Password Link */}
                    <div className="flex items-center justify-end -mt-0.5">
                      <Link
                        href="/forgot-password"
                        className="text-[11px] sm:text-xs md:text-sm font-semibold text-blue-600 hover:text-blue-700 transition-all duration-200 relative group"
                      >
                        <span>Forgot password?</span>
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-200"></span>
                      </Link>
                    </div>

                    {/* Sign In Button */}
                    <Button
                      type="submit"
                      className={`relative w-full h-9 sm:h-10 md:h-11 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg sm:rounded-xl shadow-[0_4px_16px_rgba(59,130,246,0.3),0_0_0_1px_rgba(255,255,255,0.1)_inset] sm:shadow-[0_6px_20px_rgba(59,130,246,0.4),0_0_0_1px_rgba(255,255,255,0.1)_inset] hover:shadow-[0_8px_24px_rgba(99,102,241,0.4),0_0_0_1px_rgba(255,255,255,0.2)_inset] sm:hover:shadow-[0_10px_28px_rgba(99,102,241,0.5),0_0_0_1px_rgba(255,255,255,0.2)_inset] transition-all duration-300 flex items-center justify-center space-x-1.5 sm:space-x-2 text-[11px] sm:text-xs md:text-sm overflow-hidden group ${
                        loading || isBlocked ? 'opacity-75 cursor-not-allowed' : 'hover:scale-[1.02] sm:hover:scale-[1.03] active:scale-[0.97] sm:hover:-translate-y-0.5'
                      }`}
                      disabled={loading || isBlocked}
                    >
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                      {/* Glow effect - hidden on mobile */}
                      <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300"></div>

                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent relative"></div>
                          <span className="relative font-medium">Signing in...</span>
                        </>
                      ) : isBlocked ? (
                        <>
                          <LockClosedIcon className="h-4 w-4 sm:h-5 sm:w-5 relative" />
                          <span className="relative font-medium">Locked ({blockTimer}s)</span>
                        </>
                      ) : (
                        <>
                          <span className="relative font-medium tracking-wide">Sign in to your account</span>
                          <svg className="h-4 w-4 sm:h-5 sm:w-5 relative group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </>
                      )}
                    </Button>

                    {/* OAuth Divider */}
                    <div className="relative my-2 sm:my-3 md:my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-100 sm:border-t-2"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 sm:px-3 bg-white text-gray-400 font-semibold text-[9px] sm:text-[10px] md:text-xs uppercase tracking-wider">Or continue with</span>
                      </div>
                    </div>

                    {/* OAuth Buttons */}
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-3">
                      {/* Google */}
                      <button
                        type="button"
                        onClick={onGoogleLoginClick}
                        disabled={isBlocked || loading}
                        className={`group relative flex items-center justify-center h-8 sm:h-9 md:h-11 px-2 sm:px-3 md:px-4 border border-gray-200 sm:border-2 rounded-lg sm:rounded-xl bg-white hover:border-blue-400 transition-all duration-300 overflow-hidden shadow-sm sm:shadow-md hover:shadow-lg sm:hover:shadow-xl ${
                          isBlocked || loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] sm:hover:scale-[1.03] active:scale-[0.97]'
                        }`}
                      >
                        {/* Animated gradient background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

                        <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 relative group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span className="ml-1 sm:ml-1.5 md:ml-2.5 text-[10px] sm:text-[11px] md:text-sm font-medium text-gray-700 relative">Google</span>
                      </button>

                      {/* GitHub */}
                      <button
                        type="button"
                        onClick={onGithubLoginClick}
                        disabled={isBlocked || loading}
                        className={`group relative flex items-center justify-center h-8 sm:h-9 md:h-11 px-2 sm:px-3 md:px-4 border border-gray-200 sm:border-2 rounded-lg sm:rounded-xl bg-white hover:border-gray-400 transition-all duration-300 overflow-hidden shadow-sm sm:shadow-md hover:shadow-lg sm:hover:shadow-xl ${
                          isBlocked || loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] sm:hover:scale-[1.03] active:scale-[0.97]'
                        }`}
                      >
                        {/* Animated gradient background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

                        <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-900 relative group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
                        </svg>
                        <span className="ml-1 sm:ml-1.5 md:ml-2.5 text-[10px] sm:text-[11px] md:text-sm font-medium text-gray-700 relative">GitHub</span>
                      </button>
                    </div>

                    {/* Sign Up Link */}
                    <div className="pt-2 sm:pt-3 md:pt-4 mt-1 border-t border-gray-100">
                      <p className="text-center text-[11px] sm:text-xs md:text-sm text-gray-600 font-normal">
                        Don&apos;t have an account?{' '}
                        <Link href="/register" className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 relative group inline-block">
                          <span>Create account</span>
                          <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                        </Link>
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}