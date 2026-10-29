'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import {
  BookOpenIcon,
  HomeIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  UserGroupIcon,
  UserPlusIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavbarState {
  mobileMenuOpen: boolean;
  userMenuOpen: boolean;
}

const baseNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'My Courses', href: '/my-courses', icon: BookOpenIcon },
  { name: 'Create Course', href: '/create-course', icon: UserIcon },
  { name: 'Students', href: '/students', icon: UserGroupIcon },
];

const adminOnlyNavigation: NavItem[] = [
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
];

const Navbar = () => {
  const [state, setState] = useState<NavbarState>({
    mobileMenuOpen: false,
    userMenuOpen: false
  });
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);
  const [pendingCoursesCount, setPendingCoursesCount] = useState<number>(0);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Destructure state for easier access
  const { mobileMenuOpen, userMenuOpen } = state;

  // Fetch pending tutor requests count for admins
  useEffect(() => {
    const fetchPendingRequestsCount = async () => {
      if (user?.role?.toLowerCase() !== 'tutor') {
        try {
          const response: any = await api.get('/tutor-requests/count');

          if (response.success && response.data) {
            setPendingRequestsCount(response.data.count);
          }
        } catch (error) {
          // Silently fail - count will remain at 0
        }
      }
    };

    if (user) {
      fetchPendingRequestsCount();

      // Listen for custom event to refresh count
      const handleRefreshCount = () => {
        fetchPendingRequestsCount();
      };

      window.addEventListener('tutorRequestUpdated', handleRefreshCount);

      // Refresh count every 60 seconds
      const interval = setInterval(fetchPendingRequestsCount, 60000);

      return () => {
        clearInterval(interval);
        window.removeEventListener('tutorRequestUpdated', handleRefreshCount);
      };
    }
  }, [user]);

  // Fetch pending courses count for admins
  useEffect(() => {
    const fetchPendingCoursesCount = async () => {
      if (user?.role?.toLowerCase() === 'admin') {
        try {
          const response: any = await api.courses.getPendingCount();

          if (response.success && response.data) {
            setPendingCoursesCount(response.data.count);
          }
        } catch (error) {
          // Silently fail - count will remain at 0
        }
      }
    };

    if (user) {
      fetchPendingCoursesCount();

      // Listen for custom event to refresh count
      const handleRefreshCoursesCount = () => {
        fetchPendingCoursesCount();
      };

      window.addEventListener('pendingCoursesUpdated', handleRefreshCoursesCount);

      // Refresh count every 60 seconds
      const interval = setInterval(fetchPendingCoursesCount, 60000);

      return () => {
        clearInterval(interval);
        window.removeEventListener('pendingCoursesUpdated', handleRefreshCoursesCount);
      };
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setState(prev => ({ ...prev, userMenuOpen: false }));
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
    setState(prev => ({ ...prev, userMenuOpen: false }));
  }, [pathname]);

  // Dynamic navigation based on user role
  const navigation = user?.role?.toLowerCase() !== 'tutor'
    ? [...baseNavigation, ...adminOnlyNavigation]
    : baseNavigation;


  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  };

  // If user is not authenticated, show login button
  if (!user && !loading) {
    return (
      <nav className="bg-white shadow-sm border-b border-[#DDE3EA] sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-18 md:h-20 lg:h-24">
            <div className="flex items-center flex-shrink-0">
              <Link href="/" className="flex items-center">
                <div className="h-16 w-16 sm:h-18 sm:w-18 md:h-16 md:w-16 lg:h-20 lg:w-20 relative">
                  <Image
                    src="/logo.png"
                    alt="CODiiN Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Link href="/login">
                <Button size="sm" className="bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs sm:text-sm px-3 sm:px-4">
                  <span className="hidden sm:inline">Organization </span>Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b border-[#DDE3EA] sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-18 md:h-20 lg:h-24">
          {/* Logo and Main Nav */}
          <div className="flex items-center gap-6 md:gap-8 lg:gap-10">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <div className="h-16 w-16 sm:h-18 sm:w-18 md:h-16 md:w-16 lg:h-20 lg:w-20 relative">
                <Image
                  src="/logo.png"
                  alt="CODiiN Logo"
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
                        ? 'bg-[#1D4ED8] text-white shadow-sm'
                        : 'text-[#475569] hover:text-[#1D4ED8] hover:bg-[#F6F8FA]'
                    )}
                  >
                    <item.icon className={cn(
                      "w-4 h-4 lg:w-5 lg:h-5 mr-2 flex-shrink-0",
                      isActive ? "text-white" : "text-[#64748B]"
                    )} />
                    <span className="whitespace-nowrap">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side */}
          <div className="hidden md:ml-3 lg:ml-4 md:flex md:items-center md:gap-2">
            {/* Tutor Registration Requests icon for admin users */}
            {user?.role?.toLowerCase() !== 'tutor' && (
              <Link
                href="/registrations"
                className="relative inline-flex items-center justify-center p-2 text-[#475569] hover:text-[#1D4ED8] hover:bg-[#F6F8FA] rounded-lg transition-all duration-200"
                aria-label={`Tutor registration requests${pendingRequestsCount > 0 ? ` (${pendingRequestsCount} pending)` : ''}`}
              >
                <UserPlusIcon className="h-5 w-5" />
                {pendingRequestsCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center h-5 w-5 text-[10px] font-bold text-white bg-[#1D4ED8] rounded-full border-2 border-white shadow-sm">
                    {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                  </span>
                )}
              </Link>
            )}

            {/* Pending Courses icon for admin users only */}
            {user?.role?.toLowerCase() === 'admin' && (
              <Link
                href="/pending-courses"
                className="relative inline-flex items-center justify-center p-2 text-[#475569] hover:text-[#079455] hover:bg-[#F6F8FA] rounded-lg transition-all duration-200"
                aria-label={`Pending course reviews${pendingCoursesCount > 0 ? ` (${pendingCoursesCount} pending)` : ''}`}
              >
                <BookOpenIcon className="h-5 w-5" />
                {pendingCoursesCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center h-5 w-5 text-[10px] font-bold text-white bg-[#079455] rounded-full border-2 border-white shadow-sm">
                    {pendingCoursesCount > 9 ? '9+' : pendingCoursesCount}
                  </span>
                )}
              </Link>
            )}

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <div>
                <button
                  className="flex items-center text-sm rounded-lg p-1.5 md:p-2 hover:bg-[#F6F8FA] transition-all duration-200"
                  onClick={() => setState(prev => ({ ...prev, userMenuOpen: !prev.userMenuOpen }))}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-lg bg-[#E9EEF4] flex items-center justify-center ring-2 ring-transparent hover:ring-[#DBE7FE] transition-all">
                    {user?.avatar ? (
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
                    <p className="text-sm font-medium text-[#0F172A] leading-tight">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-[#64748B] font-medium">{user?.email}</p>
                  </div>
                  <ChevronDownIcon className={cn(
                    "ml-1.5 md:ml-2 h-4 w-4 text-[#64748B] transition-transform duration-200",
                    userMenuOpen && "rotate-180"
                  )} />
                </button>
              </div>

              {userMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-lg py-1.5 bg-white ring-1 ring-black/5 z-50 border border-[#DDE3EA] animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2.5 border-b border-[#DDE3EA]">
                    <p className="text-sm font-semibold text-[#0F172A] truncate">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-[#64748B] truncate mt-0.5">{user?.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center px-3 py-2.5 text-sm text-[#334155] hover:bg-[#F6F8FA] transition-colors"
                    onClick={() => setState(prev => ({ ...prev, userMenuOpen: false }))}
                  >
                    <UserIcon className="h-4 w-4 mr-2.5 text-[#94A3B8]" />
                    Your Profile
                  </Link>
                  {user?.role?.toLowerCase() !== 'tutor' && (
                    <>
                      <Link
                        href="/create-user"
                        className="flex items-center px-3 py-2.5 text-sm text-[#334155] hover:bg-[#F6F8FA] transition-colors"
                        onClick={() => setState(prev => ({ ...prev, userMenuOpen: false }))}
                      >
                        <UserPlusIcon className="h-4 w-4 mr-2.5 text-[#94A3B8]" />
                        Create User
                      </Link>
                      <Link
                        href="/manage-users"
                        className="flex items-center px-3 py-2.5 text-sm text-[#334155] hover:bg-[#F6F8FA] transition-colors"
                        onClick={() => setState(prev => ({ ...prev, userMenuOpen: false }))}
                      >
                        <Cog6ToothIcon className="h-4 w-4 mr-2.5 text-[#94A3B8]" />
                        Manage Users
                      </Link>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setState(prev => ({ ...prev, userMenuOpen: false }));
                      handleLogout();
                    }}
                    className="flex items-center w-full text-left px-3 py-2.5 text-sm text-[#B42318] hover:bg-[#FEF3F2] transition-colors mt-1 border-t border-[#E9EEF4]"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2.5 text-[#F97066]" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            {/* Tutor Registration Requests icon for mobile */}
            {user?.role?.toLowerCase() !== 'tutor' && (
              <Link
                href="/registrations"
                className="relative inline-flex items-center justify-center p-2 text-[#475569] hover:text-[#1D4ED8] hover:bg-[#F6F8FA] rounded-lg transition-all duration-200"
                aria-label={`Tutor registration requests${pendingRequestsCount > 0 ? ` (${pendingRequestsCount} pending)` : ''}`}
              >
                <UserPlusIcon className="h-5 w-5" />
                {pendingRequestsCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center h-4 w-4 text-[9px] font-bold text-white bg-[#1D4ED8] rounded-full border-2 border-white shadow-sm">
                    {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                  </span>
                )}
              </Link>
            )}

            {/* Pending Courses icon for mobile (admin only) */}
            {user?.role?.toLowerCase() === 'admin' && (
              <Link
                href="/pending-courses"
                className="relative inline-flex items-center justify-center p-2 text-[#475569] hover:text-[#079455] hover:bg-[#F6F8FA] rounded-lg transition-all duration-200"
                aria-label={`Pending course reviews${pendingCoursesCount > 0 ? ` (${pendingCoursesCount} pending)` : ''}`}
              >
                <BookOpenIcon className="h-5 w-5" />
                {pendingCoursesCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center h-4 w-4 text-[9px] font-bold text-white bg-[#079455] rounded-full border-2 border-white shadow-sm">
                    {pendingCoursesCount > 9 ? '9+' : pendingCoursesCount}
                  </span>
                )}
              </Link>
            )}

            <button
              className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white border border-[#DDE3EA] hover:bg-[#F6F8FA] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:ring-offset-2"
              onClick={() => setState(prev => ({ ...prev, mobileMenuOpen: !prev.mobileMenuOpen }))}
              aria-label="Toggle menu"
            >
              <span className="sr-only">Open main menu</span>
              <div className="w-5 h-4 relative flex flex-col justify-between">
                <span
                  className={`w-full h-0.5 bg-[#334155] rounded-full transition-all duration-300 ease-in-out ${
                    mobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''
                  }`}
                />
                <span
                  className={`w-full h-0.5 bg-[#334155] rounded-full transition-all duration-300 ease-in-out ${
                    mobileMenuOpen ? 'opacity-0' : ''
                  }`}
                />
                <span
                  className={`w-full h-0.5 bg-[#334155] rounded-full transition-all duration-300 ease-in-out ${
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
        <div className="md:hidden bg-[#F6F8FA] border-t border-[#DDE3EA] shadow-lg">
          <div className="max-h-[calc(100vh-5rem)] overflow-y-auto">
            {/* User Profile Card */}
            {user && (
              <div className="p-4 bg-white">
                <div className="flex items-center p-3 bg-[#EFF4FF] rounded-xl border border-[#DBE7FE]">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-xl bg-[#1D4ED8] flex items-center justify-center ring-2 ring-white shadow-md">
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
                          ? 'bg-[#1D4ED8] text-white shadow-md shadow-[#1D4ED8]/20'
                          : 'text-[#334155] bg-white hover:bg-[#F6F8FA] active:scale-[0.98]'
                      )}
                      onClick={() => setState(prev => ({ ...prev, mobileMenuOpen: false }))}
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

            {/* Account Section */}
            {user && (
              <div className="px-4 pt-3 pb-4">
                <h3 className="px-3 mb-2 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Account
                </h3>
                <div className="space-y-1">
                  <Link
                    href="/profile"
                    className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-[#334155] bg-white hover:bg-[#F6F8FA] transition-all active:scale-[0.98]"
                    onClick={() => setState(prev => ({ ...prev, mobileMenuOpen: false }))}
                  >
                    <UserIcon className="h-5 w-5 mr-3 text-[#94A3B8] flex-shrink-0" />
                    <span>Your Profile</span>
                    <svg className="ml-auto w-4 h-4 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>

                  {user.role?.toLowerCase() !== 'tutor' && (
                    <>
                      <Link
                        href="/create-user"
                        className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-[#334155] bg-white hover:bg-[#F6F8FA] transition-all active:scale-[0.98]"
                        onClick={() => setState(prev => ({ ...prev, mobileMenuOpen: false }))}
                      >
                        <UserPlusIcon className="h-5 w-5 mr-3 text-[#94A3B8] flex-shrink-0" />
                        <span>Create User</span>
                        <svg className="ml-auto w-4 h-4 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>

                      <Link
                        href="/manage-users"
                        className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-[#334155] bg-white hover:bg-[#F6F8FA] transition-all active:scale-[0.98]"
                        onClick={() => setState(prev => ({ ...prev, mobileMenuOpen: false }))}
                      >
                        <Cog6ToothIcon className="h-5 w-5 mr-3 text-[#94A3B8] flex-shrink-0" />
                        <span>Manage Users</span>
                        <svg className="ml-auto w-4 h-4 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </>
                  )}

                  <button
                    onClick={() => {
                      setState(prev => ({ ...prev, mobileMenuOpen: false }));
                      handleLogout();
                    }}
                    className="flex items-center w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-[#B42318] bg-white hover:bg-[#FEF3F2] transition-all active:scale-[0.98]"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3 text-[#F04438] flex-shrink-0" />
                    <span>Sign Out</span>
                    <svg className="ml-auto w-4 h-4 text-[#F97066]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
