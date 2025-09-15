'use client';

import React, { useState, useEffect } from 'react';
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
  EyeIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { api } from '../../lib/api';
import { Course } from '../../types/api';

interface AnalyticsData {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  students: {
    total: number;
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
    totalViews: number;
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

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

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
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      // If no data is available, show empty state
      setAnalytics({
        revenue: { total: 0, thisMonth: 0, lastMonth: 0, growth: 0 },
        students: { total: 0, thisMonth: 0, lastMonth: 0, growth: 0 },
        courses: { total: 0, published: 0, draft: 0, archived: 0 },
        engagement: { totalViews: 0, avgRating: 0, totalReviews: 0, completionRate: 0 }
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

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0;
    return (
      <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? (
          <ArrowUpIcon className="w-4 h-4 mr-1" />
        ) : (
          <ArrowDownIcon className="w-4 h-4 mr-1" />
        )}
        {Math.abs(growth).toFixed(1)}%
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded mb-8"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Analytics</h1>
            <p className="text-gray-600">Unable to load analytics data. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Analytics & Revenue
            </h1>
            <p className="text-gray-600">Track your performance and revenue metrics</p>
          </div>
          <div className="flex items-center space-x-4">
            <Select
              options={periodOptions}
              value={selectedPeriod}
              onChange={setSelectedPeriod}
            />
            <Button variant="outline">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analytics.revenue.total)}
                  </div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <div className="mt-1 text-sm">
                    {formatGrowth(analytics.revenue.growth)}
                  </div>
                </div>
                <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics.students.total.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <div className="mt-1 text-sm">
                    {formatGrowth(analytics.students.growth)}
                  </div>
                </div>
                <UserGroupIcon className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics.courses.published}
                  </div>
                  <p className="text-sm text-gray-600">Published Courses</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.courses.draft} draft, {analytics.courses.archived} archived
                  </p>
                </div>
                <AcademicCapIcon className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics.engagement.avgRating.toFixed(1)}
                  </div>
                  <p className="text-sm text-gray-600">Average Rating</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.engagement.totalReviews} reviews
                  </p>
                </div>
                <StarIcon className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Performance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Course Performance</CardTitle>
            <CardDescription>Detailed analytics for your published courses with real completion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {courseAnalytics.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No course analytics available. Create and publish courses to see performance data.
                </div>
              ) : (
                courseAnalytics.map((course) => (
                  <div key={course.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{course.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <UserGroupIcon className="w-4 h-4 mr-1" />
                            {course.students} students
                          </span>
                          <span className="flex items-center">
                            <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                            {formatCurrency(course.revenue)}
                          </span>
                          <span className="flex items-center">
                            <StarIcon className="w-4 h-4 mr-1" />
                            {course.rating.toFixed(1)}
                          </span>
                          <span className="flex items-center">
                            <AcademicCapIcon className="w-4 h-4 mr-1" />
                            {course.materials} materials
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {course.completionRate.toFixed(1)}%
                        </div>
                        <p className="text-sm text-gray-600">Real Completion Rate</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Course Completion</span>
                        <span className="text-sm text-gray-600">{course.completionRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(course.completionRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Engagement Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Engagement</CardTitle>
            <CardDescription>Real-time metrics from your database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Views</span>
              <span className="text-sm font-bold text-gray-900">
                {analytics.engagement.totalViews.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Average Rating</span>
              <div className="flex items-center">
                <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                <span className="text-sm font-bold text-gray-900">
                  {analytics.engagement.avgRating.toFixed(1)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Reviews</span>
              <span className="text-sm font-bold text-gray-900">
                {analytics.engagement.totalReviews}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Overall Completion Rate</span>
              <span className="text-sm font-bold text-green-600">
                {analytics.engagement.completionRate.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}