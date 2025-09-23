'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import { useAuth } from '../../contexts/AuthContext';
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
  UserPlusIcon
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
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();

  // Destructure state for easier access
  const { mobileMenuOpen, userMenuOpen } = state;

  // Debug logging
  console.log('Navbar - User object:', user);
  console.log('Navbar - User role:', user?.role);
  console.log('Navbar - Role toLowerCase:', user?.role?.toLowerCase());
  console.log('Navbar - Is tutor check:', user?.role?.toLowerCase() === 'tutor');

  // Dynamic navigation based on user role
  const navigation = user?.role?.toLowerCase() !== 'tutor'
    ? [...baseNavigation, ...adminOnlyNavigation]
    : baseNavigation;


  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // If user is not authenticated, show login button
  if (!user && !loading) {
    return (
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">C</span>
                </div>
                <span className="ml-2 text-xl font-semibold text-slate-900">CoderZone</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">Organization Login</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Main Nav */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">C</span>
                </div>
                <span className="ml-2 text-xl font-semibold text-slate-900">CoderZone</span>
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                    )}
                  >
                    <item.icon className={cn(
                      "w-4 h-4 mr-2",
                      isActive ? "text-white" : "text-slate-500"
                    )} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {/* User menu */}
            <div className="ml-3 relative">
              <div>
                <Button
                  variant="ghost"
                  className="flex items-center text-sm rounded-lg p-2 hover:bg-slate-50"
                  onClick={() => setState(prev => ({ ...prev, userMenuOpen: !prev.userMenuOpen }))}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    {user?.avatar ? (
                      <img className="h-8 w-8 rounded-lg object-cover" src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
                    ) : (
                      <UserIcon className="h-4 w-4 text-slate-600" />
                    )}
                  </div>
                  <div className="ml-3 text-left hidden lg:block">
                    <p className="text-sm font-medium text-slate-900">{user?.firstName} {user?.lastName}</p>
                  </div>
                  <ChevronDownIcon className="ml-2 h-4 w-4 text-slate-500" />
                </Button>
              </div>
              
              {userMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 bg-white ring-1 ring-black/5 z-50 border border-slate-200">
                  <div className="px-4 py-3 border-b border-slate-200">
                    <p className="text-sm font-medium text-slate-900">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <Link href="/profile" className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <UserIcon className="h-4 w-4 mr-3 text-slate-400" />
                    Your Profile
                  </Link>
                  {user?.role?.toLowerCase() !== 'tutor' && (
                    <Link href="/create-user" className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      <UserPlusIcon className="h-4 w-4 mr-3 text-slate-400" />
                      Create User
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3 text-red-400" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <Button
              variant="ghost"
              className="inline-flex items-center justify-center p-2 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
              onClick={() => setState(prev => ({ ...prev, mobileMenuOpen: !prev.mobileMenuOpen }))}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" />
              ) : (
                <Bars3Icon className="block h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-t border-slate-200">
          <div className="pt-2 pb-3 space-y-1 px-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  )}
                  onClick={() => setState(prev => ({ ...prev, mobileMenuOpen: false }))}
                >
                  <item.icon className={cn(
                    "w-5 h-5 mr-3",
                    isActive ? "text-white" : "text-gray-500"
                  )} />
                  {item.name}
                </Link>
              );
            })}
          </div>
          <div className="pt-4 pb-3 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-slate-200 flex items-center justify-center">
                  {user?.avatar ? (
                    <img className="h-10 w-10 rounded-lg object-cover" src={user.avatar} alt={`${user?.firstName} ${user?.lastName}`} />
                  ) : (
                    <UserIcon className="h-5 w-5 text-slate-600" />
                  )}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-slate-900">{user?.firstName} {user?.lastName}</div>
                <div className="text-xs text-slate-500">{user?.email}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1 px-2">
              <Link
                href="/profile"
                className="flex items-center px-4 py-3 text-base font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg"
                onClick={() => setState(prev => ({ ...prev, mobileMenuOpen: false }))}
              >
                <UserIcon className="h-5 w-5 mr-3 text-slate-400" />
                Your Profile
              </Link>
              {user?.role?.toLowerCase() !== 'tutor' && (
                <Link
                  href="/create-user"
                  className="flex items-center px-4 py-3 text-base font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg"
                  onClick={() => setState(prev => ({ ...prev, mobileMenuOpen: false }))}
                >
                  <UserPlusIcon className="h-5 w-5 mr-3 text-slate-400" />
                  Create User
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center w-full text-left px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3 text-red-400" />
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