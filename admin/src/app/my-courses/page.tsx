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
  ClipboardDocumentListIcon,
  XCircleIcon
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
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED' | 'REJECTED';
  tutorName?: string;
  creator?: {
    firstName: string;
    lastName: string;
    role: string;
  };
  tutor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  _count?: {
    enrollments: number;
    materials: number;
    reviews: number;
  };
  averageRating?: number;
  rejectionReason?: string;
  rejectedAt?: string;
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
      case 'PENDING_REVIEW':
        return 'bg-blue-100 text-blue-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
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
    const isAdmin = user?.role?.toLowerCase() === 'admin';
    const course = courses.find(c => c.id === courseId);
    const isDraft = course?.status === 'DRAFT';

    const confirmMessage = isAdmin
      ? `Are you sure you want to publish "${courseTitle}"?\n\nOnce published, this course will be visible to all students and available for enrollment.`
      : `Are you sure you want to submit "${courseTitle}" for review?\n\nThe course will be sent to admins for approval before being published.`;

    const confirmed = confirm(confirmMessage);

    if (!confirmed) return;

    try {
      setState(prev => ({ ...prev, publishingCourseId: courseId }));

      // Admins always publish, Tutors can only submit for review
      const response = isAdmin
        ? await api.courses.publish(courseId)
        : await api.courses.submitForReview(courseId);

      if (response.success) {
        const newStatus: Course['status'] = isAdmin ? 'PUBLISHED' : 'PENDING_REVIEW';
        setState(prev => ({
          ...prev,
          courses: prev.courses.map(course =>
            course.id === courseId
              ? { ...course, status: newStatus }
              : course
          ),
          publishingCourseId: ''
        }));

        const successMessage = isAdmin
          ? `Course "${courseTitle}" published successfully!`
          : `Course "${courseTitle}" submitted for review!`;
        toast.success(successMessage);

        // Notify navbar to update count if course was pending review
        if (course?.status === 'PENDING_REVIEW') {
          window.dispatchEvent(new Event('pendingCoursesUpdated'));
        }
      } else {
        setState(prev => ({ ...prev, publishingCourseId: '' }));
        toast.error(response.error?.message || (isAdmin ? 'Failed to publish course' : 'Failed to submit course'));
      }
    } catch (error: any) {
      setState(prev => ({ ...prev, publishingCourseId: '' }));
      toast.error(error.message || (isAdmin ? 'Failed to publish course' : 'Failed to submit course'));
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
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
        {/* Header */}
        <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-8">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-slate-900 mb-1">
                  {user?.role?.toLowerCase() !== 'tutor' ? 'All Courses' : 'My Courses'}
                </h1>
                <p className="text-slate-600 text-xs sm:text-sm md:text-base">
                  {user?.role?.toLowerCase() !== 'tutor'
                    ? 'Manage all courses in your organization'
                    : 'Manage and track your courses'
                  }
                </p>
              </div>
              <Link href="/create-course">
                <Button className="w-full sm:w-auto bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-xs sm:text-sm">
                  <PlusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Create New Course</span>
                  <span className="sm:hidden">Create Course</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-8">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 md:p-6">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
                    className="pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 w-full text-xs sm:text-sm"
                  />
                </div>
              </div>
              <div className="w-full sm:w-40 md:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setState(prev => ({ ...prev, statusFilter: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="DRAFT">Draft</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <p className="text-xs sm:text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-8 sm:py-12 bg-slate-50 rounded-lg sm:rounded-xl shadow-sm border border-slate-200 px-3">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-slate-100 rounded-lg sm:rounded-xl flex items-center justify-center">
              <AcademicCapIcon className="w-6 h-6 sm:w-8 sm:h-8 text-slate-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 sm:mb-2">
              {courses.length === 0 ? 'No courses yet' : 'No courses match your search'}
            </h3>
            <p className="text-slate-600 mb-4 sm:mb-6 max-w-md mx-auto text-xs sm:text-sm">
              {courses.length === 0
                ? 'Create your course to get started teaching!'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {courses.length === 0 && (
              <Link href="/create-course">
                <Button className="bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-xs sm:text-sm">
                  <PlusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Create Course</span>
                  <span className="sm:hidden">Create</span>
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group overflow-hidden rounded-lg sm:rounded-xl">
                {/* Thumbnail */}
                <div className="aspect-video bg-slate-100 flex items-center justify-center relative">
                  {course.thumbnail ? (
                    <img
                      src={getImageUrl(course.thumbnail) || course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <AcademicCapIcon className="h-10 w-10 sm:h-12 sm:w-12 text-slate-600" />
                  )}
                  <span className={`absolute top-1.5 sm:top-2 right-1.5 sm:right-2 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium ${getStatusColor(course.status)}`}>
                    {course.status === 'PENDING_REVIEW' ? 'Pending Review' : course.status.charAt(0) + course.status.slice(1).toLowerCase()}
                  </span>
                </div>
                <CardHeader className="p-3 sm:p-4 md:p-5 bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-2 text-slate-900 text-sm sm:text-base font-semibold">{course.title}</CardTitle>
                      <CardDescription className="line-clamp-3 mt-1 text-slate-600 text-xs sm:text-sm">
                        {course.description}
                      </CardDescription>
                      {user?.role?.toLowerCase() !== 'tutor' && (
                        <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-slate-500">
                          Assigned to: {course.tutor ?
                            `${course.tutor.firstName} ${course.tutor.lastName}` :
                            course.creator ? `${course.creator.firstName} ${course.creator.lastName}` : 'Unassigned'
                          }
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-5">
                  <div className="space-y-3 sm:space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 text-sm">
                      <div className="flex items-center">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center mr-1.5 sm:mr-2">
                          <UsersIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-xs sm:text-sm">{course._count?.enrollments || 0}</div>
                          <div className="text-[10px] sm:text-xs text-slate-600">students</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-green-50 to-green-100 rounded-lg flex items-center justify-center mr-1.5 sm:mr-2">
                          <CurrencyDollarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-xs sm:text-sm">${course.price}</div>
                          <div className="text-[10px] sm:text-xs text-slate-600">price</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg flex items-center justify-center mr-1.5 sm:mr-2">
                          <StarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-xs sm:text-sm">{course.averageRating ? course.averageRating.toFixed(1) : 'N/A'}</div>
                          <div className="text-[10px] sm:text-xs text-slate-600">rating</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg flex items-center justify-center mr-1.5 sm:mr-2">
                          <AcademicCapIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-xs sm:text-sm">{course._count?.materials || 0}</div>
                          <div className="text-[10px] sm:text-xs text-slate-600">materials</div>
                        </div>
                      </div>
                    </div>

                    {/* Rejection Reason */}
                    {course.status === 'REJECTED' && course.rejectionReason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3">
                        <div className="flex items-start">
                          <XCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 mt-0.5 mr-1.5 sm:mr-2 flex-shrink-0" />
                          <div>
                            <div className="text-[10px] sm:text-xs font-semibold text-red-800 mb-0.5 sm:mb-1">Rejection Reason:</div>
                            <div className="text-[10px] sm:text-xs text-red-700">{course.rejectionReason}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Category and Tutor Name */}
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {course.category && (
                        <div className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium text-blue-700 bg-blue-50">
                          {course.category.name}
                        </div>
                      )}
                      {course.creator && (
                        <div className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium text-purple-700 bg-purple-50">
                          By: {course.creator.firstName} {course.creator.lastName}
                        </div>
                      )}
                    </div>

                    {/* Actions - Perfectly Aligned */}
                    <div className="flex flex-col gap-1.5 sm:gap-2 pt-2 sm:pt-3 border-t border-slate-200">
                      {/* First Row - View Contents, Edit */}
                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                        <Link href={`/courses/${course.id}`}>
                          <Button variant="outline" size="sm" className="w-full text-[10px] sm:text-xs whitespace-nowrap px-2 py-1.5 sm:px-3 sm:py-2">
                            <EyeIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                            <span className="hidden sm:inline">View Contents</span>
                            <span className="sm:hidden">View</span>
                          </Button>
                        </Link>
                        <Link href={`/courses/${course.id}/edit`}>
                          <Button size="sm" className="w-full text-[10px] sm:text-xs bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white whitespace-nowrap px-2 py-1.5 sm:px-3 sm:py-2">
                            <PencilIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                            Edit
                          </Button>
                        </Link>
                      </div>

                      {/* Second Row - Assignments */}
                      <Link href={`/courses/${course.id}/edit?tab=assignments`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-[10px] sm:text-xs border-purple-300 text-purple-700 hover:bg-purple-50 whitespace-nowrap px-2 py-1.5 sm:px-3 sm:py-2"
                        >
                          <ClipboardDocumentListIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                          <span className="hidden sm:inline">Assignments</span>
                          <span className="sm:hidden">Tasks</span>
                        </Button>
                      </Link>

                      {/* Third Row - Publish/Submit and Delete */}
                      {course.status === 'DRAFT' || (course.status === 'PENDING_REVIEW' && user?.role?.toLowerCase() === 'admin') ? (
                        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                          <Button
                            size="sm"
                            onClick={() => handlePublishCourse(course.id, course.title)}
                            disabled={publishingCourseId === course.id}
                            variant="outline"
                            className="w-full border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-50 text-[10px] sm:text-xs whitespace-nowrap px-2 py-1.5 sm:px-3 sm:py-2"
                          >
                            {publishingCourseId === course.id ? (
                              <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 animate-spin rounded-full border-2 border-green-300 border-t-green-600"></div>
                            ) : (
                              <CheckCircleIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                            )}
                            {publishingCourseId === course.id
                              ? (user?.role?.toLowerCase() === 'admin' ? 'Publishing...' : 'Submitting...')
                              : (user?.role?.toLowerCase() === 'admin' ? 'Publish' : 'Submit')
                            }
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCourse(course.id, course.title)}
                            disabled={deletingCourseId === course.id}
                            className="w-full border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 text-[10px] sm:text-xs whitespace-nowrap px-2 py-1.5 sm:px-3 sm:py-2"
                          >
                            {deletingCourseId === course.id ? (
                              <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 animate-spin rounded-full border-2 border-red-300 border-t-red-600"></div>
                            ) : (
                              <TrashIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                            )}
                            {deletingCourseId === course.id ? 'Deleting...' : 'Delete'}
                          </Button>
                        </div>
                      ) : course.status === 'REJECTED' ? (
                        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                          <Link href={`/courses/${course.id}/edit`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-[10px] sm:text-xs border-orange-300 text-orange-700 hover:bg-orange-50 whitespace-nowrap px-2 py-1.5 sm:px-3 sm:py-2"
                            >
                              <PencilIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                              <span className="hidden sm:inline">Fix & Resubmit</span>
                              <span className="sm:hidden">Fix</span>
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCourse(course.id, course.title)}
                            disabled={deletingCourseId === course.id}
                            className="w-full border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 text-[10px] sm:text-xs whitespace-nowrap px-2 py-1.5 sm:px-3 sm:py-2"
                          >
                            {deletingCourseId === course.id ? (
                              <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 animate-spin rounded-full border-2 border-red-300 border-t-red-600"></div>
                            ) : (
                              <TrashIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                            )}
                            {deletingCourseId === course.id ? 'Deleting...' : 'Delete'}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCourse(course.id, course.title)}
                          disabled={deletingCourseId === course.id}
                          className="w-full border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 text-[10px] sm:text-xs whitespace-nowrap px-2 py-1.5 sm:px-3 sm:py-2"
                        >
                          {deletingCourseId === course.id ? (
                            <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 animate-spin rounded-full border-2 border-red-300 border-t-red-600"></div>
                          ) : (
                            <TrashIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                          )}
                          {deletingCourseId === course.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      )}
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