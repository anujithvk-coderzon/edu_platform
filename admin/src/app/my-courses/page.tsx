'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  CurrencyDollarIcon,
  StarIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUtils';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  category?: {
    id: string;
    name: string;
  };
  level?: string;
  price: number;
  duration?: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  tutorName?: string;
  creator?: {
    firstName: string;
    lastName: string;
    role: string;
  };
  _count?: {
    enrollments: number;
    materials: number;
    reviews: number;
  };
  averageRating?: number;
  createdAt: string;
  updatedAt: string;
}

interface MyCoursesPageState {
  courses: Course[];
  loading: boolean;
  searchQuery: string;
  statusFilter: string;
  error: string;
  deletingCourseId: string;
  publishingCourseId: string;
}

const Page = () => {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<MyCoursesPageState>({
    courses: [],
    loading: true,
    searchQuery: '',
    statusFilter: 'ALL',
    error: '',
    deletingCourseId: '',
    publishingCourseId: ''
  });

  // Destructure state for easier access
  const { courses, loading, searchQuery, statusFilter, error, deletingCourseId, publishingCourseId } = state;

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user || authLoading) return;
      
      try {
        setState(prev => ({ ...prev, loading: true, error: '' }));
        const response = await api.courses.getMyCourses();
        if (response.success) {
          setState(prev => ({ ...prev, courses: response.data.courses || [], loading: false }));
        } else {
          setState(prev => ({ ...prev, error: 'Failed to load courses', loading: false }));
        }
      } catch (err: any) {
        setState(prev => ({ ...prev, error: err.message || 'Failed to load courses', loading: false }));
      }
    };

    fetchCourses();
  }, [user, authLoading]);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || course.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Course['status']) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    const confirmed = confirm(
      `Are you sure you want to delete "${courseTitle}"?\n\nThis action cannot be undone. All course materials, student enrollments, and progress data will be permanently removed.`
    );
    
    if (!confirmed) return;

    try {
      setState(prev => ({ ...prev, deletingCourseId: courseId }));
      const response = await api.courses.delete(courseId);
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          courses: prev.courses.filter(course => course.id !== courseId),
          deletingCourseId: ''
        }));
        toast.success(`Course "${courseTitle}" deleted successfully!`);
      } else {
        setState(prev => ({ ...prev, deletingCourseId: '' }));
        toast.error(response.error?.message || 'Failed to delete course');
      }
    } catch (error: any) {
      console.error('Error deleting course:', error);
      setState(prev => ({ ...prev, deletingCourseId: '' }));
      toast.error(error.message || 'Failed to delete course');
    }
  };

  const handlePublishCourse = async (courseId: string, courseTitle: string) => {
    const confirmed = confirm(
      `Are you sure you want to publish "${courseTitle}"?\n\nOnce published, this course will be visible to all students and available for enrollment.`
    );
    
    if (!confirmed) return;

    try {
      setState(prev => ({ ...prev, publishingCourseId: courseId }));
      const response = await api.courses.publish(courseId);
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          courses: prev.courses.map(course => 
            course.id === courseId 
              ? { ...course, status: 'PUBLISHED' as const }
              : course
          ),
          publishingCourseId: ''
        }));
        toast.success(`Course "${courseTitle}" published successfully!`);
      } else {
        setState(prev => ({ ...prev, publishingCourseId: '' }));
        toast.error(response.error?.message || 'Failed to publish course');
      }
    } catch (error: any) {
      console.error('Error publishing course:', error);
      setState(prev => ({ ...prev, publishingCourseId: '' }));
      toast.error(error.message || 'Failed to publish course');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 bg-white rounded-xl shadow-sm border border-slate-200"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Please sign in</h1>
            <p className="text-slate-600 mb-8">You need to be signed in to view your courses.</p>
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-1">
                  {user?.role?.toLowerCase() !== 'tutor' ? 'All Courses' : 'My Courses'}
                </h1>
                <p className="text-slate-600 text-sm sm:text-base">
                  {user?.role?.toLowerCase() !== 'tutor'
                    ? 'Manage all courses in your organization'
                    : 'Manage and track your courses'
                  }
                </p>
              </div>
              <Link href="/create-course">
                <Button className="w-full sm:w-auto">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create New Course
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
                    className="pl-10 pr-4 py-2 w-full"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setState(prev => ({ ...prev, statusFilter: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-xl flex items-center justify-center">
              <AcademicCapIcon className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {courses.length === 0 ? 'No courses yet' : 'No courses match your search'}
            </h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto text-sm">
              {courses.length === 0
                ? 'Create your first course to get started teaching!'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {courses.length === 0 && (
              <Link href="/create-course">
                <Button>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Your First Course
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group overflow-hidden">
                {/* Thumbnail */}
                <div className="aspect-video bg-slate-100 flex items-center justify-center relative">
                  {course.thumbnail ? (
                    <img
                      src={getImageUrl(course.thumbnail) || course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <AcademicCapIcon className="h-12 w-12 text-slate-600" />
                  )}
                  <span className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(course.status)}`}>
                    {course.status.charAt(0) + course.status.slice(1).toLowerCase()}
                  </span>
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-2 text-slate-900 text-base font-semibold">{course.title}</CardTitle>
                      <CardDescription className="line-clamp-3 mt-1 text-slate-600 text-sm">
                        {course.description}
                      </CardDescription>
                      {user?.role?.toLowerCase() !== 'tutor' && course.creator && (
                        <div className="mt-2 text-xs text-slate-500">
                          Assigned to: {course.creator.firstName} {course.creator.lastName}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-2">
                          <UsersIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{course._count?.enrollments || 0}</div>
                          <div className="text-xs text-slate-600">students</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center mr-2">
                          <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">${course.price}</div>
                          <div className="text-xs text-slate-600">price</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center mr-2">
                          <StarIcon className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{course.averageRating ? course.averageRating.toFixed(1) : 'N/A'}</div>
                          <div className="text-xs text-slate-600">rating</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center mr-2">
                          <AcademicCapIcon className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{course._count?.materials || 0}</div>
                          <div className="text-xs text-slate-600">materials</div>
                        </div>
                      </div>
                    </div>

                    {/* Category and Tutor Name */}
                    <div className="flex flex-wrap gap-2">
                      {course.category && (
                        <div className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-blue-700 bg-blue-50">
                          {course.category.name}
                        </div>
                      )}
                      {course.tutorName && (
                        <div className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-purple-700 bg-purple-50">
                          By: {course.tutorName}
                        </div>
                      )}
                    </div>

                    {/* Actions - Fully Responsive */}
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-3 border-t border-slate-200">
                      {/* First Row - View, Edit, Assignments */}
                      <div className="flex flex-row gap-1.5 sm:gap-2 w-full">
                        <Link href={`/courses/${course.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full text-xs px-2 sm:px-3">
                            <EyeIcon className="w-3 h-3 sm:mr-1" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                        </Link>
                        <Link href={`/courses/${course.id}/edit`} className="flex-1">
                          <Button size="sm" className="w-full text-xs px-2 sm:px-3 bg-blue-600 hover:bg-blue-700 text-white">
                            <PencilIcon className="w-3 h-3 sm:mr-1" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                        </Link>
                        <Link href={`/courses/${course.id}/edit?tab=assignments`} className="flex-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs px-2 sm:px-3 border-purple-300 text-purple-700 hover:bg-purple-50"
                          >
                            <ClipboardDocumentListIcon className="w-3 h-3 sm:mr-1" />
                            <span className="hidden sm:inline">Assignments</span>
                          </Button>
                        </Link>
                      </div>

                      {/* Second Row - Publish (if draft) and Delete */}
                      <div className="flex flex-row gap-1.5 sm:gap-2 w-full">
                        {course.status === 'DRAFT' ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handlePublishCourse(course.id, course.title)}
                              disabled={publishingCourseId === course.id}
                              variant="outline"
                              className="flex-1 border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-50 text-xs px-2 sm:px-3"
                            >
                              {publishingCourseId === course.id ? (
                                <div className="w-3 h-3 sm:mr-1 animate-spin rounded-full border-2 border-green-300 border-t-green-600"></div>
                              ) : (
                                <CheckCircleIcon className="w-3 h-3 sm:mr-1" />
                              )}
                              <span className="hidden sm:inline">
                                {publishingCourseId === course.id ? 'Publishing...' : 'Publish'}
                              </span>
                              <span className="sm:hidden">
                                {publishingCourseId === course.id ? '...' : 'Pub'}
                              </span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCourse(course.id, course.title)}
                              disabled={deletingCourseId === course.id}
                              className="flex-1 border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 text-xs px-2 sm:px-3"
                            >
                              {deletingCourseId === course.id ? (
                                <div className="w-3 h-3 sm:mr-1 animate-spin rounded-full border-2 border-red-300 border-t-red-600"></div>
                              ) : (
                                <TrashIcon className="w-3 h-3 sm:mr-1" />
                              )}
                              <span className="hidden sm:inline">
                                {deletingCourseId === course.id ? 'Deleting...' : 'Delete'}
                              </span>
                              <span className="sm:hidden">
                                {deletingCourseId === course.id ? '...' : 'Del'}
                              </span>
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCourse(course.id, course.title)}
                            disabled={deletingCourseId === course.id}
                            className="w-full sm:w-auto border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 text-xs px-2 sm:px-3"
                          >
                            {deletingCourseId === course.id ? (
                              <div className="w-3 h-3 sm:mr-1 animate-spin rounded-full border-2 border-red-300 border-t-red-600"></div>
                            ) : (
                              <TrashIcon className="w-3 h-3 sm:mr-1" />
                            )}
                            <span className="hidden sm:inline">
                              {deletingCourseId === course.id ? 'Deleting...' : 'Delete'}
                            </span>
                            <span className="sm:hidden">
                              {deletingCourseId === course.id ? '...' : 'Delete'}
                            </span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;