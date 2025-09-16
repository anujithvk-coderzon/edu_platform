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
  } | null;
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
  enrolledAt: string;
  completedAt?: string;
  hasReviewed?: boolean;
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
        let enrichedCourses = coursesResponse.data.courses || [];

        // If user is logged in, enrich courses with enrollment data
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

              enrichedCourses = enrichedCourses.map((course: Course) => {
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

        setFeaturedCourses(enrichedCourses);

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
            const enrollments = enrollmentsResponse.data.enrollments || [];
            setMyEnrollments(enrollments);
            setStats(prev => ({
              ...prev,
              completedCourses: enrollments.filter((e: any) => e.status === 'COMPLETED' || e.progressPercentage >= 100).length,
              totalHours: Math.round(enrollments.reduce((total: number, e: any) => total + (e.totalTimeSpent || 0), 0) / 60)
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
      return { text: `${Math.round(course.progressPercentage || 0)}%`, color: 'bg-blue-500' };
    }
  };

  const getEnrollmentButtonState = (enrollment: Enrollment) => {
    // Debug logging
    console.log('Dashboard getEnrollmentButtonState - enrollment:', enrollment);
    console.log('Dashboard getEnrollmentButtonState - courseId:', enrollment.courseId);
    console.log('Dashboard getEnrollmentButtonState - course.id:', enrollment.course?.id);

    const isCompleted = enrollment.progressPercentage >= 100 || enrollment.status === 'COMPLETED';
    // Use course.id if available, fallback to courseId
    const courseId = enrollment.course?.id || enrollment.courseId;

    if (isCompleted) {
      if (enrollment.hasReviewed) {
        return { text: 'Completed', href: `/courses/${courseId}` };
      } else {
        return { text: 'Rate Course', href: `/courses/${courseId}` };
      }
    } else {
      return { text: 'Continue Learning', href: `/learn/${courseId}` };
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-3xl"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              {user ? `Welcome back, ${user.firstName}!` : 'Learn Without Limits'}
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              {user
                ? 'Continue your learning journey and achieve your goals with our expert-led courses. Your success story starts here! 🚀'
                : `Discover ${stats.totalCourses > 0 ? `${stats.totalCourses}+` : 'thousands of'} courses from expert instructors and accelerate your career`
              }
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-10">
              <div className="relative group">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What do you want to learn today? ✨"
                  className="w-full px-6 py-5 text-slate-900 bg-white/95 backdrop-blur-sm rounded-2xl focus:outline-none focus:ring-4 focus:ring-white/30 pl-14 text-lg font-medium placeholder:text-slate-500 shadow-2xl border-2 border-white/20 hover:bg-white transition-all duration-300"
                />
                <MagnifyingGlassIcon className="absolute left-5 top-1/2 transform -translate-y-1/2 h-6 w-6 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Search
                </button>
              </div>
            </form>

            {/* CTA Buttons */}
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/courses">
                <button className="bg-white/95 backdrop-blur-sm text-blue-600 px-10 py-4 rounded-2xl font-bold hover:bg-white hover:scale-105 transition-all duration-300 shadow-2xl border-2 border-white/30 hover:shadow-white/20">
                  🎯 Explore Courses
                </button>
              </Link>
              {user ? (
                <Link href="/my-courses">
                  <button className="border-2 border-white/70 text-white px-10 py-4 rounded-2xl font-bold hover:bg-white hover:text-blue-600 transition-all duration-300 backdrop-blur-sm hover:scale-105">
                    📚 My Learning
                  </button>
                </Link>
              ) : (
                <Link href="/login">
                  <button className="border-2 border-white/70 text-white px-10 py-4 rounded-2xl font-bold hover:bg-white hover:text-blue-600 transition-all duration-300 backdrop-blur-sm hover:scale-105">
                    🚀 Get Started
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 text-center">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group hover:scale-105">
              <div className="bg-white/20 rounded-2xl p-4 w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <AcademicCapIcon className="h-8 w-8 mx-auto text-white" />
              </div>
              <div className="text-3xl font-bold mb-2 text-white">{stats.totalCourses || 0}+</div>
              <div className="text-blue-100 font-medium">Courses Available</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group hover:scale-105">
              <div className="bg-white/20 rounded-2xl p-4 w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <UsersIcon className="h-8 w-8 mx-auto text-white" />
              </div>
              <div className="text-3xl font-bold mb-2 text-white">
                {stats.activeStudents > 0 ? `${stats.activeStudents.toLocaleString()}+` : '1,000+'}
              </div>
              <div className="text-blue-100 font-medium">Active Students</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group hover:scale-105">
              <div className="bg-white/20 rounded-2xl p-4 w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <StarIcon className="h-8 w-8 mx-auto text-white" />
              </div>
              <div className="text-3xl font-bold mb-2 text-white">{featuredCourses.length > 0 ? (featuredCourses.reduce((sum, course) => sum + (course.averageRating || 0), 0) / featuredCourses.length).toFixed(1) : '4.8'}</div>
              <div className="text-blue-100 font-medium">Average Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Personal Stats for logged in users */}
        {user && (
          <div className="bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 rounded-3xl shadow-xl border border-slate-200/50 p-8 mb-12 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                📊 Your Learning Journey
              </h2>
              <div className="flex items-center space-x-2 bg-green-100 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-green-800">Active Learner</span>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 hover:shadow-lg transition-all duration-300 group hover:scale-105">
                <div className="bg-blue-100 rounded-2xl p-4 w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <BookOpenIcon className="h-8 w-8 mx-auto text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-slate-800 mb-2">{myEnrollments.filter(e => e.status !== 'COMPLETED' && e.progressPercentage < 100).length}</div>
                <p className="text-sm font-medium text-slate-600">Active Courses</p>
              </div>
              <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 hover:shadow-lg transition-all duration-300 group hover:scale-105">
                <div className="bg-green-100 rounded-2xl p-4 w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <CheckCircleIcon className="h-8 w-8 mx-auto text-green-600" />
                </div>
                <div className="text-3xl font-bold text-slate-800 mb-2">{stats.completedCourses}</div>
                <p className="text-sm font-medium text-slate-600">Completed</p>
              </div>
              <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 hover:shadow-lg transition-all duration-300 group hover:scale-105">
                <div className="bg-orange-100 rounded-2xl p-4 w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <ClockIcon className="h-8 w-8 mx-auto text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-slate-800 mb-2">{stats.totalHours}</div>
                <p className="text-sm font-medium text-slate-600">Hours Learned</p>
              </div>
              <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 hover:shadow-lg transition-all duration-300 group hover:scale-105">
                <div className="bg-purple-100 rounded-2xl p-4 w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <StarIcon className="h-8 w-8 mx-auto text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-slate-800 mb-2">
                  {myEnrollments.length > 0 ? Math.round(myEnrollments.reduce((sum, e) => sum + e.progressPercentage, 0) / myEnrollments.length) : 0}%
                </div>
                <p className="text-sm font-medium text-slate-600">Avg Progress</p>
              </div>
            </div>
          </div>
        )}

        {/* Continue Learning Section */}
        {user && myEnrollments.filter(e => e.status !== 'COMPLETED' && e.progressPercentage < 100).length > 0 && (
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
              {myEnrollments.filter(e => e.status !== 'COMPLETED' && e.progressPercentage < 100).slice(0, 2).map((enrollment) => (
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
                  {(() => {
                    const buttonState = getEnrollmentButtonState(enrollment);
                    return (
                      <Link href={buttonState.href}>
                        <button className={`w-full py-2 rounded-lg transition-colors flex items-center justify-center ${
                          buttonState.text === 'Completed'
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}>
                          <PlayIcon className="h-4 w-4 mr-2" />
                          {buttonState.text}
                        </button>
                      </Link>
                    );
                  })()}
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
                    {(() => {
                      const badge = getCourseStatusBadge(course);
                      return badge && (
                        <div className={`absolute top-2 right-2 ${badge.color} text-white px-2 py-1 rounded-full text-xs font-medium`}>
                          {badge.text}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>

                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <span>{course.tutorName || (course.creator ? `${course.creator.firstName} ${course.creator.lastName}` : 'Instructor')}</span>
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

                    {(() => {
                      const buttonState = getCourseButtonState(course);
                      return (
                        <Link href={buttonState.href}>
                          <button className={`w-full py-2 rounded-lg transition-colors ${
                            buttonState.text === 'Completed'
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}>
                            {buttonState.text}
                          </button>
                        </Link>
                      );
                    })()}
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
