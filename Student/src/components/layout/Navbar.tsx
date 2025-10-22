'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '../../utils/cn';
import { getCdnUrl } from '@/utils/cdn';
import {
  BookOpenIcon,
  HomeIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Courses', href: '/courses', icon: MagnifyingGlassIcon },
  { name: 'My Learning', href: '/my-courses', icon: AcademicCapIcon },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  // Close dropdown when pathname changes
  useEffect(() => {
    setUserMenuOpen(false);
  }, [pathname]);

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-18 md:h-20 lg:h-24">
          {/* Logo and Main Nav */}
          <div className="flex items-center gap-6 md:gap-8 lg:gap-10">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 lg:h-20 lg:w-20 relative">
                <Image
                  src="/logo.png"
                  alt="Codiin Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex md:items-center md:gap-2 lg:gap-3">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg text-sm lg:text-base font-medium transition-all duration-200',
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                    )}
                  >
                    <item.icon className={cn(
                      "w-4 h-4 lg:w-5 lg:h-5 mr-2 flex-shrink-0",
                      isActive ? "text-white" : "text-slate-500"
                    )} />
                    <span className="whitespace-nowrap">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side */}
          <div className="hidden md:ml-3 lg:ml-4 md:flex md:items-center">
            {user ? (
              // User menu
              <div className="relative" ref={userMenuRef}>
                <div>
                  <button
                    className="flex items-center text-sm rounded-lg p-1.5 md:p-2 hover:bg-slate-50 transition-all duration-200"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center ring-2 ring-transparent hover:ring-blue-100 transition-all">
                      {user.avatar ? (
                        <img
                          className="h-8 w-8 rounded-lg object-cover"
                          src={getCdnUrl(user.avatar) || ''}
                          alt={`${user.firstName} ${user.lastName}`}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <UserIcon className="h-4 w-4 text-slate-600" />
                      )}
                    </div>
                    <div className="ml-2 md:ml-3 text-left hidden lg:block">
                      <p className="text-sm font-medium text-slate-900 leading-tight">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-slate-500 font-medium">Student</p>
                    </div>
                    <ChevronDownIcon className={cn(
                      "ml-1.5 md:ml-2 h-4 w-4 text-slate-500 transition-transform duration-200",
                      userMenuOpen && "rotate-180"
                    )} />
                  </button>
                </div>

                {userMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-lg py-1.5 bg-white ring-1 ring-black/5 z-50 border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-2.5 border-b border-slate-200">
                      <p className="text-sm font-semibold text-slate-900 truncate">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
                      <p className="text-xs text-blue-600 font-semibold mt-1">Student</p>
                    </div>
                    <Link
                      href="/profile"
                      className="flex items-center px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <UserIcon className="h-4 w-4 mr-2.5 text-slate-400" />
                      Your Profile
                    </Link>
                    <Link
                      href="/my-courses"
                      className="flex items-center px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <AcademicCapIcon className="h-4 w-4 mr-2.5 text-slate-400" />
                      My Learning
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center w-full text-left px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors mt-1 border-t border-slate-100"
                    >
                      <svg className="h-4 w-4 mr-2.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Login/Register buttons
              <div className="flex items-center gap-2 md:gap-3">
                <Link href="/login">
                  <button className="text-slate-700 hover:text-slate-900 px-3 md:px-4 py-1.5 md:py-2 text-sm font-medium transition-colors rounded-lg hover:bg-slate-50">
                    Sign in
                  </button>
                </Link>
                <Link href="/register">
                  <button className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 px-4 md:px-6 py-1.5 md:py-2.5 rounded-lg md:rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                    Get Started
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-all duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <XMarkIcon className="block h-5 w-5" />
              ) : (
                <Bars3Icon className="block h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 shadow-lg">
          <div className="pt-1.5 pb-2 space-y-0.5 px-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className={cn(
                    "w-4 h-4 mr-2.5 flex-shrink-0",
                    isActive ? "text-white" : "text-slate-500"
                  )} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
          {user && (
            <div className="pt-2.5 pb-2 border-t border-slate-200 bg-slate-50/50">
              <div className="flex items-center px-3 py-2">
                <div className="flex-shrink-0">
                  <div className="h-9 w-9 rounded-lg bg-slate-200 flex items-center justify-center ring-2 ring-white">
                    {user.avatar ? (
                      <img
                        className="h-9 w-9 rounded-lg object-cover"
                        src={getCdnUrl(user.avatar) || ''}
                        alt={`${user.firstName} ${user.lastName}`}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <UserIcon className="h-4 w-4 text-slate-600" />
                    )}
                  </div>
                </div>
                <div className="ml-2.5 min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-900 truncate">{user.firstName} {user.lastName}</div>
                  <div className="text-xs text-slate-500 truncate">{user.email}</div>
                  <div className="text-xs text-blue-600 font-semibold mt-0.5">Student</div>
                </div>
              </div>
              <div className="mt-2 space-y-0.5 px-2">
                <Link
                  href="/profile"
                  className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <UserIcon className="h-4 w-4 mr-2.5 text-slate-400 flex-shrink-0" />
                  Your Profile
                </Link>
                <Link
                  href="/my-courses"
                  className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <AcademicCapIcon className="h-4 w-4 mr-2.5 text-slate-400 flex-shrink-0" />
                  My Learning
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center w-full text-left px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg className="h-4 w-4 mr-2.5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          )}

          {!user && (
            <div className="pt-2.5 pb-2 border-t border-slate-200">
              <div className="space-y-1 px-2">
                <Link
                  href="/login"
                  className="block px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="block px-3 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 rounded-lg text-center shadow-md hover:shadow-lg transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}