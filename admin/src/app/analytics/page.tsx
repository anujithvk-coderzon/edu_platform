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
  ExclamationTriangleIcon
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
    total: number;        // Unique students
    enrollments: number;  // Total enrollments (for comparison)
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md mx-auto text-center">
          <div className="h-16 w-16 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-slate-600 mb-6">
            Analytics and financial information are only available to administrators.
          </p>
          <Button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
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
      
      // Get real analytics data from the API
      const analyticsResponse = await api.analytics.getTutorAnalytics();
      if (analyticsResponse.success && analyticsResponse.data) {
        const { analytics: realAnalytics, courseAnalytics: realCourseAnalytics, revenueData: realRevenueData } = analyticsResponse.data;
        
        setAnalytics(realAnalytics);
        setCourseAnalytics(realCourseAnalytics);
        setRevenueData(realRevenueData);
        
        // Also get user's courses for any additional UI needs
        const coursesResponse = await api.courses.getMyCourses();
        if (coursesResponse.success) {
          setCourses(coursesResponse.data.courses || []);
        }
      }
    } catch (error: any) {
      console.error('Error fetching analytics data:', error);
      // If no data is available, show empty state
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


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-white rounded-lg shadow-sm border border-slate-200"></div>
              ))}
            </div>
            <div className="h-96 bg-white rounded-lg shadow-sm border border-slate-200 mb-6"></div>
            <div className="h-96 bg-white rounded-lg shadow-sm border border-slate-200"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <ChartBarIcon className="w-8 h-8 text-slate-600" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">Analytics Dashboard</h1>
            <p className="text-slate-600 text-sm">Unable to load analytics data. Please try again later.</p>
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
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-2">
                  Analytics Dashboard
                </h1>
                <p className="text-slate-600 text-sm sm:text-base">Track your performance and revenue metrics</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select
                  options={periodOptions}
                  value={selectedPeriod}
                  onChange={setSelectedPeriod}
                  className="min-w-[140px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 sm:mb-8">
          <Card className="bg-white shadow-sm border border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold text-slate-900 mb-1">
                    {formatCurrency(analytics.revenue.total)}
                  </div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Total Revenue</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold text-slate-900 mb-1">
                    {analytics.students.total.toLocaleString()}
                  </div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Total Students</p>
                  <p className="text-xs text-slate-500 mb-2">
                    {analytics.students.enrollments?.toLocaleString() || 0} total enrollments
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UserGroupIcon className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold text-slate-900 mb-1">
                    {analytics.courses.published}
                  </div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Published Courses</p>
                  <p className="text-xs text-slate-500">
                    {analytics.courses.draft} draft • {analytics.courses.archived} archived
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <AcademicCapIcon className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold text-slate-900 mb-1">
                    {analytics.engagement.avgRating.toFixed(1)}
                  </div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Average Rating</p>
                  <p className="text-xs text-slate-500">
                    {analytics.engagement.totalReviews} reviews
                  </p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <StarIcon className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Performance */}
        <Card className="mb-6 sm:mb-8 bg-white shadow-sm border border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center">
              <ChartBarIcon className="w-5 h-5 mr-2 text-slate-600" />
              Course Performance
            </CardTitle>
            <CardDescription className="text-slate-600 text-sm">
              Detailed analytics for your published courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {courseAnalytics.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <ChartBarIcon className="w-8 h-8 text-slate-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Course Analytics Yet</h3>
                  <p className="text-slate-600 text-sm">Create and publish courses to see detailed performance data!</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {courseAnalytics.map((course) => (
                    <div key={course.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 mb-3 text-base">{course.title}</h3>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                            <div className="flex items-center bg-white px-3 py-2 rounded-lg border border-slate-200">
                              <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center mr-2">
                                <UserGroupIcon className="w-2 h-2 text-blue-600" />
                              </div>
                              <span className="font-medium text-slate-700">{course.students} students</span>
                            </div>
                            <div className="flex items-center bg-white px-3 py-2 rounded-lg border border-slate-200">
                              <div className="w-4 h-4 bg-green-100 rounded flex items-center justify-center mr-2">
                                <CurrencyDollarIcon className="w-2 h-2 text-green-600" />
                              </div>
                              <span className="font-medium text-slate-700">{formatCurrency(course.revenue)}</span>
                            </div>
                            <div className="flex items-center bg-white px-3 py-2 rounded-lg border border-slate-200">
                              <div className="w-4 h-4 bg-yellow-100 rounded flex items-center justify-center mr-2">
                                <StarIcon className="w-2 h-2 text-yellow-600" />
                              </div>
                              <span className="font-medium text-slate-700">{course.rating.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center bg-white px-3 py-2 rounded-lg border border-slate-200">
                              <div className="w-4 h-4 bg-purple-100 rounded flex items-center justify-center mr-2">
                                <AcademicCapIcon className="w-2 h-2 text-purple-600" />
                              </div>
                              <span className="font-medium text-slate-700">{course.materials} materials</span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 text-right bg-white p-4 rounded-lg border border-slate-200 min-w-[120px]">
                          <div className="text-lg font-semibold text-slate-900 mb-1">
                            {course.completionRate.toFixed(1)}%
                          </div>
                          <p className="text-xs font-medium text-slate-500">Completion Rate</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">Course Progress</span>
                          <span className="text-sm font-semibold text-green-700">{course.completionRate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${Math.min(course.completionRate, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Engagement Metrics */}
        <Card className="bg-white shadow-sm border border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center">
              <ChartBarIcon className="w-5 h-5 mr-2 text-slate-600" />
              Overall Engagement
            </CardTitle>
            <CardDescription className="text-slate-600 text-sm">
              Real-time metrics from your database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <UserGroupIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Total Enrollments</span>
                  </div>
                  <span className="text-lg font-semibold text-slate-900">
                    {analytics.engagement.totalEnrollments.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                      <StarIcon className="w-4 h-4 text-yellow-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Average Rating</span>
                  </div>
                  <span className="text-lg font-semibold text-slate-900">
                    {analytics.engagement.avgRating.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <ChartBarIcon className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Total Reviews</span>
                  </div>
                  <span className="text-lg font-semibold text-slate-900">
                    {analytics.engagement.totalReviews}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <AcademicCapIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Completion Rate</span>
                  </div>
                  <span className="text-lg font-semibold text-slate-900">
                    {analytics.engagement.completionRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Overall Performance Summary */}
            <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <ChartBarIcon className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Overall Performance</span>
                </div>
                <span className="text-lg font-semibold text-slate-900">{analytics.engagement.completionRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${Math.min(analytics.engagement.completionRate, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>0%</span>
                <span>Optimal Performance</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}