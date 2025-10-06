'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  UserIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { getCdnUrl } from '../../utils/cdn';

interface PendingCourse {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  level?: string;
  price: number;
  duration?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    email: string;
  };
  tutor?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  category?: {
    id: string;
    name: string;
  };
  _count?: {
    enrollments: number;
    materials: number;
    modules: number;
  };
}

export default function PendingCoursesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState<PendingCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!authLoading && user?.role?.toLowerCase() === 'tutor') {
      router.push('/');
      return;
    }

    if (user) {
      fetchPendingCourses();
    }
  }, [user, authLoading, router]);

  const fetchPendingCourses = async () => {
    try {
      setLoading(true);
      const response: any = await api.courses.getPending();

      if (response.success && response.data) {
        setCourses(response.data.courses);
      }
    } catch (error: any) {
      // Silently handle error - just show empty state
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (courseId: string) => {
    if (!confirm('Are you sure you want to publish this course? It will be visible to all students.')) {
      return;
    }

    try {
      setProcessing(courseId);
      const response: any = await api.courses.publish(courseId);

      if (response.success) {
        fetchPendingCourses(); // Refresh the list

        // Notify Navbar to update count
        window.dispatchEvent(new Event('pendingCoursesUpdated'));
      }
    } catch (error: any) {
      // Silently handle error
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (courseId: string) => {
    const reason = prompt('Please provide a reason for rejection (optional):');

    try {
      setProcessing(courseId);
      const response: any = await api.courses.reject(courseId, reason || undefined);

      if (response.success) {
        fetchPendingCourses(); // Refresh the list

        // Notify Navbar to update count
        window.dispatchEvent(new Event('pendingCoursesUpdated'));
      }
    } catch (error: any) {
      // Silently handle error
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading pending courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Pending Course Reviews</h1>
          <p className="mt-2 text-slate-600">
            Review and approve or reject course submissions from tutors
          </p>
          {courses.length > 0 && (
            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
              <ClockIcon className="w-4 h-4 mr-2" />
              {courses.length} pending {courses.length === 1 ? 'course' : 'courses'}
            </div>
          )}
        </div>

        {/* Courses List */}
        {courses.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpenIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900">No pending courses</h3>
            <p className="mt-1 text-sm text-slate-500">
              There are no courses waiting for review at this time.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Course Thumbnail */}
                  <div className="flex-shrink-0">
                    {course.thumbnail ? (
                      <img
                        src={getCdnUrl(course.thumbnail) || ''}
                        alt={course.title}
                        className="w-full md:w-48 h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full md:w-48 h-32 bg-slate-200 rounded-lg flex items-center justify-center">
                        <BookOpenIcon className="w-12 h-12 text-slate-400" />
                      </div>
                    )}
                  </div>

                  {/* Course Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">
                          {course.title}
                        </h3>
                        <p className="text-slate-600 text-sm line-clamp-2 mb-3">
                          {course.description}
                        </p>

                        <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-3">
                          <div className="flex items-center">
                            <UserIcon className="w-4 h-4 mr-1" />
                            <span>By {course.creator.firstName} {course.creator.lastName}</span>
                          </div>
                          {course.category && (
                            <div className="px-2 py-1 bg-slate-100 rounded text-xs">
                              {course.category.name}
                            </div>
                          )}
                          {course.level && (
                            <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {course.level}
                            </div>
                          )}
                          {course.duration && (
                            <div className="flex items-center">
                              <ClockIcon className="w-4 h-4 mr-1" />
                              {course.duration}h
                            </div>
                          )}
                          <div className="font-semibold text-green-600">
                            ${course.price}
                          </div>
                        </div>

                        <div className="flex gap-2 text-xs text-slate-500">
                          <span>{course._count?.modules || 0} modules</span>
                          <span>•</span>
                          <span>{course._count?.materials || 0} materials</span>
                          <span>•</span>
                          <span>Submitted: {formatDate(course.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 min-w-[140px]">
                    <Link href={`/courses/${course.id}`}>
                      <Button variant="outline" className="w-full">
                        <EyeIcon className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                    <Button
                      onClick={() => handleApprove(course.id)}
                      disabled={processing === course.id}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      {processing === course.id ? 'Publishing...' : 'Publish'}
                    </Button>
                    <Button
                      onClick={() => handleReject(course.id)}
                      disabled={processing === course.id}
                      variant="outline"
                      className="w-full border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <XCircleIcon className="w-4 h-4 mr-2" />
                      {processing === course.id ? 'Rejecting...' : 'Reject'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
