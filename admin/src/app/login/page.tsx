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
  ShieldCheckIcon,
  LockClosedIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserGroupIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import './animations.css';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginErrors {
  email?: string;
  password?: string;
  general?: string;
}

const Page = () => {
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
  const { login, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Destructure for easier access
  const { email, password } = loginData;

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <ShieldCheckIcon className="h-8 w-8 text-indigo-600 animate-pulse" />
            </div>
          </div>
          <p className="text-slate-900 mt-4 text-lg font-bold">Authenticating...</p>
          <p className="text-slate-600 mt-2 text-sm">Please wait while we verify your credentials</p>
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
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await login(email, password);
      router.push('/');
    } catch (error: any) {
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


  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Light Modern Background with Floating Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234b5563' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-20 left-20 w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-3xl animate-float-slower"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-purple-400/8 rounded-full blur-3xl animate-float-slow"></div>
      </div>

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 items-center justify-center p-8 xl:p-12">
        <div className="max-w-lg space-y-6 lg:space-y-8 animate-slide-in-left">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-14 w-14 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30 animate-glow group-hover:scale-110 transition-transform duration-300">
              <AcademicCapIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">CODiiN</h1>
              <p className="text-sm text-indigo-600 font-semibold">Admin Portal</p>
            </div>
          </div>

          {/* Main Heading */}
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold text-slate-900 leading-tight">
            Enterprise Learning
            <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mt-2">Management System</span>
          </h2>

          <p className="text-lg xl:text-xl text-slate-700 leading-relaxed">
            Secure administrative access for managing your organization's educational content and user base.
          </p>

          {/* Feature highlights */}
          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                <UserGroupIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-0.5 text-sm">User management</h3>
                <p className="text-xs text-slate-600">Comprehensive control over platform users</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-3 sm:p-6 md:p-8 relative z-10">
        <div className="max-w-md w-full space-y-3 sm:space-y-4 animate-slide-in-right">

          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-3 sm:mb-4 animate-fade-in-up">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-xl shadow-indigo-500/30 transform hover:scale-105 transition-transform duration-300">
                <AcademicCapIcon className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">CODiiN</h1>
                <p className="text-xs text-indigo-600 font-semibold">Admin Portal</p>
              </div>
            </div>
          </div>

          {/* Modern Login Card with Glow Effect */}
          <div className="relative group">
            {/* Glow effect on hover */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

          <Card className="relative bg-white shadow-2xl border border-slate-200/50 rounded-2xl overflow-hidden hover-lift">
            {/* Animated gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-gradient-x"></div>

            <CardHeader className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-3 sm:p-4 md:p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 bg-white/10 rounded-full filter blur-3xl opacity-30 animate-pulse-subtle"></div>
              <div className="absolute bottom-0 left-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-full filter blur-2xl opacity-30"></div>
              <div className="relative z-10 flex items-center gap-2 sm:gap-2.5">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
                  <ShieldCheckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl text-white font-extrabold leading-tight">Admin Portal</CardTitle>
                  <CardDescription className="text-blue-100 mt-0 sm:mt-0.5 text-xs font-medium">
                    Sign in to manage your platform
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            {/* Subtle background pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 pointer-events-none"></div>

            <CardContent className="relative p-3 sm:p-4">

              <form className="space-y-2.5 sm:space-y-3" onSubmit={handleSubmit}>
                {/* Error or Block Message */}
                {(errors.general || isBlocked) && (
                  <div className={`${
                    isBlocked
                      ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300'
                      : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300'
                  } border-2 rounded-xl p-2.5 sm:p-3 flex items-start space-x-2 sm:space-x-2.5 shadow-md animate-shake`}>
                    <div className={`p-1 sm:p-1.5 rounded-lg ${isBlocked ? 'bg-orange-100' : 'bg-red-100'}`}>
                      <ExclamationTriangleIcon className={`h-4 w-4 ${isBlocked ? 'text-orange-600' : 'text-red-600'} flex-shrink-0`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-xs sm:text-sm font-bold ${isBlocked ? 'text-orange-900' : 'text-red-900'}`}>
                        {isBlocked ? `Account locked. Wait ${blockTimer}s` : errors.general}
                      </p>
                      {loginAttempts > 0 && !isBlocked && (
                        <p className="text-xs text-red-700 mt-0.5 sm:mt-1 font-semibold">
                          {3 - loginAttempts} attempt{3 - loginAttempts !== 1 ? 's' : ''} remaining
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-xs sm:text-sm font-bold text-slate-700 mb-1 sm:mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="admin@organization.com"
                      value={email}
                      onChange={(e) =>
                        setLoginData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      disabled={isBlocked}
                      error={errors.email}
                      leftIcon={<BuildingOfficeIcon className="h-5 w-5" />}
                      className={`${isBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    {email && !errors.email && (
                      <CheckCircleIcon className="absolute right-2 top-2 sm:right-3 sm:top-2.5 h-4 w-4 text-green-500 z-20" />
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                    <label htmlFor="password" className="block text-xs sm:text-sm font-bold text-slate-700">
                      Password
                    </label>
                    {capsLockActive && (
                      <div className="flex items-center gap-0.5 sm:gap-1 text-amber-600 bg-amber-50 px-1.5 sm:px-2 py-0.5 rounded-md">
                        <ExclamationTriangleIcon className="h-3 w-3" />
                        <span className="text-[10px] sm:text-xs font-medium">Caps</span>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) =>
                        setLoginData((prev) => ({ ...prev, password: e.target.value }))
                      }
                      disabled={isBlocked}
                      error={errors.password}
                      leftIcon={<LockClosedIcon className="h-5 w-5" />}
                      className={`${isBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                </div>

                <div className="pt-1 sm:pt-2">
                  <Button
                    type="submit"
                    size="sm"
                    className={`w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-95 relative overflow-hidden group ${
                      loading || isBlocked ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                    disabled={loading || isBlocked}
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                    <div className="relative flex items-center justify-center space-x-2">
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                          <span>Authenticating...</span>
                        </>
                      ) : isBlocked ? (
                        <>
                          <LockClosedIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span>Locked ({blockTimer}s)</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheckIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span>Sign In</span>
                        </>
                      )}
                    </div>
                  </Button>
                </div>
              </form>

            </CardContent>

            {/* Register as Tutor Link - Outside CardContent */}
            <div className="relative px-3 sm:px-4 pb-3 sm:pb-4 text-center">
              {/* Divider */}
              <div className="relative my-2.5 sm:my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-white text-slate-500 font-medium rounded-full border border-slate-100">New to tutoring?</span>
                </div>
              </div>

              <a
                href="/register-tutor"
                className="relative group w-full bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 hover:from-purple-100 hover:via-blue-100 hover:to-indigo-100 text-blue-700 hover:text-blue-800 border-2 border-blue-200 hover:border-blue-400 font-bold py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg sm:rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2 overflow-hidden text-xs sm:text-sm"
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                <AcademicCapIcon className="h-4 w-4 sm:h-5 sm:w-5 relative z-10" />
                <span className="relative z-10">Register as Tutor</span>
              </a>

              <p className="text-xs text-slate-500 mt-1.5 sm:mt-2">
                Join our community of expert educators
              </p>
            </div>
          </Card>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Page;