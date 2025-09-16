'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const { login, loading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Validation
    const newErrors: { email?: string; password?: string } = {};
    
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
      return;
    }
    
    try {
      await login(email, password);
      router.push('/');
    } catch (error) {
      setErrors({ general: 'Invalid email or password' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-br from-indigo-200 to-pink-200 rounded-full blur-3xl opacity-30"></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="h-20 w-20 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300 group">
              <span className="text-white font-bold text-3xl group-hover:scale-110 transition-transform duration-300">🎓</span>
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent mb-4">
            Welcome to CoderZone! ✨
          </h1>
          <p className="text-lg text-slate-600 font-medium">
            🚀 Sign in to unlock your learning potential
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 hover:shadow-3xl transition-all duration-300">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center">
              🔐 Sign In
            </h2>
            <p className="text-slate-600 font-medium">
              Enter your credentials to access your learning dashboard
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {errors.general && (
              <div className="bg-red-50/80 backdrop-blur-sm border-2 border-red-200 rounded-2xl p-4 flex items-center space-x-3">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm">!</span>
                </div>
                <p className="text-red-700 font-medium">{errors.general}</p>
              </div>
            )}
              
              <div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="📧 Enter your email address"
                  label="✉️ Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                />
              </div>

              <div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="🔒 Enter your password"
                    label="🔑 Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={errors.password}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-xl hover:bg-slate-100 transition-colors duration-200 z-20"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ marginTop: '12px' }}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-slate-500" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-slate-500" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 focus:ring-2 border-2 border-slate-300 rounded-lg hover:border-blue-400 transition-colors duration-200"
                  />
                  <label htmlFor="remember-me" className="ml-3 block text-sm font-medium text-slate-700">
                    💾 Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link href="/forgot-password" className="font-bold text-blue-600 hover:text-blue-700 transition-colors duration-200">
                    🤔 Forgot password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>🚀 Sign In</span>
                  </div>
                )}
              </button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500 font-medium">Don't have an account?</span>
                </div>
              </div>

              <div className="mt-6">
                <Link href="/register">
                  <button className="w-full border-2 border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 font-bold py-4 px-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-lg bg-white hover:bg-blue-50">
                    ✨ Create New Account
                  </button>
                </Link>
              </div>
            </div>
          </div>

        {/* Demo Credentials */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 backdrop-blur-sm rounded-3xl border-2 border-green-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-green-500 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold">🎯</span>
            </div>
            <h3 className="text-lg font-bold text-green-800">Demo Credentials</h3>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-green-200">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-green-700 font-bold text-sm">📧 Email:</span>
                <code className="bg-green-100 text-green-800 px-2 py-1 rounded-lg text-sm font-mono">student@coderzon.com</code>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-700 font-bold text-sm">🔑 Password:</span>
                <code className="bg-green-100 text-green-800 px-2 py-1 rounded-lg text-sm font-mono">password123</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}