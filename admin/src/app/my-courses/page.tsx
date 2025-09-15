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
  CheckCircleIcon
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h1>
          <p className="text-gray-600 mb-8">You need to be signed in to view your courses.</p>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-blue-100/50">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">My Courses</h1>
            <p className="text-gray-600 mt-2 text-lg">
              Manage and track your courses
            </p>
          </div>
          <Link href="/create-course">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3 text-base font-medium">
              <PlusIcon className="w-5 h-5 mr-2" />
              Create New Course
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-white/60 backdrop-blur-lg rounded-xl p-4 shadow-md border border-blue-100/30">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400" />
              <Input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="pl-12 pr-4 py-3 bg-white/80 border-blue-200/50 rounded-xl text-gray-700 placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
              />
            </div>
          </div>
          <div className="sm:w-52">
            <select
              value={statusFilter}
              onChange={(e) => setState(prev => ({ ...prev, statusFilter: e.target.value }))}
              className="w-full rounded-xl border border-blue-200/50 bg-white/80 px-4 py-3 text-sm font-medium text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-300"
            >
              <option value="ALL">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50/80 backdrop-blur-lg border border-red-200/50 rounded-xl p-4 mb-8 shadow-md">
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-16 bg-white/60 backdrop-blur-lg rounded-2xl shadow-lg border border-blue-100/50">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
              <AcademicCapIcon className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {courses.length === 0 ? 'No courses yet' : 'No courses match your search'}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {courses.length === 0 
                ? 'Create your first course to get started teaching on CoderZone!'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {courses.length === 0 && (
              <Link href="/create-course">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3">
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Create Your First Course
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="bg-white/80 backdrop-blur-lg border border-blue-100/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group overflow-hidden">
                {/* Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center relative">
                  {course.thumbnail ? (
                    <img
                      src={getImageUrl(course.thumbnail) || course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <AcademicCapIcon className="h-16 w-16 text-white opacity-80" />
                  )}
                  <span className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getStatusColor(course.status)}`}>
                    {course.status.charAt(0) + course.status.slice(1).toLowerCase()}
                  </span>
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-2 text-gray-900 group-hover:text-blue-600 transition-colors duration-300">{course.title}</CardTitle>
                      <CardDescription className="line-clamp-3 mt-2 text-gray-600">
                        {course.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <UsersIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{course._count?.enrollments || 0}</div>
                          <div className="text-xs text-gray-500">students</div>
                        </div>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">${course.price}</div>
                          <div className="text-xs text-gray-500">price</div>
                        </div>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                          <StarIcon className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{course.averageRating ? course.averageRating.toFixed(1) : 'N/A'}</div>
                          <div className="text-xs text-gray-500">rating</div>
                        </div>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                          <AcademicCapIcon className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{course._count?.materials || 0}</div>
                          <div className="text-xs text-gray-500">materials</div>
                        </div>
                      </div>
                    </div>

                    {/* Category and Tutor Name */}
                    <div className="flex flex-wrap gap-2">
                      {course.category && (
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-blue-700 bg-blue-100 border border-blue-200">
                          {course.category.name}
                        </div>
                      )}
                      {course.tutorName && (
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-purple-700 bg-purple-100 border border-purple-200">
                          By: {course.tutorName}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-4">
                      <Link href={`/courses/${course.id}`} className="flex-1 min-w-[80px]">
                        <Button variant="outline" size="sm" className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300">
                          <EyeIcon className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/courses/${course.id}/edit`} className="flex-1 min-w-[80px]">
                        <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300">
                          <PencilIcon className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      {course.status === 'DRAFT' && (
                        <Button
                          size="sm"
                          onClick={() => handlePublishCourse(course.id, course.title)}
                          disabled={publishingCourseId === course.id}
                          className="flex-1 min-w-[80px] bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all duration-300"
                        >
                          {publishingCourseId === course.id ? (
                            <div className="w-4 h-4 mr-1 animate-spin rounded-full border-2 border-green-300 border-t-white"></div>
                          ) : (
                            <CheckCircleIcon className="w-4 h-4 mr-1" />
                          )}
                          {publishingCourseId === course.id ? 'Publishing...' : 'Publish'}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCourse(course.id, course.title)}
                        disabled={deletingCourseId === course.id}
                        className="flex-shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 disabled:opacity-50 transition-all duration-300"
                      >
                        {deletingCourseId === course.id ? (
                          <div className="w-4 h-4 mr-1 animate-spin rounded-full border-2 border-red-300 border-t-red-600"></div>
                        ) : (
                          <TrashIcon className="w-4 h-4 mr-1" />
                        )}
                        {deletingCourseId === course.id ? 'Deleting...' : 'Delete'}
                      </Button>
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