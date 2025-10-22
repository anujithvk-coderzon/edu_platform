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
              <BookOpenIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Codiin</h1>
          </div>

          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight">
            Learn. Code.
            <span className="block text-blue-400">Excel Together.</span>
          </h2>

          <p className="text-lg xl:text-xl text-blue-200">
            Join thousands of learners on their journey to master programming and technology skills.
          </p>

        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 relative z-10">
        <div className="max-w-md w-full space-y-3 sm:space-y-4 md:space-y-6 animate-slide-in-right">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-2 sm:mb-3 md:mb-4">
            <div className="flex items-center justify-center space-x-2 mb-1.5 sm:mb-2">
              <div className="h-9 w-9 sm:h-10 sm:w-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-xl">
                <BookOpenIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Codiin</h1>
            </div>
            <p className="text-blue-200 text-xs sm:text-sm">Codiin Learning Platform</p>
          </div>

          {/* Login Form */}
          <Card className="bg-white/95 backdrop-blur-xl shadow-2xl border-0 rounded-xl sm:rounded-2xl overflow-hidden hover-lift">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 p-2.5 sm:p-3 md:p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 bg-blue-500 rounded-full filter blur-3xl opacity-20"></div>
              <div className="relative z-10">
                <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl text-white font-bold">Welcome Back</CardTitle>
                <CardDescription className="text-blue-100 mt-1 text-xs sm:text-sm">
                  Sign in to continue your learning journey
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-2.5 sm:p-3 md:p-5">
              <form className="space-y-2.5 sm:space-y-3 md:space-y-4" onSubmit={handleSubmit}>
                {/* Error or Block Message */}
                {(errors.general || isBlocked) && (
                  <div className={`${isBlocked ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'} border rounded-lg p-2 sm:p-2.5 md:p-3 flex items-start space-x-2`}>
                    <ExclamationTriangleIcon className={`h-4 w-4 ${isBlocked ? 'text-orange-600' : 'text-red-600'} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <p className={`text-xs sm:text-sm font-medium ${isBlocked ? 'text-orange-800' : 'text-red-800'}`}>
                        {isBlocked ? `Account temporarily locked. Please wait ${blockTimer} seconds.` : errors.general}
                      </p>
                      {loginAttempts > 0 && !isBlocked && (
                        <p className="text-xs text-red-600 mt-0.5 sm:mt-1">
                          {3 - loginAttempts} attempt{3 - loginAttempts !== 1 ? 's' : ''} remaining
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1 sm:mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="student@example.com"
                      value={email}
                      onChange={(e) =>
                        setLoginData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      disabled={isBlocked}
                      error={errors.email}
                      className={`w-full bg-gray-50 border-gray-300 rounded-lg px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${isBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    {email && !errors.email && (
                      <CheckCircleIcon className="absolute right-2.5 top-2 sm:top-2.5 h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                    <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-gray-800">
                      Password
                    </label>
                    {capsLockActive && (
                      <div className="flex items-center space-x-1 text-amber-600">
                        <ExclamationTriangleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="text-xs font-medium">Caps Lock</span>
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
                      className={`w-full bg-gray-50 border-gray-300 rounded-lg px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 pr-9 sm:pr-10 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${isBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
                  <div className="flex items-center justify-end">
                    <div className="text-xs sm:text-sm">
                      <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200">
                        Forgot password?
                      </Link>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className={`w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 sm:py-3 md:py-3.5 px-3 sm:px-4 md:px-6 text-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center space-x-2 ${
                      loading || isBlocked ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                    disabled={loading || isBlocked}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span className="text-sm">Authenticating...</span>
                      </>
                    ) : isBlocked ? (
                      <>
                        <LockClosedIcon className="h-4 w-4" />
                        <span className="text-sm">Account Locked ({blockTimer}s)</span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm">Sign In</span>
                        <LockClosedIcon className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>

                {/* OAuth Divider */}
                <div className="relative my-3 sm:my-4 md:my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs sm:text-sm">
                    <span className="px-3 sm:px-4 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                {/* OAuth Buttons */}
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5 md:gap-3">
                  {/* Google Sign In */}
                  <button
                    type="button"
                    onClick={onGoogleLoginClick}
                    disabled={isBlocked || loading}
                    className={`flex items-center justify-center px-2 sm:px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 transition-all duration-200 ${
                      isBlocked || loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
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
                    <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm font-medium text-gray-700">Google</span>
                  </button>

                  {/* GitHub Sign In */}
                  <button
                    type="button"
                    onClick={onGithubLoginClick}
                    disabled={isBlocked || loading}
                    className={`flex items-center justify-center px-2 sm:px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 transition-all duration-200 ${
                      isBlocked || loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
                    }`}
                  >
                    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm font-medium text-gray-700">GitHub</span>
                  </button>
                </div>

                {/* Sign Up Link */}
                <div className="pt-3 sm:pt-4 md:pt-5 border-t border-gray-100 mt-3 sm:mt-4 md:mt-5">
                  <p className="text-center text-xs sm:text-sm text-gray-600">
                    Don&apos;t have an account?{' '}
                    <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200">
                      Sign up for free
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}