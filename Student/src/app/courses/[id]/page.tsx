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
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  TrophyIcon
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
  tutor?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
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

  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'reviews'>('overview');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

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
      setTimeout(() => {
        router.push('/login');
      }, 1500);
      return;
    }

    try {
      setEnrolling(true);
      const response = await api.enrollments.enroll(courseId);
      if (response.success) {
        toast.success('Successfully enrolled in course!');
        setCourse(prev => prev ? { ...prev, isEnrolled: true } : null);
        await fetchCourseDetails();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium text-sm">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="bg-white rounded-lg p-8 border border-slate-200">
            <BookOpenIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Course Not Found</h3>
            <p className="text-slate-600 text-sm mb-6">The course you're looking for doesn't exist or has been removed.</p>
            <Link href="/courses">
              <button className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-all font-semibold text-sm">
                Browse All Courses
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalMaterials = course.modules.reduce((sum, module) => sum + module.materials.length, 0);

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Back Button */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3">
          <button
            onClick={() => router.push('/courses')}
            className="flex items-center text-slate-600 hover:text-indigo-600 transition-colors text-sm font-medium group"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Courses
          </button>
        </div>
      </div>

      {/* Clean Hero Section */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-10 items-start">
            {/* Left Content - Course Info */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-5">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {course.category && (
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-semibold border border-indigo-200">
                    {course.category.name}
                  </span>
                )}
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-semibold border border-slate-200">
                  {course.level}
                </span>
                {course.isEnrolled && (
                  <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-md text-xs font-semibold border border-green-200 flex items-center gap-1">
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                    Enrolled
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight tracking-tight">
                {course.title}
              </h1>

              {/* Description */}
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {course.description}
              </p>

              {/* Stats Row - Mobile Optimized */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm border-y border-slate-200 py-4">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                          star <= (course.averageRating || 0)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-slate-900 text-xs sm:text-sm">{course.averageRating?.toFixed(1) || '0.0'}</span>
                  <span className="text-slate-500 hidden sm:inline">({course.totalReviews})</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-slate-600">
                  <UsersIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate"><span className="font-semibold text-slate-900">{course._count.enrollments}</span> students</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-slate-600">
                  <ClockIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">{course.duration ? `${course.duration}h` : 'Self-paced'}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-slate-600">
                  <BookOpenIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">{totalMaterials} materials</span>
                </div>
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
                {(course.tutor?.avatar || course.creator.avatar) ? (
                  <img
                    src={getCdnUrl(course.tutor?.avatar || course.creator.avatar) || ''}
                    alt="Instructor"
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-white shadow-sm object-cover flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-indigo-600 flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0">
                    <span className="text-xs sm:text-sm font-bold text-white">
                      {course.tutor ? `${course.tutor.firstName[0]}${course.tutor.lastName[0]}` : `${course.creator.firstName[0]}${course.creator.lastName[0]}`}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">Instructor</p>
                  <p className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                    {course.tutor ? `${course.tutor.firstName} ${course.tutor.lastName}` :
                     course.tutorName ||
                     `${course.creator.firstName} ${course.creator.lastName}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Right - Compact Enrollment Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden lg:sticky lg:top-20">
                {/* Compact Thumbnail */}
                <div className="relative aspect-video bg-slate-100">
                  {course.thumbnail && getImageUrl(course.thumbnail) ? (
                    <img
                      src={getImageUrl(course.thumbnail)!}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpenIcon className="h-12 w-12 sm:h-16 sm:w-16 text-slate-400" />
                    </div>
                  )}
                </div>

                <div className="p-4 sm:p-5 space-y-3">
                  {/* Price */}
                  {course.price === 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
                      <span className="text-base sm:text-lg font-bold text-green-700">FREE</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                        ${course.price}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">One-time payment</div>
                    </div>
                  )}

                  {/* Progress (if enrolled) */}
                  {course.isEnrolled && progress && (
                    <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-slate-700">Progress</span>
                        <span className="text-sm font-bold text-indigo-600">
                          {Math.min(100, Math.round(progress.stats.progressPercentage))}%
                        </span>
                      </div>
                      <div className="w-full bg-indigo-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(100, progress.stats.progressPercentage)}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-600 mt-1.5 text-center sm:text-left">
                        {progress.stats.completedMaterials}/{progress.stats.totalMaterials} completed
                      </div>
                    </div>
                  )}

                  {/* CTA Button */}
                  {course.isEnrolled ? (
                    <Link href={`/learn/${courseId}`} className="block">
                      <button className="w-full bg-indigo-600 text-white py-3 sm:py-3.5 px-4 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-all flex items-center justify-center font-semibold text-sm shadow-sm min-h-[44px]">
                        <PlayIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                        <span>Continue Learning</span>
                      </button>
                    </Link>
                  ) : (
                    <button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="w-full bg-indigo-600 text-white py-3 sm:py-3.5 px-4 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-sm min-h-[44px]"
                    >
                      {enrolling ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Enrolling...</span>
                        </div>
                      ) : (
                        'Enroll Now'
                      )}
                    </button>
                  )}

                  {/* Compact Includes */}
                  <div className="pt-3 border-t border-slate-200">
                    <h4 className="font-semibold text-slate-900 mb-2 text-xs uppercase tracking-wide">Includes</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-600">
                        <ClockIcon className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                        <span className="truncate">{course.duration ? `${course.duration} hours` : 'Self-paced'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <BookOpenIcon className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                        <span className="truncate">{totalMaterials} materials</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <ShieldCheckIcon className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                        <span className="truncate">Lifetime access</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-[49px] z-20 -mx-[1px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-0 overflow-x-auto scrollbar-hide -mb-px">
            {(['overview', 'curriculum', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-4 sm:px-6 border-b-2 font-medium text-xs sm:text-sm capitalize transition-all whitespace-nowrap flex-shrink-0 min-h-[44px] ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 active:bg-slate-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {activeTab === 'overview' && (
          <div className="max-w-4xl space-y-4 sm:space-y-5">
            {/* About */}
            <div className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 md:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4">About This Course</h2>
              <div className="prose max-w-none">
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {course.description}
                </p>
              </div>
            </div>

            {/* Requirements & Prerequisites */}
            {((course.requirements && course.requirements.length > 0) ||
              (course.prerequisites && course.prerequisites.length > 0)) && (
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
                {course.requirements && course.requirements.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                      <span>Requirements</span>
                    </h3>
                    <ul className="space-y-2">
                      {course.requirements.map((requirement, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                          <span className="text-xs sm:text-sm text-slate-700 leading-relaxed">{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {course.prerequisites && course.prerequisites.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <AcademicCapIcon className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 flex-shrink-0" />
                      <span>Prerequisites</span>
                    </h3>
                    <ul className="space-y-2">
                      {course.prerequisites.map((prerequisite, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                          <span className="text-xs sm:text-sm text-slate-700 leading-relaxed">{prerequisite}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'curriculum' && (
          <div className="max-w-5xl">
            <div className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4 sm:mb-5">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">Course Curriculum</h2>
                <div className="text-xs sm:text-sm text-slate-600 font-medium">
                  {course.modules.length} Modules • {totalMaterials} Materials
                </div>
              </div>

              <div className="space-y-4">
                {course.modules.length > 0 ? (
                  course.modules
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((module, moduleIndex) => {
                      const isExpanded = expandedModules.has(module.id);
                      const completedCount = module.materials.filter(m =>
                        progress?.materials.find(pm => pm.id === m.id)?.progress?.isCompleted
                      ).length;

                      return (
                        <div key={module.id} className="border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-all">
                          {/* Module Header */}
                          <button
                            onClick={() => toggleModule(module.id)}
                            className="w-full p-4 sm:p-5 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 transition-all min-h-[44px]"
                          >
                            <div className="flex items-start gap-2.5 sm:gap-3">
                              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xs sm:text-sm">{moduleIndex + 1}</span>
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 mb-1 pr-2">
                                  {module.title}
                                </h3>
                                {module.description && (
                                  <p className="text-xs sm:text-sm text-slate-600 mb-2 line-clamp-2 pr-2">{module.description}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                  <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 sm:py-1 rounded border border-indigo-200 whitespace-nowrap">
                                    {module.materials.length} {module.materials.length === 1 ? 'Material' : 'Materials'}
                                  </span>
                                  {course.isEnrolled && completedCount > 0 && (
                                    <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 sm:py-1 rounded border border-green-200 flex items-center gap-1 whitespace-nowrap">
                                      <CheckCircleIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                                      <span>{completedCount} Done</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex-shrink-0 self-center">
                                {isExpanded ? (
                                  <ChevronUpIcon className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400" />
                                ) : (
                                  <ChevronDownIcon className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400" />
                                )}
                              </div>
                            </div>
                          </button>

                          {/* Module Materials */}
                          {isExpanded && (
                            <div className="divide-y divide-slate-100 bg-white">
                              {module.materials
                                .sort((a, b) => a.orderIndex - b.orderIndex)
                                .map((material, materialIndex) => {
                                  const isCompleted = progress?.materials.find(
                                    m => m.id === material.id
                                  )?.progress?.isCompleted;

                                  return (
                                    <div key={material.id} className="p-3 sm:p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors group">
                                      <div className="flex items-start gap-2.5 sm:gap-3">
                                        <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 transition-all ${
                                          isCompleted
                                            ? 'bg-green-100'
                                            : 'bg-slate-100 group-hover:bg-indigo-50'
                                        }`}>
                                          {isCompleted ? (
                                            <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                                          ) : (
                                            <div className="text-slate-500 group-hover:text-indigo-600 transition-colors">
                                              {getMaterialIcon(material.type)}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-medium text-slate-900 text-xs sm:text-sm mb-0.5">
                                            {materialIndex + 1}. {material.title}
                                          </h4>
                                          {material.description && (
                                            <p className="text-xs text-slate-600 line-clamp-1">{material.description}</p>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          <span className={`text-xs font-medium capitalize px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap ${
                                            material.type === 'VIDEO' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                            material.type === 'DOCUMENT' || material.type === 'PDF' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                            material.type === 'AUDIO' ? 'bg-pink-50 text-pink-700 border border-pink-200' :
                                            'bg-slate-50 text-slate-700 border border-slate-200'
                                          }`}>
                                            {material.type.toLowerCase()}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-10 sm:py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <BookOpenIcon className="h-12 w-12 sm:h-16 sm:w-16 text-slate-400 mx-auto mb-3" />
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1 px-4">No Curriculum Available</h3>
                    <p className="text-xs sm:text-sm text-slate-600 px-4">The course content is currently being prepared.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="max-w-4xl space-y-4 sm:space-y-6">
            {/* Reviews Summary */}
            <div className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 md:p-8">
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 md:gap-12 items-start sm:items-center">
                {/* Overall Rating */}
                <div className="text-center sm:text-left w-full sm:w-auto">
                  <div className="text-4xl sm:text-5xl font-bold text-slate-900 mb-2">
                    {course.averageRating?.toFixed(1) || '0.0'}
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-0.5 sm:gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        className={`h-4 w-4 sm:h-5 sm:w-5 ${
                          star <= (course.averageRating || 0)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600">
                    {course.totalReviews} {course.totalReviews === 1 ? 'review' : 'reviews'}
                  </p>
                </div>

                {/* Rating Distribution */}
                <div className="flex-1 w-full space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = course.reviews?.filter(r => Math.round(r.rating) === rating).length || 0;
                    const percentage = course.totalReviews > 0 ? (count / course.totalReviews) * 100 : 0;

                    return (
                      <div key={rating} className="flex items-center gap-2 sm:gap-3">
                        <span className="text-xs font-medium text-slate-600 w-10 sm:w-12 flex-shrink-0">{rating} star</span>
                        <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden min-w-0">
                          <div
                            className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-600 w-8 sm:w-10 text-right flex-shrink-0">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Write Review (if enrolled) */}
            {course.isEnrolled && (
              <div className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 md:p-8">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4">Write a Review</h3>
                <CourseReview
                  courseId={course.id}
                  onReviewSubmitted={() => {
                    fetchCourseDetails();
                  }}
                />
              </div>
            )}

            {/* Reviews List */}
            <div className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 md:p-8">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4 sm:mb-6">All Reviews</h3>
              <CourseReviews courseId={course.id} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
