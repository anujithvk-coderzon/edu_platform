'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import { useAuth } from '../../contexts/AuthContext';
import { getCdnUrl } from '../../utils/cdn';
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
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 sm:h-24">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="h-16 w-16 sm:h-20 sm:w-20 relative">
                  <Image
                    src="/logo.png"
                    alt="Codiin Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/login">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-3 sm:px-4 py-2">
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
    <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 sm:h-24">
          {/* Logo and Main Nav */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <div className="h-16 w-16 sm:h-20 sm:w-20 relative">
                  <Image
                    src="/logo.png"
                    alt="Codiin Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>
            </div>
            <div className="hidden md:ml-6 lg:ml-8 md:flex md:items-center md:gap-2 lg:gap-3">
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
          <div className="hidden sm:ml-3 md:ml-6 sm:flex sm:items-center sm:space-x-2 md:space-x-3">
            {/* Tutor Registration Requests icon for admin users */}
            {user?.role?.toLowerCase() !== 'tutor' && (
              <Link
                href="/registrations"
                className="relative inline-flex items-center justify-center p-2 text-slate-600 hover:text-purple-600 hover:bg-slate-50 rounded-lg transition-all duration-200"
                aria-label={`Tutor registration requests${pendingRequestsCount > 0 ? ` (${pendingRequestsCount} pending)` : ''}`}
              >
                <UserPlusIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                {pendingRequestsCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 inline-flex items-center justify-center h-4 w-4 sm:h-5 sm:w-5 text-[9px] sm:text-[10px] font-bold text-white bg-gradient-to-br from-purple-500 to-purple-600 rounded-full border-2 border-white shadow-sm animate-pulse">
                    {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                  </span>
                )}
              </Link>
            )}
            {/* Pending Courses icon for admin users only */}
            {user?.role?.toLowerCase() === 'admin' && (
              <Link
                href="/pending-courses"
                className="relative inline-flex items-center justify-center p-2 text-slate-600 hover:text-green-600 hover:bg-slate-50 rounded-lg transition-all duration-200"
                aria-label={`Pending course reviews${pendingCoursesCount > 0 ? ` (${pendingCoursesCount} pending)` : ''}`}
              >
                <BookOpenIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                {pendingCoursesCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 inline-flex items-center justify-center h-4 w-4 sm:h-5 sm:w-5 text-[9px] sm:text-[10px] font-bold text-white bg-gradient-to-br from-green-500 to-green-600 rounded-full border-2 border-white shadow-sm animate-pulse">
                    {pendingCoursesCount > 9 ? '9+' : pendingCoursesCount}
                  </span>
                )}
              </Link>
            )}
            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <div>
                <Button
                  variant="ghost"
                  className="flex items-center text-xs sm:text-sm rounded-lg p-1.5 sm:p-2 hover:bg-slate-50 transition-all duration-200"
                  onClick={() => setState(prev => ({ ...prev, userMenuOpen: !prev.userMenuOpen }))}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-sm">
                    {user?.avatar ? (
                      <img className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg object-cover" src={getCdnUrl(user.avatar) || ''} alt={`${user.firstName} ${user.lastName}`} referrerPolicy="no-referrer" />
                    ) : (
                      <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600" />
                    )}
                  </div>
                  <div className="ml-2 sm:ml-3 text-left hidden xl:block">
                    <p className="text-xs sm:text-sm font-medium text-slate-900 truncate max-w-24">
                      {user?.firstName} {user?.lastName}
                    </p>
                  </div>
                  <div className="ml-2 sm:ml-3 text-left hidden lg:block xl:hidden">
                    <p className="text-xs sm:text-sm font-medium text-slate-900 truncate max-w-16">
                      {user?.firstName}
                    </p>
                  </div>
                  <ChevronDownIcon className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 text-slate-500" />
                </Button>
              </div>

              {userMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 bg-white ring-1 ring-black/5 z-50 border border-slate-200">
                  <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                    <p className="text-sm font-medium text-slate-900">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-all duration-150"
                    onClick={() => setState(prev => ({ ...prev, userMenuOpen: false }))}
                  >
                    <UserIcon className="h-4 w-4 mr-3 text-slate-400" />
                    Your Profile
                  </Link>
                  {user?.role?.toLowerCase() !== 'tutor' && (
                    <>
                      <Link
                        href="/create-user"
                        className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-all duration-150"
                        onClick={() => setState(prev => ({ ...prev, userMenuOpen: false }))}
                      >
                        <UserPlusIcon className="h-4 w-4 mr-3 text-slate-400" />
                        Create User
                      </Link>
                      <Link
                        href="/manage-users"
                        className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-all duration-150"
                        onClick={() => setState(prev => ({ ...prev, userMenuOpen: false }))}
                      >
                        <Cog6ToothIcon className="h-4 w-4 mr-3 text-slate-400" />
                        Manage Users
                      </Link>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setState(prev => ({ ...prev, userMenuOpen: false }));
                      handleLogout();
                    }}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-all duration-150"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3 text-red-400" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-1 sm:space-x-2">
            {/* Tutor Registration Requests icon for mobile */}
            {user?.role?.toLowerCase() !== 'tutor' && (
              <Link
                href="/registrations"
                className="relative inline-flex items-center justify-center p-1.5 sm:p-2 text-slate-600 hover:text-purple-600 hover:bg-slate-50 rounded-lg transition-all duration-200 sm:hidden"
                aria-label={`Tutor registration requests${pendingRequestsCount > 0 ? ` (${pendingRequestsCount} pending)` : ''}`}
              >
                <UserPlusIcon className="h-5 w-5" />
                {pendingRequestsCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center h-4 w-4 text-[9px] font-bold text-white bg-gradient-to-br from-purple-500 to-purple-600 rounded-full border-2 border-white shadow-sm animate-pulse">
                    {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                  </span>
                )}
              </Link>
            )}
            {/* Pending Courses icon for mobile (admin only) */}
            {user?.role?.toLowerCase() === 'admin' && (
              <Link
                href="/pending-courses"
                className="relative inline-flex items-center justify-center p-1.5 sm:p-2 text-slate-600 hover:text-green-600 hover:bg-slate-50 rounded-lg transition-all duration-200 sm:hidden"
                aria-label={`Pending course reviews${pendingCoursesCount > 0 ? ` (${pendingCoursesCount} pending)` : ''}`}
              >
                <BookOpenIcon className="h-5 w-5" />
                {pendingCoursesCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center h-4 w-4 text-[9px] font-bold text-white bg-gradient-to-br from-green-500 to-green-600 rounded-full border-2 border-white shadow-sm animate-pulse">
                    {pendingCoursesCount > 9 ? '9+' : pendingCoursesCount}
                  </span>
                )}
              </Link>
            )}
            <Button
              variant="ghost"
              className="inline-flex items-center justify-center p-1.5 sm:p-2 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
              onClick={() => setState(prev => ({ ...prev, mobileMenuOpen: !prev.mobileMenuOpen }))}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <XMarkIcon className="block h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Bars3Icon className="block h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </Button>
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
                  onClick={() => setState(prev => ({ ...prev, mobileMenuOpen: false }))}
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
          <div className="pt-2.5 pb-2 border-t border-slate-200 bg-slate-50/50">
            <div className="flex items-center px-3 py-2">
              <div className="flex-shrink-0">
                <div className="h-9 w-9 rounded-lg bg-slate-200 flex items-center justify-center ring-2 ring-white">
                  {user?.avatar ? (
                    <img className="h-9 w-9 rounded-lg object-cover" src={getCdnUrl(user.avatar) || ''} alt={`${user?.firstName} ${user?.lastName}`} referrerPolicy="no-referrer" />
                  ) : (
                    <UserIcon className="h-4 w-4 text-slate-600" />
                  )}
                </div>
              </div>
              <div className="ml-2.5 min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900 truncate">{user?.firstName} {user?.lastName}</div>
                <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                <div className="text-xs text-blue-600 font-semibold mt-0.5">{user?.role || 'Admin'}</div>
              </div>
            </div>
            <div className="mt-2 space-y-0.5 px-2">
              <Link
                href="/profile"
                className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
                onClick={() => setState(prev => ({ ...prev, mobileMenuOpen: false }))}
              >
                <UserIcon className="h-4 w-4 mr-2.5 text-slate-400 flex-shrink-0" />
                Your Profile
              </Link>
              {user?.role?.toLowerCase() !== 'tutor' && (
                <>
                  <Link
                    href="/create-user"
                    className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
                    onClick={() => setState(prev => ({ ...prev, mobileMenuOpen: false }))}
                  >
                    <UserPlusIcon className="h-4 w-4 mr-2.5 text-slate-400 flex-shrink-0" />
                    Create User
                  </Link>
                  <Link
                    href="/manage-users"
                    className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
                    onClick={() => setState(prev => ({ ...prev, mobileMenuOpen: false }))}
                  >
                    <Cog6ToothIcon className="h-4 w-4 mr-2.5 text-slate-400 flex-shrink-0" />
                    Manage Users
                  </Link>
                </>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center w-full text-left px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2.5 text-red-400 flex-shrink-0" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;