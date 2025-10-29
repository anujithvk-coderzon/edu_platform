'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  BookOpenIcon,
  ClockIcon,
  StarIcon,
  UsersIcon,
  ChevronDownIcon,
  XMarkIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
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
  tutor?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
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
}


function CoursesContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('search') || '');
  const [selectedLevel, setSelectedLevel] = useState(searchParams?.get('level') || '');
  const [priceRange, setPriceRange] = useState(searchParams?.get('price') || '');
  const [sortBy, setSortBy] = useState(searchParams?.get('sort') || 'newest');

  // Load More State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCourses, setTotalCourses] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // UI State
  const [showFilters, setShowFilters] = useState(false);

  const levels = ['Beginner', 'Intermediate', 'Advanced'];
  const priceRanges = [
    { label: 'Free', value: 'free' },
    { label: 'Under $50', value: '0-50' },
    { label: '$50 - $100', value: '50-100' },
    { label: 'Over $100', value: '100+' }
  ];

  const sortOptions = [
    { label: 'Newest', value: 'newest' },
    { label: 'Highest Rated', value: 'rating' },
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' }
  ];


  useEffect(() => {
    // Reset to page 1 when filters change
    setPage(1);
    setCourses([]);
    fetchCourses(1, false);
  }, [searchQuery, selectedLevel, priceRange, sortBy]);

  const fetchCourses = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const filters: any = {
        page: pageNum,
        limit: 8
      };

      if (searchQuery) filters.search = searchQuery;
      if (selectedLevel) filters.level = selectedLevel;
      if (priceRange) filters.price = priceRange;
      if (sortBy) filters.sort = sortBy;

      const response = await api.courses.getAll(filters);
      if (response.success && response.data) {
        const courses = response.data.courses || [];

        // Backend now includes enrollment data, no need to fetch separately!
        // Append or replace courses
        if (append) {
          setCourses(prev => [...prev, ...courses]);
        } else {
          setCourses(courses);
        }

        // Check if there are more courses to load
        const totalPages = response.data.pagination?.pages || 1;
        const total = response.data.pagination?.total || 0;
        setHasMore(pageNum < totalPages);
        setTotalCourses(total);
      }
    } catch (error) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCourses(nextPage, true);
  };

  const handleEnroll = async (courseId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      setEnrolling(courseId);
      const response = await api.enrollments.enroll(courseId);
      if (response.success) {
        toast.success('Successfully enrolled in course!');
        await fetchCourses();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to enroll in course');
    } finally {
      setEnrolling(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedLevel('');
    setPriceRange('');
    setSortBy('newest');
    setPage(1);
  };

  const hasActiveFilters = searchQuery || selectedLevel || priceRange || sortBy !== 'newest';

  const getCourseButtonState = (course: Course) => {
    if (!course.isEnrolled) {
      return { text: 'View Course', href: `/courses/${course.id}`, type: 'view' };
    }

    const isCompleted = course.enrollmentStatus === 'COMPLETED' || (course.progressPercentage && course.progressPercentage >= 100);

    if (isCompleted) {
      // If completed but has new content
      if (course.hasNewContent) {
        return { text: 'View New Content', href: `/learn/${course.id}`, type: 'new-content' };
      }
      // If completed and reviewed
      if (course.hasReviewed) {
        return { text: 'View Contents', href: `/courses/${course.id}`, type: 'completed' };
      }
      // If completed but not reviewed
      return { text: 'Rate Course', href: `/courses/${course.id}/rate`, type: 'rate' };
    } else {
      return { text: 'Continue Learning', href: `/learn/${course.id}`, type: 'continue' };
    }
  };

  const getCourseStatusBadge = (course: Course) => {
    if (!course.isEnrolled) return null;

    const isCompleted = course.enrollmentStatus === 'COMPLETED' || (course.progressPercentage && course.progressPercentage >= 100);

    if (isCompleted) {
      return { text: 'Completed', color: 'bg-green-500' };
    } else {
      return { text: `${Math.min(100, Math.round(course.progressPercentage || 0))}%`, color: 'bg-indigo-600' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
                Explore Courses
              </h1>
              <p className="text-sm text-slate-600">
                {totalCourses > 0 ? `${totalCourses} courses available` : 'Loading courses...'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Search & Filters Bar */}
      <div className="sticky top-16 sm:top-18 md:top-20 lg:top-24 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          {/* Search Bar - Always Visible */}
          <div className="relative mb-3">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses by title, instructor, or topic..."
              className="w-full pl-12 pr-4 py-3 sm:py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white text-sm sm:text-base transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-slate-200 rounded-full transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-slate-500" />
              </button>
            )}
          </div>

          {/* Filter Controls Row */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Filters - Desktop */}
            <div className="hidden lg:flex items-center gap-2 flex-1">
              {/* Level Pills */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedLevel('')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    !selectedLevel
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All Levels
                </button>
                {levels.map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedLevel === level
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-slate-300"></div>

              {/* Price Pills */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPriceRange('')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    !priceRange
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All Prices
                </button>
                {priceRanges.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setPriceRange(range.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      priceRange === range.value
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-sm font-medium flex-1 relative"
            >
              <FunnelIcon className="h-5 w-5 text-slate-700" />
              <span className="text-slate-900">Filters</span>
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 font-semibold shadow-lg">
                  {[selectedLevel, priceRange].filter(Boolean).length}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-slate-900 cursor-pointer transition-all min-w-[140px] sm:min-w-[180px]"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-600 pointer-events-none" />
            </div>

            {/* Clear All Button */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-all text-sm font-medium border border-red-200"
              >
                <XMarkIcon className="h-4 w-4" />
                <span className="hidden xl:inline">Clear</span>
              </button>
            )}
          </div>

          {/* Mobile Filters Panel */}
          {showFilters && (
            <div className="lg:hidden mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4 animate-in slide-in-from-top-2 duration-200">
              {/* Level Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedLevel('')}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      !selectedLevel
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-300 hover:border-blue-500'
                    }`}
                  >
                    All Levels
                  </button>
                  {levels.map((level) => (
                    <button
                      key={level}
                      onClick={() => setSelectedLevel(level)}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        selectedLevel === level
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-300 hover:border-blue-500'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Price Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPriceRange('')}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      !priceRange
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-300 hover:border-blue-500'
                    }`}
                  >
                    All Prices
                  </button>
                  {priceRanges.map((range) => (
                    <button
                      key={range.value}
                      onClick={() => setPriceRange(range.value)}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        priceRange === range.value
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-300 hover:border-blue-500'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Action Buttons */}
              <div className="flex gap-2 pt-2">
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex-1 px-4 py-2.5 bg-white border-2 border-red-300 text-red-700 font-medium rounded-lg hover:bg-red-50 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all text-sm"
                >
                  Show {totalCourses} Courses
                </button>
              </div>
            </div>
          )}

          {/* Active Filters Tags */}
          {hasActiveFilters && !showFilters && (
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Active:</span>
              {selectedLevel && (
                <button
                  onClick={() => setSelectedLevel('')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 rounded-lg text-xs font-medium border border-purple-200 hover:border-purple-300 transition-all group"
                >
                  <span>{selectedLevel}</span>
                  <XMarkIcon className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                </button>
              )}
              {priceRange && (
                <button
                  onClick={() => setPriceRange('')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-50 to-green-100 text-green-700 rounded-lg text-xs font-medium border border-green-200 hover:border-green-300 transition-all group"
                >
                  <span>{priceRanges.find(p => p.value === priceRange)?.label}</span>
                  <XMarkIcon className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Course Grid */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-slate-200 animate-pulse">
                <div className="h-48 bg-slate-200 rounded-t-lg"></div>
                <div className="p-4">
                  <div className="h-5 bg-slate-200 rounded mb-3"></div>
                  <div className="h-4 bg-slate-200 rounded mb-3"></div>
                  <div className="h-4 bg-slate-200 rounded mb-4"></div>
                  <div className="h-10 bg-slate-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : courses.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="group bg-white rounded-lg shadow-sm border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all duration-200 overflow-hidden flex flex-col h-full"
                >
                  {/* Thumbnail */}
                  <div className="relative h-48 bg-slate-100 overflow-hidden flex-shrink-0">
                    {course.thumbnail && getImageUrl(course.thumbnail) ? (
                      <img
                        src={getImageUrl(course.thumbnail)!}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpenIcon className="h-16 w-16 text-slate-300" />
                      </div>
                    )}
                    {/* Status and New Content Badges */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                      {(() => {
                        const badge = getCourseStatusBadge(course);
                        return badge && (
                          <div className={`${badge.color} px-2 py-1 rounded text-xs font-medium shadow-lg`} style={{ color: 'white' }}>
                            {badge.text}
                          </div>
                        );
                      })()}
                      {course.hasNewContent && (
                        <div className="bg-orange-500 px-2 py-1 rounded text-xs font-medium shadow-lg animate-pulse" style={{ color: 'white' }}>
                          🆕 New Content Added
                        </div>
                      )}
                    </div>
                    {course.level && (
                      <div className="absolute top-2 left-2 bg-white/90 text-slate-700 px-2 py-1 rounded text-xs font-semibold border border-slate-200">
                        {course.level}
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    {/* Category */}
                    {course.category && (
                      <span className="text-xs font-medium text-blue-600 mb-2">
                        {course.category.name}
                      </span>
                    )}

                    {/* Title */}
                    <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 text-sm group-hover:text-blue-600 transition-colors">
                      {course.title}
                    </h3>

                    {/* Description */}
                    <p className="text-slate-600 text-xs mb-3 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>

                    {/* Instructor */}
                    <div className="text-xs text-slate-600 mb-3 truncate">
                      by {course.tutor ? `${course.tutor.firstName} ${course.tutor.lastName}` :
                          course.tutorName ||
                          (course.creator ? `${course.creator.firstName} ${course.creator.lastName}` : 'Instructor')}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-3 pb-3 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-1">
                        <StarIconSolid className="h-4 w-4 text-yellow-500" />
                        <span className="text-xs font-semibold text-slate-700">
                          {course.averageRating?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-600">
                        <UsersIcon className="h-4 w-4" />
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
                            <button className={`px-4 py-2 rounded-lg font-medium text-xs transition-colors ${
                              buttonState.type === 'completed'
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : buttonState.type === 'rate'
                                ? 'bg-orange-500 text-white hover:bg-orange-600'
                                : buttonState.type === 'new-content'
                                ? 'bg-orange-600 text-white hover:bg-orange-700 animate-pulse'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
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

            {/* Load More Button */}
            {hasMore && courses.length > 0 && (
              <div className="flex flex-col items-center gap-3 mt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="group relative px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none"
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
                  Showing <span className="font-semibold text-slate-900">{courses.length}</span> of <span className="font-semibold text-slate-900">{totalCourses}</span> courses
                </p>
              </div>
            )}

            {/* All Courses Loaded Message */}
            {!hasMore && courses.length > 0 && courses.length === totalCourses && (
              <div className="flex flex-col items-center gap-2 mt-8 py-6 border-t border-slate-200">
                <div className="flex items-center gap-2 text-slate-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">You've reached the end! All {totalCourses} courses shown.</span>
                </div>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mt-2"
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
          <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-slate-200">
            <AcademicCapIcon className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No courses found
            </h3>
            <p className="text-slate-600 mb-6 text-sm">
              Try adjusting your search or filter criteria
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CoursesContent />
    </Suspense>
  );
}
