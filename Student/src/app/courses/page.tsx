'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
  XMarkIcon
} from '@heroicons/react/24/outline';
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
}


export default function CoursesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('search') || '');
  const [selectedLevel, setSelectedLevel] = useState(searchParams?.get('level') || '');
  const [priceRange, setPriceRange] = useState(searchParams?.get('price') || '');
  const [sortBy, setSortBy] = useState(searchParams?.get('sort') || 'newest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);

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
    { label: 'Most Popular', value: 'popular' },
    { label: 'Highest Rated', value: 'rating' },
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' }
  ];


  useEffect(() => {
    fetchCourses();
  }, [searchQuery, selectedLevel, priceRange, sortBy, currentPage]);


  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 12,
      };

      if (searchQuery) params.search = searchQuery;
      if (selectedLevel) params.level = selectedLevel;

      const response = await api.courses.getAll(params);
      if (response.success && response.data) {
        let filteredCourses = response.data.courses;

        // Enrich courses with enrollment data if user is logged in
        if (user) {
          try {
            const enrollmentsResponse = await api.enrollments.getMy();
            if (enrollmentsResponse.success) {
              const enrollmentMap = new Map(
                enrollmentsResponse.data.enrollments.map((e: any) => [
                  e.course.id,
                  { status: e.status, progressPercentage: e.progressPercentage, hasReviewed: e.hasReviewed }
                ])
              );

              filteredCourses = filteredCourses.map((course: Course) => {
                const enrollment = enrollmentMap.get(course.id);
                return {
                  ...course,
                  enrollmentStatus: enrollment?.status,
                  progressPercentage: enrollment?.progressPercentage,
                  hasReviewed: enrollment?.hasReviewed
                };
              });
            }
          } catch (error) {
            console.error('Error fetching enrollments for course enrichment:', error);
          }
        }

        // Apply price filter (client-side since backend might not support it)
        if (priceRange) {
          filteredCourses = filteredCourses.filter((course: Course) => {
            switch (priceRange) {
              case 'free':
                return course.price === 0;
              case '0-50':
                return course.price > 0 && course.price <= 50;
              case '50-100':
                return course.price > 50 && course.price <= 100;
              case '100+':
                return course.price > 100;
              default:
                return true;
            }
          });
        }

        // Apply sorting
        if (sortBy !== 'newest') {
          filteredCourses.sort((a: Course, b: Course) => {
            switch (sortBy) {
              case 'popular':
                return b._count.enrollments - a._count.enrollments;
              case 'rating':
                return (b.averageRating || 0) - (a.averageRating || 0);
              case 'price-asc':
                return a.price - b.price;
              case 'price-desc':
                return b.price - a.price;
              default:
                return 0;
            }
          });
        }

        setCourses(filteredCourses);
        setTotalPages(response.data.pagination.pages);
        setTotalCourses(response.data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    if (!user) {
      toast.error('Please login to enroll in courses');
      return;
    }

    try {
      setEnrolling(courseId);
      const response = await api.enrollments.enroll(courseId);
      if (response.success) {
        toast.success('Successfully enrolled in course!');
        // Refresh the courses data to get updated enrollment status
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
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || selectedLevel || priceRange || sortBy !== 'newest';

  const getCourseButtonState = (course: Course) => {
    if (!course.isEnrolled) {
      return { text: 'View Course', href: `/courses/${course.id}` };
    }

    const isCompleted = course.enrollmentStatus === 'COMPLETED' || (course.progressPercentage && course.progressPercentage >= 100);

    if (isCompleted) {
      if (course.hasReviewed) {
        return { text: 'Completed', href: `/courses/${course.id}` };
      } else {
        return { text: 'Rate Course', href: `/courses/${course.id}` };
      }
    } else {
      return { text: 'Continue Learning', href: `/learn/${course.id}` };
    }
  };

  const getCourseStatusBadge = (course: Course) => {
    if (!course.isEnrolled) return null;

    const isCompleted = course.enrollmentStatus === 'COMPLETED' || (course.progressPercentage && course.progressPercentage >= 100);

    if (isCompleted) {
      if (course.hasReviewed) {
        return { text: 'Completed', color: 'bg-green-500' };
      } else {
        return { text: 'Rate Course', color: 'bg-orange-500' };
      }
    } else {
      return { text: `${Math.min(100, Math.round(course.progressPercentage || 0))}%`, color: 'bg-blue-500' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Explore Courses
              </h1>
              <p className="text-slate-600">
                {totalCourses > 0 ? `${totalCourses} courses available` : 'Loading courses...'} - Find your perfect learning path
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md w-full lg:w-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700"
            >
              <FunnelIcon className="h-5 w-5" />
              <span>Filters</span>
              <ChevronDownIcon className={`h-4 w-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>


            {/* Sort */}
            <div className="ml-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-6 p-6 bg-slate-50 rounded-lg border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Level */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Level
                  </label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                  >
                    <option value="">All Levels</option>
                    {levels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Price
                  </label>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                  >
                    <option value="">All Prices</option>
                    {priceRanges.map((range) => (
                      <option key={range.value} value={range.value}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="w-full px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap gap-2">
              {searchQuery && (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-200">
                  Search: "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery('')}
                    className="hover:bg-blue-100 rounded-full p-1 transition-colors"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedLevel && (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm border border-purple-200">
                  Level: {selectedLevel}
                  <button
                    onClick={() => setSelectedLevel('')}
                    className="hover:bg-purple-100 rounded-full p-1 transition-colors"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              {priceRange && (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-700 rounded-lg text-sm border border-orange-200">
                  Price: {priceRanges.find(p => p.value === priceRange)?.label}
                  <button
                    onClick={() => setPriceRange('')}
                    className="hover:bg-orange-100 rounded-full p-1 transition-colors"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Course Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow border border-slate-200 animate-pulse">
                <div className="aspect-video bg-slate-200 rounded-t-lg"></div>
                <div className="p-6">
                  <div className="h-5 bg-slate-200 rounded mb-3"></div>
                  <div className="h-4 bg-slate-200 rounded mb-3"></div>
                  <div className="h-4 bg-slate-200 rounded mb-6"></div>
                  <div className="h-10 bg-slate-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : courses.length > 0 ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {courses.map((course) => (
                <div key={course.id} className="bg-white rounded-lg shadow border border-slate-200 hover:shadow-lg transition-shadow overflow-hidden">
                  <div className="aspect-video bg-slate-100 flex items-center justify-center relative">
                    {course.thumbnail ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${course.thumbnail}`}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpenIcon className="h-16 w-16 text-slate-400" />
                    )}
                    {(() => {
                      const badge = getCourseStatusBadge(course);
                      return badge && (
                        <div className={`absolute top-3 right-3 ${badge.color} text-white px-2 py-1 rounded text-xs font-medium`}>
                          {badge.text}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="p-6">
                    <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">{course.title}</h3>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">{course.description}</p>

                    <div className="text-sm text-slate-600 mb-4">
                      by {course.tutorName || (course.creator ? `${course.creator.firstName} ${course.creator.lastName}` : 'Instructor')}
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        <span>{course.duration ? `${course.duration}h` : 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <UsersIcon className="h-4 w-4" />
                        <span>{course._count.enrollments}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`h-4 w-4 ${i < Math.floor(course.averageRating || 0) ? 'fill-current' : ''}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-slate-600 ml-2">
                          {course.averageRating?.toFixed(1) || 'N/A'}
                        </span>
                      </div>
                      <span className="font-semibold text-slate-900">
                        {course.price === 0 ? 'Free' : `$${course.price}`}
                      </span>
                    </div>

                    {course.isEnrolled ? (
                      (() => {
                        const buttonState = getCourseButtonState(course);
                        return (
                          <Link href={buttonState.href}>
                            <button className={`w-full py-3 rounded-lg transition-colors font-medium ${
                              buttonState.text === 'Completed'
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}>
                              {buttonState.text}
                            </button>
                          </Link>
                        );
                      })()
                    ) : (
                      <div className="space-y-2">
                        <Link href={`/courses/${course.id}`}>
                          <button className="w-full border border-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium">
                            View Details
                          </button>
                        </Link>
                        <button
                          onClick={() => handleEnroll(course.id)}
                          disabled={enrolling === course.id}
                          className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                          {enrolling === course.id ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Enrolling...</span>
                            </div>
                          ) : (
                            `Enroll ${course.price === 0 ? 'Free' : `$${course.price}`}`
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <nav className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg"
                  >
                    Previous
                  </button>

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm font-medium transition-colors rounded-lg ${
                          currentPage === page
                            ? 'bg-indigo-600 text-white'
                            : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MagnifyingGlassIcon className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">
              {hasActiveFilters ? 'No courses found' : 'No courses available'}
            </h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              {hasActiveFilters
                ? 'Try adjusting your search criteria or browse all courses to find your perfect learning path.'
                : 'Check back later for new courses! We\'re constantly adding exciting learning opportunities.'
              }
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Browse All Courses
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}