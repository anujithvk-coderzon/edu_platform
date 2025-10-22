'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '../../../components/ui/Button';
import toast from 'react-hot-toast';
import { api } from '../../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import {
  ChevronLeftIcon,
  PencilIcon,
  UsersIcon,
  CurrencyDollarIcon,
  StarIcon,
  AcademicCapIcon,
  ClockIcon,
  DocumentIcon,
  PlayIcon,
  PhotoIcon,
  LinkIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { getCdnUrl } from '../../../utils/cdn';
import { BUNNY_STREAM_LIBRARY_ID } from '../../../config/env';

/**
 * Check if the src is a Bunny Stream GUID (format: 8-4-4-4-12 hex characters)
 */
const isBunnyStreamGuid = (src: string): boolean => {
  if (!src) return false;
  const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return guidPattern.test(src);
};

interface Material {
  id: string;
  title: string;
  description?: string;
  type: 'PDF' | 'VIDEO' | 'AUDIO' | 'IMAGE' | 'DOCUMENT' | 'LINK';
  fileUrl?: string;
  content?: string;
  orderIndex: number;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  orderIndex: number;
  materials: Material[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  level: string;
  price: number;
  duration: number;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  thumbnail?: string;
  tutorName?: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  tutor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  category?: {
    id: string;
    name: string;
  };
  modules: Module[];
  _count?: {
    enrollments: number;
    materials: number;
    reviews: number;
  };
  averageRating?: number;
  isEnrolled?: boolean;
}

export default function CourseViewPage() {
  const { user } = useAuth();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedMaterials, setExpandedMaterials] = useState<Set<string>>(new Set());

  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL!;

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      const response = await api.courses.getById(courseId);
      if (response.success && response.data?.course) {
        setCourse(response.data.course);
      } else {
        setError('Course not found or you do not have permission to view it');
      }
    } catch (error) {
      setError('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!course) return;

    if (!confirm('Are you sure you want to submit this course for admin review?')) {
      return;
    }

    try {
      const response: any = await api.courses.submitForReview(course.id);
      if (response.success) {
        toast.success('Course submitted for review successfully!');
        loadCourseData(); // Refresh to show updated status

        // Notify Navbar to update pending courses count
        window.dispatchEvent(new Event('pendingCoursesUpdated'));
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit course for review');
    }
  };

  const handlePublish = async () => {
    if (!course) return;

    if (!confirm('Are you sure you want to publish this course? It will be visible to students.')) {
      return;
    }

    try {
      const response: any = await api.courses.publish(course.id);
      if (response.success) {
        toast.success('Course published successfully!');
        loadCourseData(); // Refresh to show updated status
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to publish course');
    }
  };

  const handleReject = async () => {
    if (!course) return;

    const reason = prompt('Please provide a reason for rejection (optional):');

    try {
      const response: any = await api.courses.reject(course.id, reason || undefined);
      if (response.success) {
        toast.success('Course rejected and sent back to draft');
        loadCourseData(); // Refresh to show updated status
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject course');
    }
  };

  const handleViewMaterial = (material: Material) => {
    const newExpanded = new Set(expandedMaterials);
    if (expandedMaterials.has(material.id)) {
      newExpanded.delete(material.id);
    } else {
      newExpanded.add(material.id);
    }
    setExpandedMaterials(newExpanded);
  };

  const getMaterialIcon = (type: Material['type']) => {
    switch (type) {
      case 'PDF':
      case 'DOCUMENT':
        return DocumentIcon;
      case 'VIDEO':
        return PlayIcon;
      case 'AUDIO':
        return PlayIcon;
      case 'IMAGE':
        return PhotoIcon;
      case 'LINK':
        return LinkIcon;
      default:
        return DocumentIcon;
    }
  };

  const getStatusColor = (status: Course['status']) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'PENDING_REVIEW':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'ARCHIVED':
        return 'bg-slate-100 text-slate-800 border border-slate-200';
      default:
        return 'bg-slate-100 text-slate-800 border border-slate-200';
    }
  };

  const getStatusLabel = (status: Course['status']) => {
    switch (status) {
      case 'PUBLISHED':
        return 'Published';
      case 'PENDING_REVIEW':
        return 'Pending Review';
      case 'DRAFT':
        return 'Draft';
      case 'ARCHIVED':
        return 'Archived';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-8"></div>
            <div className="h-96 bg-white rounded-xl shadow-sm border border-slate-200"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-4">
            <Link href="/my-courses" className="inline-flex items-center text-slate-700 hover:text-slate-900">
              <ChevronLeftIcon className="w-4 h-4 mr-2" />
              Back to My Courses
            </Link>
          </div>
          <Card className="bg-white shadow-sm border border-slate-200">
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Course Not Found</h3>
              <p className="text-slate-600 mb-6">{error}</p>
              <Link href="/my-courses">
                <Button>Back to My Courses</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isOwner = user && course.creator && user.id === course.creator.id;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="mb-4">
            <Link href="/my-courses" className="inline-flex items-center px-3 py-2 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors rounded-lg border border-slate-300 shadow-sm font-medium text-sm">
              <ChevronLeftIcon className="w-4 h-4 mr-2" />
              Back to My Courses
            </Link>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                  <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
                    {course.title}
                  </h1>
                  <span className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(course.status)} w-fit`}>
                    {getStatusLabel(course.status)}
                  </span>
                </div>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">{course.description}</p>
              </div>
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                {isOwner && (
                  <Link href={`/courses/${course.id}/edit`}>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <PencilIcon className="w-4 h-4 mr-2" />
                      Edit Course
                    </Button>
                  </Link>
                )}
                {/* Tutor: Submit for Review button (only for DRAFT courses) */}
                {user?.role === 'Tutor' && isOwner && course.status === 'DRAFT' && (
                  <Button onClick={handleSubmitForReview} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                    Submit for Review
                  </Button>
                )}
                {/* Admin: Publish and Reject buttons (only for PENDING_REVIEW courses) */}
                {user?.role === 'Admin' && course.status === 'PENDING_REVIEW' && (
                  <>
                    <Button onClick={handlePublish} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                      Publish Course
                    </Button>
                    <Button onClick={handleReject} variant="outline" className="w-full sm:w-auto border-red-300 text-red-600 hover:bg-red-50">
                      Reject Course
                    </Button>
                  </>
                )}
                {/* Admin: Publish button (for DRAFT courses if admin wants to publish directly) */}
                {user?.role === 'Admin' && course.status === 'DRAFT' && (
                  <Button onClick={handlePublish} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                    Publish Course
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center text-slate-700">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <UsersIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-lg">{course._count?.enrollments || 0}</div>
                    <div className="text-xs text-slate-600">Students</div>
                    </div>
                  </div>
                </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center text-slate-700">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-lg">${course.price}</div>
                    <div className="text-xs text-slate-600">Price</div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center text-slate-700">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                    <StarIcon className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-lg">{course.averageRating ? course.averageRating.toFixed(1) : 'N/A'}</div>
                    <div className="text-xs text-slate-600">Rating</div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center text-slate-700">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <ClockIcon className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-lg">{course.duration || 0}h</div>
                    <div className="text-xs text-slate-600">Duration</div>
                  </div>
                </div>
              </div>
              </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {course.category && (
                <div className="inline-flex items-center px-3 py-1 rounded text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200">
                  {course.category.name}
                </div>
              )}
              {course.level && (
                <div className="inline-flex items-center px-3 py-1 rounded text-xs font-medium text-slate-700 bg-slate-100 border border-slate-300">
                  Level: {course.level}
                </div>
              )}
              <div className="inline-flex items-center px-3 py-1 rounded text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200">
                Created by: {course.creator.firstName} {course.creator.lastName}
              </div>
              {(course.tutor && course.tutor.id !== course.creator.id) && (
                <div className="inline-flex items-center px-3 py-1 rounded text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200">
                  Assigned to: {course.tutor.firstName} {course.tutor.lastName}
                </div>
              )}
            </div>
            </div>

            {isOwner && (
              <div className="mt-4 sm:absolute sm:top-4 sm:right-4">
                <Link href={`/courses/${courseId}/edit`}>
                  <Button className="flex items-center space-x-2">
                    <PencilIcon className="w-4 h-4" />
                    <span>Edit Course</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-white shadow-sm border border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                <AcademicCapIcon className="w-5 h-5 text-slate-600" />
                Course Content
              </CardTitle>
              <CardDescription className="text-slate-600 text-sm">
                {course.modules?.length || 0} modules • {course._count?.materials || 0} materials
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              {course.modules && course.modules.length > 0 ? (
                <div className="space-y-6">
                  {course.modules.map((module, moduleIndex) => (
                    <Card key={module.id} className="bg-slate-50 border border-slate-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <FolderIcon className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base font-semibold text-slate-900">{module.title}</CardTitle>
                            {module.description && (
                              <CardDescription className="mt-1 text-slate-600 text-sm">{module.description}</CardDescription>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {module.materials.length > 0 ? (
                          <div className="space-y-3">
                            {module.materials.map((material) => {
                              const MaterialIcon = getMaterialIcon(material.type);
                              const materialUrl = getCdnUrl(material.fileUrl) || '';
                              return (
                                <div key={material.id} className="p-3 bg-white rounded-lg border border-slate-200">
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-3">
                                      <MaterialIcon className="w-4 h-4 text-slate-600" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium text-slate-900 text-sm">{material.title}</p>
                                      {material.description && (
                                        <p className="text-slate-600 mt-1 text-xs">{material.description}</p>
                                      )}
                                      <div className="flex items-center mt-2 space-x-3">
                                        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                          {material.type}
                                        </span>
                                        {material.fileUrl && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleViewMaterial(material)}
                                            className="text-xs"
                                          >
                                            <PlayIcon className="w-3 h-3 mr-1" />
                                            {expandedMaterials.has(material.id) ? 'Hide' : (material.type === 'VIDEO' ? 'Play' : 'View')}
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {material.fileUrl && expandedMaterials.has(material.id) && (
                                    <div className="mt-4">
                                      {material.type === 'VIDEO' && (
                                        isBunnyStreamGuid(material.fileUrl) ? (
                                          /* Bunny Stream iframe embed */
                                          <iframe
                                            src={`https://iframe.mediadelivery.net/embed/${BUNNY_STREAM_LIBRARY_ID}/${material.fileUrl}`}
                                            loading="lazy"
                                            style={{ border: 0, width: '100%', aspectRatio: '16/9', maxWidth: '28rem' }}
                                            className="rounded-lg bg-black"
                                            allowFullScreen
                                          />
                                        ) : (
                                          /* Regular video tag for non-stream videos */
                                          <video
                                            controls
                                            className="w-full max-w-md h-full bg-black rounded-lg object-cover"
                                            src={materialUrl}
                                            onError={(e) => {
                                              console.error('Video load error:', material.fileUrl);
                                              toast.error(`Failed to load video: ${material.title}`);
                                            }}
                                          >
                                            Your browser does not support the video tag.
                                          </video>
                                        )
                                      )}
                                      {material.type === 'PDF' && (
                                        <div className="bg-white border rounded-lg p-4">
                                          <p className="text-sm text-gray-600 mb-2">PDF Document</p>
                                          <a
                                            href={materialUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 underline"
                                          >
                                            Open PDF in new tab
                                          </a>
                                        </div>
                                      )}
                                      {material.type === 'IMAGE' && (
                                        <img
                                          src={materialUrl}
                                          alt={material.title}
                                          className="w-full max-h-96 object-contain rounded-lg bg-white"
                                          onError={(e) => {
                                            console.error('Image load error:', e);
                                            toast.error('Failed to load image. Please check if the file exists.');
                                          }}
                                        />
                                      )}
                                      {material.type === 'AUDIO' && (
                                        <audio
                                          controls
                                          className="w-full"
                                          src={materialUrl}
                                          onError={(e) => {
                                            console.error('Audio load error:', e);
                                            toast.error('Failed to load audio. Please check if the file exists.');
                                          }}
                                        >
                                          Your browser does not support the audio tag.
                                        </audio>
                                      )}
                                      {(material.type === 'DOCUMENT' || material.type === 'LINK') && (
                                        <div className="bg-white border rounded-lg p-4">
                                          <p className="text-sm text-gray-600 mb-2">{material.type === 'LINK' ? 'External Link' : 'Document'}</p>
                                          <a
                                            href={material.type === 'LINK' ? material.fileUrl : materialUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 underline"
                                          >
                                            {material.type === 'LINK' ? 'Open Link' : 'Download Document'}
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                              <span className="text-white text-2xl">📝</span>
                            </div>
                            <p className="text-slate-600 font-medium text-lg">
                              No materials in this module yet.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-300 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-white text-4xl">📁</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-4">No content yet ✨</h3>
                  <p className="text-slate-700 mb-8 text-lg font-medium max-w-md mx-auto">
                    This course does not have any modules or materials yet. Start creating amazing content!
                  </p>
                  {isOwner && (
                    <Link href={`/courses/${courseId}/edit`}>
                      <div className="inline-flex items-center bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-bold py-4 px-8 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 cursor-pointer">
                        <PencilIcon className="w-5 h-5 mr-3" />
                        <span>🚀 Add Content</span>
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
  );
}