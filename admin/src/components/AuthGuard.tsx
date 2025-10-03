'use client';

import { useAuth } from '../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import Navbar from './layout/Navbar';

interface AuthGuardProps {
  children: ReactNode;
}

// Pages that don't require authentication
const publicRoutes = ['/login', '/forgot-password', '/register-tutor'];

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect if still loading
    if (loading) {
      return;
    }

    // If user is authenticated and on login page, redirect to dashboard
    if (isAuthenticated && pathname === '/login') {
      router.push('/');
      return;
    }

    // If on a public route and not login page, allow access
    if (publicRoutes.includes(pathname) && pathname !== '/login') {
      return;
    }

    // Redirect to login if not authenticated and not on a public route
    if (!isAuthenticated && !publicRoutes.includes(pathname)) {
      router.push('/login');
      return;
    }

    // Since we're using admin-specific routes, if user exists, they're already an admin
  }, [loading, isAuthenticated, user, router, pathname]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render protected content if not authenticated (unless on public route)
  if (!publicRoutes.includes(pathname) && !isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  // Since we're using admin-specific routes, no additional role check needed

  // For public routes, don't show navbar if user is not authenticated
  const shouldShowNavbar = !publicRoutes.includes(pathname) || isAuthenticated;

  return (
    <div className="min-h-screen">
      {shouldShowNavbar && <Navbar />}
      <main className={shouldShowNavbar ? "flex-1" : ""}>
        {children}
      </main>
    </div>
  );
}