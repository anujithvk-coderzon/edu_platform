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
  StarIcon,
  ChevronDownIcon,
  XMarkIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

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
  const [loadError, setLoadError] = useState<string | null>(null);

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
        setLoadError(null);
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
    } catch (error: any) {
      // Keep the real reason: an empty catalogue and a failed request are
      // different situations and must not look the same on screen.
      const reason = error?.message || 'The server did not respond.';
      setLoadError(reason);
      if (!append) setCourses([]);
      toast.error(reason);
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


  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-[#DDE3EA]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-h2 sm:text-h1 text-[#0F172A] mb-1">
                Explore Courses
              </h1>
              <p className="text-sm text-[#475569]">
                {totalCourses > 0 ? `${totalCourses} courses available` : 'Loading courses...'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Search & Filters Bar */}
      <div className="sticky top-16 sm:top-18 md:top-20 lg:top-24 z-20 bg-white border-b border-[#DDE3EA]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          {/* Search Bar - Always Visible */}
          <div className="relative mb-3">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#94A3B8] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses by title, instructor, or topic..."
              className="w-full pl-12 pr-4 py-3 sm:py-3.5 bg-white border-2 border-[#DDE3EA] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8] focus:bg-white text-sm sm:text-base transition-all placeholder:text-[#94A3B8]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-[#E9EEF4] rounded-full transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-[#64748B]" />
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
                  className={`px-3 py-1.5 rounded-[4px] text-sm font-medium transition-all ${
                    !selectedLevel
                      ? 'bg-[#1D4ED8] text-white '
                      : 'bg-[#F6F8FA] text-[#0F172A] hover:bg-[#E9EEF4]'
                  }`}
                >
                  All Levels
                </button>
                {levels.map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`px-3 py-1.5 rounded-[4px] text-sm font-medium transition-all ${
                      selectedLevel === level
                        ? 'bg-[#1D4ED8] text-white '
                        : 'bg-[#F6F8FA] text-[#0F172A] hover:bg-[#E9EEF4]'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-[#CBD5E1]"></div>

              {/* Price Pills */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPriceRange('')}
                  className={`px-3 py-1.5 rounded-[4px] text-sm font-medium transition-all ${
                    !priceRange
                      ? 'bg-[#1D4ED8] text-white '
                      : 'bg-[#F6F8FA] text-[#0F172A] hover:bg-[#E9EEF4]'
                  }`}
                >
                  All Prices
                </button>
                {priceRanges.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setPriceRange(range.value)}
                    className={`px-3 py-1.5 rounded-[4px] text-sm font-medium transition-all whitespace-nowrap ${
                      priceRange === range.value
                        ? 'bg-[#1D4ED8] text-white '
                        : 'bg-[#F6F8FA] text-[#0F172A] hover:bg-[#E9EEF4]'
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
              className="lg:hidden flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F6F8FA] hover:bg-[#E9EEF4] rounded-[6px] transition-all text-sm font-medium flex-1 relative"
            >
              <FunnelIcon className="h-5 w-5 text-[#0F172A]" />
              <span className="text-[#0F172A]">Filters</span>
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 bg-[#1D4ED8] text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 font-semibold">
                  {[selectedLevel, priceRange].filter(Boolean).length}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 bg-[#F6F8FA] hover:bg-[#E9EEF4] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm font-medium text-[#0F172A] cursor-pointer transition-all min-w-[140px] sm:min-w-[180px]"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#475569] pointer-events-none" />
            </div>

            {/* Clear All Button */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2.5 bg-[#FEF3F2] hover:bg-[#FEE4E2] text-[#B42318] rounded-[6px] transition-all text-sm font-medium border border-[#FECDCA]"
              >
                <XMarkIcon className="h-4 w-4" />
                <span className="hidden xl:inline">Clear</span>
              </button>
            )}
          </div>

          {/* Mobile Filters Panel */}
          {showFilters && (
            <div className="lg:hidden mt-4 p-4 bg-white rounded-[6px] border border-[#DDE3EA] space-y-4 animate-in slide-in-from-top-2 duration-200">
              {/* Level Filter */}
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-2 uppercase tracking-wide">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedLevel('')}
                    className={`px-4 py-2.5 rounded-[4px] text-sm font-medium transition-all ${
                      !selectedLevel
                        ? 'bg-[#1D4ED8] text-white '
                        : 'bg-white text-[#0F172A] border border-[#C7D2DE] hover:border-[#1D4ED8]'
                    }`}
                  >
                    All Levels
                  </button>
                  {levels.map((level) => (
                    <button
                      key={level}
                      onClick={() => setSelectedLevel(level)}
                      className={`px-4 py-2.5 rounded-[4px] text-sm font-medium transition-all ${
                        selectedLevel === level
                          ? 'bg-[#1D4ED8] text-white '
                          : 'bg-white text-[#0F172A] border border-[#C7D2DE] hover:border-[#1D4ED8]'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-2 uppercase tracking-wide">
                  Price Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPriceRange('')}
                    className={`px-4 py-2.5 rounded-[4px] text-sm font-medium transition-all ${
                      !priceRange
                        ? 'bg-[#1D4ED8] text-white '
                        : 'bg-white text-[#0F172A] border border-[#C7D2DE] hover:border-[#1D4ED8]'
                    }`}
                  >
                    All Prices
                  </button>
                  {priceRanges.map((range) => (
                    <button
                      key={range.value}
                      onClick={() => setPriceRange(range.value)}
                      className={`px-4 py-2.5 rounded-[4px] text-sm font-medium transition-all ${
                        priceRange === range.value
                          ? 'bg-[#1D4ED8] text-white '
                          : 'bg-white text-[#0F172A] border border-[#C7D2DE] hover:border-[#1D4ED8]'
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
                    className="flex-1 px-4 py-2.5 bg-white border-2 border-[#FDA29B] text-[#B42318] font-medium rounded-[4px] hover:bg-[#FEF3F2] transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 px-4 py-2.5 bg-[#1D4ED8] text-white font-medium rounded-[4px] hover:bg-[#1E40AF] transition-all text-sm"
                >
                  Show {totalCourses} Courses
                </button>
              </div>
            </div>
          )}

          {/* Active Filters Tags */}
          {hasActiveFilters && !showFilters && (
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold text-[#475569] uppercase tracking-wide">Active:</span>
              {selectedLevel && (
                <button
                  onClick={() => setSelectedLevel('')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F6F8FA] text-[#475569] rounded-[4px] text-xs font-medium border border-[#DDE3EA] hover:border-[#C7D2DE] transition-all group"
                >
                  <span>{selectedLevel}</span>
                  <XMarkIcon className="h-3.5 w-3.5 transition-transform" />
                </button>
              )}
              {priceRange && (
                <button
                  onClick={() => setPriceRange('')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F6F8FA] text-[#0F172A] rounded-[4px] text-xs font-medium border border-[#DDE3EA] hover:border-[#C7D2DE] transition-all group"
                >
                  <span>{priceRanges.find(p => p.value === priceRange)?.label}</span>
                  <XMarkIcon className="h-3.5 w-3.5 transition-transform" />
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
              <div key={i} className="bg-white rounded-[4px] border border-[#DDE3EA] animate-pulse">
                <div className="h-48 bg-[#E9EEF4] rounded-t-lg"></div>
                <div className="p-4">
                  <div className="h-5 bg-[#E9EEF4] rounded mb-3"></div>
                  <div className="h-4 bg-[#E9EEF4] rounded mb-3"></div>
                  <div className="h-4 bg-[#E9EEF4] rounded mb-4"></div>
                  <div className="h-10 bg-[#E9EEF4] rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : courses.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {courses.map((course) => (
                <article
                  key={course.id}
                  className="group flex h-full flex-col overflow-hidden rounded-[6px] border border-[#DDE3EA] bg-white transition-colors hover:border-[#1D4ED8]"
                >
                  {/* Thumbnail — one overlay only; everything else reads below. */}
                  <div className="relative h-48 flex-shrink-0 overflow-hidden bg-[#F6F8FA]">
                    {course.thumbnail ? (
                      <>
                        <img
                          src={course.thumbnail}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl opacity-45"
                        />
                        <img
                          src={course.thumbnail}
                          alt=""
                          className="relative h-full w-full object-contain"
                        />
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <BookOpenIcon className="h-12 w-12 text-[#CBD5E1]" />
                      </div>
                    )}

                    <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
                      {course.isEnrolled && (
                        <span
                          className={`rounded-[3px] px-2.5 py-1 text-[11px] font-semibold shadow-[0_1px_4px_rgba(15,23,42,0.45)] ${
                            (course.progressPercentage ?? 0) >= 100 ||
                            course.enrollmentStatus === 'COMPLETED'
                              ? 'bg-white text-[#0F172A] ring-1 ring-black/5'
                              : 'bg-[#1D4ED8] text-white'
                          }`}
                        >
                          {(course.progressPercentage ?? 0) >= 100 ||
                          course.enrollmentStatus === 'COMPLETED'
                            ? 'Completed'
                            : 'Enrolled'}
                        </span>
                      )}

                      {/* Something new to watch is the one thing worth
                          interrupting for, so it gets the warm signal colour. */}
                      {course.hasNewContent && (
                        <span className="inline-flex items-center gap-1.5 rounded-[3px] bg-[#B45309] px-2.5 py-1 text-[11px] font-semibold text-white shadow-[0_1px_4px_rgba(15,23,42,0.45)]">
                          <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                          New material
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    {/* Title leads. Everything under it is support. */}
                    <h3 className="text-body font-semibold leading-snug text-[#0F172A] line-clamp-2 transition-colors group-hover:text-[#1D4ED8]">
                      {course.title}
                    </h3>

                    <p className="mt-1.5 text-caption text-[#475569] truncate">
                      {course.tutor
                        ? `${course.tutor.firstName} ${course.tutor.lastName}`
                        : course.tutorName ||
                          (course.creator
                            ? `${course.creator.firstName} ${course.creator.lastName}`
                            : 'Instructor')}
                    </p>

                    <p className="mt-2 text-[12px] leading-relaxed text-[#64748B] line-clamp-2">
                      {course.description}
                    </p>

                    {/* One typographic meta line instead of three icon pairs. */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-[#475569]">
                      {course.level && (
                        <span className="rounded-[3px] border border-[#DDE3EA] px-1.5 py-0.5 text-[11px] font-medium text-[#0F172A]">
                          {course.level}
                        </span>
                      )}
                      {(course.averageRating ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <StarIconSolid className="h-3.5 w-3.5 text-[#B45309]" />
                          <span className="font-medium text-[#0F172A] tabular-nums">
                            {course.averageRating.toFixed(1)}
                          </span>
                        </span>
                      )}
                      {(course._count?.enrollments ?? 0) > 0 && (
                        <span className="tabular-nums">
                          {course._count.enrollments} enrolled
                        </span>
                      )}
                      {course.duration && (
                        <span className="tabular-nums">{course.duration}h</span>
                      )}
                    </div>

                    {/* Progress replaces a bare percentage badge. */}
                    {course.isEnrolled &&
                      (course.progressPercentage ?? 0) < 100 &&
                      course.enrollmentStatus !== 'COMPLETED' && (
                        <div className="mt-3 flex items-center gap-2.5">
                          <div className="h-[3px] flex-1 rounded-full bg-[#E9EEF4]">
                            <div
                              className="h-full rounded-full bg-[#1D4ED8]"
                              style={{
                                width: `${Math.min(100, Math.round(course.progressPercentage ?? 0))}%`,
                              }}
                            />
                          </div>
                          <span className="text-[12px] font-medium tabular-nums text-[#475569]">
                            {Math.min(100, Math.round(course.progressPercentage ?? 0))}%
                          </span>
                        </div>
                      )}

                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#DDE3EA] pt-3.5">
                      <span className="text-body font-semibold tabular-nums text-[#0F172A]">
                        {course.price === 0
                          ? 'Free'
                          : `₹${course.price.toLocaleString('en-IN')}`}
                      </span>

                      {(() => {
                        const buttonState = getCourseButtonState(course);
                        // A filled button means you already have this in progress;
                        // browsing a new course is a quieter, secondary action.
                        return course.isEnrolled ? (
                          <Link
                            href={buttonState.href}
                            className="rounded-[4px] bg-[#1D4ED8] px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#1E40AF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
                          >
                            {buttonState.text}
                          </Link>
                        ) : (
                          <Link
                            href={buttonState.href}
                            className="rounded-[4px] border border-[#DDE3EA] px-3.5 py-2 text-[12px] font-semibold text-[#0F172A] transition-colors hover:border-[#1D4ED8] hover:text-[#1D4ED8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
                          >
                            {buttonState.text}
                          </Link>
                        );
                      })()}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && courses.length > 0 && (
              <div className="flex flex-col items-center gap-3 mt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="rounded-[4px] bg-[#1D4ED8] px-7 py-3 text-body font-semibold text-white transition-colors hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:bg-[#E9EEF4] disabled:text-[#94A3B8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
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
                  Showing <span className="font-semibold text-[#0F172A]">{courses.length}</span> of <span className="font-semibold text-[#0F172A]">{totalCourses}</span> courses
                </p>
              </div>
            )}

            {/* All Courses Loaded Message */}
            {!hasMore && courses.length > 0 && courses.length === totalCourses && (
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
        ) : loadError ? (
          <div className="rounded-[6px] border border-[#DDE3EA] bg-white px-6 py-14 text-center">
            <h3 className="text-title text-[#0F172A]">
              Courses could not be loaded
            </h3>
            <p className="mx-auto mt-2 max-w-[52ch] text-body leading-relaxed text-[#475569]">
              {loadError}
            </p>
            <button
              onClick={() => fetchCourses(1, false)}
              className="mt-6 rounded-[4px] bg-[#1D4ED8] px-6 py-2.5 text-ui font-semibold text-white transition-colors hover:bg-[#1E40AF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="rounded-[6px] border border-[#DDE3EA] bg-white px-6 py-14 text-center">
            <h3 className="text-title text-[#0F172A]">
              {hasActiveFilters ? 'Nothing matches those filters' : 'No courses published yet'}
            </h3>
            <p className="mx-auto mt-2 max-w-[52ch] text-body leading-relaxed text-[#475569]">
              {hasActiveFilters
                ? 'Try a broader search, or clear the filters to see everything available.'
                : 'New courses appear here as soon as they go live.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-6 rounded-[4px] bg-[#1D4ED8] px-6 py-2.5 text-ui font-semibold text-white transition-colors hover:bg-[#1E40AF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
              >
                Clear filters
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1D4ED8]"></div>
      </div>
    }>
      <CoursesContent />
    </Suspense>
  );
}
