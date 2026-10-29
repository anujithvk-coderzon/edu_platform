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
  CurrencyRupeeIcon,
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
import { formatPrice } from '@/utils/currency';

interface Material {
  id: string;
  title: string;
  description?: string;
  type: 'PDF' | 'VIDEO' | 'AUDIO' | 'IMAGE' | 'DOCUMENT' | 'LINK';
  fileUrl?: string;
  /** Bunny Stream embed URL, resolved by the API for VIDEO materials. */
  embedUrl?: string;
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
        return 'bg-[#DCFAE6] text-[#05603A] border border-[#ABEFC6]';
      case 'PENDING_REVIEW':
        return 'bg-[#DBE7FE] text-[#1E40AF] border border-[#C7D7FE]';
      case 'DRAFT':
        return 'bg-[#FEF0C7] text-[#93370D] border border-[#FEDF89]';
      case 'ARCHIVED':
        return 'bg-[#E9EEF4] text-[#1E293B] border border-[#DDE3EA]';
      default:
        return 'bg-[#E9EEF4] text-[#1E293B] border border-[#DDE3EA]';
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
      <div className="min-h-screen bg-[#F6F8FA]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-[#DDE3EA] rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-[#DDE3EA] rounded w-1/2 mb-8"></div>
            <div className="h-96 bg-white rounded-xl shadow-sm border border-[#DDE3EA]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-[#F6F8FA]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-4">
            <Link href="/my-courses" className="inline-flex items-center text-[#334155] hover:text-[#0F172A]">
              <ChevronLeftIcon className="w-4 h-4 mr-2" />
              Back to My Courses
            </Link>
          </div>
          <Card className="bg-white shadow-sm border border-[#DDE3EA]">
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Course Not Found</h3>
              <p className="text-[#475569] mb-6">{error}</p>
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
    <div className="min-h-screen bg-[#F6F8FA]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="mb-4">
            <Link href="/my-courses" className="inline-flex items-center px-3 py-2 bg-white text-[#334155] hover:text-[#0F172A] hover:bg-[#F6F8FA] transition-colors rounded-lg border border-[#C7D2DE] shadow-sm font-medium text-sm">
              <ChevronLeftIcon className="w-4 h-4 mr-2" />
              Back to My Courses
            </Link>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-[#DDE3EA] p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                  <h1 className="text-2xl sm:text-3xl font-semibold text-[#0F172A]">
                    {course.title}
                  </h1>
                  <span className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(course.status)} w-fit`}>
                    {getStatusLabel(course.status)}
                  </span>
                </div>
                <p className="text-[#475569] text-sm sm:text-base leading-relaxed">{course.description}</p>
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
                  <Button onClick={handleSubmitForReview} className="w-full sm:w-auto bg-[#1D4ED8] hover:bg-[#1E40AF]">
                    Submit for Review
                  </Button>
                )}
                {/* Admin: Publish and Reject buttons (only for PENDING_REVIEW courses) */}
                {user?.role === 'Admin' && course.status === 'PENDING_REVIEW' && (
                  <>
                    <Button onClick={handlePublish} className="w-full sm:w-auto bg-[#079455] hover:bg-[#067647]">
                      Publish Course
                    </Button>
                    <Button onClick={handleReject} variant="outline" className="w-full sm:w-auto border-[#FDA29B] text-[#B42318] hover:bg-[#FEF3F2]">
                      Reject Course
                    </Button>
                  </>
                )}
                {/* Admin: Publish button (for DRAFT courses if admin wants to publish directly) */}
                {user?.role === 'Admin' && course.status === 'DRAFT' && (
                  <Button onClick={handlePublish} className="w-full sm:w-auto bg-[#079455] hover:bg-[#067647]">
                    Publish Course
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="bg-[#F6F8FA] rounded-lg p-3 border border-[#DDE3EA]">
                <div className="flex items-center text-[#334155]">
                  <div className="w-8 h-8 bg-[#DBE7FE] rounded-lg flex items-center justify-center mr-3">
                    <UsersIcon className="w-4 h-4 text-[#1D4ED8]" />
                  </div>
                  <div>
                    <div className="font-semibold text-[#0F172A] text-lg">{course._count?.enrollments || 0}</div>
                    <div className="text-xs text-[#475569]">Students</div>
                    </div>
                  </div>
                </div>
              <div className="bg-[#F6F8FA] rounded-lg p-3 border border-[#DDE3EA]">
                <div className="flex items-center text-[#334155]">
                  <div className="w-8 h-8 bg-[#DCFAE6] rounded-lg flex items-center justify-center mr-3">
                    <CurrencyRupeeIcon className="w-4 h-4 text-[#079455]" />
                  </div>
                  <div>
                    <div className="font-semibold text-[#0F172A] text-lg">{formatPrice(course.price)}</div>
                    <div className="text-xs text-[#475569]">Price</div>
                  </div>
                </div>
              </div>
              <div className="bg-[#F6F8FA] rounded-lg p-3 border border-[#DDE3EA]">
                <div className="flex items-center text-[#334155]">
                  <div className="w-8 h-8 bg-[#FEF0C7] rounded-lg flex items-center justify-center mr-3">
                    <StarIcon className="w-4 h-4 text-[#DC6803]" />
                  </div>
                  <div>
                    <div className="font-semibold text-[#0F172A] text-lg">{course.averageRating ? course.averageRating.toFixed(1) : 'N/A'}</div>
                    <div className="text-xs text-[#475569]">Rating</div>
                  </div>
                </div>
              </div>
              <div className="bg-[#F6F8FA] rounded-lg p-3 border border-[#DDE3EA]">
                <div className="flex items-center text-[#334155]">
                  <div className="w-8 h-8 bg-[#DBE7FE] rounded-lg flex items-center justify-center mr-3">
                    <ClockIcon className="w-4 h-4 text-[#1D4ED8]" />
                  </div>
                  <div>
                    <div className="font-semibold text-[#0F172A] text-lg">{course.duration || 0}h</div>
                    <div className="text-xs text-[#475569]">Duration</div>
                  </div>
                </div>
              </div>
              </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {course.category && (
                <div className="inline-flex items-center px-3 py-1 rounded text-xs font-medium text-[#1E40AF] bg-[#EFF4FF] border border-[#C7D7FE]">
                  {course.category.name}
                </div>
              )}
              {course.level && (
                <div className="inline-flex items-center px-3 py-1 rounded text-xs font-medium text-[#334155] bg-[#E9EEF4] border border-[#C7D2DE]">
                  Level: {course.level}
                </div>
              )}
              <div className="inline-flex items-center px-3 py-1 rounded text-xs font-medium text-[#1E40AF] bg-[#EFF4FF] border border-[#C7D7FE]">
                Created by: {course.creator.firstName} {course.creator.lastName}
              </div>
              {(course.tutor && course.tutor.id !== course.creator.id) && (
                <div className="inline-flex items-center px-3 py-1 rounded text-xs font-medium text-[#1E40AF] bg-[#EFF4FF] border border-[#C7D7FE]">
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
          <Card className="bg-white shadow-sm border border-[#DDE3EA]">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-[#0F172A]">
                <AcademicCapIcon className="w-5 h-5 text-[#475569]" />
                Course Content
              </CardTitle>
              <CardDescription className="text-[#475569] text-sm">
                {course.modules?.length || 0} modules • {course._count?.materials || 0} materials
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              {course.modules && course.modules.length > 0 ? (
                <div className="space-y-6">
                  {course.modules.map((module, moduleIndex) => (
                    <Card key={module.id} className="bg-[#F6F8FA] border border-[#DDE3EA]">
                      <CardHeader className="pb-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-[#DBE7FE] rounded-lg flex items-center justify-center mr-3">
                            <FolderIcon className="w-4 h-4 text-[#1D4ED8]" />
                          </div>
                          <div>
                            <CardTitle className="text-base font-semibold text-[#0F172A]">{module.title}</CardTitle>
                            {module.description && (
                              <CardDescription className="mt-1 text-[#475569] text-sm">{module.description}</CardDescription>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {module.materials.length > 0 ? (
                          <div className="space-y-3">
                            {module.materials.map((material) => {
                              const MaterialIcon = getMaterialIcon(material.type);
                              const materialUrl = material.fileUrl || '';
                              return (
                                <div key={material.id} className="p-3 bg-white rounded-lg border border-[#DDE3EA]">
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 bg-[#E9EEF4] rounded-lg flex items-center justify-center mr-3">
                                      <MaterialIcon className="w-4 h-4 text-[#475569]" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium text-[#0F172A] text-sm">{material.title}</p>
                                      {material.description && (
                                        <p className="text-[#475569] mt-1 text-xs">{material.description}</p>
                                      )}
                                      <div className="flex items-center mt-2 space-x-3">
                                        <span className="text-xs font-medium text-[#475569] bg-[#E9EEF4] px-2 py-1 rounded">
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
                                        material.embedUrl ? (
                                          /* Bunny Stream iframe embed */
                                          <iframe
                                            src={material.embedUrl}
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
                                          <p className="text-sm text-[#475569] mb-2">PDF Document</p>
                                          <a
                                            href={materialUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[#1D4ED8] hover:text-[#1E40AF] underline"
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
                                          <p className="text-sm text-[#475569] mb-2">{material.type === 'LINK' ? 'External Link' : 'Document'}</p>
                                          <a
                                            href={material.type === 'LINK' ? material.fileUrl : materialUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[#1D4ED8] hover:text-[#1E40AF] underline"
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
                            <div className="w-16 h-16 bg-[#0F172A] rounded-full flex items-center justify-center mx-auto mb-4">
                              <span className="text-white text-2xl">📝</span>
                            </div>
                            <p className="text-[#475569] font-medium text-lg">
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
                  <div className="w-24 h-24 bg-[#1D4ED8] rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-white text-4xl">📁</span>
                  </div>
                  <h3 className="text-2xl font-bold text-[#1E293B] mb-4">No content yet ✨</h3>
                  <p className="text-[#334155] mb-8 text-lg font-medium max-w-md mx-auto">
                    This course does not have any modules or materials yet. Start creating amazing content!
                  </p>
                  {isOwner && (
                    <Link href={`/courses/${courseId}/edit`}>
                      <div className="inline-flex items-center bg-[#1D4ED8] hover:from-[#1E40AF] hover:to-[#1E40AF] text-white font-bold py-4 px-8 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 cursor-pointer">
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