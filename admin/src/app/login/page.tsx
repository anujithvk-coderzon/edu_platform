'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

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

  // Don't render login form if already authenticated
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Validation
    const newErrors: LoginErrors = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix the form errors');
      return;
    }
    
    try {
      await login(email, password);
      router.push('/');
    } catch (error: any) {
      const errorMessage = error.message || 'Invalid email or password';
      setErrors({ general: errorMessage });
      // Toast is already handled in AuthContext
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl animate-pulse">
              <span className="text-white font-bold text-2xl">C</span>
            </div>
          </div>
          <h2 className="mt-6 text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Organization Login
          </h2>
          <p className="mt-3 text-lg text-gray-600">
            Sign in to your organization's education platform
          </p>
        </div>

        {/* Login Form */}
        <Card className="bg-white/80 backdrop-blur-lg shadow-2xl border border-blue-100/50">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
            <CardTitle className="text-2xl text-gray-900">Sign In</CardTitle>
            <CardDescription className="text-gray-600">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {errors.general && (
                <div className="bg-red-50/80 backdrop-blur-lg border border-red-200/50 rounded-xl p-4 shadow-md">
                  <p className="text-sm text-red-600 font-medium">{errors.general}</p>
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
                  Email address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => 
                    setLoginData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  error={errors.email}
                  className="bg-white/80 border-blue-200/50 rounded-xl px-4 py-3 text-gray-700 placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3">
                  Password
                </label>
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
                    error={errors.password}
                    className="bg-white/80 border-blue-200/50 rounded-xl px-4 py-3 pr-12 text-gray-700 placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-blue-400 hover:text-blue-600 transition-colors duration-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-blue-300 rounded transition-colors duration-300"
                  />
                  <label htmlFor="remember-me" className="ml-3 block text-sm font-medium text-gray-700">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="mailto:admin@organization.com" className="font-semibold text-blue-600 hover:text-purple-600 transition-colors duration-300">
                    Contact Administrator
                  </a>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

          </CardContent>
        </Card>

        {/* Organization Info */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 shadow-lg">
          <CardContent className="pt-6">
            <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
              Organization Access Only
            </h3>
            <div className="bg-white/60 backdrop-blur-lg rounded-lg p-3 border border-blue-100">
              <p className="text-sm text-blue-800 font-medium">
                This platform is designed for single organization access. <br />
                Contact your administrator for login credentials.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Page;