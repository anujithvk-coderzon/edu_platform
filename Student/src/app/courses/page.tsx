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

interface Category {
  id: string;
  name: string;
  description?: string;
  _count: {
    courses: number;
  };
}

export default function CoursesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams?.get('category') || '');
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
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [searchQuery, selectedCategory, selectedLevel, priceRange, sortBy, currentPage]);

  const fetchCategories = async () => {
    try {
      const response = await api.courses.getCategories();
      if (response.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 12,
      };

      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedLevel) params.level = selectedLevel;

      const response = await api.courses.getAll(params);
      if (response.success) {
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
    setSelectedCategory('');
    setSelectedLevel('');
    setPriceRange('');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedLevel || priceRange || sortBy !== 'newest';

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-br from-blue-200 to-pink-200 rounded-full blur-3xl opacity-30"></div>

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-indigo-200/50 relative z-10">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="text-center lg:text-left">
              <div className="flex justify-center lg:justify-start mb-6">
                <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-700 rounded-3xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300 group">
                  <span className="text-white font-bold text-2xl group-hover:scale-110 transition-transform duration-300">🎓</span>
                </div>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                Explore Courses ✨
              </h1>
              <p className="text-slate-700 text-xl font-medium">
                🚀 {totalCourses > 0 ? `${totalCourses} courses available` : 'Loading courses...'} • Find your perfect learning path
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md w-full lg:w-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Search courses..."
                className="w-full pl-12 pr-6 py-4 bg-white/90 backdrop-blur-sm border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 shadow-lg text-lg font-medium placeholder:text-slate-500 hover:shadow-xl"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-slate-500">
                <span>🔍</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-indigo-200/50 relative z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center gap-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl hover:from-indigo-100 hover:to-purple-100 transition-all duration-200 shadow-md hover:shadow-lg font-bold text-slate-800"
            >
              <span>🎛️</span>
              <span>Filters</span>
              <ChevronDownIcon className={`h-5 w-5 transform transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-3">
              {categories.slice(0, 4).map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(selectedCategory === category.name ? '' : category.name)}
                  className={`px-4 py-2 rounded-2xl text-sm font-bold border-2 transition-all duration-200 hover:scale-105 shadow-md ${
                    selectedCategory === category.name
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-600 shadow-lg'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                  }`}
                >
                  🏷️ {category.name}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="ml-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-white/90 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 shadow-md font-bold text-slate-800"
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
            <div className="mt-6 p-8 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 backdrop-blur-sm rounded-3xl border-2 border-indigo-200/50 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Categories */}
                <div>
                  <label className="block text-lg font-bold text-slate-800 mb-3 flex items-center space-x-2">
                    <span>🏷️</span>
                    <span>Category</span>
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-white/90 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 shadow-md font-medium text-slate-800"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name} ({category._count.courses})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Level */}
                <div>
                  <label className="block text-lg font-bold text-slate-800 mb-3 flex items-center space-x-2">
                    <span>📊</span>
                    <span>Level</span>
                  </label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full px-4 py-3 bg-white/90 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 shadow-md font-medium text-slate-800"
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
                  <label className="block text-lg font-bold text-slate-800 mb-3 flex items-center space-x-2">
                    <span>💰</span>
                    <span>Price</span>
                  </label>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full px-4 py-3 bg-white/90 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 shadow-md font-medium text-slate-800"
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
                      className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold rounded-2xl hover:from-red-600 hover:to-pink-700 transition-all duration-200 hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
                    >
                      <span>🗑️</span>
                      <span>Clear All</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mt-6 flex flex-wrap gap-3">
              {searchQuery && (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-2xl text-sm font-bold border-2 border-blue-200 shadow-md">
                  🔍 Search: "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery('')}
                    className="hover:bg-blue-200 rounded-full p-1 transition-colors duration-200"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </span>
              )}
              {selectedCategory && (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-2xl text-sm font-bold border-2 border-green-200 shadow-md">
                  🏷️ Category: {selectedCategory}
                  <button
                    onClick={() => setSelectedCategory('')}
                    className="hover:bg-green-200 rounded-full p-1 transition-colors duration-200"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </span>
              )}
              {selectedLevel && (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-2xl text-sm font-bold border-2 border-purple-200 shadow-md">
                  📊 Level: {selectedLevel}
                  <button
                    onClick={() => setSelectedLevel('')}
                    className="hover:bg-purple-200 rounded-full p-1 transition-colors duration-200"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </span>
              )}
              {priceRange && (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 rounded-2xl text-sm font-bold border-2 border-orange-200 shadow-md">
                  💰 Price: {priceRanges.find(p => p.value === priceRange)?.label}
                  <button
                    onClick={() => setPriceRange('')}
                    className="hover:bg-orange-200 rounded-full p-1 transition-colors duration-200"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Course Grid */}
      <div className="container mx-auto px-4 py-12 relative z-10">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl animate-pulse border border-indigo-200/50">
                <div className="aspect-video bg-gradient-to-br from-indigo-200 to-purple-200 rounded-t-3xl"></div>
                <div className="p-6">
                  <div className="h-6 bg-indigo-200 rounded-xl mb-3"></div>
                  <div className="h-4 bg-slate-200 rounded-xl mb-3"></div>
                  <div className="h-4 bg-slate-200 rounded-xl mb-6"></div>
                  <div className="h-12 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-2xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : courses.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
              {courses.map((course) => (
                <div key={course.id} className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-indigo-200/50 overflow-hidden group">
                  <div className="aspect-video bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-600 rounded-t-3xl flex items-center justify-center relative overflow-hidden">
                    {course.thumbnail ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${course.thumbnail}`}
                        alt={course.title}
                        className="w-full h-full object-cover rounded-t-3xl group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="relative">
                        <BookOpenIcon className="h-20 w-20 text-white opacity-90" />
                        <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse"></div>
                      </div>
                    )}
                    {(() => {
                      const badge = getCourseStatusBadge(course);
                      return badge && (
                        <div className={`absolute top-3 right-3 ${badge.color} text-white px-3 py-2 rounded-2xl text-sm font-bold shadow-lg border-2 border-white/20`}>
                          {badge.text}
                        </div>
                      );
                    })()}
                    {course.category && (
                      <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-2xl text-sm font-bold border border-white/20">
                        🏷️ {course.category.name}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  <div className="p-8">
                    <h3 className="font-bold text-slate-800 mb-3 line-clamp-2 text-xl group-hover:text-indigo-700 transition-colors duration-200">{course.title}</h3>
                    <p className="text-slate-700 text-sm mb-4 line-clamp-2 font-medium leading-relaxed">{course.description}</p>

                    <div className="text-sm font-bold text-slate-700 mb-4 flex items-center space-x-2">
                      <span>👨‍🏫</span>
                      <span>by {course.tutorName || (course.creator ? `${course.creator.firstName} ${course.creator.lastName}` : 'Instructor')}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm font-bold text-slate-700 mb-6">
                      <div className="flex items-center bg-blue-50 px-3 py-2 rounded-xl border border-blue-200">
                        <span className="mr-2">⏱️</span>
                        <span>{course.duration ? `${course.duration}h` : 'N/A'}</span>
                      </div>
                      <div className="flex items-center bg-green-50 px-3 py-2 rounded-xl border border-green-200">
                        <span className="mr-2">👥</span>
                        <span>{course._count.enrollments}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`h-5 w-5 ${i < Math.floor(course.averageRating || 0) ? 'fill-current' : ''}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-bold text-slate-700 ml-2">
                          {course.averageRating?.toFixed(1) || 'N/A'}
                        </span>
                      </div>
                      <span className="font-bold text-2xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {course.price === 0 ? '🆓 Free' : `💰 $${course.price}`}
                      </span>
                    </div>

                    {course.isEnrolled ? (
                      (() => {
                        const buttonState = getCourseButtonState(course);
                        return (
                          <Link href={buttonState.href}>
                            <button className={`w-full py-4 rounded-2xl transition-all duration-200 hover:scale-105 shadow-lg font-bold text-lg flex items-center justify-center space-x-2 ${
                              buttonState.text === 'Completed'
                                ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:from-green-700 hover:to-emerald-800'
                                : 'bg-gradient-to-r from-indigo-600 to-purple-700 text-white hover:from-indigo-700 hover:to-purple-800'
                            }`}>
                              <span>{buttonState.text === 'Completed' ? '✅' : buttonState.text === 'Continue Learning' ? '📚' : '⭐'}</span>
                              <span>{buttonState.text}</span>
                            </button>
                          </Link>
                        );
                      })()
                    ) : (
                      <div className="space-y-3">
                        <Link href={`/courses/${course.id}`}>
                          <button className="w-full border-2 border-indigo-600 text-indigo-700 py-3 rounded-2xl hover:bg-indigo-50 transition-all duration-200 font-bold hover:scale-105 shadow-md flex items-center justify-center space-x-2">
                            <span>👀</span>
                            <span>View Details</span>
                          </button>
                        </Link>
                        <button
                          onClick={() => handleEnroll(course.id)}
                          disabled={enrolling === course.id}
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
                        >
                          {enrolling === course.id ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Enrolling...</span>
                            </>
                          ) : (
                            <>
                              <span>🚀</span>
                              <span>Enroll {course.price === 0 ? 'Free' : `$${course.price}`}</span>
                            </>
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
                <nav className="flex space-x-3 bg-white/80 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-indigo-200/50">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-6 py-3 text-sm font-bold rounded-2xl border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-md"
                  >
                    ⬅️ Previous
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
                        className={`px-4 py-3 text-sm font-bold rounded-2xl border-2 transition-all duration-200 hover:scale-105 shadow-md ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-600'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-6 py-3 text-sm font-bold rounded-2xl border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-md"
                  >
                    Next ➡️
                  </button>
                </nav>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="w-32 h-32 bg-gradient-to-br from-indigo-300 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-white text-6xl">🔍</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 mb-6">
              {hasActiveFilters ? 'No courses found with current filters ✨' : 'No courses available 📚'}
            </h3>
            <p className="text-slate-700 mb-8 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
              {hasActiveFilters
                ? 'Try adjusting your search criteria or browse all courses to find your perfect learning path!'
                : 'Check back later for new courses! We\'re constantly adding exciting learning opportunities.'
              }
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-200 hover:scale-105 shadow-2xl flex items-center space-x-3 mx-auto"
              >
                <span>🌟</span>
                <span>Browse All Courses</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}