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
  ArrowRightIcon,
  CalendarIcon,
  UserIcon,
  EnvelopeIcon,
  ClockIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { api } from '../lib/api';
import { Course, User } from '../types/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalCourses: number;
  totalStudents: number; // Total students in database
  totalEnrollments: number; // Total enrollments count
  totalEarnings: number;
  coursesProgress: number;
  studentsProgress: number;
  earningsProgress: number;
  enrollmentsProgress: number;
}

interface DashboardData {
  user: User | null;
  stats: DashboardStats;
  myCourses: Course[];
  recentActivities: any[];
}

interface RegisteredStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

type TimePeriod = '1week' | '1month' | '6months';

const timePeriodLabels = {
  '1week': 'Last 7 Days',
  '1month': 'Last 30 Days',
  '6months': 'Last 6 Months'
};

const Page = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData>({
    user: null,
    stats: {
      totalCourses: 0,
      totalStudents: 0,
      totalEnrollments: 0,
      totalEarnings: 0,
      coursesProgress: 0,
      studentsProgress: 0,
      earningsProgress: 0,
      enrollmentsProgress: 0
    },
    myCourses: [],
    recentActivities: []
  });
  const { user } = useAuth();
  const [students, setStudents] = useState<RegisteredStudent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<RegisteredStudent[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1month');

  useEffect(() => {
    filterStudentsByPeriod();
  }, [students, selectedPeriod]);

  const filterStudentsByPeriod = () => {
    const now = new Date();
    let cutoffDate = new Date();

    switch (selectedPeriod) {
      case '1week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '1month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '6months':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
    }

    const filtered = students.filter(student => {
      const registrationDate = new Date(student.createdAt);
      return registrationDate >= cutoffDate;
    });

    // Sort by most recent first
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredStudents(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

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

          // Get proper counts from database
          let totalStudentsCount = 0;
          let totalEnrollmentsCount = 0;
          let totalCoursesCount = 0;

          // Get student count from dedicated endpoint
          try {
            const studentsCountResponse = await api.admin.getStudentsCount();
            if (studentsCountResponse.success && studentsCountResponse.data?.studentsCount !== undefined) {
              totalStudentsCount = studentsCountResponse.data.studentsCount;
              console.log(`✅ Successfully fetched student count: ${totalStudentsCount}`);
            }
          } catch (error) {
            console.error('❌ Error fetching students count:', error);
          }

          // Get enrollment and course count from stats overview
          try {
            const statsOverviewResponse = await api.admin.getStatsOverview();
            console.log('📊 Stats overview response:', statsOverviewResponse);

            if (statsOverviewResponse.success && statsOverviewResponse.data?.stats) {
              totalEnrollmentsCount = statsOverviewResponse.data.stats.totalEnrollments || 0;
              totalCoursesCount = statsOverviewResponse.data.stats.totalCourses || 0;
              console.log(`✅ Successfully fetched stats - Enrollments: ${totalEnrollmentsCount}, Courses: ${totalCoursesCount}`);
            } else {
              console.log('⚠️ Stats overview response missing data, using fallback');
            }
          } catch (error) {
            console.error('❌ Error fetching stats overview:', error);
            console.log('🔄 Using fallback counts');
          }

          if (coursesResponse.success) {
            const courses = coursesResponse.data.courses || [];

            // If stats overview didn't work, fallback to calculating from courses
            if (totalCoursesCount === 0) {
              totalCoursesCount = coursesResponse.data.pagination?.total || coursesResponse.data.total || coursesResponse.data.coursesCount || courses.length;
            }

            if (totalEnrollmentsCount === 0) {
              // Calculate total enrollments from the courses as fallback
              courses.forEach((course: any) => {
                totalEnrollmentsCount += course._count?.enrollments || 0;
              });
            }

            console.log(`🎯 Final stats - Courses: ${totalCoursesCount}, Students: ${totalStudentsCount}, Enrollments: ${totalEnrollmentsCount}`);

            // Since there's no payment system implemented yet, earnings should be 0
            const totalEarnings = 0;

            // Calculate progress percentages based on dynamic goals
            const courseGoal = Math.max(10, totalCoursesCount * 2);
            const studentGoal = Math.max(50, totalStudentsCount * 2);
            const earningsGoal = 1000;
            const enrollmentsGoal = Math.max(100, totalEnrollmentsCount * 2);

            const stats: DashboardStats = {
              totalCourses: totalCoursesCount, // Using total count from database
              totalStudents: totalStudentsCount,
              totalEnrollments: totalEnrollmentsCount, // Using total count from database
              totalEarnings: totalEarnings,
              coursesProgress: Math.min((totalCoursesCount / courseGoal) * 100, 100),
              studentsProgress: Math.min((totalStudentsCount / studentGoal) * 100, 100),
              earningsProgress: Math.min((totalEarnings / earningsGoal) * 100, 100),
              enrollmentsProgress: Math.min((totalEnrollmentsCount / enrollmentsGoal) * 100, 100)
            };

            setData({
              user: currentUser,
              stats,
              myCourses: courses,
              recentActivities: []
            });
          }
        }

        // Fetch all registered students directly from Student table
        try {
          const studentsResponse = await api.admin.getAllRegisteredStudents();
          if (studentsResponse.success && studentsResponse.data?.students) {
            const registeredStudents: RegisteredStudent[] = studentsResponse.data.students.map((student: any) => ({
              id: student.id,
              firstName: student.firstName,
              lastName: student.lastName,
              email: student.email,
              createdAt: student.registeredAt // This is the student's registration date from DB
            }));
            setStudents(registeredStudents);
          }
        } catch (error) {
          console.error('Error fetching registered students:', error);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        const message = error instanceof Error ? error.message : 'Failed to load dashboard data';
        setError(message);
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
  const { user: dashboardUser, stats, myCourses } = data;


  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
        {/* Header */}
        <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-8">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <div className="flex items-center space-x-2 sm:space-x-3 mb-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-white font-semibold text-xs sm:text-sm md:text-base">
                      {user?.firstName?.charAt(0) || 'T'}
                    </span>
                  </div>
                  <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-semibold text-slate-900">
                    Welcome back, {user?.firstName || 'Tutor'}
                  </h1>
                </div>
                <p className="text-slate-600 text-xs sm:text-sm md:text-base ml-10 sm:ml-11 md:ml-13">
                  Manage your courses and track student progress
                </p>
              </div>
              <div className="text-right sm:text-right">
                <div className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                <div className="flex items-center justify-end space-x-1 mt-0.5 sm:mt-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] sm:text-xs text-slate-600">Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-5 md:mb-6 lg:mb-8">
          <Link href="/create-course" className="group">
            <div className="bg-white hover:bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4 transition-all duration-200 hover:shadow-md">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300 transition-all shadow-sm">
                  <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-xs sm:text-sm md:text-base truncate">Create Course</h3>
                  <p className="text-[10px] sm:text-xs md:text-sm text-slate-600 truncate">Add new course content</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/my-courses" className="group">
            <div className="bg-white hover:bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4 transition-all duration-200 hover:shadow-md">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center group-hover:from-green-200 group-hover:to-green-300 transition-all shadow-sm">
                  <BookOpenIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-xs sm:text-sm md:text-base truncate">Manage Courses</h3>
                  <p className="text-[10px] sm:text-xs md:text-sm text-slate-600 truncate">Edit and organize content</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/students" className="group">
            <div className="bg-white hover:bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4 transition-all duration-200 hover:shadow-md">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center group-hover:from-purple-200 group-hover:to-purple-300 transition-all shadow-sm">
                  <UserGroupIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-xs sm:text-sm md:text-base truncate">View Students</h3>
                  <p className="text-[10px] sm:text-xs md:text-sm text-slate-600 truncate">Monitor student progress</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity Section - Admin Only */}
        {user?.role?.toLowerCase() === 'admin' && (
          <div className="mb-6 sm:mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-1">Recent Activity</h2>
                  <p className="text-sm text-slate-600">Track recent student registrations</p>
                </div>
              {filteredStudents.length > 1 && (
                <div className="flex items-center gap-2">
                  <ChartBarIcon className="w-5 h-5 text-slate-500" />
                  <span className="text-sm text-slate-600">
                    {filteredStudents.length} registrations
                  </span>
                </div>
              )}
            </div>

            {/* Time Period Filter */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <FunnelIcon className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Filter by Time Period
                </h3>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {(Object.keys(timePeriodLabels) as TimePeriod[]).map((period) => (
                  <Button
                    key={period}
                    variant={selectedPeriod === period ? 'default' : 'outline'}
                    onClick={() => setSelectedPeriod(period)}
                    size="sm"
                    className={`
                      ${selectedPeriod === period
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                      }
                    `}
                  >
                    <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm">{timePeriodLabels[period]}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Students List */}
            {filteredStudents.length > 0 ? (
              <div className="space-y-3">
                {filteredStudents.slice(0, 5).map((student) => (
                  <div
                    key={student.id}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4 hover:bg-white hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      {/* Student Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-md flex-shrink-0">
                          {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
                            <h3 className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                              {student.firstName} {student.lastName}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <EnvelopeIcon className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
                            <p className="text-xs sm:text-sm text-slate-600 truncate">
                              {student.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Registration Date */}
                      <div className="flex flex-col sm:items-end gap-1 flex-shrink-0 pl-13 sm:pl-0">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" />
                          <span className="text-xs sm:text-sm font-medium text-slate-700">
                            {formatDate(student.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 sm:justify-end">
                          <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                          <span className="text-xs text-blue-600 font-medium">
                            {getTimeAgo(student.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 px-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <UserGroupIcon className="w-6 h-6 sm:w-8 sm:h-8 text-slate-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
                  No registrations found
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto">
                  No students registered in the selected time period.
                </p>
              </div>
            )}

            {/* View All Button */}
            {filteredStudents.length > 0 && (
              <div className="mt-6 text-center">
                <Link href="/registrations">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto bg-white hover:bg-blue-50 text-blue-600 border-blue-300 hover:border-blue-400"
                  >
                    View All Registrations
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                {filteredStudents.length > 5 && (
                  <p className="text-xs text-slate-500 mt-2">
                    Showing 5 of {filteredStudents.length} registrations
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        )}

        {/* Statistics */}
        <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-8">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-slate-900">Overview</h2>
              <div className="flex items-center space-x-1 text-sm text-slate-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] sm:text-xs md:text-sm">Live data</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              <div className="p-3 sm:p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all duration-200 border border-slate-100">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center shadow-sm">
                    <BookOpenIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">{stats.totalCourses}</div>
                    <div className="text-[10px] sm:text-xs md:text-sm text-slate-600 truncate">Total Courses</div>
                  </div>
                </div>
              </div>

              <div className="p-3 sm:p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all duration-200 border border-slate-100">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center shadow-sm">
                    <UserGroupIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">{stats.totalStudents}</div>
                    <div className="text-[10px] sm:text-xs md:text-sm text-slate-600 truncate">Total Students</div>
                  </div>
                </div>
              </div>

              {user?.role?.toLowerCase() !== 'tutor' && (
                <div className="p-3 sm:p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all duration-200 border border-slate-100">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center shadow-sm">
                      <CurrencyDollarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">${stats.totalEarnings}</div>
                      <div className="text-[10px] sm:text-xs md:text-sm text-slate-600 truncate">Total Earnings</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 sm:p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all duration-200 border border-slate-100">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center shadow-sm">
                    <UserGroupIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">{stats.totalEnrollments}</div>
                    <div className="text-[10px] sm:text-xs md:text-sm text-slate-600 truncate">Total Enrollments</div>
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
                    <Button className="w-full sm:w-auto">Create Course</Button>
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