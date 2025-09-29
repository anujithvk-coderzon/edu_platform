'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  BookOpenIcon,
  ClockIcon,
  StarIcon,
  UsersIcon,
  PlayIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  PhotoIcon,
  MusicalNoteIcon,
  LinkIcon,
  CheckCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import StarRating from '@/components/ui/StarRating';
import CourseReview from '@/components/CourseReview';
import CourseReviews from '@/components/CourseReviews';
import { getImageUrl } from '@/utils/imageUtils';
import { getCdnUrl } from '@/utils/cdn';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  level: string;
  duration: number;
  averageRating: number;
  totalReviews: number;
  tutorName?: string;
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
  } | null;
  requirements: string[];
  prerequisites: string[];
  modules: Array<{
    id: string;
    title: string;
    description: string;
    orderIndex: number;
    materials: Array<{
      id: string;
      title: string;
      description: string;
      type: string;
      fileUrl: string;
      content: string;
      orderIndex: number;
      isPublic: boolean;
    }>;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar: string;
    };
  }>;
  _count: {
    enrollments: number;
    materials: number;
    reviews: number;
  };
}

interface Progress {
  enrollment: {
    id: string;
    progressPercentage: number;
    status: string;
  };
  materials: Array<{
    id: string;
    title: string;
    type: string;
    moduleId: string;
    orderIndex: number;
    progress: {
      isCompleted: boolean;
      lastAccessed: string;
      timeSpent: number;
    } | null;
  }>;
  stats: {
    totalMaterials: number;
    completedMaterials: number;
    progressPercentage: number;
    totalTimeSpent: number;
  };
}

