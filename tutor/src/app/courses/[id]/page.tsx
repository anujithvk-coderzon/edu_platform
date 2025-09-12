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
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  thumbnail?: string;
  tutorName?: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
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
        setError('Course not found or you don\'t have permission to view it');
      }
    } catch (error) {
      console.error('Error loading course:', error);
      setError('Failed to load course data');
    } finally {
      setLoading(false);
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
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-4">
          <Link href="/my-courses" className="text-blue-600 hover:text-blue-700">
            <ChevronLeftIcon className="w-4 h-4 mr-2 inline" />
            Back to My Courses
          </Link>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Course Not Found</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/my-courses">
              <Button>Back to My Courses</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwner = user && course.creator && user.id === course.creator.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link href="/my-courses" className="text-blue-600 hover:text-blue-700">
              <ChevronLeftIcon className="w-4 h-4 mr-2 inline" />
              Back to My Courses
            </Link>
          </div>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {course.title}
                </h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getStatusColor(course.status)}`}>
                  {course.status.charAt(0) + course.status.slice(1).toLowerCase()}
                </span>
              </div>
              <p className="text-gray-600 text-lg mb-4">{course.description}</p>
              
              {/* Course Meta */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <div className="flex items-center text-gray-600">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <UsersIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{course._count?.enrollments || 0}</div>
                    <div className="text-sm text-gray-500">students</div>
                  </div>
                </div>
                <div className="flex items-center text-gray-600">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">${course.price}</div>
                    <div className="text-sm text-gray-500">price</div>
                  </div>
                </div>
                <div className="flex items-center text-gray-600">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                    <StarIcon className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{course.averageRating ? course.averageRating.toFixed(1) : 'N/A'}</div>
                    <div className="text-sm text-gray-500">rating</div>
                  </div>
                </div>
                <div className="flex items-center text-gray-600">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <ClockIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{course.duration || 0}h</div>
                    <div className="text-sm text-gray-500">duration</div>
                  </div>
                </div>
              </div>

              {/* Course Details */}
              <div className="flex flex-wrap gap-4 mb-6">
                {course.category && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-blue-700 bg-blue-100 border border-blue-200">
                    {course.category.name}
                  </div>
                )}
                {course.level && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200">
                    Level: {course.level}
                  </div>
                )}
                {course.tutorName && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-purple-700 bg-purple-100 border border-purple-200">
                    Created by: {course.tutorName}
                  </div>
                )}
              </div>
            </div>
            
            {isOwner && (
              <div className="mt-6 lg:mt-0">
                <Link href={`/courses/${courseId}/edit`}>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3">
                    <PencilIcon className="w-5 h-5 mr-2" />
                    Edit Course
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Course Content */}
        <div className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-lg border border-blue-100/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AcademicCapIcon className="w-6 h-6 text-blue-600" />
                Course Content
              </CardTitle>
              <CardDescription>
                {course.modules.length} modules • {course._count?.materials || 0} materials
              </CardDescription>
            </CardHeader>
            <CardContent>
              {course.modules && course.modules.length > 0 ? (
                <div className="space-y-4">
                  {course.modules.map((module, moduleIndex) => (
                    <Card key={module.id} className="border border-gray-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center">
                          <FolderIcon className="w-5 h-5 text-blue-600 mr-3" />
                          <div>
                            <CardTitle className="text-lg">{module.title}</CardTitle>
                            {module.description && (
                              <CardDescription className="mt-1">{module.description}</CardDescription>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {module.materials.length > 0 ? (
                          <div className="space-y-2">
                            {module.materials.map((material) => {
                              const MaterialIcon = getMaterialIcon(material.type);
                              return (
                                <div key={material.id} className="p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center">
                                    <MaterialIcon className="w-5 h-5 text-gray-500 mr-3" />
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900">{material.title}</p>
                                      {material.description && (
                                        <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                                      )}
                                      <div className="flex items-center mt-2 space-x-4">
                                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                          {material.type}
                                        </span>
                                        {material.fileUrl && (
                                          <Button
                                            size="sm"
                                            onClick={() => handleViewMaterial(material)}
                                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
                                          >
                                            <PlayIcon className="w-3 h-3 mr-1" />
                                            {expandedMaterials.has(material.id) ? 'Hide' : (material.type === 'VIDEO' ? 'Play' : 'View')}
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Material Content Display */}
                                  {material.fileUrl && expandedMaterials.has(material.id) && (
                                    <div className="mt-4">
                                      {material.type === 'VIDEO' && (
                                        <video 
                                          controls 
                                          className="w-full h-64 bg-black rounded-lg"
                                          src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000'}${material.fileUrl}`}
                                          onError={(e) => {
                                            console.error('Video load error:', material.fileUrl);
                                            toast.error(`Failed to load video: ${material.title}`);
                                          }}
                                        >
                                          Your browser does not support the video tag.
                                        </video>
                                      )}
                                      {material.type === 'PDF' && (
                                        <div className="bg-white border rounded-lg p-4">
                                          <p className="text-sm text-gray-600 mb-2">PDF Document</p>
                                          <a 
                                            href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000'}${material.fileUrl}`} 
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
                                          src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000'}${material.fileUrl}`} 
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
                                          src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000'}${material.fileUrl}`}
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
                                            href={material.type === 'LINK' ? material.fileUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000'}${material.fileUrl}`} 
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
                          <p className="text-gray-600 text-center py-4">
                            No materials in this module yet.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FolderIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
                  <p className="text-gray-600 mb-6">
                    This course doesn't have any modules or materials yet.
                  </p>
                  {isOwner && (
                    <Link href={`/courses/${courseId}/edit`}>
                      <Button>
                        <PencilIcon className="w-4 h-4 mr-2" />
                        Add Content
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}