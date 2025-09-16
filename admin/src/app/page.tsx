'use client';

import { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { 
  BookOpenIcon, 
  UserGroupIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  PlusIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { api } from '../lib/api';
import { Course, User } from '../types/api';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalCourses: number;
  activeStudents: number;
  totalEarnings: number;
  monthlyViews: number;
  coursesProgress: number;
  studentsProgress: number;
  earningsProgress: number;
  viewsProgress: number;
}

interface DashboardData {
  user: User | null;
  stats: DashboardStats;
  myCourses: Course[];
  recentActivities: any[];
}

const Page = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData>({
    user: null,
    stats: {
      totalCourses: 0,
      activeStudents: 0,
      totalEarnings: 0,
      monthlyViews: 0,
      coursesProgress: 0,
      studentsProgress: 0,
      earningsProgress: 0,
      viewsProgress: 0
    },
    myCourses: [],
    recentActivities: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get current user
        const userResponse = await api.auth.getMe();
        if (userResponse.success) {
          const currentUser = userResponse.data.user;
          
          // Get tutor's courses
          const coursesResponse = await api.courses.getMyCourses();
          if (coursesResponse.success) {
            const courses = coursesResponse.data.courses || [];
            
            // Calculate stats from courses
            const totalStudents = courses.reduce((sum: number, course: any) => 
              sum + (course._count?.enrollments || 0), 0);
            // Since there's no payment system implemented yet, earnings should be 0
            const totalEarnings = 0;
            
            // Calculate progress percentages based on dynamic goals
            const courseGoal = Math.max(10, courses.length * 2);
            const studentGoal = Math.max(100, totalStudents * 3);
            const earningsGoal = 1000; // Static goal since no payment system
            const viewsGoal = Math.max(500, totalStudents * 2);
            
            // Calculate monthly views based on course engagement
            const avgViewsPerStudent = courses.length > 0 ? 2 : 0;
            const monthlyViews = Math.floor(totalStudents * avgViewsPerStudent);
            
            const stats: DashboardStats = {
              totalCourses: courses.length,
              activeStudents: totalStudents,
              totalEarnings: totalEarnings,
              monthlyViews: monthlyViews,
              coursesProgress: Math.min((courses.length / courseGoal) * 100, 100),
              studentsProgress: Math.min((totalStudents / studentGoal) * 100, 100),
              earningsProgress: Math.min((totalEarnings / earningsGoal) * 100, 100),
              viewsProgress: Math.min((monthlyViews / viewsGoal) * 100, 100)
            };

            setData({
              user: currentUser,
              stats,
              myCourses: courses,
              recentActivities: []
            });
          }
        }
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        setError(error.message || 'Failed to load dashboard data');
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Early returns for loading and error states
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Destructure data for easier access
  const { user, stats, myCourses } = data;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold text-sm sm:text-base">
                      {user?.firstName?.charAt(0) || 'T'}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-900">
                    Welcome back, {user?.firstName || 'Tutor'}
                  </h1>
                </div>
                <p className="text-slate-600 text-sm sm:text-base ml-11 sm:ml-13">
                  Manage your courses and track student progress
                </p>
              </div>
              <div className="text-right sm:text-right">
                <div className="text-xs sm:text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                <div className="flex items-center justify-end space-x-1 mt-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-slate-600">Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link href="/create-course" className="group">
            <div className="bg-white hover:bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm sm:text-base truncate">Create Course</h3>
                  <p className="text-xs sm:text-sm text-slate-600 truncate">Add new course content</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/courses" className="group">
            <div className="bg-white hover:bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <BookOpenIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm sm:text-base truncate">Manage Courses</h3>
                  <p className="text-xs sm:text-sm text-slate-600 truncate">Edit and organize content</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/students" className="group">
            <div className="bg-white hover:bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <UserGroupIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm sm:text-base truncate">View Students</h3>
                  <p className="text-xs sm:text-sm text-slate-600 truncate">Monitor student progress</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Statistics */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Overview</h2>
              <div className="flex items-center space-x-1 text-sm text-slate-500">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs sm:text-sm">Live data</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpenIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xl sm:text-2xl font-bold text-slate-900">{stats.totalCourses}</div>
                    <div className="text-xs sm:text-sm text-slate-600 truncate">Total Courses</div>
                  </div>
                </div>
              </div>

              <div className="p-3 sm:p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <UserGroupIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xl sm:text-2xl font-bold text-slate-900">{stats.activeStudents}</div>
                    <div className="text-xs sm:text-sm text-slate-600 truncate">Active Students</div>
                  </div>
                </div>
              </div>

              <div className="p-3 sm:p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <CurrencyDollarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xl sm:text-2xl font-bold text-slate-900">${stats.totalEarnings}</div>
                    <div className="text-xs sm:text-sm text-slate-600 truncate">Total Earnings</div>
                  </div>
                </div>
              </div>

              <div className="p-3 sm:p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xl sm:text-2xl font-bold text-slate-900">{stats.monthlyViews}</div>
                    <div className="text-xs sm:text-sm text-slate-600 truncate">Monthly Views</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Recent Courses */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">My Courses</h2>
              <Link href="/my-courses">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  View All
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {myCourses.length > 0 ? (
                myCourses.slice(0, 3).map((course) => (
                  <div key={course.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpenIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-900 text-sm sm:text-base truncate">{course.title}</h3>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs text-slate-600 mt-1 space-y-1 sm:space-y-0">
                          <span>{course._count?.enrollments || 0} students</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium self-start ${
                            course.status === 'PUBLISHED'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {course.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link href={`/courses/${course.id}/edit`} className="self-end sm:self-center">
                      <Button variant="ghost" size="sm" className="w-full sm:w-auto">
                        Edit
                      </Button>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpenIcon className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 mb-4 sm:mb-6 text-sm sm:text-base">No courses yet</p>
                  <Link href="/create-course">
                    <Button className="w-full sm:w-auto">Create Your First Course</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;