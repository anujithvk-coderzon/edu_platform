'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '../../utils/cn';
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
    <nav className="sticky top-0 z-50 border-b border-[#DDE3EA] bg-[#FFFFFF]">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-[72px]">
          {/* Logo and Main Nav */}
          <div className="flex items-center gap-6 md:gap-8 lg:gap-10">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <div className="relative h-11 w-11 lg:h-12 lg:w-12">
                <Image
                  src="/logo.png"
                  alt="CODiiN"
                  fill
                  sizes="48px"
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex md:items-center md:gap-6 lg:gap-8">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center border-b-2 px-1 pt-1 pb-[6px] text-body transition-colors',
                      isActive
                        ? 'border-[#1D4ED8] font-semibold text-[#0F172A]'
                        : 'border-transparent font-medium text-[#475569] hover:text-[#0F172A]'
                    )}
                  >
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
                    className="flex items-center rounded-[3px] p-1.5 text-sm transition-colors hover:bg-[#F6F8FA]"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DDE3EA]">
                      {user.avatar ? (
                        <img
                          className="h-8 w-8 rounded-lg object-cover"
                          src={user.avatar || ''}
                          alt={`${user.firstName} ${user.lastName}`}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <UserIcon className="h-4 w-4 text-[#475569]" />
                      )}
                    </div>
                    <div className="ml-2 md:ml-3 text-left hidden lg:block">
                      <p className="text-sm font-medium text-[#0F172A] leading-tight">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-[#64748B] font-medium">{user.email}</p>
                    </div>
                    <ChevronDownIcon className={cn(
                      "ml-1.5 md:ml-2 h-4 w-4 text-[#64748B] transition-transform duration-200",
                      userMenuOpen && "rotate-180"
                    )} />
                  </button>
                </div>

                {userMenuOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-60 origin-top-right rounded-[4px] border border-[#DDE3EA] bg-[#FFFFFF] py-1.5 shadow-[0_12px_32px_-12px_rgba(15,23,42,0.18)]">
                    <div className="px-3 py-2.5 border-b border-[#DDE3EA]">
                      <p className="text-sm font-semibold text-[#0F172A] truncate">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-[#64748B] truncate mt-0.5">{user.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      className="flex items-center px-3 py-2.5 text-sm text-[#0F172A] hover:bg-[#F6F8FA] transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <UserIcon className="h-4 w-4 mr-2.5 text-[#94A3B8]" />
                      Your Profile
                    </Link>
                    <Link
                      href="/my-courses"
                      className="flex items-center px-3 py-2.5 text-sm text-[#0F172A] hover:bg-[#F6F8FA] transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <AcademicCapIcon className="h-4 w-4 mr-2.5 text-[#94A3B8]" />
                      My Learning
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center w-full text-left px-3 py-2.5 text-sm text-[#B42318] hover:bg-[#FEF3F2] transition-colors mt-1 border-t border-[#DDE3EA]"
                    >
                      <svg className="h-4 w-4 mr-2.5 text-[#D92D20]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  <button className="px-1 py-2 text-body font-medium text-[#475569] transition-colors hover:text-[#0F172A]">
                    Sign in
                  </button>
                </Link>
                <Link href="/register">
                  <button className="rounded-[4px] bg-[#1D4ED8] px-5 py-2.5 text-ui font-semibold text-white transition-colors hover:bg-[#1E40AF]">
                    Get Started
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-[3px] border border-[#DDE3EA] bg-[#FFFFFF] transition-colors hover:bg-[#F6F8FA] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F172A]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <span className="sr-only">Open main menu</span>
              <div className="w-5 h-4 relative flex flex-col justify-between">
                <span
                  className={`w-full h-0.5 bg-[#0F172A] rounded-full transition-all duration-300 ease-in-out ${
                    mobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''
                  }`}
                />
                <span
                  className={`w-full h-0.5 bg-[#0F172A] rounded-full transition-all duration-300 ease-in-out ${
                    mobileMenuOpen ? 'opacity-0' : ''
                  }`}
                />
                <span
                  className={`w-full h-0.5 bg-[#0F172A] rounded-full transition-all duration-300 ease-in-out ${
                    mobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-[#DDE3EA] bg-[#FFFFFF] md:hidden">
          <div className="max-h-[calc(100vh-5rem)] overflow-y-auto">
            {/* User Profile Card - Only for logged in users */}
            {user && (
              <div className="p-4 bg-white">
                <div className="flex items-center rounded-[4px] border border-[#DDE3EA] bg-[#F6F8FA] p-3">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0F172A] text-white">
                      {user.avatar ? (
                        <img
                          className="h-12 w-12 rounded-xl object-cover"
                          src={user.avatar || ''}
                          alt={`${user.firstName} ${user.lastName}`}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <UserIcon className="h-6 w-6 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <div className="text-sm font-bold text-[#0F172A] truncate">{user.firstName} {user.lastName}</div>
                    <div className="text-xs text-[#475569] truncate mt-0.5">{user.email}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Section */}
            <div className="px-4 pt-4 pb-2">
              <h3 className="px-3 mb-2 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Navigation
              </h3>
              <div className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all',
                        isActive
                          ? 'bg-[#1D4ED8] text-white'
                          : 'text-[#0F172A] bg-white hover:bg-[#F6F8FA] active:scale-[0.98]'
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className={cn(
                        "w-5 h-5 mr-3 flex-shrink-0",
                        isActive ? "text-white" : "text-[#94A3B8]"
                      )} />
                      <span>{item.name}</span>
                      {isActive && (
                        <svg className="ml-auto w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Account Section - Only for logged in users */}
            {user && (
              <div className="px-4 pt-3 pb-4">
                <h3 className="px-3 mb-2 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Account
                </h3>
                <div className="space-y-1">
                  <Link
                    href="/profile"
                    className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-[#0F172A] bg-white hover:bg-[#F6F8FA] transition-all active:scale-[0.98]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <UserIcon className="h-5 w-5 mr-3 text-[#94A3B8] flex-shrink-0" />
                    <span>Your Profile</span>
                    <svg className="ml-auto w-4 h-4 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-[#B42318] bg-white hover:bg-[#FEF3F2] transition-all active:scale-[0.98]"
                  >
                    <svg className="h-5 w-5 mr-3 text-[#B42318] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                    <svg className="ml-auto w-4 h-4 text-[#D92D20]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Get Started Section - Only for guests */}
            {!user && (
              <div className="px-4 pt-3 pb-4">
                <h3 className="px-3 mb-2 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Get Started
                </h3>
                <div className="space-y-2">
                  <Link
                    href="/login"
                    className="flex items-center justify-center rounded-[4px] border border-[#DDE3EA] bg-white px-4 py-3 text-sm font-semibold text-[#0F172A] transition-colors hover:border-[#1D4ED8] hover:text-[#1D4ED8]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>

                  <Link
                    href="/register"
                    className="flex items-center justify-center rounded-[4px] bg-[#1D4ED8] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1E40AF]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                    <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}