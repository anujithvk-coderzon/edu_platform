'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import CourseReview from '@/components/CourseReview';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { getImageUrl } from '@/utils/imageUtils';
import {
  BookOpenIcon,
  ArrowLeftIcon,
  StarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  level: string;
  creator: {
    firstName: string;
    lastName: string;
  };
  category: {
    name: string;
  } | null;
}

interface Enrollment {
  id: string;
  progressPercentage: number;
  status: string;
  hasReviewed: boolean;
}

export default function CourseRatingPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const courseId = params.id as string;

  useEffect(() => {
    if (user && courseId) {
      fetchCourseAndEnrollment();
    }
  }, [user, courseId]);

  const fetchCourseAndEnrollment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch course details
      const courseResponse = await api.courses.getById(courseId);
      if (!courseResponse.success) {
        throw new Error('Course not found');
      }

      // Fetch enrollment details to check completion status
      const enrollmentResponse = await api.enrollments.getMy();
      if (!enrollmentResponse.success) {
        throw new Error('Failed to load enrollment data');
      }

      const userEnrollment = enrollmentResponse.data.enrollments?.find(
        (e: any) => e.courseId === courseId || e.course?.id === courseId
      );

      if (!userEnrollment) {
        throw new Error('You are not enrolled in this course');
      }

      // Check if course is completed
      if (userEnrollment.progressPercentage < 100 && userEnrollment.status !== 'COMPLETED') {
        throw new Error('You need to complete the course before rating it');
      }

      setCourse(courseResponse.data.course);
      setEnrollment(userEnrollment);
    } catch (error: any) {
      console.error('Error fetching course data:', error);
      setError(error.message || 'Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmitted = () => {
    // Refresh enrollment data to update hasReviewed status
    fetchCourseAndEnrollment();

    // Show success message and optionally redirect
    setTimeout(() => {
      toast.success('Thank you for your review!');
      router.push('/my-courses');
    }, 1500);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Please log in</h3>
          <p className="text-gray-600 mb-4">You need to be logged in to rate courses.</p>
          <Link href="/login">
            <Button>Log In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8">
          <div className="animate-pulse">
            <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/3 mb-3 sm:mb-4"></div>
            <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2 mb-4 sm:mb-6 md:mb-8"></div>
            <div className="bg-white rounded-lg border p-4 sm:p-5 md:p-6">
              <div className="h-5 sm:h-6 bg-gray-200 rounded w-1/4 mb-3 sm:mb-4"></div>
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-5 md:p-6 text-center">
            <h2 className="text-base sm:text-lg font-semibold text-red-800 mb-2">Unable to Load Rating Page</h2>
            <p className="text-sm text-red-600 mb-3 sm:mb-4">{error}</p>
            <div className="space-x-4">
              <Link href="/my-courses">
                <Button variant="outline">Back to My Courses</Button>
              </Link>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 md:py-5">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <Link href="/my-courses" className="hidden sm:block">
              <Button variant="ghost" size="sm">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                <span className="text-sm">Back to My Courses</span>
              </Button>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 md:gap-5">
            {/* Course Thumbnail */}
            <div className="flex-shrink-0">
              <div className="w-24 h-16 sm:w-32 sm:h-20 md:w-40 md:h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center relative overflow-hidden">
                {course?.thumbnail && getImageUrl(course.thumbnail) ? (
                  <img
                    src={getImageUrl(course.thumbnail)!}
                    alt={course.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Failed to load thumbnail in rate page:', getImageUrl(course.thumbnail));
                      console.error('Original thumbnail value:', course.thumbnail);
                    }}
                    onLoad={() => {
                      console.log('Successfully loaded thumbnail in rate page:', getImageUrl(course.thumbnail));
                    }}
                  />
                ) : (
                  <BookOpenIcon className="h-8 w-8 text-white/80" />
                )}
              </div>
            </div>

            {/* Course Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                {course?.category && (
                  <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                    {course.category.name}
                  </span>
                )}
                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-700 rounded text-xs">
                  {course?.level}
                </span>
                <div className="flex items-center text-green-600">
                  <CheckCircleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                  <span className="text-xs font-medium">Completed</span>
                </div>
              </div>

              <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-900 mb-1.5 sm:mb-2">
                {course?.title}
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 mb-2 sm:mb-3 line-clamp-2">
                {course?.description}
              </p>

              <div className="text-xs sm:text-sm text-slate-600">
                by {course?.creator.firstName} {course?.creator.lastName}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Section */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8">
        <div className="mb-4 sm:mb-5 md:mb-6">
          <div className="flex items-center space-x-1.5 sm:space-x-2 mb-1.5 sm:mb-2">
            <StarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-slate-900">
              {enrollment?.hasReviewed ? 'Update Your Review' : 'Rate This Course'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            {enrollment?.hasReviewed
              ? 'You can update your rating and review anytime.'
              : 'Share your experience to help other students discover great courses.'
            }
          </p>
        </div>

        {/* Course Review Component */}
        <CourseReview
          courseId={courseId}
          onReviewSubmitted={handleReviewSubmitted}
        />

        {/* Additional Actions */}
        <div className="mt-4 sm:mt-5 md:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
          <Link href={`/courses/${courseId}`}>
            <Button variant="outline" className="w-full sm:w-auto">
              View Course Details
            </Button>
          </Link>
          <Link href="/courses">
            <Button variant="outline" className="w-full sm:w-auto">
              Browse More Courses
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}