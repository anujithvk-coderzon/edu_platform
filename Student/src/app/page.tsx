'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  BookOpenIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  StarIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
  UsersIcon,
  PlayIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { getImageUrl } from '@/utils/imageUtils';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  level: string;
  duration: number;
  averageRating: number;
  tutorName?: string;
  isEnrolled: boolean;
  hasReviewed?: boolean;
  enrollmentStatus?: string;
  progressPercentage?: number;
  hasNewContent?: boolean;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string;
  };
  category: {
    id: string;
    name: string;
  } | null;
  _count: {
    enrollments: number;
    materials: number;
    reviews: number;
  };
}

interface Enrollment {
  id: string;
  courseId: string;
  progressPercentage: number;
  status: string;
  enrolledAt: string;
  completedAt?: string;
  hasReviewed?: boolean;
  completedMaterials: number;
  totalTimeSpent: number;
  hasNewContent?: boolean;
  course: Course;
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeStudents: 0, // Real unique students from platform
    completedCourses: 0,
    totalHours: 0,
    averageRating: 0 // Real platform-wide average rating
  });
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]); // For stats calculation
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch platform statistics (real data from backend)
      const platformStatsResponse = await api.platform.getStats();
      if (platformStatsResponse.success && platformStatsResponse.data) {
        setStats(prev => ({
          ...prev,
          totalCourses: platformStatsResponse.data.totalCourses || 0,
          activeStudents: platformStatsResponse.data.totalStudents || 0, // Real unique students count
          averageRating: platformStatsResponse.data.averageRating || 0
        }));
      }

      // Get featured courses (backend now includes enrollment data)
      const coursesResponse = await api.courses.getAll({ limit: 8 });
      if (coursesResponse.success && coursesResponse.data) {
        const courses = coursesResponse.data.courses || [];
        setFeaturedCourses(courses);
      }

      // If user is logged in, get their enrollments
      if (user) {
        try {
          // Fetch ALL enrollments for accurate stats calculation
          const allEnrollmentsResponse = await api.enrollments.getMy({ limit: 1000 });
          if (allEnrollmentsResponse.success) {
            const allEnrolls = allEnrollmentsResponse.data.enrollments || [];
            setAllEnrollments(allEnrolls);
            setStats(prev => ({
              ...prev,
              completedCourses: allEnrolls.filter((e: any) => e.status === 'COMPLETED' || (e.progressPercentage ?? 0) >= 100).length,
              totalHours: Math.round(allEnrolls.reduce((total: number, e: any) => total + (e.totalTimeSpent || 0), 0) / 60)
            }));
          }

          // Fetch paginated enrollments (8) for Continue Learning widget display
          const enrollmentsResponse = await api.enrollments.getMy({ limit: 8 });
          if (enrollmentsResponse.success) {
            const enrollments = enrollmentsResponse.data.enrollments || [];
            setMyEnrollments(enrollments);
          }
        } catch (error) {
        }
      }

    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/courses?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const getCourseButtonState = (course: Course) => {
    if (!course.isEnrolled) {
      return { text: 'View Course', href: `/courses/${course.id}` };
    }

    const isCompleted = course.enrollmentStatus === 'COMPLETED' || (course.progressPercentage && course.progressPercentage >= 100);

    if (isCompleted) {
      // If completed but has new content, show "View New Content"
      if (course.hasNewContent) {
        return { text: 'View New Content', href: `/learn/${course.id}` };
      }
      // If completed and reviewed, show "View Contents"
      if (course.hasReviewed) {
        return { text: 'View Contents', href: `/courses/${course.id}` };
      }
      // If completed but not reviewed, show "Rate Course"
      return { text: 'Rate Course', href: `/courses/${course.id}/rate` };
    } else {
      return { text: 'Continue Learning', href: `/learn/${course.id}` };
    }
  };

  const getCourseStatusBadge = (course: Course) => {
    if (!course.isEnrolled) return null;

    const isCompleted = course.enrollmentStatus === 'COMPLETED' || (course.progressPercentage && course.progressPercentage >= 100);

    if (isCompleted) {
      return { text: 'Completed', color: 'bg-green-500' };
    } else {
      return { text: `${Math.round(course.progressPercentage || 0)}%`, color: 'bg-indigo-600' };
    }
  };

  const getEnrollmentButtonState = (enrollment: Enrollment) => {
    const isCompleted = (enrollment.progressPercentage ?? 0) >= 100 || enrollment.status === 'COMPLETED';
    const courseId = enrollment.course?.id || enrollment.courseId;

    if (isCompleted) {
      // If completed but has new content, show "View New Content"
      if (enrollment.hasNewContent) {
        return { text: 'View New Content', href: `/learn/${courseId}`, type: 'new-content' };
      }
      // If completed and reviewed, show "View Contents"
      if (enrollment.hasReviewed) {
        return { text: 'View Contents', href: `/courses/${courseId}`, type: 'completed' };
      }
      // If completed but not reviewed, show "Rate Course"
      return { text: 'Rate Course', href: `/courses/${courseId}/rate`, type: 'rate' };
    } else {
      return { text: 'Continue Learning', href: `/learn/${courseId}`, type: 'continue' };
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section - Compact & Modern */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 relative z-10">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-white">
              {user ? `Welcome back, ${user.firstName}!` : 'Advance Your Career with Expert-Led Courses'}
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto">
              {user
                ? 'Continue your learning journey with our professional courses designed for career growth'
                : `Access ${stats.totalCourses > 0 ? `${stats.totalCourses}+` : 'premium'} courses from industry experts and transform your career`
              }
            </p>

            {/* Search Bar - Compact */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-6 sm:mb-8">
              <div className="relative group">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for courses..."
                  className="w-full px-4 sm:px-5 py-3 text-slate-900 bg-white rounded-xl focus:outline-none focus:ring-4 focus:ring-white/30 pl-11 sm:pl-12 pr-24 text-sm sm:text-base placeholder:text-slate-400 shadow-xl transition-all duration-300"
                />
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-slate-900 text-white px-5 py-2 rounded-lg hover:bg-slate-800 transition-all duration-300 font-medium text-sm"
                >
                  Search
                </button>
              </div>
            </form>

            {/* CTA Buttons - Compact */}
            <div className="flex gap-3 justify-center flex-wrap mb-8 sm:mb-10">
              <Link href="/my-courses">
                <button className="bg-white text-slate-900 px-5 sm:px-6 py-2.5 rounded-lg font-semibold hover:bg-slate-100 transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base">
                  My Courses
                </button>
              </Link>
              {user ? (
                <Link href="/courses">
                  <button className="border-2 border-white text-white px-5 sm:px-6 py-2.5 rounded-lg font-semibold hover:bg-white/10 transition-all duration-300 text-sm sm:text-base">
                    Browse All Courses
                  </button>
                </Link>
              ) : (
                <Link href="/register">
                  <button className="bg-slate-900 text-white px-5 sm:px-6 py-2.5 rounded-lg font-semibold hover:bg-slate-800 transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base">
                    Start Free Trial
                  </button>
                </Link>
              )}
            </div>

            {/* Stats - Inline on larger screens */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-3xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-white/20 hover:bg-white/15 transition-colors">
                <AcademicCapIcon className="h-7 w-7 sm:h-8 sm:w-8 mx-auto text-white mb-2" />
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{stats.totalCourses || 0}+</div>
                <div className="text-white/80 text-xs sm:text-sm mt-1">Courses</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-white/20 hover:bg-white/15 transition-colors">
                <UsersIcon className="h-7 w-7 sm:h-8 sm:w-8 mx-auto text-white mb-2" />
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                  {stats.activeStudents > 0 ? `${stats.activeStudents.toLocaleString()}+` : '-'}
                </div>
                <div className="text-white/80 text-xs sm:text-sm mt-1">Students</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-white/20 hover:bg-white/15 transition-colors">
                <StarIcon className="h-7 w-7 sm:h-8 sm:w-8 mx-auto text-white mb-2" />
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                  {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-'}
                </div>
                <div className="text-white/80 text-xs sm:text-sm mt-1">Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Personal Stats for logged in users */}
        {user && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                Your Learning Progress
              </h2>
              <div className="flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-full self-start sm:self-center border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-700">Active</span>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 sm:p-5 border border-blue-100 hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row items-center sm:space-x-3 text-center sm:text-left">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg mb-1.5 sm:mb-0">
                    <BookOpenIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 whitespace-nowrap">{allEnrollments.filter(e => e.status !== 'COMPLETED' && (e.progressPercentage ?? 0) < 100).length}</div>
                    <p className="text-xs text-slate-600 font-medium whitespace-nowrap">Active</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 sm:p-5 border border-green-100 hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row items-center sm:space-x-3 text-center sm:text-left">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg mb-1.5 sm:mb-0">
                    <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 whitespace-nowrap">{stats.completedCourses}</div>
                    <p className="text-xs text-slate-600 font-medium whitespace-nowrap">Completed</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-3 sm:p-5 border border-purple-100 hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row items-center sm:space-x-3 text-center sm:text-left">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg mb-1.5 sm:mb-0">
                    <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 whitespace-nowrap">{stats.totalHours}h</div>
                    <p className="text-xs text-slate-600 font-medium whitespace-nowrap">Studied</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 sm:p-5 border border-amber-100 hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row items-center sm:space-x-3 text-center sm:text-left">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg mb-1.5 sm:mb-0">
                    <ChartBarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 whitespace-nowrap">
                      {allEnrollments.length > 0 ? Math.round(allEnrollments.reduce((sum, e) => sum + (e.progressPercentage ?? 0), 0) / allEnrollments.length) : 0}%
                    </div>
                    <p className="text-xs text-slate-600 font-medium whitespace-nowrap">Progress</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Continue Learning Section */}
        {user && myEnrollments.filter(e => e.status !== 'COMPLETED' && (e.progressPercentage ?? 0) < 100).length > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Continue Learning</h2>
              <Link href="/my-courses">
                <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center group">
                  View All
                  <ArrowRightIcon className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myEnrollments.filter(e => e.status !== 'COMPLETED' && (e.progressPercentage ?? 0) < 100).slice(0, 3).map((enrollment) => (
                <div key={enrollment.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-indigo-200 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-slate-900 line-clamp-2 text-sm pr-2 group-hover:text-indigo-600 transition-colors">{enrollment.course?.title}</h3>
                    <div className="flex flex-col gap-1 items-end flex-shrink-0">
                      <span className="text-sm font-bold bg-indigo-600 px-2 py-1 rounded-lg shadow-sm" style={{ color: 'white' }}>{Math.round(enrollment.progressPercentage ?? 0)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 mb-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${enrollment.progressPercentage ?? 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-1">
                      <PlayIcon className="h-3.5 w-3.5" />
                      <span>{enrollment.completedMaterials || 0} lessons</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ClockIcon className="h-3.5 w-3.5" />
                      <span>{Math.round((enrollment.totalTimeSpent || 0) / 60)}h</span>
                    </div>
                  </div>

                  {(() => {
                    const buttonState = getEnrollmentButtonState(enrollment);
                    return (
                      <Link href={buttonState.href}>
                        <button className={`w-full py-2.5 rounded-lg transition-all text-sm font-semibold flex items-center justify-center gap-2 ${
                          buttonState.type === 'completed'
                            ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-600/30'
                            : buttonState.type === 'rate'
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-lg shadow-yellow-500/30'
                            : buttonState.type === 'new-content'
                            ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-600/30 animate-pulse'
                            : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/30'
                        }`}>
                          <PlayIcon className="h-4 w-4" />
                          {buttonState.text}
                        </button>
                      </Link>
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Featured Courses */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Featured Courses</h2>
            <Link href="/courses">
              <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center group">
                View All
                <ArrowRightIcon className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm animate-pulse overflow-hidden">
                  <div className="h-48 bg-slate-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-slate-200 rounded mb-2"></div>
                    <div className="h-5 bg-slate-200 rounded mb-3"></div>
                    <div className="h-3 bg-slate-200 rounded mb-4"></div>
                    <div className="h-9 bg-slate-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredCourses.length > 0 ? (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {featuredCourses.map((course) => (
                  <div key={course.id} className="group bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-slate-300 transition-all duration-300 overflow-hidden flex flex-col h-full">
                    {/* Thumbnail */}
                    <div className="relative h-48 bg-slate-100 overflow-hidden flex-shrink-0">
                      {course.thumbnail && getImageUrl(course.thumbnail) ? (
                        <img
                          src={getImageUrl(course.thumbnail)!}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                          <BookOpenIcon className="h-16 w-16 text-white/80" />
                        </div>
                      )}
                      {(() => {
                        const badge = getCourseStatusBadge(course);
                        return badge && (
                          <div className={`absolute top-2 right-2 ${badge.color} px-2 py-1 rounded-lg text-xs font-semibold shadow-lg z-10`} style={{ color: 'white' }}>
                            {badge.text}
                          </div>
                        );
                      })()}
                      {/* New Content Badge */}
                      {course.hasNewContent && (
                        <div className="absolute top-12 right-2 bg-orange-500 px-2 py-1 rounded-lg text-xs font-semibold shadow-lg z-10 animate-pulse" style={{ color: 'white' }}>
                          🆕 New Content
                        </div>
                      )}
                      {course.level && (
                        <div className="absolute top-2 left-2 bg-white/95 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200 backdrop-blur-sm z-10">
                          {course.level}
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col">
                      {/* Category */}
                      {course.category && (
                        <span className="text-xs font-semibold text-indigo-600 mb-2 uppercase tracking-wide">
                          {course.category.name}
                        </span>
                      )}

                      {/* Title */}
                      <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 text-sm group-hover:text-indigo-600 transition-colors">
                        {course.title}
                      </h3>

                      {/* Description */}
                      <p className="text-slate-600 text-xs mb-3 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>

                      {/* Instructor */}
                      <div className="text-xs text-slate-600 mb-3 truncate">
                        by {course.tutorName || (course.creator ? `${course.creator.firstName} ${course.creator.lastName}` : 'Instructor')}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 mb-3 pb-3 border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-1">
                          <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-xs font-semibold text-slate-700">
                            {course.averageRating?.toFixed(1) || '0.0'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-600">
                          <UserGroupIcon className="h-4 w-4" />
                          <span className="text-xs">{course._count?.enrollments || 0}</span>
                        </div>
                        {course.duration && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <ClockIcon className="h-4 w-4" />
                            <span className="text-xs">{course.duration}h</span>
                          </div>
                        )}
                      </div>

                      {/* Price & CTA */}
                      <div className="mt-auto flex items-center justify-between">
                        <span className="text-lg font-bold text-slate-900">
                          {course.price === 0 ? 'Free' : `$${course.price}`}
                        </span>
                        {(() => {
                          const buttonState = getCourseButtonState(course);
                          return (
                            <Link href={buttonState.href}>
                              <button className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all ${
                                buttonState.text === 'View Contents'
                                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-600/30'
                                  : buttonState.text === 'Rate Course'
                                  ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/30'
                                  : buttonState.text === 'View New Content'
                                  ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-600/30 animate-pulse'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/30'
                              }`}>
                                {buttonState.text}
                              </button>
                            </Link>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* View All Courses Button */}
              <div className="text-center mt-8">
                <Link href="/courses">
                  <button className="inline-flex items-center px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-semibold text-sm shadow-xl hover:shadow-2xl hover:scale-105 group">
                    View All Courses
                    <ArrowRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
              <AcademicCapIcon className="h-20 w-20 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No courses available yet</h3>
              <p className="text-slate-600">Check back later for new courses!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
