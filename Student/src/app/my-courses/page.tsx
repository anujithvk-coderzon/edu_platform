'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import {
  BookOpenIcon,
  ClockIcon,
  PlayIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CalendarIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getImageUrl } from '@/utils/imageUtils';

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
  course: {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    price: number;
    level: string;
    duration: number;
    tutorName?: string;
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
  };
}

export default function MyCoursesPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed'>('all');

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalEnrollments, setTotalEnrollments] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Store ALL enrollments for accurate stats (separate from paginated display)
  const [allEnrollmentsForStats, setAllEnrollmentsForStats] = useState<Enrollment[]>([]);

  useEffect(() => {
    if (user) {
      setPage(1);
      fetchAllEnrollmentsForStats(); // Fetch all for stats
      fetchMyEnrollments(1, false); // Fetch paginated for display
    }
  }, [user]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMyEnrollments(nextPage, true);
  };

  // Fetch ALL enrollments for accurate stats calculation
  const fetchAllEnrollmentsForStats = async () => {
    try {
      const response = await api.enrollments.getMy({
        page: 1,
        limit: 1000 // Fetch all enrollments (large limit)
      });

      if (response.success && response.data) {
        setAllEnrollmentsForStats(response.data.enrollments || []);
        setTotalEnrollments(response.data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching all enrollments for stats:', error);
    }
  };

  const fetchMyEnrollments = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      // Fetch paginated enrollments for display
      const response = await api.enrollments.getMy({
        page: pageNum,
        limit: 8
      });

      if (response.success && response.data) {
        const newEnrollments = response.data.enrollments || [];

        // Append or replace enrollments
        if (append) {
          setEnrollments(prev => [...prev, ...newEnrollments]);
        } else {
          setEnrollments(newEnrollments);
        }

        // Update pagination info
        const totalPages = response.data.pagination?.pages || 1;
        const total = response.data.pagination?.total || 0;
        setHasMore(pageNum < totalPages);
        setTotalEnrollments(total);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error('Failed to load your courses');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const getEnrollmentButtonState = (enrollment: Enrollment) => {
    const isCompleted = enrollment.progressPercentage >= 100 || enrollment.status === 'COMPLETED';
    // Use course.id if available, fallback to courseId
    const courseId = enrollment.course?.id || enrollment.courseId;

    if (isCompleted) {
      if (enrollment.hasReviewed) {
        return { text: 'Completed', href: `/courses/${courseId}` };
      } else {
        return { text: 'Rate Course', href: `/courses/${courseId}/rate` };
      }
    } else {
      return { text: 'Continue Learning', href: `/learn/${courseId}` };
    }
  };

  const filteredEnrollments = enrollments.filter(enrollment => {
    switch (filter) {
      case 'in_progress':
        return enrollment.status !== 'COMPLETED' && enrollment.progressPercentage < 100;
      case 'completed':
        return enrollment.status === 'COMPLETED' || enrollment.progressPercentage >= 100;
      default:
        return true;
    }
  });

  // Calculate stats from ALL enrollments (not paginated) for accuracy
  const statsSource = allEnrollmentsForStats.length > 0 ? allEnrollmentsForStats : enrollments;
  const stats = {
    total: totalEnrollments, // Use total from backend pagination
    active: statsSource.filter(e => e.status !== 'COMPLETED' && e.progressPercentage < 100).length,
    inProgress: statsSource.filter(e => e.status === 'ACTIVE' && e.progressPercentage < 100).length,
    completed: statsSource.filter(e => e.status === 'COMPLETED' || e.progressPercentage >= 100).length,
    totalHours: Math.round(statsSource.reduce((total, e) => total + (e.totalTimeSpent || 0), 0) / 60),
    averageProgress: statsSource.length > 0
      ? Math.min(100, Math.round(statsSource.reduce((sum, e) => sum + Math.min(100, e.progressPercentage), 0) / statsSource.length))
      : 0
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-3">
        <div className="text-center">
          <BookOpenIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Please log in</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">You need to be logged in to view your courses.</p>
          <Link href="/login">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm sm:text-base">
              Log In
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
                My Courses
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                {stats.total > 0
                  ? `${stats.active} active • ${stats.completed} completed • ${stats.averageProgress}% average progress`
                  : 'Start your learning journey by enrolling in courses'
                }
              </p>
            </div>

            <Link href="/courses">
              <button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm hover:shadow-md min-h-[44px]">
                {stats.active > 0 ? 'Browse More Courses' : 'Explore Courses'}
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpenIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-slate-900">{stats.active}</p>
                <p className="text-[10px] sm:text-xs font-medium text-slate-600 uppercase truncate">Active</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <ChartBarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-slate-900">{stats.inProgress}</p>
                <p className="text-[10px] sm:text-xs font-medium text-slate-600 uppercase truncate">In Progress</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-slate-900">{stats.completed}</p>
                <p className="text-[10px] sm:text-xs font-medium text-slate-600 uppercase truncate">Completed</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-slate-900">{stats.totalHours}</p>
                <p className="text-[10px] sm:text-xs font-medium text-slate-600 uppercase truncate">Hours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'all', label: 'All Courses', count: stats.total },
            { key: 'in_progress', label: 'Active', count: stats.active },
            { key: 'completed', label: 'Completed', count: stats.completed }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as typeof filter)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span className="whitespace-nowrap">{label}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-semibold ${
                filter === key
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Course List */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden animate-pulse">
                <div className="aspect-video bg-slate-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded"></div>
                  <div className="h-2 bg-slate-200 rounded"></div>
                  <div className="h-9 bg-slate-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredEnrollments.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredEnrollments.map((enrollment) => (
              <div key={enrollment.id} className="bg-white rounded-lg border border-slate-200 hover:shadow-lg transition-all duration-200 overflow-hidden">
                <div className="relative w-full rounded-t-lg" style={{ height: '208px' }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-t-lg overflow-hidden">
                    {enrollment.course.thumbnail && getImageUrl(enrollment.course.thumbnail) ? (
                      <img
                        src={getImageUrl(enrollment.course.thumbnail)!}
                        alt={enrollment.course.title}
                        className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Failed to load thumbnail in my-courses:', getImageUrl(enrollment.course.thumbnail));
                        console.error('Original thumbnail value:', enrollment.course.thumbnail);
                      }}
                      onLoad={() => {
                        console.log('Successfully loaded thumbnail in my-courses:', getImageUrl(enrollment.course.thumbnail));
                      }}
                      />
                    ) : (
                      <BookOpenIcon className="h-10 w-10 sm:h-12 sm:w-12 text-white/80" />
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-2 right-2 z-10">
                    {enrollment.progressPercentage === 100 ? (
                      <div className="bg-green-600 px-2 py-1 rounded text-xs font-medium" style={{ color: 'white' }}>
                        Completed
                      </div>
                    ) : (
                      <div className="bg-indigo-600 px-2 py-1 rounded text-xs font-medium" style={{ color: 'white' }}>
                        {Math.min(100, Math.round(enrollment.progressPercentage))}%
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {enrollment.course.category && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                        {enrollment.course.category.name}
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {enrollment.course.level}
                    </span>
                  </div>

                  <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 text-sm">
                    {enrollment.course.title}
                  </h3>

                  <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                    {enrollment.course.description}
                  </p>

                  <div className="text-xs text-slate-600 mb-3 truncate">
                    by {enrollment.course.tutorName || `${enrollment.course.creator.firstName} ${enrollment.course.creator.lastName}`}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">Progress</span>
                      <span className="font-medium text-slate-900">
                        {Math.min(100, Math.round(enrollment.progressPercentage))}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          enrollment.progressPercentage === 100 ? 'bg-green-600' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${Math.min(100, enrollment.progressPercentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex justify-between text-xs text-slate-600 mb-3">
                    <span>{enrollment.completedMaterials || 0} / {enrollment.course._count.materials} lessons</span>
                    <span>{Math.round((enrollment.totalTimeSpent || 0) / 60)}h</span>
                  </div>

                  {/* Action Button */}
                  {(() => {
                    const buttonState = getEnrollmentButtonState(enrollment);
                    return (
                      <Link href={buttonState.href}>
                        <button className={`w-full py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                          buttonState.text === 'Completed'
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : buttonState.text === 'Rate Course'
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}>
                          {buttonState.text === 'Rate Course' && <StarIcon className="h-3.5 w-3.5" />}
                          <span>{buttonState.text}</span>
                        </button>
                      </Link>
                    );
                  })()}

                  {/* Enrollment Date */}
                  <div className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      <span className="truncate">Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}</span>
                    </div>
                    {enrollment.completedAt && (
                      <div className="mt-1 truncate">Completed {new Date(enrollment.completedAt).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {!loading && hasMore && filteredEnrollments.length > 0 && (
            <div className="flex flex-col items-center gap-3 mt-8">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="group relative px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-indigo-800 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none"
              >
                {loadingMore ? (
                  <div className="flex items-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Load More Courses</span>
                    <svg className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                )}
              </button>
              <p className="text-sm text-slate-600">
                Showing <span className="font-semibold text-slate-900">{enrollments.length}</span> of <span className="font-semibold text-slate-900">{totalEnrollments}</span> courses
              </p>
            </div>
          )}

          {/* All Courses Loaded Message */}
          {!loading && !hasMore && filteredEnrollments.length > 0 && enrollments.length === totalEnrollments && (
            <div className="flex flex-col items-center gap-2 mt-8 py-6 border-t border-slate-200">
              <div className="flex items-center gap-2 text-slate-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">You've reached the end! All {totalEnrollments} courses shown.</span>
              </div>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 mt-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Back to Top
              </button>
            </div>
          )}
          </>
        ) : (
          <div className="text-center py-12">
            {filter === 'all' ? (
              <>
                <BookOpenIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No courses enrolled yet</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Start your learning journey by enrolling in your first course!
                </p>
                <Link href="/courses">
                  <button className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors">
                    Browse Courses
                  </button>
                </Link>
              </>
            ) : filter === 'in_progress' ? (
              <>
                <ChartBarIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No courses in progress</h3>
                <p className="text-sm text-slate-600">All your enrolled courses are completed!</p>
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No completed courses</h3>
                <p className="text-sm text-slate-600">Keep learning to complete your first course!</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}