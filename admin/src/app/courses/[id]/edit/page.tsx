'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '../../../../components/ui/Button';
import toast from 'react-hot-toast';
import { api } from '../../../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { Input } from '../../../../components/ui/Input';
import { Textarea } from '../../../../components/ui/Textarea';
import { Select } from '../../../../components/ui/Select';
import type { SelectOption } from '../../../../components/ui/Select';
import { FileUpload } from '../../../../components/ui/FileUpload';
import { 
  ChevronLeftIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DocumentIcon,
  PlayIcon,
  PhotoIcon,
  LinkIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { getImageUrl } from '../../../../utils/imageUtils';

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
  isPublic: boolean;
  thumbnail?: string;
  thumbnailFile?: File;
  tutorName?: string;
  requirements: string[];
  prerequisites: string[];
  modules: Module[];
}

const materialTypes: SelectOption[] = [
  { value: 'PDF', label: 'PDF Document' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'AUDIO', label: 'Audio' },
  { value: 'IMAGE', label: 'Image' },
  { value: 'DOCUMENT', label: 'Document' },
  { value: 'LINK', label: 'External Link' }
];


export default function CourseEditPage() {
  const params = useParams();
  const courseId = params.id as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'content'>('details');
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState<{moduleId: string} | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<{moduleId: string, material: Material} | null>(null);
  const [deletingMaterialId, setDeletingMaterialId] = useState<string>('');
  const [deletingModuleId, setDeletingModuleId] = useState<string>('');
  const [creatingModule, setCreatingModule] = useState(false);
  const [creatingMaterial, setCreatingMaterial] = useState(false);

  const [newModule, setNewModule] = useState({
    title: '',
    description: ''
  });

  const [newMaterial, setNewMaterial] = useState({
    title: '',
    description: '',
    type: 'VIDEO' as Material['type'],
    fileUrl: '',
    content: ''
  });

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      const response = await api.courses.getById(courseId);
      if (response.success && response.data?.course) {
        console.log('Loaded course data:', response.data.course);
        console.log('Course thumbnail:', response.data.course.thumbnail);
        // Ensure requirements and prerequisites are arrays, and isPublic has a default value
        const courseData = {
          ...response.data.course,
          requirements: response.data.course.requirements || [],
          prerequisites: response.data.course.prerequisites || [],
          isPublic: response.data.course.isPublic ?? false
        };
        setCourse(courseData);
      } else {
        toast.error('Failed to load course data');
      }
    } catch (error) {
      console.error('Error loading course:', error);
      toast.error('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCourse = async () => {
    if (!course) return;

    try {
      setSaving(true);

      let thumbnailUrl = course.thumbnail;

      // Upload new thumbnail if a file was selected
      if (course.thumbnailFile) {
        try {
          const uploadResponse = await api.uploads.courseThumbnail(course.thumbnailFile, courseId);
          if (uploadResponse.success && uploadResponse.data?.url) {
            thumbnailUrl = uploadResponse.data.url;
          } else {
            toast.error('Failed to upload thumbnail');
            return;
          }
        } catch (uploadError) {
          console.error('Thumbnail upload error:', uploadError);
          toast.error('Failed to upload thumbnail');
          return;
        }
      }

      const updateData = {
        title: course.title,
        description: course.description,
        price: course.price,
        duration: course.duration,
        isPublic: course.isPublic,
        categoryId: course.categoryId,
        level: course.level,
        tutorName: course.tutorName,
        requirements: course.requirements || [],
        prerequisites: course.prerequisites || [],
        thumbnail: thumbnailUrl
      };

      console.log('Saving course with data:', updateData);
      console.log('Requirements:', updateData.requirements);
      console.log('Prerequisites:', updateData.prerequisites);

      const response = await api.courses.update(courseId, updateData);

      if (response.success) {
        // Update course state with uploaded thumbnail URL and clear the file
        setCourse(prev => prev ? ({
          ...prev,
          thumbnail: thumbnailUrl,
          thumbnailFile: undefined
        }) : prev);
        toast.success('Course updated successfully!');
      } else {
        const errorMessage = response.error?.message || 'Failed to update course';
        if (response.error?.details) {
          const detailMessages = response.error.details.map((detail: any) => detail.msg).join(', ');
          toast.error(`${errorMessage}: ${detailMessages}`);
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error('Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!course || !confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await api.courses.delete(courseId);
      if (response.success) {
        toast.success('Course deleted successfully!');
        window.location.href = '/my-courses';
      } else {
        toast.error('Failed to delete course');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
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

  const handleAddModule = async () => {
    if (!newModule.title.trim() || !course) return;
    
    try {
      setCreatingModule(true);
      const moduleData = {
        title: newModule.title,
        description: newModule.description,
        orderIndex: course.modules.length,
        courseId: courseId
      };

      const response = await api.modules.create(moduleData);
      
      if (response.success && response.data?.module) {
        setCourse(prev => prev ? ({
          ...prev,
          modules: [...prev.modules, { ...response.data.module, materials: [] }]
        }) : prev);
        
        setNewModule({ title: '', description: '' });
        setShowModuleModal(false);
        toast.success('Module added successfully!');
      } else {
        toast.error('Failed to add module');
      }
    } catch (error) {
      console.error('Error adding module:', error);
      toast.error('Failed to add module');
    } finally {
      setCreatingModule(false);
    }
  };

  const handleAddMaterial = async () => {
    if (!newMaterial.title.trim() || !showMaterialModal || !course) return;
    
    try {
      setCreatingMaterial(true);
      const moduleId = showMaterialModal.moduleId;
      const targetModule = course.modules.find(m => m.id === moduleId);
      
      if (!targetModule) {
        toast.error('Module not found');
        return;
      }

      const materialData = {
        title: newMaterial.title,
        description: newMaterial.description,
        type: newMaterial.type,
        fileUrl: newMaterial.type === 'LINK' ? newMaterial.content : (newMaterial.fileUrl || undefined),
        content: newMaterial.type === 'LINK' ? undefined : (newMaterial.content || undefined),
        orderIndex: targetModule.materials.length,
        courseId: courseId,
        moduleId: moduleId
      };

      const response = await api.materials.create(materialData);
      
      if (response.success && response.data?.material) {
        setCourse(prev => prev ? ({
          ...prev,
          modules: prev.modules.map(module => 
            module.id === moduleId
              ? {
                  ...module,
                  materials: [...module.materials, response.data.material]
                }
              : module
          )
        }) : prev);
        
        setNewMaterial({ title: '', description: '', type: 'VIDEO', fileUrl: '', content: '' });
        setShowMaterialModal(null);
        toast.success('Material added successfully!');
      } else {
        toast.error('Failed to add material');
      }
    } catch (error) {
      console.error('Error adding material:', error);
      toast.error('Failed to add material');
    } finally {
      setCreatingMaterial(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module and all its materials? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingModuleId(moduleId);
      const response = await api.modules.delete(moduleId);
      
      if (response.success) {
        setCourse(prev => prev ? ({
          ...prev,
          modules: prev.modules.filter(m => m.id !== moduleId)
        }) : prev);
        toast.success('Module deleted successfully!');
      } else {
        toast.error('Failed to delete module');
      }
    } catch (error) {
      console.error('Error deleting module:', error);
      toast.error('Failed to delete module');
    } finally {
      setDeletingModuleId('');
    }
  };

  const handleDeleteMaterial = async (moduleId: string, materialId: string) => {
    if (!confirm('Are you sure you want to delete this material? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingMaterialId(materialId);
      const response = await api.materials.delete(materialId);
      
      if (response.success) {
        setCourse(prev => prev ? ({
          ...prev,
          modules: prev.modules.map(module => 
            module.id === moduleId
              ? {
                  ...module,
                  materials: module.materials.filter(m => m.id !== materialId)
                }
              : module
          )
        }) : prev);
        toast.success('Material deleted successfully!');
      } else {
        toast.error('Failed to delete material');
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Failed to delete material');
    } finally {
      setDeletingMaterialId('');
    }
  };

  const moveModule = (moduleId: string, direction: 'up' | 'down') => {
    setCourse(prev => {
      if (!prev) return prev;
      const modules = [...prev.modules];
      const index = modules.findIndex(m => m.id === moduleId);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= modules.length) return prev;
      
      [modules[index], modules[newIndex]] = [modules[newIndex], modules[index]];
      
      return { ...prev, modules };
    });
  };

  const moveMaterial = (moduleId: string, materialId: string, direction: 'up' | 'down') => {
    setCourse(prev => prev ? ({
      ...prev,
      modules: prev.modules.map(module => {
        if (module.id !== moduleId) return module;
        
        const materials = [...module.materials];
        const index = materials.findIndex(m => m.id === materialId);
        if (index === -1) return module;
        
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= materials.length) return module;
        
        [materials[index], materials[newIndex]] = [materials[newIndex], materials[index]];
        
        return { ...module, materials };
      })
    }) : prev);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="mb-4">
            <Link href="/my-courses" className="inline-flex items-center px-3 py-2 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors rounded-lg border border-slate-300 shadow-sm font-medium text-sm">
              <ChevronLeftIcon className="w-4 h-4 mr-2" />
              Back to My Courses
            </Link>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-2">
              Edit Course
            </h1>
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                <p className="text-slate-600 text-sm sm:text-base">Loading course data...</p>
              </div>
            ) : course ? (
              <p className="text-slate-600 text-sm sm:text-base">{course.title}</p>
            ) : (
              <p className="text-red-600 font-medium">Course not found</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1">
            <nav className="flex space-x-1">
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === 'details'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Course Details
              </button>
              <button
                onClick={() => setActiveTab('content')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === 'content'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Course Content
              </button>
            </nav>
          </div>
        </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : !course ? (
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Course Not Found</h3>
            <p className="text-gray-600 mb-6">The course you're looking for doesn't exist or you don't have permission to edit it.</p>
            <Link href="/my-courses">
              <Button>Back to My Courses</Button>
            </Link>
          </CardContent>
        </Card>
      ) : activeTab === 'details' ? (
        /* Course Details Tab */
        <Card className="bg-white shadow-sm border border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">
              Course Information
            </CardTitle>
            <CardDescription className="text-slate-600 text-sm mt-1">
              Update your course details and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Course Title
              </label>
              <Input
                value={course?.title || ''}
                onChange={(e) => setCourse(prev => prev ? ({ ...prev, title: e.target.value }) : prev)}
                placeholder="Enter course title"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Description
              </label>
              <Textarea
                value={course?.description || ''}
                onChange={(e) => setCourse(prev => prev ? ({ ...prev, description: e.target.value }) : prev)}
                rows={4}
                placeholder="Describe what students will learn"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Price (USD)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={course?.price || ''}
                  onChange={(e) => setCourse(prev => prev ? ({ ...prev, price: parseFloat(e.target.value) }) : prev)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Duration (hours)
                </label>
                <Input
                  type="number"
                  min="1"
                  value={course?.duration || ''}
                  onChange={(e) => setCourse(prev => prev ? ({ ...prev, duration: parseInt(e.target.value) }) : prev)}
                  placeholder="Duration in hours"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Tutor/Organization Name
              </label>
              <Input
                value={course?.tutorName || ''}
                onChange={(e) => setCourse(prev => prev ? ({ ...prev, tutorName: e.target.value }) : prev)}
                placeholder="e.g., CoderZone Academy"
              />
              <p className="text-xs text-slate-500 mt-1">
                This will be displayed as "Created by" on the course page
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirements
              </label>
              <div className="space-y-2">
                {(course?.requirements || []).map((req, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={req}
                      onChange={(e) => {
                        const newReqs = [...(course?.requirements || [])];
                        newReqs[index] = e.target.value;
                        setCourse(prev => prev ? ({ ...prev, requirements: newReqs }) : prev);
                      }}
                      placeholder="e.g., Basic computer skills"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newReqs = course?.requirements?.filter((_, i) => i !== index) || [];
                        setCourse(prev => prev ? ({ ...prev, requirements: newReqs }) : prev);
                      }}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newReqs = [...(course?.requirements || []), ''];
                    setCourse(prev => prev ? ({ ...prev, requirements: newReqs }) : prev);
                  }}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Requirement
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                What students need to have or know before taking this course
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prerequisites
              </label>
              <div className="space-y-2">
                {(course?.prerequisites || []).map((prereq, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={prereq}
                      onChange={(e) => {
                        const newPrereqs = [...(course?.prerequisites || [])];
                        newPrereqs[index] = e.target.value;
                        setCourse(prev => prev ? ({ ...prev, prerequisites: newPrereqs }) : prev);
                      }}
                      placeholder="e.g., Introduction to Programming course"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPrereqs = course?.prerequisites?.filter((_, i) => i !== index) || [];
                        setCourse(prev => prev ? ({ ...prev, prerequisites: newPrereqs }) : prev);
                      }}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPrereqs = [...(course?.prerequisites || []), ''];
                    setCourse(prev => prev ? ({ ...prev, prerequisites: newPrereqs }) : prev);
                  }}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Prerequisite
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Recommended courses or knowledge before taking this course
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Thumbnail
              </label>
              <div className="space-y-4">
                {course?.thumbnail ? (
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img
                        src={course.thumbnail.startsWith('blob:')
                          ? course.thumbnail
                          : getImageUrl(course.thumbnail) || course.thumbnail
                        }
                        alt="Course thumbnail"
                        className="w-32 h-20 object-cover rounded-lg border"
                        onError={(e) => {
                          console.error('Failed to load thumbnail:', course.thumbnail);
                          console.error('Generated URL:', getImageUrl(course.thumbnail));
                          console.error('Full URL being used:', course.thumbnail.startsWith('blob:') ? course.thumbnail : getImageUrl(course.thumbnail) || course.thumbnail);
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div
                        className="w-32 h-20 bg-gray-100 rounded-lg border flex items-center justify-center text-xs text-gray-500 text-center"
                        style={{ display: 'none' }}
                      >
                        Failed to load<br/>thumbnail
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Current thumbnail</p>
                      <p className="text-xs text-blue-600 mb-3">
                        Remove this thumbnail to upload a new one
                      </p>
                      <button
                        type="button"
                        onClick={async () => {
                          if (course?.thumbnail) {
                            try {
                              // If it's an uploaded file (starts with /uploads/), delete from server
                              if (course.thumbnail.startsWith('/uploads/')) {
                                const filename = course.thumbnail.split('/').pop();
                                if (filename) {
                                  await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/uploads/file/${filename}`, {
                                    method: 'DELETE',
                                    credentials: 'include'
                                  });
                                }
                              }
                              setCourse(prev => prev ? ({ ...prev, thumbnail: undefined, thumbnailFile: undefined }) : prev);
                              toast.success('Thumbnail removed successfully!');
                            } catch (error) {
                              console.error('Error removing thumbnail:', error);
                              setCourse(prev => prev ? ({ ...prev, thumbnail: undefined, thumbnailFile: undefined }) : prev);
                              toast.success('Thumbnail removed!');
                            }
                          }
                        }}
                        className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      >
                        🗑️ Remove thumbnail
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-gray-500 mb-4">
                      No thumbnail uploaded
                    </div>
                    <FileUpload
                      accept="image/*"
                      onFileSelect={(files) => {
                        if (files.length === 0) return;
                        const file = files[0];
                        const fileUrl = URL.createObjectURL(file);
                        setCourse(prev => prev ? ({ ...prev, thumbnail: fileUrl, thumbnailFile: file }) : prev);
                      }}
                    />
                    <p className="text-sm text-gray-500">
                      Upload an image to represent your course. Recommended size: 400x225px (16:9 ratio)
                    </p>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibility
              </label>
              <Select
                options={[
                  { value: 'false', label: 'Private (Hidden from students)' },
                  { value: 'true', label: 'Public (Visible to students)' }
                ]}
                value={course?.isPublic ? 'true' : 'false'}
                onChange={(value) => setCourse(prev => prev ? ({ ...prev, isPublic: value === 'true' }) : prev)}
              />
              <p className="text-sm text-gray-500 mt-1">
                Course must be both "Published" and "Public" to appear in the student course catalog
              </p>
            </div>
            
            <div className="flex justify-end space-x-6 pt-6 border-t border-indigo-200/50">
              <Button
                variant="outline"
                onClick={() => {
                  loadCourseData();
                  toast.success('Changes cancelled');
                }}
                disabled={loading || saving}
                className="px-6 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveCourse}
                disabled={saving || loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Course Content Tab */
        <div className="space-y-6">
          <Card className="bg-white shadow-sm border border-slate-200">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg font-semibold text-slate-900">
                    Course Content
                  </CardTitle>
                  <CardDescription className="text-slate-600 text-sm">
                    Organize your course into modules and add materials
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowModuleModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium w-full sm:w-auto flex-shrink-0"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Chapter
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {course?.modules && course.modules.length > 0 ? (
                <div className="space-y-4">
                  {course.modules.map((module, moduleIndex) => (
                    <Card key={module.id} className="bg-white border border-slate-200 shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-3">
                              <FolderIcon className="w-4 h-4 text-slate-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-base font-semibold text-slate-900 truncate">{module.title}</CardTitle>
                              {module.description && (
                                <CardDescription className="text-slate-600 text-sm mt-1 line-clamp-2">{module.description}</CardDescription>
                              )}
                            </div>
                          </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveModule(module.id, 'up')}
                            disabled={moduleIndex === 0}
                            className="rounded-none border-0 px-2 h-8"
                          >
                            <ArrowUpIcon className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveModule(module.id, 'down')}
                            disabled={moduleIndex === (course?.modules.length || 0) - 1}
                            className="rounded-none border-0 border-l border-slate-200 px-2 h-8"
                          >
                            <ArrowDownIcon className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowMaterialModal({ moduleId: module.id })}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs sm:text-sm"
                        >
                          <PlusIcon className="w-3 h-3 mr-1" />
                          <span className="hidden sm:inline">Add Material</span>
                          <span className="sm:hidden">Add</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteModule(module.id)}
                          disabled={deletingModuleId === module.id}
                          className="text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          {deletingModuleId === module.id ? (
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600"></div>
                          ) : (
                            <TrashIcon className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {module.materials.length > 0 ? (
                      <div className="space-y-2">
                        {module.materials.map((material, materialIndex) => {
                          const MaterialIcon = getMaterialIcon(material.type);
                          return (
                            <div key={material.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 gap-3 sm:gap-0">
                              <div className="flex items-center min-w-0 flex-1">
                                <MaterialIcon className="w-5 h-5 text-slate-500 mr-3 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-slate-900 truncate">{material.title}</p>
                                  <p className="text-sm text-slate-600 truncate">
                                    {material.type} {material.description && `• ${material.description}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 justify-end sm:justify-start">
                                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => moveMaterial(module.id, material.id, 'up')}
                                    disabled={materialIndex === 0}
                                    className="rounded-none border-0 px-2 h-7"
                                  >
                                    <ArrowUpIcon className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => moveMaterial(module.id, material.id, 'down')}
                                    disabled={materialIndex === module.materials.length - 1}
                                    className="rounded-none border-0 border-l border-slate-200 px-2 h-7"
                                  >
                                    <ArrowDownIcon className="w-3 h-3" />
                                  </Button>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteMaterial(module.id, material.id)}
                                  disabled={deletingMaterialId === material.id}
                                  className="text-red-600 hover:text-red-700 disabled:opacity-50"
                                >
                                  {deletingMaterialId === material.id ? (
                                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600"></div>
                                  ) : (
                                    <TrashIcon className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-600 text-center py-8">
                        No materials yet. Add your first material to get started.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <FolderIcon className="w-8 h-8 text-slate-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No modules yet</h3>
                  <p className="text-slate-600 mb-6 text-sm max-w-md mx-auto">
                    Organize your course content by creating modules and adding materials.
                  </p>
                  <Button
                    onClick={() => setShowModuleModal(true)}
                    className="w-full sm:w-auto"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Create Your First Chapter
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <Card className="w-full max-w-lg mx-auto my-8 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Add New Chapter</CardTitle>
              <CardDescription>Create a new chapter to organize your course content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chapter Title *
                </label>
                <Input
                  placeholder="Enter chapter title"
                  value={newModule.title}
                  onChange={(e) => setNewModule(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <Textarea
                  placeholder="Brief description of this chapter"
                  value={newModule.description}
                  onChange={(e) => setNewModule(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-4 sm:gap-0">
                <Button variant="outline" onClick={() => setShowModuleModal(false)} className="order-2 sm:order-1">
                  Cancel
                </Button>
                <Button onClick={handleAddModule} disabled={!newModule.title.trim() || creatingModule} className="order-1 sm:order-2">
                  {creatingModule ? 'Adding...' : 'Add Module'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Material Modal */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <Card className="w-full max-w-lg mx-auto my-8 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Add New Material</CardTitle>
              <CardDescription>Add a new material to this module</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Material Title *
                </label>
                <Input
                  placeholder="Enter material title"
                  value={newMaterial.title}
                  onChange={(e) => setNewMaterial(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Material Type *
                </label>
                <Select
                  options={materialTypes}
                  value={newMaterial.type}
                  onChange={(value) => setNewMaterial(prev => ({ ...prev, type: value as Material['type'] }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <Textarea
                  placeholder="Brief description of this material"
                  value={newMaterial.description}
                  onChange={(e) => setNewMaterial(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>
              {newMaterial.type === 'LINK' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL *
                  </label>
                  <Input
                    placeholder="https://example.com"
                    value={newMaterial.content}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload File
                  </label>
                  <FileUpload
                    accept={newMaterial.type === 'IMAGE' ? 'image/*' : newMaterial.type === 'VIDEO' ? 'video/*' : '*'}
                    onFileSelect={async (files) => {
                      if (files.length === 0) return;
                      try {
                        const response = await api.uploads.material(
                          files[0],
                          courseId as string,
                          undefined,
                          newMaterial.type
                        );
                        if (response.success) {
                          setNewMaterial(prev => ({
                            ...prev,
                            fileUrl: response.data.url
                          }));
                          alert('File uploaded successfully!');
                        }
                      } catch (error) {
                        console.error('Upload error:', error);
                        alert('Failed to upload file. Please try again.');
                      }
                    }}
                  />
                </div>
              )}
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-4 sm:gap-0">
                <Button variant="outline" onClick={() => setShowMaterialModal(null)} className="order-2 sm:order-1">
                  Cancel
                </Button>
                <Button onClick={handleAddMaterial} disabled={!newMaterial.title.trim() || creatingMaterial} className="order-1 sm:order-2">
                  {creatingMaterial ? 'Adding...' : 'Add Material'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    </div>
  );
}