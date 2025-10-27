'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import type { SelectOption } from '../../components/ui/Select';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarIcon,
  StarIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  BookOpenIcon,
  DocumentTextIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { api } from '../../lib/api';
import { Course } from '../../types/api';
import { useAuth } from '../../contexts/AuthContext';

interface AnalyticsData {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  students: {
    total: number;
    enrollments: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  courses: {
    total: number;
    published: number;
    draft: number;
    archived: number;
  };
  engagement: {
    totalEnrollments: number;
    avgRating: number;
    totalReviews: number;
    completionRate: number;
  };
}

interface CourseAnalytics {
  id: string;
  title: string;
  students: number;
  revenue: number;
  rating: number;
  completionRate: number;
  materials: number;
  enrollments: {
    date: string;
    count: number;
  }[];
}

interface RevenueData {
  date: string;
  revenue: number;
  students: number;
}

const periodOptions: SelectOption[] = [
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'last3months', label: 'Last 3 Months' },
  { value: 'last6months', label: 'Last 6 Months' },
  { value: 'lastyear', label: 'Last Year' }
];

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('last3months');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [courseAnalytics, setCourseAnalytics] = useState<CourseAnalytics[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  // Redirect tutors to dashboard
  useEffect(() => {
    if (user && user.role === 'Tutor') {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role?.toLowerCase() !== 'tutor') {
      fetchAnalyticsData();
    }
  }, [selectedPeriod, user]);

  // Show access denied for tutors
  if (user?.role?.toLowerCase() === 'tutor') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6 sm:p-8 max-w-md mx-auto text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-orange-100 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <ExclamationTriangleIcon className="w-7 h-7 sm:w-8 sm:h-8 text-orange-600" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6">
            Analytics and financial information are only available to administrators.
          </p>
          <Button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!user || user.role === 'Tutor') {
    return null;
  }

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      const analyticsResponse = await api.analytics.getTutorAnalytics();
      if (analyticsResponse.success && analyticsResponse.data) {
        const { analytics: realAnalytics, courseAnalytics: realCourseAnalytics, revenueData: realRevenueData } = analyticsResponse.data;

        setAnalytics(realAnalytics);
        setCourseAnalytics(realCourseAnalytics);
        setRevenueData(realRevenueData);

        const coursesResponse = await api.courses.getMyCourses();
        if (coursesResponse.success) {
          setCourses(coursesResponse.data.courses || []);
        }
      }
    } catch (error: any) {
      console.error('Error fetching analytics data:', error);
      setAnalytics({
        revenue: { total: 0, thisMonth: 0, lastMonth: 0, growth: 0 },
        students: { total: 0, enrollments: 0, thisMonth: 0, lastMonth: 0, growth: 0 },
        courses: { total: 0, published: 0, draft: 0, archived: 0 },
        engagement: { totalEnrollments: 0, avgRating: 0, totalReviews: 0, completionRate: 0 }
      });
      setCourseAnalytics([]);
      setRevenueData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Filter and limit courses
  const getDisplayedCourses = () => {
    let filtered = courseAnalytics;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by revenue (highest first) for "top courses"
    const sorted = [...filtered].sort((a, b) => b.revenue - a.revenue);

    // When searching, show all results. Otherwise, limit by displayLimit
    return searchQuery.trim() ? sorted : sorted.slice(0, displayLimit);
  };

  const displayedCourses = getDisplayedCourses();
  const filteredTotal = searchQuery.trim()
    ? courseAnalytics.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())).length
    : courseAnalytics.length;
  const hasMoreCourses = !searchQuery.trim() && displayedCourses.length < filteredTotal;
  const remainingCourses = filteredTotal - displayedCourses.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="animate-pulse">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6 sm:mb-8">
              <div className="h-6 sm:h-8 bg-slate-200 rounded w-1/2 sm:w-1/3 mx-auto mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4 sm:w-1/2 mx-auto"></div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 sm:h-24 bg-white rounded-lg shadow-sm border border-slate-200"></div>
              ))}
            </div>
            <div className="h-80 sm:h-96 bg-white rounded-lg shadow-sm border border-slate-200"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="text-center py-12">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <ChartBarIcon className="w-7 h-7 sm:w-8 sm:h-8 text-slate-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-2">Analytics Dashboard</h1>
            <p className="text-sm sm:text-base text-slate-600">Unable to load analytics data. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 pt-6 pb-32 sm:pt-8 sm:pb-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-2 sm:mb-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center ring-2 ring-white/30">
                <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">
                  Analytics Dashboard
                </h1>
                <p className="text-xs sm:text-sm md:text-base mt-0.5 sm:mt-1 text-white/90">
                  Track your performance and revenue metrics
                </p>
              </div>
            </div>
            <div className="self-start sm:self-auto">
              <Select
                options={periodOptions}
                value={selectedPeriod}
                onChange={setSelectedPeriod}
                className="min-w-[140px] text-sm sm:text-base"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 sm:-mt-32 pb-8 sm:pb-12">

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6">
          {/* Revenue Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-slate-200 p-3 sm:p-4 md:p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <CurrencyDollarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <div className="text-right">
                <div className="text-base sm:text-xl md:text-2xl font-bold text-slate-900">
                  {formatCurrency(analytics.revenue.total)}
                </div>
              </div>
            </div>
            <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-slate-600 mb-1">Total Revenue</p>
            {analytics.revenue.growth !== 0 && (
              <div className={`flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] font-medium ${
                analytics.revenue.growth > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {analytics.revenue.growth > 0 ? (
                  <ArrowUpIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                ) : (
                  <ArrowDownIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                )}
                <span>{Math.abs(analytics.revenue.growth).toFixed(1)}% vs last month</span>
              </div>
            )}
          </div>

          {/* Students Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-slate-200 p-3 sm:p-4 md:p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <UserGroupIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <div className="text-right">
                <div className="text-base sm:text-xl md:text-2xl font-bold text-slate-900">
                  {analytics.students.total.toLocaleString()}
                </div>
              </div>
            </div>
            <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-slate-600 mb-1">Total Students</p>
          </div>

          {/* Courses Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-slate-200 p-3 sm:p-4 md:p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <AcademicCapIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              </div>
              <div className="text-right">
                <div className="text-base sm:text-xl md:text-2xl font-bold text-slate-900">
                  {analytics.courses.published}
                </div>
              </div>
            </div>
            <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-slate-600 mb-1">Published</p>
            <p className="text-[9px] sm:text-[10px] text-slate-500">
              {analytics.courses.draft} draft • {analytics.courses.archived} archived
            </p>
          </div>

          {/* Rating Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-slate-200 p-3 sm:p-4 md:p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
              </div>
              <div className="text-right">
                <div className="text-base sm:text-xl md:text-2xl font-bold text-slate-900">
                  {analytics.engagement.avgRating.toFixed(1)}
                </div>
              </div>
            </div>
            <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-slate-600 mb-1">Avg Rating</p>
            <p className="text-[9px] sm:text-[10px] text-slate-500">
              {analytics.engagement.totalReviews} reviews
            </p>
          </div>
        </div>

        {/* Course Performance Section */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-xl border border-slate-200 overflow-hidden mb-6" data-section="course-performance">
          <div className="bg-slate-50 px-3 sm:px-6 py-2.5 sm:py-4 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <BookOpenIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm sm:text-lg font-semibold text-slate-900">
                    Course Performance
                  </h3>
                  <p className="text-[9px] sm:text-xs text-slate-600 mt-0.5">
                    {searchQuery.trim() ? (
                      `${displayedCourses.length} result${displayedCourses.length !== 1 ? 's' : ''}`
                    ) : hasMoreCourses ? (
                      `Showing ${displayedCourses.length} of ${filteredTotal} courses`
                    ) : (
                      `${displayedCourses.length} course${displayedCourses.length !== 1 ? 's' : ''}`
                    )}
                  </p>
                </div>
              </div>

              {/* Search Bar - Only show when there are courses */}
              {courseAnalytics.length > 0 && (
                <div className="relative flex-1 max-w-xs">
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      // Reset display limit when search is cleared
                      if (e.target.value.trim() === '') {
                        setDisplayLimit(5);
                      }
                    }}
                    className="w-full pl-3 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="p-2 sm:p-6">
            {courseAnalytics.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-sm">
                  <ChartBarIcon className="w-7 h-7 sm:w-8 sm:h-8 text-slate-500" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">No Course Analytics Yet</h3>
                <p className="text-xs sm:text-sm text-slate-600 mb-4">Create and publish courses to see detailed performance data!</p>
                <Button
                  onClick={() => router.push('/create-course')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                >
                  Create Your First Course
                </Button>
              </div>
            ) : (
              <>
              <div className="space-y-2 sm:space-y-3">
                {displayedCourses.map((course) => {
                  const isSelected = selectedCourseId === course.id;

                  return (
                    <div key={course.id} className="bg-white border border-slate-200 rounded-lg sm:rounded-xl shadow-sm overflow-hidden">
                      {/* Course Header - Always Visible & Clickable */}
                      <div
                        className="bg-slate-50 p-2 sm:p-3 cursor-pointer active:bg-slate-100 transition-colors"
                        onClick={() => setSelectedCourseId(isSelected ? null : course.id)}
                      >
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <BookOpenIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs sm:text-sm font-bold text-slate-900 mb-1 sm:mb-2 line-clamp-2">
                              {course.title}
                            </h5>

                            {/* Quick Stats - Always Visible */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                              <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200">
                                <UserGroupIcon className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                <span className="text-[9px] sm:text-[10px] font-medium text-slate-700">{course.students}</span>
                              </div>
                              <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200">
                                <CurrencyDollarIcon className="w-3 h-3 text-green-500 flex-shrink-0" />
                                <span className="text-[9px] sm:text-[10px] font-medium text-slate-700 truncate">{formatCurrency(course.revenue)}</span>
                              </div>
                              <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200">
                                <StarIcon className="w-3 h-3 text-amber-500 flex-shrink-0" />
                                <span className="text-[9px] sm:text-[10px] font-medium text-slate-700">{course.rating.toFixed(1)}</span>
                              </div>
                              <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200">
                                <DocumentTextIcon className="w-3 h-3 text-purple-500 flex-shrink-0" />
                                <span className="text-[9px] sm:text-[10px] font-medium text-slate-700">{course.materials}</span>
                              </div>
                            </div>
                          </div>

                          {/* Completion Rate Badge & Chevron */}
                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                            <div className="text-center px-2 sm:px-3 py-1 sm:py-1.5 bg-white rounded-md shadow-sm border border-slate-200">
                              <div className="text-sm sm:text-lg font-bold text-green-600">
                                {course.completionRate.toFixed(0)}%
                              </div>
                              <div className="text-[9px] sm:text-[10px] text-slate-600">Complete</div>
                            </div>
                            <ChevronDownIcon
                              className={`w-5 h-5 sm:w-6 sm:h-6 text-slate-400 transition-transform duration-200 ${
                                isSelected ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Detailed Course Info - Only shown when selected */}
                      {isSelected && (
                        <div className="p-2 sm:p-3 bg-slate-50 border-t border-slate-200">
                          {/* Progress Bar */}
                          <div className="bg-white rounded-lg p-2 sm:p-3 border border-slate-200 mb-2 sm:mb-3">
                            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                              <span className="text-[10px] sm:text-xs font-medium text-slate-700">Course Progress</span>
                              <span className="text-xs sm:text-sm font-semibold text-green-600">
                                {course.completionRate.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 sm:h-2 overflow-hidden">
                              <div
                                className="bg-green-600 h-1.5 sm:h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(course.completionRate, 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Detailed Metrics Grid */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white rounded-lg p-2 sm:p-3 border-l-2 border-blue-500 shadow-sm">
                              <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-md flex items-center justify-center">
                                  <UserGroupIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600" />
                                </div>
                                <span className="text-[10px] sm:text-xs font-bold text-slate-700">Students</span>
                              </div>
                              <div className="text-base sm:text-xl font-bold text-blue-600">{course.students}</div>
                              <div className="text-[9px] sm:text-[10px] text-slate-500">Total enrolled</div>
                            </div>

                            <div className="bg-white rounded-lg p-2 sm:p-3 border-l-2 border-green-500 shadow-sm">
                              <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-md flex items-center justify-center">
                                  <CurrencyDollarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-600" />
                                </div>
                                <span className="text-[10px] sm:text-xs font-bold text-slate-700">Revenue</span>
                              </div>
                              <div className="text-base sm:text-xl font-bold text-green-600">{formatCurrency(course.revenue)}</div>
                              <div className="text-[9px] sm:text-[10px] text-slate-500">Total earned</div>
                            </div>

                            <div className="bg-white rounded-lg p-2 sm:p-3 border-l-2 border-amber-500 shadow-sm">
                              <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-amber-100 rounded-md flex items-center justify-center">
                                  <StarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600" />
                                </div>
                                <span className="text-[10px] sm:text-xs font-bold text-slate-700">Rating</span>
                              </div>
                              <div className="text-base sm:text-xl font-bold text-amber-600">{course.rating.toFixed(1)}</div>
                              <div className="text-[9px] sm:text-[10px] text-slate-500">Average score</div>
                            </div>

                            <div className="bg-white rounded-lg p-2 sm:p-3 border-l-2 border-purple-500 shadow-sm">
                              <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-purple-100 rounded-md flex items-center justify-center">
                                  <DocumentTextIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-600" />
                                </div>
                                <span className="text-[10px] sm:text-xs font-bold text-slate-700">Materials</span>
                              </div>
                              <div className="text-base sm:text-xl font-bold text-purple-600">{course.materials}</div>
                              <div className="text-[9px] sm:text-[10px] text-slate-500">Total items</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Load More / Show Less Buttons */}
              <div className="mt-3 sm:mt-4 flex justify-center gap-2">
                {hasMoreCourses && (
                  <Button
                    onClick={() => {
                      setDisplayLimit(prev => prev + 5);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-600 text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium transition-colors shadow-sm"
                  >
                    <ChevronDownIcon className="w-4 h-4 inline-block mr-1" />
                    Load More ({Math.min(5, remainingCourses)} of {remainingCourses} remaining)
                  </Button>
                )}

                {displayLimit > 5 && (
                  <Button
                    onClick={() => {
                      setDisplayLimit(5);
                      setSelectedCourseId(null); // Close any open course
                      // Scroll to top of course section
                      document.querySelector('[data-section="course-performance"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium transition-colors"
                  >
                    <ChevronDownIcon className="w-4 h-4 inline-block mr-1 rotate-180" />
                    Show Less
                  </Button>
                )}
              </div>

              {/* No Results Message */}
              {displayedCourses.length === 0 && searchQuery && (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-600">No courses found matching &quot;{searchQuery}&quot;</p>
                  <Button
                    onClick={() => {
                      setSearchQuery('');
                      setDisplayLimit(5);
                    }}
                    className="mt-3 text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    Clear search
                  </Button>
                </div>
              )}
              </>
            )}
          </div>
        </div>

        {/* Overall Engagement Section */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-3 sm:px-6 py-2.5 sm:py-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              <h3 className="text-sm sm:text-lg font-semibold text-slate-900">
                Overall Engagement
              </h3>
            </div>
            <p className="text-[9px] sm:text-xs text-slate-600 mt-0.5">Real-time metrics from your database</p>
          </div>

          <div className="p-2 sm:p-6">
            {/* Engagement Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="bg-slate-50 rounded-lg p-2 sm:p-3 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-100 rounded-md flex items-center justify-center">
                    <UserGroupIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                  </div>
                </div>
                <div className="text-base sm:text-xl font-bold text-slate-900">
                  {analytics.engagement.totalEnrollments.toLocaleString()}
                </div>
                <div className="text-[9px] sm:text-[10px] font-medium text-slate-600">Total Enrollments</div>
              </div>

              <div className="bg-slate-50 rounded-lg p-2 sm:p-3 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 bg-amber-100 rounded-md flex items-center justify-center">
                    <StarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                  </div>
                </div>
                <div className="text-base sm:text-xl font-bold text-slate-900">
                  {analytics.engagement.avgRating.toFixed(1)}
                </div>
                <div className="text-[9px] sm:text-[10px] font-medium text-slate-600">Average Rating</div>
              </div>

              <div className="bg-slate-50 rounded-lg p-2 sm:p-3 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 bg-indigo-100 rounded-md flex items-center justify-center">
                    <ChartBarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
                  </div>
                </div>
                <div className="text-base sm:text-xl font-bold text-slate-900">
                  {analytics.engagement.totalReviews}
                </div>
                <div className="text-[9px] sm:text-[10px] font-medium text-slate-600">Total Reviews</div>
              </div>

              <div className="bg-slate-50 rounded-lg p-2 sm:p-3 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 bg-green-100 rounded-md flex items-center justify-center">
                    <AcademicCapIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                  </div>
                </div>
                <div className="text-base sm:text-xl font-bold text-slate-900">
                  {analytics.engagement.completionRate.toFixed(1)}%
                </div>
                <div className="text-[9px] sm:text-[10px] font-medium text-slate-600">Completion Rate</div>
              </div>
            </div>

            {/* Overall Performance Summary */}
            <div className="bg-slate-50 rounded-lg p-3 sm:p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrophyIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900">Overall Performance</span>
                </div>
                <span className="text-base sm:text-lg font-bold text-slate-900">
                  {analytics.engagement.completionRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 sm:h-2.5 overflow-hidden">
                <div
                  className="bg-green-600 h-2 sm:h-2.5 rounded-full transition-all"
                  style={{ width: `${Math.min(analytics.engagement.completionRate, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] sm:text-[10px] text-slate-500 mt-1.5 sm:mt-2 font-medium">
                <span>0%</span>
                <span>Optimal Performance</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
