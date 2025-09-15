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
            const totalEarnings = courses.reduce((sum: number, course: any) => 
              sum + ((course._count?.enrollments || 0) * course.price), 0);
            
            // Calculate progress percentages based on dynamic goals
            const courseGoal = Math.max(10, courses.length * 2);
            const studentGoal = Math.max(100, totalStudents * 3);
            const earningsGoal = Math.max(1000, totalEarnings * 2);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome back, {user?.firstName || 'Tutor'}! 👋
              </h1>
              <p className="text-gray-600 text-lg mt-2">Here's what's happening with your courses today.</p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="text-sm text-gray-500">Today's Date</div>
                <div className="text-lg font-semibold text-gray-900">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <Link href="/create-course" className="flex-1">
            <div className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-2xl p-6 text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Create New Course</h3>
                  <p className="text-blue-100 text-sm">Start teaching and reach new students</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl group-hover:bg-white/30 transition-all">
                  <PlusIcon className="w-6 h-6" />
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            </div>
          </Link>
          <Link href="/my-courses" className="flex-1">
            <div className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-2xl p-6 text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Manage Courses</h3>
                  <p className="text-purple-100 text-sm">Edit and track your course performance</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl group-hover:bg-white/30 transition-all">
                  <BookOpenIcon className="w-6 h-6" />
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            </div>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-xl group-hover:bg-blue-200 transition-colors">
                <BookOpenIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{stats.totalCourses}</div>
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
              </div>
            </div>
            <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${stats.coursesProgress}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-xl group-hover:bg-green-200 transition-colors">
                <UserGroupIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{stats.activeStudents}</div>
                <p className="text-sm font-medium text-gray-600">Active Students</p>
              </div>
            </div>
            <div className="h-2 bg-green-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                style={{ width: `${stats.studentsProgress}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-xl group-hover:bg-purple-200 transition-colors">
                <CurrencyDollarIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">${stats.totalEarnings.toFixed(0)}</div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              </div>
            </div>
            <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${stats.earningsProgress}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-xl group-hover:bg-orange-200 transition-colors">
                <ChartBarIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{stats.monthlyViews.toLocaleString()}</div>
                <p className="text-sm font-medium text-gray-600">Monthly Views</p>
              </div>
            </div>
            <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-500"
                style={{ width: `${stats.viewsProgress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* My Courses */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Courses</h2>
              <Link href="/my-courses">
                <Button variant="ghost" size="sm" className="flex items-center text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                  View All
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="space-y-4">
              {myCourses.length > 0 ? (
                myCourses.slice(0, 3).map((course) => (
                  <div key={course.id} className="group bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-all duration-200 border border-gray-100 hover:border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{course.title}</h3>
                        <div className="flex items-center space-x-4 mt-2 text-sm">
                          <span className="flex items-center text-blue-600">
                            <UserGroupIcon className="w-4 h-4 mr-1" />
                            {course._count?.enrollments || 0}
                          </span>
                          <span className="flex items-center text-green-600">
                            <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                            ${((course._count?.enrollments || 0) * course.price).toFixed(0)}
                          </span>
                          <span className="flex items-center text-yellow-600">
                            ⭐ {course.averageRating?.toFixed(1) || 'N/A'}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            course.status === 'PUBLISHED' 
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : course.status === 'DRAFT'
                              ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}>
                            {course.status.charAt(0) + course.status.slice(1).toLowerCase()}
                          </span>
                        </div>
                      </div>
                      <Link href={`/courses/${course.id}/edit`}>
                        <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="bg-blue-50 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <BookOpenIcon className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
                  <p className="text-gray-600 mb-6">Create your first course to get started!</p>
                  <Link href="/create-course">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Create Course
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {myCourses.length > 0 ? (
                <>
                  <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <div className="bg-blue-500 p-2 rounded-lg">
                      <BookOpenIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="font-medium text-gray-900">
                        You have {stats.totalCourses} active courses
                      </p>
                      <p className="text-sm text-blue-600">Updated just now</p>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.totalCourses}
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                    <div className="bg-green-500 p-2 rounded-lg">
                      <CurrencyDollarIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="font-medium text-gray-900">
                        Total revenue generated
                      </p>
                      <p className="text-sm text-green-600">Calculated from enrollments</p>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      ${stats.totalEarnings.toFixed(0)}
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                    <div className="bg-purple-500 p-2 rounded-lg">
                      <UserGroupIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="font-medium text-gray-900">
                        Students enrolled across all courses
                      </p>
                      <p className="text-sm text-purple-600">All time enrollment</p>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.activeStudents}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-xl w-fit mx-auto mb-4">
                      <UserGroupIcon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Welcome to the tutor dashboard! 🎉
                    </h3>
                    <p className="text-gray-600 mb-4">Create your first course to get started and begin your teaching journey.</p>
                    <Link href="/create-course">
                      <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        Get started today
                      </Button>
                    </Link>
                  </div>
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