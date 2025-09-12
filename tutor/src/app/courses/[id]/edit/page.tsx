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
        setCourse(response.data.course);
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
      const response = await api.courses.update(courseId, {
        title: course.title,
        description: course.description,
        price: course.price,
        duration: course.duration,
        status: course.status,
        categoryId: course.categoryId,
        level: course.level,
        tutorName: course.tutorName
      });
      
      if (response.success) {
        toast.success('Course updated successfully!');
      } else {
        toast.error('Failed to update course');
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
        fileUrl: newMaterial.fileUrl || undefined,
        content: newMaterial.content || undefined,
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link href="/my-courses" className="text-blue-600 hover:text-blue-700">
            <ChevronLeftIcon className="w-4 h-4 mr-2 inline" />
            Back to My Courses
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Course</h1>
        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : course ? (
          <p className="text-gray-600">{course.title}</p>
        ) : (
          <p className="text-red-600">Course not found</p>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Course Details
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'content'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
        <Card>
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
            <CardDescription>Update your course details and settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Title
              </label>
              <Input
                value={course?.title || ''}
                onChange={(e) => setCourse(prev => prev ? ({ ...prev, title: e.target.value }) : prev)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Textarea
                value={course?.description || ''}
                onChange={(e) => setCourse(prev => prev ? ({ ...prev, description: e.target.value }) : prev)}
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (USD)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={course?.price || 0}
                  onChange={(e) => setCourse(prev => prev ? ({ ...prev, price: parseFloat(e.target.value) }) : prev)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (hours)
                </label>
                <Input
                  type="number"
                  min="1"
                  value={course?.duration || 0}
                  onChange={(e) => setCourse(prev => prev ? ({ ...prev, duration: parseInt(e.target.value) }) : prev)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tutor/Organization Name
              </label>
              <Input
                value={course?.tutorName || ''}
                onChange={(e) => setCourse(prev => prev ? ({ ...prev, tutorName: e.target.value }) : prev)}
                placeholder="e.g., CoderZone Academy or Your Name"
              />
              <p className="text-sm text-gray-500 mt-1">
                This will be displayed as "Created by" on the course page
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Status
              </label>
              <Select
                options={[
                  { value: 'DRAFT', label: 'Draft' },
                  { value: 'PUBLISHED', label: 'Published' },
                  { value: 'ARCHIVED', label: 'Archived' }
                ]}
                value={course?.status || 'DRAFT'}
                onChange={(value) => setCourse(prev => prev ? ({ ...prev, status: value as Course['status'] }) : prev)}
              />
            </div>
            
            <div className="flex justify-end space-x-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  loadCourseData();
                  toast.success('Changes cancelled');
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveCourse}
                disabled={saving || loading}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Course Content Tab */
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Course Content</h2>
              <p className="text-gray-600">Organize your course into modules and add materials</p>
            </div>
            <Button onClick={() => setShowModuleModal(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Module
            </Button>
          </div>

          {course?.modules && course.modules.length > 0 ? (
            <div className="space-y-4">
              {course.modules.map((module, moduleIndex) => (
                <Card key={module.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FolderIcon className="w-5 h-5 text-blue-600 mr-2" />
                        <div>
                          <CardTitle className="text-lg">{module.title}</CardTitle>
                          {module.description && (
                            <CardDescription>{module.description}</CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveModule(module.id, 'up')}
                          disabled={moduleIndex === 0}
                        >
                          <ArrowUpIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveModule(module.id, 'down')}
                          disabled={moduleIndex === (course?.modules.length || 0) - 1}
                        >
                          <ArrowDownIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowMaterialModal({ moduleId: module.id })}
                        >
                          <PlusIcon className="w-4 h-4 mr-1" />
                          Add Material
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingModule(module)}
                        >
                          <PencilIcon className="w-4 h-4" />
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
                            <div key={material.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center">
                                <MaterialIcon className="w-5 h-5 text-gray-500 mr-3" />
                                <div>
                                  <p className="font-medium text-gray-900">{material.title}</p>
                                  <p className="text-sm text-gray-600">
                                    {material.type} {material.description && `• ${material.description}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => moveMaterial(module.id, material.id, 'up')}
                                  disabled={materialIndex === 0}
                                >
                                  <ArrowUpIcon className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => moveMaterial(module.id, material.id, 'down')}
                                  disabled={materialIndex === module.materials.length - 1}
                                >
                                  <ArrowDownIcon className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingMaterial({ moduleId: module.id, material })}
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </Button>
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
            <Card>
              <CardContent className="p-12 text-center">
                <FolderIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No modules yet</h3>
                <p className="text-gray-600 mb-6">
                  Organize your course content by creating modules and adding materials.
                </p>
                <Button onClick={() => setShowModuleModal(true)}>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Your First Module
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Add Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>Add New Module</CardTitle>
              <CardDescription>Create a new module to organize your course content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Module Title *
                </label>
                <Input
                  placeholder="Enter module title"
                  value={newModule.title}
                  onChange={(e) => setNewModule(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <Textarea
                  placeholder="Brief description of this module"
                  value={newModule.description}
                  onChange={(e) => setNewModule(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={() => setShowModuleModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddModule} disabled={!newModule.title.trim() || creatingModule}>
                  {creatingModule ? 'Adding...' : 'Add Module'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Material Modal */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
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
              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={() => setShowMaterialModal(null)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMaterial} disabled={!newMaterial.title.trim() || creatingMaterial}>
                  {creatingMaterial ? 'Adding...' : 'Add Material'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}