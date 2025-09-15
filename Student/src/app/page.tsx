'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  BookOpenIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  StarIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
  UsersIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  level: string;
  duration: number;
  averageRating: number;
  isEnrolled: boolean;
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

interface Enrollment {
  id: string;
  courseId: string;
  progressPercentage: number;
  status: string;
  completedMaterials: number;
  totalTimeSpent: number;
  course: Course;
}

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
  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Get featured courses
      const coursesResponse = await api.courses.getAll({ limit: 6 });
      if (coursesResponse.success) {
        setFeaturedCourses(coursesResponse.data.courses || []);

        // Calculate active students from course enrollment counts
        const totalActiveStudents = coursesResponse.data.courses.reduce(
          (total: number, course: Course) => total + (course._count?.enrollments || 0),
          0
        );

        setStats(prev => ({
          ...prev,
          totalCourses: coursesResponse.data.pagination?.total || 0,
          activeStudents: totalActiveStudents
        }));
      }

      // If user is logged in, get their enrollments
      if (user) {
        try {
          const enrollmentsResponse = await api.enrollments.getMy();
          if (enrollmentsResponse.success) {
            setMyEnrollments(enrollmentsResponse.data.enrollments || []);
            setStats(prev => ({
              ...prev,
              completedCourses: enrollmentsResponse.data.enrollments?.filter((e: any) => e.status === 'COMPLETED').length || 0,
              totalHours: Math.round(enrollmentsResponse.data.enrollments?.reduce((total: number, e: any) => total + (e.totalTimeSpent || 0), 0) / 60) || 0
            }));
          }
        } catch (error) {
          console.error('Error fetching enrollments:', error);
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/courses?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-6">
              {user ? `Welcome back, ${user.firstName}!` : 'Learn Without Limits'}
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              {user
                ? 'Continue your learning journey and achieve your goals with our expert-led courses'
                : `Discover ${stats.totalCourses > 0 ? `${stats.totalCourses}+` : 'thousands of'} courses from expert instructors and accelerate your career`
              }
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What do you want to learn today?"
                  className="w-full px-6 py-4 text-gray-900 bg-white/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 pl-12"
                />
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            {/* CTA Buttons */}
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/courses">
                <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  Explore Courses
                </button>
              </Link>
              {user ? (
                <Link href="/my-courses">
                  <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                    My Learning
                  </button>
                </Link>
              ) : (
                <Link href="/login">
                  <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                    Get Started
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
              <AcademicCapIcon className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.totalCourses || 0}+</div>
              <div className="text-blue-100">Courses Available</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
              <UsersIcon className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {stats.activeStudents > 0 ? `${stats.activeStudents.toLocaleString()}+` : '0'}
              </div>
              <div className="text-blue-100">Active Students</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
              <StarIcon className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{featuredCourses.length > 0 ? (featuredCourses.reduce((sum, course) => sum + (course.averageRating || 0), 0) / featuredCourses.length).toFixed(1) : 'N/A'}</div>
              <div className="text-blue-100">Average Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Personal Stats for logged in users */}
        {user && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Learning Stats</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <BookOpenIcon className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">{myEnrollments.length}</div>
                <p className="text-sm text-gray-600">Enrolled Courses</p>
              </div>
              <div className="text-center">
                <CheckCircleIcon className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.completedCourses}</div>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <div className="text-center">
                <ClockIcon className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.totalHours}</div>
                <p className="text-sm text-gray-600">Hours Learned</p>
              </div>
              <div className="text-center">
                <StarIcon className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {myEnrollments.length > 0 ? Math.round(myEnrollments.reduce((sum, e) => sum + e.progressPercentage, 0) / myEnrollments.length) : 0}%
                </div>
                <p className="text-sm text-gray-600">Avg Progress</p>
              </div>
            </div>
          </div>
        )}

        {/* Continue Learning Section */}
        {user && myEnrollments.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Continue Learning</h2>
              <Link href="/my-courses">
                <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center">
                  View All
                  <ArrowRightIcon className="h-4 w-4 ml-1" />
                </button>
              </Link>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {myEnrollments.slice(0, 2).map((enrollment) => (
                <div key={enrollment.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 truncate">{enrollment.course?.title}</h3>
                    <span className="text-sm font-medium text-blue-600">{Math.round(enrollment.progressPercentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${enrollment.progressPercentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span>{enrollment.completedMaterials || 0} materials completed</span>
                    <span>{Math.round((enrollment.totalTimeSpent || 0) / 60)}h studied</span>
                  </div>
                  <Link href={`/courses/${enrollment.courseId}`}>
                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
                      <PlayIcon className="h-4 w-4 mr-2" />
                      Continue Learning
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Featured Courses */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Featured Courses</h2>
            <Link href="/courses">
              <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center">
                View All
                <ArrowRightIcon className="h-4 w-4 ml-1" />
              </button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm animate-pulse">
                  <div className="aspect-video bg-gray-200 rounded-t-lg"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredCourses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.map((course) => (
                <div key={course.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-600 rounded-t-lg flex items-center justify-center relative">
                    {course.thumbnail ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${course.thumbnail}`}
                        alt={course.title}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    ) : (
                      <BookOpenIcon className="h-16 w-16 text-white opacity-80" />
                    )}
                    {course.isEnrolled && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        Enrolled
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>

                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <span>{course.creator ? `${course.creator.firstName} ${course.creator.lastName}` : 'Instructor'}</span>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {course.duration ? `${course.duration}h` : 'N/A'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`h-4 w-4 ${i < Math.floor(course.averageRating || 0) ? 'fill-current' : ''}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 ml-2">
                          {course.averageRating?.toFixed(1) || 'N/A'} ({course._count?.enrollments || 0})
                        </span>
                      </div>
                      <span className="font-bold text-lg text-gray-900">
                        {course.price === 0 ? 'Free' : `$${course.price}`}
                      </span>
                    </div>

                    <Link href={`/courses/${course.id}`}>
                      <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        {course.isEnrolled ? 'Continue Learning' : 'View Course'}
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses available yet</h3>
              <p className="text-gray-600">Check back later for new courses!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
