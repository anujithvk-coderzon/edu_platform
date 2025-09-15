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
  UserGroupIcon
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

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'My Courses', href: '/my-courses', icon: BookOpenIcon },
  { name: 'Create Course', href: '/create-course', icon: UserIcon },
  { name: 'Students', href: '/students', icon: UserGroupIcon },
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
      <nav className="bg-white/90 backdrop-blur-lg shadow-lg border-b border-blue-100/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center group">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <span className="text-white font-bold text-xl">C</span>
                </div>
                <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">CoderZone</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">Organization Login</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white/95 backdrop-blur-lg shadow-lg border-b border-blue-100/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Main Nav */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center group">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <span className="text-white font-bold text-xl">C</span>
                </div>
                <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">CoderZone</span>
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
                      'inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 group',
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:shadow-md'
                    )}
                  >
                    <item.icon className={cn(
                      "w-4 h-4 mr-2 transition-transform duration-300",
                      isActive ? "text-white" : "text-gray-500 group-hover:text-blue-500 group-hover:scale-110"
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
                  className="flex items-center text-sm rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover:bg-blue-50 transition-all duration-300 group"
                  onClick={() => setState(prev => ({ ...prev, userMenuOpen: !prev.userMenuOpen }))}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
                    {user?.avatar ? (
                      <img className="h-9 w-9 rounded-xl object-cover" src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
                    ) : (
                      <UserIcon className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div className="ml-3 text-left hidden lg:block">
                    <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-blue-600 uppercase font-medium">{user?.role}</p>
                  </div>
                  <ChevronDownIcon className="ml-2 h-4 w-4 text-gray-500 group-hover:text-blue-600 transition-colors duration-300" />
                </Button>
              </div>
              
              {userMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-2xl py-2 bg-white/95 backdrop-blur-lg ring-1 ring-black/5 z-50 border border-blue-100/50">
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-xl border-b border-blue-100/50">
                    <p className="font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                    <p className="text-xs text-blue-600 uppercase font-bold mt-1 px-2 py-1 bg-blue-100 rounded-full inline-block">{user?.role}</p>
                  </div>
                  <Link href="/profile" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group">
                    <UserIcon className="h-4 w-4 mr-3 text-gray-400 group-hover:text-blue-500" />
                    Your Profile
                  </Link>
                  <Link href="/settings" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group">
                    <UserIcon className="h-4 w-4 mr-3 text-gray-400 group-hover:text-blue-500" />
                    Settings
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-all duration-200 group rounded-b-xl"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3 text-red-400 group-hover:text-red-500" />
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
        <div className="sm:hidden bg-white/95 backdrop-blur-lg border-t border-blue-100/50">
          <div className="pt-2 pb-3 space-y-1 px-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-4 py-3 rounded-xl text-base font-medium transition-all duration-300',
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
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
          <div className="pt-4 pb-3 border-t border-blue-100/50 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center shadow-md">
                  {user?.avatar ? (
                    <img className="h-12 w-12 rounded-xl object-cover" src={user.avatar} alt={`${user?.firstName} ${user?.lastName}`} />
                  ) : (
                    <UserIcon className="h-6 w-6 text-blue-600" />
                  )}
                </div>
              </div>
              <div className="ml-4">
                <div className="text-base font-semibold text-gray-900">{user?.firstName} {user?.lastName}</div>
                <div className="text-sm text-gray-600">{user?.email}</div>
                <div className="text-xs text-blue-600 uppercase font-bold mt-1 px-2 py-1 bg-blue-100 rounded-full inline-block">{user?.role}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1 px-2">
              <Link
                href="/profile"
                className="flex items-center px-4 py-3 text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                onClick={() => setState(prev => ({ ...prev, mobileMenuOpen: false }))}
              >
                <UserIcon className="h-5 w-5 mr-3 text-gray-400" />
                Your Profile
              </Link>
              <Link
                href="/settings"
                className="flex items-center px-4 py-3 text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                onClick={() => setState(prev => ({ ...prev, mobileMenuOpen: false }))}
              >
                <UserIcon className="h-5 w-5 mr-3 text-gray-400" />
                Settings
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center w-full text-left px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
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