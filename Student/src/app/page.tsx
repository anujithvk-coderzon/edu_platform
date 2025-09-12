'use client';

import { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { 
  BookOpenIcon, 
  ClockIcon, 
  UserGroupIcon,
  CheckCircleIcon,
  StarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { api } from '../lib/api';
import { Course, Enrollment, ApiResponse } from '../types/api';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeStudents: 0,
    completedCourses: 0,
    totalHours: 0
  });
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [myProgress, setMyProgress] = useState<Enrollment[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // If user is logged in, get their enrollments
        if (user) {
          try {
            const enrollmentsResponse = await api.enrollments.getMy();
            if (enrollmentsResponse.success) {
              setMyProgress(enrollmentsResponse.data.enrollments || []);
              setStats(prev => ({
                ...prev,
                completedCourses: enrollmentsResponse.data.enrollments?.filter((e: any) => e.status === 'COMPLETED').length || 0,
                totalHours: enrollmentsResponse.data.enrollments?.reduce((total: number, e: any) => total + (e.totalTimeSpent || 0), 0) || 0
              }));
            }
          } catch (error) {
            console.error('Error fetching enrollments:', error);
          }
        }

        // Get featured courses
        const coursesResponse = await api.courses.getAll({ limit: 3, featured: true });
        if (coursesResponse.success) {
          setFeaturedCourses(coursesResponse.data?.items || []);
          setStats(prev => ({
            ...prev,
            totalCourses: coursesResponse.data?.pagination?.total || 0
          }));
        }

        // Get platform stats
        try {
          const statsResponse = await api.get('/users/stats/overview');
          if (statsResponse.success) {
            setStats(prev => ({
              ...prev,
              activeStudents: statsResponse.data.stats.totalStudents || 0
            }));
          }
        } catch (error) {
          // Stats might be admin only, use defaults
          setStats(prev => ({
            ...prev,
            activeStudents: 2500 // fallback
          }));
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        // Fallback to default data
        setStats({
          totalCourses: 120,
          activeStudents: 2500,
          completedCourses: 0,
          totalHours: 0
        });
        setFeaturedCourses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]); // Re-fetch when user changes

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl mb-6">
          {user ? `Welcome back, ${user.firstName}!` : 'Welcome to CoderZone'}
          <span className="text-blue-600"> {user ? 'Continue your' : 'Start your'} learning journey</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          {user 
            ? 'Continue learning with our comprehensive courses designed by industry experts. Track your progress and achieve your goals.'
            : 'Discover amazing courses designed by industry experts. Join thousands of learners and start your journey today!'
          }
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/courses">
            <Button size="lg">Explore Courses</Button>
          </Link>
          {user ? (
            <Link href="/my-courses">
              <Button variant="outline" size="lg">Continue Learning</Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="lg">Sign In</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card className="text-center">
          <CardContent className="pt-6">
            <BookOpenIcon className="w-8 h-8 mx-auto text-blue-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.totalCourses}</div>
            <p className="text-sm text-gray-600">Available Courses</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <UserGroupIcon className="w-8 h-8 mx-auto text-green-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.activeStudents}</div>
            <p className="text-sm text-gray-600">Active Students</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <CheckCircleIcon className="w-8 h-8 mx-auto text-purple-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.completedCourses}</div>
            <p className="text-sm text-gray-600">Completed Courses</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <ClockIcon className="w-8 h-8 mx-auto text-orange-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.totalHours}</div>
            <p className="text-sm text-gray-600">Hours Learned</p>
          </CardContent>
        </Card>
      </div>

      {/* Continue Learning Section */}
      {user && myProgress.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Continue Learning</h2>
            <Link href="/my-courses">
              <Button variant="ghost" className="flex items-center">
                View All
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {myProgress.slice(0, 2).map((enrollment) => (
              <Card key={enrollment.id} hover>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">{enrollment.course?.title || 'Course'}</h3>
                    <span className="text-sm font-medium text-blue-600">{Math.round(enrollment.progressPercentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${enrollment.progressPercentage}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Status: {enrollment.status.charAt(0) + enrollment.status.slice(1).toLowerCase()}
                  </p>
                  <Link href={`/courses/${enrollment.courseId}`}>
                    <Button size="sm" className="w-full">
                      Continue Learning
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Featured Courses */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Courses</h2>
          <Link href="/courses">
            <Button variant="ghost" className="flex items-center">
              View All
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <div className="aspect-video bg-gray-200 rounded-t-lg animate-pulse"></div>
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCourses.length > 0 ? (
              featuredCourses.map((course) => (
                <Card key={course.id} hover>
                  <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-600 rounded-t-lg flex items-center justify-center">
                    <BookOpenIcon className="w-16 h-16 text-white opacity-80" />
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <span>{course.creator ? `${course.creator.firstName} ${course.creator.lastName}` : 'Instructor'}</span>
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {course.duration ? `${course.duration}h` : 'N/A'}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <StarIcon className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                        {course.averageRating || 'N/A'} ({course._count?.enrollments || 0} students)
                      </div>
                      <span className="font-bold text-lg text-gray-900">
                        {course.price === 0 ? 'Free' : `$${course.price}`}
                      </span>
                    </div>
                    <Link href={`/courses/${course.id}`}>
                      <Button className="w-full">
                        {course.isEnrolled ? 'Continue Learning' : 'View Course'}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <BookOpenIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses available yet</h3>
                <p className="text-gray-600">Check back later for new courses!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
