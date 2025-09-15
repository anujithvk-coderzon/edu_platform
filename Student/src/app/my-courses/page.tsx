'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  BookOpenIcon,
  ClockIcon,
  PlayIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Enrollment {
  id: string;
  courseId: string;
  progressPercentage: number;
  status: string;
  enrolledAt: string;
  completedAt?: string;
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
    creator: {
      id: string;
      firstName: string;
      lastName: string;
      avatar: string;
    };
    category: {
      id: string;
      name: string;
    };
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

  const filteredEnrollments = enrollments.filter(enrollment => {
    switch (filter) {
      case 'in_progress':
        return enrollment.status === 'ACTIVE' && enrollment.progressPercentage < 100;
      case 'completed':
        return enrollment.status === 'COMPLETED' || enrollment.progressPercentage === 100;
      default:
        return true;
    }
  });

  const stats = {
    total: enrollments.length,
    inProgress: enrollments.filter(e => e.status === 'ACTIVE' && e.progressPercentage < 100).length,
    completed: enrollments.filter(e => e.status === 'COMPLETED' || e.progressPercentage === 100).length,
    totalHours: Math.round(enrollments.reduce((total, e) => total + (e.totalTimeSpent || 0), 0) / 60),
    averageProgress: enrollments.length > 0
      ? Math.round(enrollments.reduce((sum, e) => sum + e.progressPercentage, 0) / enrollments.length)
      : 0
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Please log in</h3>
          <p className="text-gray-600 mb-4">You need to be logged in to view your courses.</p>
          <Link href="/login">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Log In
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Learning</h1>
              <p className="text-gray-600 mt-1">
                {stats.total > 0
                  ? `${stats.total} course${stats.total === 1 ? '' : 's'} enrolled • Track your progress and continue learning`
                  : 'Start your learning journey by enrolling in courses'
                }
              </p>
            </div>

            <Link href="/courses">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                {stats.total > 0 ? 'Explore More Courses' : 'Browse Courses'}
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpenIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hours Studied</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalHours}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Courses', count: stats.total },
              { key: 'in_progress', label: 'In Progress', count: stats.inProgress },
              { key: 'completed', label: 'Completed', count: stats.completed }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as typeof filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Course List */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm animate-pulse">
                <div className="aspect-video bg-gray-200 rounded-t-lg"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-2 bg-gray-200 rounded mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredEnrollments.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEnrollments.map((enrollment) => (
              <div key={enrollment.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-600 rounded-t-lg flex items-center justify-center relative">
                  {enrollment.course.thumbnail ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${enrollment.course.thumbnail}`}
                      alt={enrollment.course.title}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  ) : (
                    <BookOpenIcon className="h-16 w-16 text-white opacity-80" />
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    {enrollment.progressPercentage === 100 ? (
                      <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Completed
                      </div>
                    ) : (
                      <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        {Math.round(enrollment.progressPercentage)}%
                      </div>
                    )}
                  </div>

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/40 rounded-t-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <PlayIcon className="h-12 w-12 text-white" />
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                      {enrollment.course.category.name}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      {enrollment.course.level}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {enrollment.course.title}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {enrollment.course.description}
                  </p>

                  <div className="text-sm text-gray-600 mb-4">
                    by {enrollment.course.creator.firstName} {enrollment.course.creator.lastName}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-gray-900">
                        {Math.round(enrollment.progressPercentage)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          enrollment.progressPercentage === 100 ? 'bg-green-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${enrollment.progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex justify-between text-xs text-gray-600 mb-4">
                    <span>
                      {enrollment.completedMaterials || 0} of {enrollment.course._count.materials} lessons
                    </span>
                    <span>
                      {Math.round((enrollment.totalTimeSpent || 0) / 60)}h studied
                    </span>
                  </div>

                  {/* Action Button */}
                  <Link href={`/learn/${enrollment.courseId}`}>
                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
                      <PlayIcon className="h-4 w-4 mr-2" />
                      {enrollment.progressPercentage === 100 ? 'Review Course' : 'Continue Learning'}
                    </button>
                  </Link>

                  {/* Enrollment Date */}
                  <div className="flex items-center text-xs text-gray-500 mt-4">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    {enrollment.completedAt && (
                      <>
                        <span className="mx-2">•</span>
                        Completed {new Date(enrollment.completedAt).toLocaleDateString()}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            {filter === 'all' ? (
              <>
                <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses enrolled yet</h3>
                <p className="text-gray-600 mb-4">
                  Start your learning journey by enrolling in your first course!
                </p>
                <Link href="/courses">
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                    Browse Courses
                  </button>
                </Link>
              </>
            ) : filter === 'in_progress' ? (
              <>
                <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses in progress</h3>
                <p className="text-gray-600">All your enrolled courses are completed!</p>
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No completed courses</h3>
                <p className="text-gray-600">Keep learning to complete your first course!</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}