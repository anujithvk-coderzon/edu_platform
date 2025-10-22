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

  useEffect(() => {
    if (user) {
      fetchMyEnrollments();
    }
  }, [user]);

  const fetchMyEnrollments = async () => {
    try {
      setLoading(true);
      const response = await api.enrollments.getMy();
      if (response.success) {
        setEnrollments(response.data.enrollments || []);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error('Failed to load your courses');
    } finally {
      setLoading(false);
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

  const stats = {
    total: enrollments.length,
    active: enrollments.filter(e => e.status !== 'COMPLETED' && e.progressPercentage < 100).length,
    inProgress: enrollments.filter(e => e.status === 'ACTIVE' && e.progressPercentage < 100).length,
    completed: enrollments.filter(e => e.status === 'COMPLETED' || e.progressPercentage >= 100).length,
    totalHours: Math.round(enrollments.reduce((total, e) => total + (e.totalTimeSpent || 0), 0) / 60),
    averageProgress: enrollments.length > 0
      ? Math.min(100, Math.round(enrollments.reduce((sum, e) => sum + Math.min(100, e.progressPercentage), 0) / enrollments.length))
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
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-900">
                My Learning
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-1">
                {stats.total > 0
                  ? `${stats.active} active courses • ${stats.completed} completed`
                  : 'Start your learning journey by enrolling in courses'
                }
              </p>
            </div>

            <Link href="/courses">
              <Button className="w-full sm:w-auto text-sm sm:text-base">
                {stats.active > 0 ? 'Browse More Courses' : 'Explore Courses'}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
          <div className="bg-white rounded-lg border border-slate-200 p-2.5 sm:p-3 md:p-4">
            <div className="flex items-center space-x-2 sm:space-x-2.5 md:space-x-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpenIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">{stats.active}</p>
                <p className="text-xs text-slate-600 truncate">Active</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-2.5 sm:p-3 md:p-4">
            <div className="flex items-center space-x-2 sm:space-x-2.5 md:space-x-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <ChartBarIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">{stats.inProgress}</p>
                <p className="text-xs text-slate-600 truncate">In Progress</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-2.5 sm:p-3 md:p-4">
            <div className="flex items-center space-x-2 sm:space-x-2.5 md:space-x-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircleIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">{stats.completed}</p>
                <p className="text-xs text-slate-600 truncate">Completed</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-2.5 sm:p-3 md:p-4">
            <div className="flex items-center space-x-2 sm:space-x-2.5 md:space-x-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <ClockIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">{stats.totalHours}</p>
                <p className="text-xs text-slate-600 truncate">Hours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-slate-200 p-2.5 sm:p-3 md:p-4 mb-4 sm:mb-5 md:mb-6">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {[
              { key: 'all', label: 'All Courses', count: stats.total },
              { key: 'in_progress', label: 'Active', count: stats.active },
              { key: 'completed', label: 'Completed', count: stats.completed }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as typeof filter)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Course List */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm animate-pulse">
                <div className="aspect-video bg-gray-200 rounded-t-lg"></div>
                <div className="p-3 sm:p-4">
                  <div className="h-5 sm:h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 sm:h-4 bg-gray-200 rounded mb-3 sm:mb-4"></div>
                  <div className="h-2 bg-gray-200 rounded mb-3 sm:mb-4"></div>
                  <div className="h-8 sm:h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredEnrollments.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
            {filteredEnrollments.map((enrollment) => (
              <div key={enrollment.id} className="bg-white rounded-lg border border-slate-200 hover:shadow-lg transition-all duration-300">
                <div className="aspect-video bg-gradient-to-br from-indigo-500 to-purple-600 rounded-t-lg flex items-center justify-center relative">
                  {enrollment.course.thumbnail && getImageUrl(enrollment.course.thumbnail) ? (
                    <img
                      src={getImageUrl(enrollment.course.thumbnail)!}
                      alt={enrollment.course.title}
                      className="w-full h-full object-cover rounded-t-lg"
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

                  {/* Status Badge */}
                  <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2">
                    {enrollment.progressPercentage === 100 ? (
                      <div className="bg-green-600 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-medium">
                        Completed
                      </div>
                    ) : (
                      <div className="bg-indigo-600 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-medium">
                        {Math.min(100, Math.round(enrollment.progressPercentage))}%
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 sm:p-4">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
                    {enrollment.course.category && (
                      <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium truncate">
                        {enrollment.course.category.name}
                      </span>
                    )}
                    <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-700 rounded text-xs truncate">
                      {enrollment.course.level}
                    </span>
                  </div>

                  <h3 className="font-semibold text-slate-900 mb-1.5 sm:mb-2 line-clamp-2 text-sm">
                    {enrollment.course.title}
                  </h3>

                  <p className="text-xs text-slate-600 mb-2 sm:mb-3 line-clamp-2">
                    {enrollment.course.description}
                  </p>

                  <div className="text-xs text-slate-600 mb-2 sm:mb-3 truncate">
                    by {enrollment.course.tutorName || `${enrollment.course.creator.firstName} ${enrollment.course.creator.lastName}`}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2 sm:mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">Progress</span>
                      <span className="font-medium text-slate-900">
                        {Math.min(100, Math.round(enrollment.progressPercentage))}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 sm:h-2">
                      <div
                        className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                          enrollment.progressPercentage === 100 ? 'bg-green-600' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${Math.min(100, enrollment.progressPercentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex justify-between text-xs text-slate-600 mb-2 sm:mb-3">
                    <span className="truncate">
                      {enrollment.completedMaterials || 0} / {enrollment.course._count.materials} lessons
                    </span>
                    <span className="flex-shrink-0 ml-2">
                      {Math.round((enrollment.totalTimeSpent || 0) / 60)}h
                    </span>
                  </div>

                  {/* Action Button */}
                  {(() => {
                    const buttonState = getEnrollmentButtonState(enrollment);
                    return (
                      <Link href={buttonState.href}>
                        <button className={`w-full py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center space-x-1 ${
                          buttonState.text === 'Completed'
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : buttonState.text === 'Rate Course'
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}>
                          {buttonState.text === 'Rate Course' && <StarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                          <span>{buttonState.text}</span>
                        </button>
                      </Link>
                    );
                  })()}

                  {/* Enrollment Date */}
                  <div className="text-xs text-slate-500 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100">
                    <div className="flex items-center">
                      <CalendarIcon className="h-3 w-3 mr-1 flex-shrink-0" />
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
        ) : (
          <div className="text-center py-8 sm:py-10 md:py-12 px-3">
            {filter === 'all' ? (
              <>
                <BookOpenIcon className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No courses enrolled yet</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                  Start your learning journey by enrolling in your first course!
                </p>
                <Link href="/courses">
                  <button className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 text-sm sm:text-base">
                    Browse Courses
                  </button>
                </Link>
              </>
            ) : filter === 'in_progress' ? (
              <>
                <ChartBarIcon className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No courses in progress</h3>
                <p className="text-sm sm:text-base text-gray-600">All your enrolled courses are completed!</p>
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No completed courses</h3>
                <p className="text-sm sm:text-base text-gray-600">Keep learning to complete your first course!</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}