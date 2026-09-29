'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { studentStorage } from '@/utils/storage';
import { handleGoogleLogin } from '@/Oauth/google';
import { handleGithubLogin } from '@/Oauth/github';

import { env } from '../../config/env';
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
      <div className="flex min-h-[60vh] items-center justify-center bg-white">
        <p className="text-body text-[#475569]">Signing you in…</p>
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

        // Attempt OAuth login with backend
        const loginResponse = await fetch(`${env.API_BASE_URL}/student/auth/oauth-login`, {
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

        // OAuth bypasses the API client, so capture the token here too —
        // without this, Gmail sign-in still fails on iOS.
        if (loginData?.data?.token) studentStorage.setToken(loginData.data.token);

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
        toast.error(result.error || 'Failed to sign in with Google');
      }
    } catch (error) {
      toast.error('Failed to sign in with Google. Please try again.');
    }
  };

  const onGithubLoginClick = async () => {
    try {
      const result = await handleGithubLogin();

      if (result.success && result.data) {

        // Attempt OAuth login with backend
        const loginResponse = await fetch(`${env.API_BASE_URL}/student/auth/oauth-login`, {
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

        // OAuth bypasses the API client, so capture the token here too —
        // without this, Gmail sign-in still fails on iOS.
        if (loginData?.data?.token) studentStorage.setToken(loginData.data.token);

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
        toast.error(result.error || 'Failed to sign in with GitHub');
      }
    } catch (error) {
      toast.error('Failed to sign in with GitHub. Please try again.');
    }
  };


  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white lg:min-h-[calc(100vh-72px)]">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-20 lg:py-20">
        {/* Left: what signing in gets you. Hidden on small screens where the
            form is the only thing that matters. */}
        <div className="hidden lg:block lg:pt-6">
          <h1 className="font-display text-display text-[#0F172A]">
            Welcome back
          </h1>
          <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-[#475569]">
            Sign in to pick up your courses where you stopped, track what you
            have finished, and keep your progress in one place.
          </p>

          <dl className="mt-10 border-t border-[#DDE3EA]">
            {[
              ['Your progress', 'Every lesson you complete is saved automatically.'],
              ['Your courses', 'Enrolments, materials and assignments in one list.'],
              ['Your certificates', 'Finish a course and your record stays with you.'],
            ].map(([term, detail]) => (
              <div key={term} className="border-b border-[#DDE3EA] py-5">
                <dt className="text-body font-semibold text-[#0F172A]">{term}</dt>
                <dd className="mt-1 text-ui leading-relaxed text-[#475569]">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Right: the form */}
        <div className="w-full max-w-md justify-self-center lg:justify-self-end">
          <div className="lg:hidden">
            <h1 className="text-h2 text-[#0F172A]">
              Welcome back
            </h1>
            <p className="mt-2 text-body text-[#475569]">
              Sign in to continue learning.
            </p>
          </div>

          <div className="mt-6 rounded-[8px] border border-[#DDE3EA] bg-white p-6 sm:p-7 lg:mt-0">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {(errors.general || isBlocked) && (
                <div
                  className={`rounded-[4px] border-l-[3px] px-4 py-3 ${
                    isBlocked
                      ? 'border-l-[#B45309] bg-[#FFFBEB]'
                      : 'border-l-[#B42318] bg-[#FEF3F2]'
                  }`}
                >
                  <p
                    className={`text-ui font-medium ${
                      isBlocked ? 'text-[#92400E]' : 'text-[#B42318]'
                    }`}
                  >
                    {isBlocked
                      ? `Too many attempts. Try again in ${blockTimer} seconds.`
                      : errors.general}
                  </p>
                  {loginAttempts > 0 && !isBlocked && (
                    <p className="mt-1 text-caption text-[#475569]">
                      {5 - loginAttempts} attempts remaining
                    </p>
                  )}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-ui font-medium text-[#0F172A]"
                >
                  Email address
                </label>
                <input
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
                  className={`mt-1.5 w-full rounded-[4px] border bg-white px-3.5 py-2.5 text-body text-[#0F172A] transition-colors placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-[#F6F8FA] ${
                    errors.email
                      ? 'border-[#B42318] focus:border-[#B42318] focus:ring-[#B42318]/15'
                      : 'border-[#DDE3EA] focus:border-[#1D4ED8] focus:ring-[#1D4ED8]/15'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1.5 text-caption text-[#B42318]">{errors.email}</p>
                )}
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <label
                    htmlFor="password"
                    className="block text-ui font-medium text-[#0F172A]"
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-caption font-medium text-[#1D4ED8] underline decoration-[#C7D2DE] underline-offset-4 transition-colors hover:decoration-[#1D4ED8]"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative mt-1.5">
                  <input
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
                    className={`w-full rounded-[4px] border bg-white py-2.5 pl-3.5 pr-11 text-body text-[#0F172A] transition-colors placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-[#F6F8FA] ${
                      errors.password
                        ? 'border-[#B42318] focus:border-[#B42318] focus:ring-[#B42318]/15'
                        : 'border-[#DDE3EA] focus:border-[#1D4ED8] focus:ring-[#1D4ED8]/15'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-[3px] p-2 text-[#64748B] transition-colors hover:text-[#0F172A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-caption text-[#B42318]">{errors.password}</p>
                )}
                {capsLockActive && (
                  <p className="mt-1.5 text-caption text-[#B45309]">Caps Lock is on</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || isBlocked}
                className="w-full rounded-[4px] bg-[#1D4ED8] px-4 py-3 text-body font-semibold text-white transition-colors hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:bg-[#94A3B8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
              >
                {loading ? 'Signing in…' : isBlocked ? `Locked (${blockTimer}s)` : 'Sign in'}
              </button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <span className="h-px flex-1 bg-[#DDE3EA]" />
              <span className="text-caption text-[#64748B]">or</span>
              <span className="h-px flex-1 bg-[#DDE3EA]" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={onGoogleLoginClick}
                disabled={isBlocked || loading}
                className="flex items-center justify-center gap-2.5 rounded-[4px] border border-[#DDE3EA] bg-white px-4 py-2.5 text-ui font-semibold text-[#0F172A] transition-colors hover:border-[#1D4ED8] hover:text-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z" />
                  <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 010-4.22V7.05H2.18a11 11 0 000 9.9l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 002.18 7.05l3.66 2.84C6.71 7.29 9.14 4.75 12 4.75z" />
                </svg>
                Google
              </button>

              <button
                type="button"
                onClick={onGithubLoginClick}
                disabled={isBlocked || loading}
                className="flex items-center justify-center gap-2.5 rounded-[4px] border border-[#DDE3EA] bg-white px-4 py-2.5 text-ui font-semibold text-[#0F172A] transition-colors hover:border-[#1D4ED8] hover:text-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 .5a12 12 0 00-3.79 23.4c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0012 .5z" />
                </svg>
                GitHub
              </button>
            </div>

            <p className="mt-6 text-center text-ui text-[#475569]">
              New here?{' '}
              <Link
                href="/register"
                className="font-semibold text-[#1D4ED8] underline decoration-[#C7D2DE] underline-offset-4 transition-colors hover:decoration-[#1D4ED8]"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
