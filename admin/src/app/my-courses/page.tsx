'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  CurrencyRupeeIcon,
  StarIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  XCircleIcon,
  BookOpenIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import './animations.css';
import { formatPrice } from '@/utils/currency';

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
  initialLoading: boolean;
  searchQuery: string;
  statusFilter: string;
  error: string;
  deletingCourseId: string;
  publishingCourseId: string;
  page: number;
  hasMore: boolean;
  totalCourses: number;
  loadingMore: boolean;
}

const Page = () => {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<MyCoursesPageState>({
    courses: [],
    loading: false,
    initialLoading: true,
    searchQuery: '',
    statusFilter: 'ALL',
    error: '',
    deletingCourseId: '',
    publishingCourseId: '',
    page: 1,
    hasMore: true,
    totalCourses: 0,
    loadingMore: false
  });
  const [searchInput, setSearchInput] = useState(''); // Separate state for input

  const { courses, loading, initialLoading, searchQuery, statusFilter, error, deletingCourseId, publishingCourseId, page, hasMore, totalCourses, loadingMore } = state;

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setState(prev => ({ ...prev, searchQuery: searchInput }));
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch courses when search/filter changes
  useEffect(() => {
    if (user && !authLoading) {
      // Reset to page 1 when filters change
      setState(prev => ({ ...prev, page: 1, courses: [] }));
      fetchCourses(1, false);
    }
  }, [user, authLoading, searchQuery, statusFilter]);

  const fetchCourses = async (pageNum: number = 1, append: boolean = false) => {
    if (!user || authLoading) return;

    try {
      if (append) {
        setState(prev => ({ ...prev, loadingMore: true }));
      } else {
        setState(prev => ({ ...prev, loading: true, error: '' }));
      }

      // Build query parameters
      const params: any = {
        page: pageNum,
        limit: 8
      };

      if (searchQuery) params.search = searchQuery;
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;

      const response = await api.courses.getMyCourses(params);

      if (response.success) {
        const newCourses = response.data.courses || [];

        // Append or replace courses
        if (append) {
          setState(prev => ({
            ...prev,
            courses: [...prev.courses, ...newCourses],
            loadingMore: false,
            loading: false,
            initialLoading: false
          }));
        } else {
          setState(prev => ({
            ...prev,
            courses: newCourses,
            loading: false,
            initialLoading: false
          }));
        }

        // Check if there are more courses to load
        const total = response.data.pagination?.total || response.data.courses?.length || 0;
        const totalPages = response.data.pagination?.totalPages || response.data.pagination?.pages || 1;

        setState(prev => ({
          ...prev,
          hasMore: pageNum < totalPages,
          totalCourses: total
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: 'Failed to load courses',
          loading: false,
          initialLoading: false,
          loadingMore: false
        }));
      }
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        error: err.message || 'Failed to load courses',
        loading: false,
        initialLoading: false,
        loadingMore: false
      }));
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setState(prev => ({ ...prev, page: nextPage }));
    fetchCourses(nextPage, true);
  };

  // No need for client-side filtering since it's done on backend
  const filteredCourses = courses;

  const getStatusColor = (status: Course['status']) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-[#DCFAE6] text-[#067647] border-[#ABEFC6]';
      case 'PENDING_REVIEW':
        return 'bg-[#DBE7FE] text-[#1E40AF] border-[#C7D7FE]';
      case 'DRAFT':
        return 'bg-[#FEF0C7] text-[#B45309] border-[#FEDF89]';
      case 'REJECTED':
        return 'bg-[#FEE4E2] text-[#912018] border-[#FECDCA]';
      case 'ARCHIVED':
        return 'bg-[#E9EEF4] text-[#334155] border-[#DDE3EA]';
      default:
        return 'bg-[#E9EEF4] text-[#334155] border-[#DDE3EA]';
    }
  };

  const getStatusText = (status: Course['status']) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return 'Pending Review';
      default:
        return status.charAt(0) + status.slice(1).toLowerCase();
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

    const confirmMessage = isAdmin
      ? `Are you sure you want to publish "${courseTitle}"?\n\nOnce published, this course will be visible to all students and available for enrollment.`
      : `Are you sure you want to submit "${courseTitle}" for review?\n\nThe course will be sent to admins for approval before being published.`;

    const confirmed = confirm(confirmMessage);

    if (!confirmed) return;

    try {
      setState(prev => ({ ...prev, publishingCourseId: courseId }));

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

  if (authLoading || initialLoading) {
    return (
      <div className="min-h-screen bg-[#F6F8FA]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[#DDE3EA] rounded-lg w-1/4"></div>
            <div className="h-4 bg-[#DDE3EA] rounded w-1/3"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-72 bg-white rounded-lg shadow-sm"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F6F8FA] flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white rounded-xl shadow-lg p-8">
          <AcademicCapIcon className="w-16 h-16 mx-auto mb-4 text-[#1D4ED8]" />
          <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Please Sign In</h1>
          <p className="text-[#475569] mb-6 text-sm">You need to be signed in to view your courses.</p>
          <Link href="/login">
            <Button className="bg-[#1D4ED8] hover:bg-[#1E40AF]">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FA]">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-1">
                {user?.role?.toLowerCase() !== 'tutor' ? 'All Courses' : 'My Courses'}
              </h1>
              <p className="text-[#475569] text-sm">
                {user?.role?.toLowerCase() !== 'tutor'
                  ? 'Manage all courses in your organization'
                  : 'Create and manage your courses'
                }
              </p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs text-[#64748B]">
                  <span className="font-semibold text-[#0F172A]">{totalCourses > 0 ? totalCourses : courses.length}</span> courses
                </span>
              </div>
            </div>
            <Link href="/create-course">
              <Button className="w-full sm:w-auto bg-[#1D4ED8] hover:bg-[#1E40AF] shadow-sm">
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Course
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-[#DDE3EA] p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                <Input
                  type="text"
                  placeholder="Search courses..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 text-sm"
                />
                {searchInput && searchInput !== searchQuery && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#C7D2DE] border-t-blue-600"></div>
                  </div>
                )}
              </div>
              <div className="w-full sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setState(prev => ({ ...prev, statusFilter: e.target.value }))}
                  className="w-full rounded-lg border border-[#C7D2DE] bg-white px-3 py-2 text-sm text-[#334155] focus:border-[#1D4ED8] focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
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
          <div className="bg-[#FEF3F2] border border-[#FECDCA] rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <XCircleIcon className="w-5 h-5 text-[#B42318] flex-shrink-0" />
              <p className="text-sm text-[#912018]">{error}</p>
            </div>
          </div>
        )}

        {/* Courses Grid */}
        {loading && !loadingMore ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-72 bg-white rounded-lg shadow-sm border border-[#DDE3EA]"></div>
            ))}
          </div>
        ) : filteredCourses.length === 0 && !loading ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-[#DDE3EA]">
            <AcademicCapIcon className="w-12 h-12 mx-auto mb-4 text-[#94A3B8]" />
            <h3 className="text-lg font-semibold text-[#0F172A] mb-2">
              {totalCourses === 0 ? 'No courses yet' : 'No courses match your search'}
            </h3>
            <p className="text-[#475569] mb-6 text-sm max-w-sm mx-auto">
              {totalCourses === 0
                ? 'Create your first course to get started.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {totalCourses === 0 && (
              <Link href="/create-course">
                <Button className="bg-[#1D4ED8] hover:bg-[#1E40AF]">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Course
                </Button>
              </Link>
            )}
          </div>
        ) : filteredCourses.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr mb-8">
              {filteredCourses.map((course) => (
              <Card
                key={course.id}
                className="group bg-white border border-[#DDE3EA] hover:border-[#C7D2DE] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col h-full"
              >
                {/* Thumbnail */}
                <div className="relative w-full" style={{ height: '208px' }}>
                  <div className="absolute inset-0 bg-[#E9EEF4] overflow-hidden">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail || course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <AcademicCapIcon className="h-12 w-12 text-[#C7D2DE]" />
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-2 right-2 z-10">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusColor(course.status)}`}>
                      {getStatusText(course.status)}
                    </span>
                  </div>
                  {/* Level Badge */}
                  {course.level && (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-white/90 text-[#334155] border border-[#DDE3EA]">
                        {course.level}
                      </span>
                    </div>
                  )}
                </div>

                <CardContent className="p-3 flex-1 flex flex-col">
                  {/* Title & Description */}
                  <div className="mb-3">
                    <h3 className="font-semibold text-sm text-[#0F172A] line-clamp-2 mb-1 group-hover:text-[#1D4ED8] transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-[#475569] line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {course.category && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-[#1E40AF] bg-[#EFF4FF] border border-[#DBE7FE]">
                        {course.category.name}
                      </span>
                    )}
                    {user?.role?.toLowerCase() !== 'tutor' && course.tutor && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-[#1E40AF] bg-[#EFF4FF] border border-[#DBE7FE]">
                        {course.tutor.firstName} {course.tutor.lastName}
                      </span>
                    )}
                  </div>

                  {/* Stats - Compact */}
                  <div className="grid grid-cols-3 gap-2 mb-3 pb-3 border-b border-[#E9EEF4]">
                    <div className="text-center">
                      <CurrencyRupeeIcon className="w-3.5 h-3.5 mx-auto mb-0.5 text-[#079455]" />
                      <div className="text-xs font-semibold text-[#0F172A]">{formatPrice(course.price)}</div>
                      <div className="text-[9px] text-[#64748B]">price</div>
                    </div>
                    <div className="text-center">
                      <StarIconSolid className="w-3.5 h-3.5 mx-auto mb-0.5 text-[#F79009]" />
                      <div className="text-xs font-semibold text-[#0F172A]">
                        {course.averageRating ? course.averageRating.toFixed(1) : 'N/A'}
                      </div>
                      <div className="text-[9px] text-[#64748B]">rating</div>
                    </div>
                    <div className="text-center">
                      <BookOpenIcon className="w-3.5 h-3.5 mx-auto mb-0.5 text-[#1D4ED8]" />
                      <div className="text-xs font-semibold text-[#0F172A]">{course._count?.materials || 0}</div>
                      <div className="text-[9px] text-[#64748B]">items</div>
                    </div>
                  </div>

                  {/* Rejection Reason */}
                  {/* Rejection Reason - Only show to Tutors who need to fix it */}
                  {course.status === 'REJECTED' && course.rejectionReason && user?.role?.toLowerCase() === 'tutor' && (
                    <div className="bg-[#FEF3F2] border border-[#FECDCA] rounded-md p-2 mb-3">
                      <div className="flex items-start gap-1.5">
                        <XCircleIcon className="w-3.5 h-3.5 text-[#B42318] mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-semibold text-[#912018] mb-0.5">Rejection Reason:</div>
                          <div className="text-[10px] text-[#912018] line-clamp-2">{course.rejectionReason}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-auto pt-3 border-t border-[#E9EEF4]">
                    {/* Primary Action Bar */}
                    <div className="grid grid-cols-4 gap-1 mb-2">
                      <Link href={`/courses/${course.id}`} title="View Contents">
                        <button className="w-full p-2 rounded hover:bg-[#E9EEF4] transition-colors group flex flex-col items-center">
                          <EyeIcon className="w-4 h-4 text-[#475569] group-hover:text-[#1D4ED8]" />
                          <span className="text-[9px] text-[#475569] mt-0.5">Contents</span>
                        </button>
                      </Link>
                      <Link href={`/courses/${course.id}/edit`} title="Edit Course">
                        <button className="w-full p-2 rounded hover:bg-[#EFF4FF] transition-colors group flex flex-col items-center">
                          <PencilIcon className="w-4 h-4 text-[#475569] group-hover:text-[#1D4ED8]" />
                          <span className="text-[9px] text-[#475569] mt-0.5">Edit</span>
                        </button>
                      </Link>
                      <Link href={`/courses/${course.id}/edit?tab=assignments`} title="Manage Assignments">
                        <button className="w-full p-2 rounded hover:bg-[#EFF4FF] transition-colors group flex flex-col items-center">
                          <ClipboardDocumentListIcon className="w-4 h-4 text-[#475569] group-hover:text-[#1D4ED8]" />
                          <span className="text-[9px] text-[#475569] mt-0.5">Assignments</span>
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDeleteCourse(course.id, course.title)}
                        disabled={deletingCourseId === course.id}
                        title="Delete Course"
                        className="w-full p-2 rounded hover:bg-[#FEF3F2] transition-colors group flex flex-col items-center disabled:opacity-50"
                      >
                        {deletingCourseId === course.id ? (
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-[#FDA29B] border-t-red-600"></div>
                        ) : (
                          <TrashIcon className="w-4 h-4 text-[#475569] group-hover:text-[#B42318]" />
                        )}
                        <span className="text-[9px] text-[#475569] mt-0.5">
                          {deletingCourseId === course.id ? '...' : 'Delete'}
                        </span>
                      </button>
                    </div>

                    {/* Conditional Status Action */}
                    {course.status === 'DRAFT' && (
                      <Button
                        size="sm"
                        onClick={() => handlePublishCourse(course.id, course.title)}
                        disabled={publishingCourseId === course.id}
                        className="w-full bg-[#079455] hover:bg-[#067647] text-white text-xs py-2"
                      >
                        {publishingCourseId === course.id ? (
                          <>
                            <div className="w-3.5 h-3.5 mr-1.5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                            {user?.role?.toLowerCase() === 'admin' ? 'Publishing...' : 'Submitting...'}
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="w-3.5 h-3.5 mr-1.5" />
                            {user?.role?.toLowerCase() === 'admin' ? 'Publish Course' : 'Submit for Review'}
                          </>
                        )}
                      </Button>
                    )}
                    {course.status === 'PENDING_REVIEW' && user?.role?.toLowerCase() === 'admin' && (
                      <Button
                        size="sm"
                        onClick={() => handlePublishCourse(course.id, course.title)}
                        disabled={publishingCourseId === course.id}
                        className="w-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs py-2"
                      >
                        {publishingCourseId === course.id ? (
                          <>
                            <div className="w-3.5 h-3.5 mr-1.5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                            Publishing...
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="w-3.5 h-3.5 mr-1.5" />
                            Publish Course
                          </>
                        )}
                      </Button>
                    )}
                    {/* Fix & Resubmit - Only for Tutors on their rejected courses */}
                    {course.status === 'REJECTED' && user?.role?.toLowerCase() === 'tutor' && (
                      <Link href={`/courses/${course.id}/edit`}>
                        <Button size="sm" className="w-full bg-[#DC6803] hover:bg-[#B45309] text-white text-xs py-2">
                          <PencilIcon className="w-3.5 h-3.5 mr-1.5" />
                          Fix & Resubmit
                        </Button>
                      </Link>
                    )}

                    {/* Pending Review - Show status for Tutors */}
                    {course.status === 'PENDING_REVIEW' && user?.role?.toLowerCase() === 'tutor' && (
                      <div className="w-full bg-[#EFF4FF] border border-[#C7D7FE] rounded-md px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <ClockIcon className="w-3.5 h-3.5 text-[#1D4ED8]" />
                          <span className="text-xs text-[#1E40AF] font-medium">Under Review</span>
                        </div>
                        <p className="text-[10px] text-[#1D4ED8] mt-1">Your course is being reviewed</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && filteredCourses.length > 0 && (
              <div className="flex flex-col items-center gap-3 mt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="group relative px-8 py-3.5 bg-[#1D4ED8] text-white font-semibold rounded-xl hover:from-[#1E40AF] hover:to-[#1E40AF] disabled:from-[#94A3B8] disabled:to-[#64748B] disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none"
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
                <p className="text-sm text-[#475569]">
                  Showing <span className="font-semibold text-[#0F172A]">{filteredCourses.length}</span> of <span className="font-semibold text-[#0F172A]">{totalCourses}</span> courses
                </p>
              </div>
            )}

            {/* All Courses Loaded Message */}
            {!hasMore && filteredCourses.length > 0 && filteredCourses.length === totalCourses && (
              <div className="flex flex-col items-center gap-2 mt-8 py-6 border-t border-[#DDE3EA]">
                <div className="flex items-center gap-2 text-[#475569]">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">You've reached the end! All {totalCourses} courses shown.</span>
                </div>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="text-sm text-[#1D4ED8] hover:text-[#1E40AF] font-medium flex items-center gap-1 mt-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  Back to Top
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default Page;
