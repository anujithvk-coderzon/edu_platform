'use client';

import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { 
  UserIcon,
  AcademicCapIcon,
  StarIcon,
  CalendarIcon,
  ChartBarIcon,
  BookOpenIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  PencilIcon,
  MapPinIcon,
  GlobeAltIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { api } from '../../lib/api';
import { User, Course } from '../../types/api';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalReviews: 0,
    joinDate: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Get user data
      const userResponse = await api.auth.getMe();
      if (userResponse.success) {
        setUser(userResponse.data.user);
        
        // Get user's courses
        const coursesResponse = await api.courses.getMyCourses();
        if (coursesResponse.success) {
          const userCourses = coursesResponse.data.courses || [];
          setCourses(userCourses);
          
          // Calculate stats
          const totalStudents = userCourses.reduce((sum: number, course: any) => 
            sum + (course._count?.enrollments || 0), 0);
          const totalEarnings = userCourses.reduce((sum: number, course: any) => 
            sum + ((course._count?.enrollments || 0) * course.price), 0);
          const totalReviews = userCourses.reduce((sum: number, course: any) => 
            sum + (course._count?.reviews || 0), 0);
          const weightedRating = userCourses.reduce((sum: number, course: any) => 
            sum + ((course.averageRating || 0) * (course._count?.reviews || 0)), 0);
          const averageRating = totalReviews > 0 ? weightedRating / totalReviews : 0;
          
          setStats({
            totalCourses: userCourses.length,
            totalStudents,
            totalEarnings,
            averageRating,
            totalReviews,
            joinDate: userResponse.data.user.createdAt || new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, size: string = 'w-4 h-4') => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= Math.floor(rating) ? (
          <StarIconSolid key={i} className={`${size} text-yellow-400`} />
        ) : (
          <StarIcon key={i} className={`${size} text-gray-300`} />
        )
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="lg:col-span-2 h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Profile
            </h1>
            <p className="text-gray-600 mt-2">Your teaching profile and achievements</p>
          </div>
          <Link href="/settings">
            <Button variant="outline" className="flex items-center">
              <PencilIcon className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="h-24 w-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center shadow-lg">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Profile" className="h-24 w-24 rounded-full object-cover" />
                    ) : (
                      <UserIcon className="h-12 w-12 text-blue-600" />
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</h2>
                  <p className="text-blue-600 font-medium uppercase text-sm mt-1">{user?.role}</p>
                  
                  {stats.averageRating > 0 && (
                    <div className="flex items-center justify-center mt-3">
                      <div className="flex items-center">
                        {renderStars(stats.averageRating)}
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          {stats.averageRating.toFixed(1)} ({stats.totalReviews} reviews)
                        </span>
                      </div>
                    </div>
                  )}

                  {user?.bio && (
                    <p className="text-gray-600 text-sm mt-4 leading-relaxed">{user.bio}</p>
                  )}
                </div>

                <div className="mt-6 space-y-3 border-t pt-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <EnvelopeIcon className="w-4 h-4 mr-3 text-gray-400" />
                    {user?.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarIcon className="w-4 h-4 mr-3 text-gray-400" />
                    Joined {new Date(stats.joinDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}
                  </div>
                  {user?.timezone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <GlobeAltIcon className="w-4 h-4 mr-3 text-gray-400" />
                      {user.timezone}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stats Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ChartBarIcon className="w-5 h-5 mr-2" />
                  Teaching Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BookOpenIcon className="w-4 h-4 mr-2 text-blue-600" />
                    <span className="text-sm text-gray-600">Total Courses</span>
                  </div>
                  <span className="font-semibold text-gray-900">{stats.totalCourses}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <UserGroupIcon className="w-4 h-4 mr-2 text-green-600" />
                    <span className="text-sm text-gray-600">Total Students</span>
                  </div>
                  <span className="font-semibold text-gray-900">{stats.totalStudents.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="w-4 h-4 mr-2 text-purple-600" />
                    <span className="text-sm text-gray-600">Total Earnings</span>
                  </div>
                  <span className="font-semibold text-gray-900">${stats.totalEarnings.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <StarIcon className="w-4 h-4 mr-2 text-yellow-600" />
                    <span className="text-sm text-gray-600">Avg. Rating</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Courses and Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Courses */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <AcademicCapIcon className="w-5 h-5 mr-2" />
                    My Courses ({stats.totalCourses})
                  </CardTitle>
                  <Link href="/my-courses">
                    <Button variant="outline" size="sm">View All</Button>
                  </Link>
                </div>
                <CardDescription>Courses you've created and are teaching</CardDescription>
              </CardHeader>
              <CardContent>
                {courses.length > 0 ? (
                  <div className="space-y-4">
                    {courses.slice(0, 4).map((course) => (
                      <div key={course.id} className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpenIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="ml-4 flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {course.title}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center">
                              <UserGroupIcon className="w-3 h-3 mr-1" />
                              {course._count?.enrollments || 0} students
                            </span>
                            <span className="flex items-center">
                              <CurrencyDollarIcon className="w-3 h-3 mr-1" />
                              ${course.price}
                            </span>
                            {course.averageRating && (
                              <span className="flex items-center">
                                <StarIcon className="w-3 h-3 mr-1" />
                                {course.averageRating.toFixed(1)}
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              course.status === 'PUBLISHED' 
                                ? 'bg-green-100 text-green-700'
                                : course.status === 'DRAFT'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {course.status.charAt(0) + course.status.slice(1).toLowerCase()}
                            </span>
                          </div>
                        </div>
                        <Link href={`/courses/${course.id}/edit`}>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    ))}
                    {courses.length > 4 && (
                      <div className="text-center pt-4">
                        <Link href="/my-courses">
                          <Button variant="outline">
                            View {courses.length - 4} More Course{courses.length - 4 !== 1 ? 's' : ''}
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpenIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
                    <p className="text-gray-600 mb-4">Start creating courses to build your teaching profile!</p>
                    <Link href="/create-course">
                      <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        Create Your First Course
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest teaching activities and achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.totalCourses > 0 ? (
                    <>
                      <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <BookOpenIcon className="h-4 w-4 text-white" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            You have {stats.totalCourses} active course{stats.totalCourses !== 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-blue-600">Keep creating great content!</p>
                        </div>
                      </div>
                      
                      {stats.totalStudents > 0 && (
                        <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="h-8 w-8 bg-green-500 rounded-lg flex items-center justify-center">
                            <UserGroupIcon className="h-4 w-4 text-white" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {stats.totalStudents} student{stats.totalStudents !== 1 ? 's have' : ' has'} enrolled in your courses
                            </p>
                            <p className="text-xs text-green-600">Great work reaching students!</p>
                          </div>
                        </div>
                      )}
                      
                      {stats.totalEarnings > 0 && (
                        <div className="flex items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="h-8 w-8 bg-purple-500 rounded-lg flex items-center justify-center">
                            <CurrencyDollarIcon className="h-4 w-4 text-white" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              Total earnings: ${stats.totalEarnings.toLocaleString()}
                            </p>
                            <p className="text-xs text-purple-600">Revenue from all courses</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <ChartBarIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-600">No recent activity</p>
                      <p className="text-xs text-gray-500 mt-1">Start teaching to see your activity here!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}