export default function CourseDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id as string;

  // Debug logging
  console.log('Course Detail Page - params:', params);
  console.log('Course Detail Page - courseId:', courseId);

  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'reviews'>('overview');

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId, user]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const response = await api.courses.getById(courseId);
      if (response.success) {
        setCourse(response.data.course);

        // If user is enrolled, fetch progress
        if (user && response.data.course.isEnrolled) {
          try {
            const progressResponse = await api.enrollments.getProgress(courseId);
            if (progressResponse.success) {
              setProgress(progressResponse.data);
            }
          } catch (error) {
            console.error('Error fetching progress:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      toast.error('Please login to enroll in courses');
      return;
    }

    try {
      setEnrolling(true);
      const response = await api.enrollments.enroll(courseId);
      if (response.success) {
        toast.success('Successfully enrolled in course!');
        setCourse(prev => prev ? { ...prev, isEnrolled: true } : null);
        // Refresh to get progress data
        await fetchCourseDetails();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'VIDEO':
        return <VideoCameraIcon className="h-5 w-5" />;
      case 'PDF':
      case 'DOCUMENT':
        return <DocumentTextIcon className="h-5 w-5" />;
      case 'AUDIO':
        return <MusicalNoteIcon className="h-5 w-5" />;
      case 'IMAGE':
        return <PhotoIcon className="h-5 w-5" />;
      case 'LINK':
        return <LinkIcon className="h-5 w-5" />;
      default:
        return <DocumentTextIcon className="h-5 w-5" />;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <div key={star} className="relative">
            <StarIcon className="h-5 w-5 text-gray-300" />
            {star <= rating && (
              <StarIconSolid className="absolute inset-0 h-5 w-5 text-yellow-400" />
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpenIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Course not found</h3>
          <p className="text-slate-600 mb-4">The course you're looking for doesn't exist or has been removed.</p>
          <Link href="/courses">
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Browse Courses
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Course Hero Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-slate-600 hover:text-slate-900 mb-6 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Courses
          </button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Course Information */}
            <div className="lg:col-span-2">
              <div className="flex items-start gap-3 mb-4">
                {course.category && (
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-sm font-medium">
                    {course.category.name}
                  </span>
                )}
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">
                  {course.level}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-slate-900 mb-4">{course.title}</h1>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">{course.description}</p>

              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600 mb-6">
                <div className="flex items-center">
                  <StarRating rating={course.averageRating || 0} readonly showValue />
                  <span className="ml-2">({course.totalReviews} reviews)</span>
                </div>
                <div className="flex items-center">
                  <UsersIcon className="h-5 w-5 mr-2 text-slate-500" />
                  <span>{course._count.enrollments} students</span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2 text-slate-500" />
                  <span>{course.duration ? `${course.duration} hours` : 'Self-paced'}</span>
                </div>
                <div className="flex items-center">
                  <BookOpenIcon className="h-5 w-5 mr-2 text-slate-500" />
                  <span>{course._count.materials} materials</span>
                </div>
              </div>

              {/* Instructor Info */}
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  {course.creator.avatar ? (
                    <img
                      src={getCdnUrl(course.creator.avatar) || ''}
                      alt={`${course.creator.firstName} ${course.creator.lastName}`}
                      className="h-12 w-12 rounded-full border-2 border-slate-200"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center border-2 border-slate-200">
                      <span className="text-sm font-medium text-slate-700">
                        {course.creator.firstName[0]}{course.creator.lastName[0]}
                      </span>
                    </div>
                  )}
                  <div className="ml-3">
                    <p className="text-sm font-medium text-slate-900">
                      {course.tutorName || `${course.creator.firstName} ${course.creator.lastName}`}
                    </p>
                    <p className="text-sm text-slate-600">Course Instructor</p>
                  </div>
                </div>
              </div>

              {/* Course Requirements & Prerequisites */}
              <div className="space-y-6 mt-8">
                {/* Course Requirements */}
                {course.requirements && course.requirements.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Course Requirements</h3>
                    <ul className="space-y-2">
                      {course.requirements.map((requirement, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-700">{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Prerequisites */}
                {course.prerequisites && course.prerequisites.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Prerequisites</h3>
                    <ul className="space-y-2">
                      {course.prerequisites.map((prerequisite, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <BookOpenIcon className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-700">{prerequisite}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Enrollment Card */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-slate-200 rounded-lg p-6 sticky top-6">
                <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center mb-6 relative overflow-hidden">
                  {course.thumbnail ? (
                    <img
                      src={getImageUrl(course.thumbnail)}
                      alt={course.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Failed to load thumbnail in course detail page:', getImageUrl(course.thumbnail));
                        console.error('Original thumbnail value:', course.thumbnail);
                      }}
                      onLoad={() => {
                        console.log('Successfully loaded thumbnail in course detail page:', getImageUrl(course.thumbnail));
                      }}
                    />
                  ) : (
                    <BookOpenIcon className="h-16 w-16 text-slate-400" />
                  )}
                  {course.isEnrolled && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <PlayIcon className="h-12 w-12 text-white" />
                    </div>
                  )}
                </div>

                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-slate-900 mb-2">
                    {course.price === 0 ? 'Free' : `$${course.price}`}
                  </div>
                  {course.price > 0 && (
                    <div className="text-sm text-slate-600">One-time payment</div>
                  )}
                </div>

                {course.isEnrolled ? (
                  <div className="space-y-4">
                    {progress && (
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-600">Course Progress</span>
                          <span className="font-medium text-slate-900">{Math.min(100, Math.round(progress.stats.progressPercentage))}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, progress.stats.progressPercentage)}%` }}
                          />
                        </div>
                        <div className="text-xs text-slate-600 mt-2">
                          <span>{progress.stats.completedMaterials} of {progress.stats.totalMaterials} completed</span>
                        </div>
                      </div>
                    )}
                    <Link href={`/learn/${courseId}`}>
                      <button className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center font-medium">
                        <PlayIcon className="h-5 w-5 mr-2" />
                        Continue Learning
                      </button>
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                )}

                {/* Course Details */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h4 className="font-medium text-slate-900 mb-3">Course Details</h4>
                  <div className="space-y-3 text-sm text-slate-600">
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 text-slate-500 mr-3" />
                      <span>{course.duration ? `${course.duration} hours` : 'Self-paced'}</span>
                    </div>
                    <div className="flex items-center">
                      <BookOpenIcon className="h-4 w-4 text-slate-500 mr-3" />
                      <span>{course._count.materials} learning materials</span>
                    </div>
                    <div className="flex items-center">
                      <UsersIcon className="h-4 w-4 text-slate-500 mr-3" />
                      <span>{course.level} level</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex space-x-8">
            {['overview', 'curriculum', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="max-w-4xl">
          {activeTab === 'overview' && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">About This Course</h2>
              <div className="prose max-w-none">
                <p className="text-slate-600 leading-relaxed">
                  {course.description}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'curriculum' && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Course Curriculum</h2>
              <div className="space-y-4">
                {course.modules.length > 0 ? (
                  course.modules
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((module, moduleIndex) => (
                      <div key={module.id} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-200">
                          <h3 className="text-lg font-semibold text-slate-900">
                            Module {moduleIndex + 1}: {module.title}
                          </h3>
                          {module.description && (
                            <p className="text-slate-600 mt-2">{module.description}</p>
                          )}
                        </div>
                        <div className="divide-y divide-slate-200">
                          {module.materials
                            .sort((a, b) => a.orderIndex - b.orderIndex)
                            .map((material, materialIndex) => {
                              const isCompleted = progress?.materials.find(
                                m => m.id === material.id
                              )?.progress?.isCompleted;

                              return (
                                <div key={material.id} className="p-4 flex items-center">
                                  <div className="flex items-center flex-1">
                                    <div className={`p-2 rounded-lg mr-4 ${
                                      isCompleted ? 'bg-emerald-100' : 'bg-slate-100'
                                    }`}>
                                      {isCompleted ? (
                                        <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                                      ) : (
                                        <div className="text-slate-500">
                                          {getMaterialIcon(material.type)}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-medium text-slate-900">
                                        {materialIndex + 1}. {material.title}
                                      </h4>
                                      {material.description && (
                                        <p className="text-sm text-slate-600 mt-1">{material.description}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-sm text-slate-500 capitalize font-medium">
                                    {material.type.toLowerCase()}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-12">
                    <BookOpenIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No curriculum available</h3>
                    <p className="text-slate-600">The course content is being prepared.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="space-y-8">
                {course.isEnrolled && (
                  <CourseReview
                    courseId={course.id}
                    onReviewSubmitted={() => {
                      fetchCourseDetails();
                    }}
                  />
                )}
                <CourseReviews courseId={course.id} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}