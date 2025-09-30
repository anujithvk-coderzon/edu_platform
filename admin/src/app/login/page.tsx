'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-500 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <ShieldCheckIcon className="h-8 w-8 text-blue-400 animate-pulse" />
            </div>
          </div>
          <p className="text-blue-200 mt-4 text-lg font-medium">Authenticating...</p>
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
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234b5563' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl opacity-10 animate-float"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-10 animate-float" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 items-center justify-center p-8 xl:p-12">
        <div className="max-w-lg text-center lg:text-left space-y-6 lg:space-y-8 animate-slide-in-left">
          <div className="flex items-center justify-center lg:justify-start space-x-3">
            <div className="h-14 w-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl animate-glow">
              <AcademicCapIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">EduPlatform</h1>
          </div>

          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight">
            Enterprise Learning
            <span className="block text-blue-400">Management System</span>
          </h2>

          <p className="text-lg xl:text-xl text-blue-200">
            Secure administrative access for managing your organization's educational content and user base.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 relative z-10">
        <div className="max-w-md w-full space-y-4 sm:space-y-6 animate-slide-in-right">

          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-4 sm:mb-6">
            <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-xl">
                <AcademicCapIcon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">EduPlatform</h1>
            </div>
            <p className="text-blue-200 text-sm sm:text-base">Administrative Portal</p>
          </div>

          {/* Login Form */}
          <Card className="bg-white/95 backdrop-blur-xl shadow-2xl border-0 rounded-2xl overflow-hidden hover-lift">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 bg-blue-500 rounded-full filter blur-3xl opacity-20"></div>
              <div className="relative z-10">
                <CardTitle className="text-xl sm:text-2xl md:text-3xl text-white font-bold">Welcome Back</CardTitle>
                <CardDescription className="text-blue-100 mt-1 sm:mt-2 text-sm sm:text-base">
                  Sign in to manage your educational platform
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 md:p-8">

              <form className="space-y-4 sm:space-y-5 md:space-y-6" onSubmit={handleSubmit}>
                {/* Error or Block Message */}
                {(errors.general || isBlocked) && (
                  <div className={`${isBlocked ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'} border rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-start space-x-2 sm:space-x-3`}>
                    <ExclamationTriangleIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${isBlocked ? 'text-orange-600' : 'text-red-600'} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <p className={`text-xs sm:text-sm font-medium ${isBlocked ? 'text-orange-800' : 'text-red-800'}`}>
                        {isBlocked ? `Account temporarily locked. Please wait ${blockTimer} seconds.` : errors.general}
                      </p>
                      {loginAttempts > 0 && !isBlocked && (
                        <p className="text-xs text-red-600 mt-1">
                          {3 - loginAttempts} attempt{3 - loginAttempts !== 1 ? 's' : ''} remaining
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2">
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
                      className={`w-full bg-gray-50 border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${isBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    {email && !errors.email && (
                      <CheckCircleIcon className="absolute right-3 top-2.5 sm:top-3 md:top-3.5 h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-800">
                      Password
                    </label>
                    {capsLockActive && (
                      <div className="flex items-center space-x-1 text-amber-600">
                        <ExclamationTriangleIcon className="h-4 w-4" />
                        <span className="text-xs font-medium">Caps Lock is on</span>
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
                      className={`w-full bg-gray-50 border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 pr-10 sm:pr-12 text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${isBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
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

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-end">
                  </div>

                  <Button
                    type="submit"
                    className={`w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 sm:py-3.5 md:py-4 px-4 sm:px-6 text-sm sm:text-base rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center space-x-2 ${
                      loading || isBlocked ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                    disabled={loading || isBlocked}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                        <span>Authenticating...</span>
                      </>
                    ) : isBlocked ? (
                      <>
                        <LockClosedIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>Account Locked ({blockTimer}s)</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <LockClosedIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default Page;