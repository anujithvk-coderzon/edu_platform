'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
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
  ArrowUpIcon,
  ArrowDownIcon,
  DocumentIcon,
  PlayIcon,
  PhotoIcon,
  LinkIcon,
  FolderIcon,
  FolderPlusIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  XMarkIcon,
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

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate?: string;
  maxScore: number;
  courseId: string;
  createdAt: string;
  _count?: {
    submissions: number;
  };
  ungradedSubmissions?: number;
}

interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  content: string;
  fileUrl?: string;
  grade?: number;
  score?: number; // Backend uses 'score' field
  feedback?: string;
  isGraded: boolean;
  status?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  gradedAt?: string;
  assignment?: {
    id: string;
    title: string;
    maxScore: number;
  };
}

interface ErrorDetail {
  path?: string;
  param?: string;
  msg: string;
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

interface CourseUpdateData {
  title: string;
  description: string;
  price: number;
  duration: number;
  isPublic: boolean;
  categoryId: string;
  level: string;
  requirements: string[];
  prerequisites: string[];
  tutorName?: string;
  thumbnail?: string;
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
  const searchParams = useSearchParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'content' | 'assignments'>('details');

  // Update tab based on URL parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'assignments') {
      setActiveTab('assignments');
    } else if (tabParam === 'content') {
      setActiveTab('content');
    } else {
      setActiveTab('details');
    }
  }, [searchParams]);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState<{moduleId: string} | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [deletingMaterialId, setDeletingMaterialId] = useState<string>('');
  const [deletingModuleId, setDeletingModuleId] = useState<string>('');
  const [creatingModule, setCreatingModule] = useState(false);
  const [creatingMaterial, setCreatingMaterial] = useState(false);
  const [creatingAssignment, setCreatingAssignment] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxScore: 100
  });

  useEffect(() => {
    loadCourseData();
    loadAssignments();
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

      const updateData: CourseUpdateData = {
        title: course.title,
        description: course.description,
        price: course.price,
        duration: course.duration,
        isPublic: course.isPublic,
        categoryId: course.categoryId,
        level: course.level,
        requirements: course.requirements || [],
        prerequisites: course.prerequisites || []
      };

      // Only include tutorName if it has a valid value
      if (course.tutorName && course.tutorName.trim()) {
        updateData.tutorName = course.tutorName;
      }

      // Only include thumbnail if it has a valid value
      if (thumbnailUrl && thumbnailUrl.trim()) {
        updateData.thumbnail = thumbnailUrl;
      }

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
          const detailMessages = response.error.details.map((detail: ErrorDetail) => detail.msg).join(', ');
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

      let fileUrl = newMaterial.fileUrl;

      // Upload file if one was selected (for non-LINK types)
      if (selectedFile && newMaterial.type !== 'LINK') {
        try {
          const uploadResponse = await api.uploads.material(
            selectedFile,
            courseId as string,
            undefined,
            newMaterial.type
          );
          if (uploadResponse.success) {
            fileUrl = uploadResponse.data.url;
          } else {
            toast.error('Failed to upload file');
            return;
          }
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error('Failed to upload file. Please try again.');
          return;
        }
      }

      const materialData = {
        title: newMaterial.title,
        description: newMaterial.description,
        type: newMaterial.type,
        fileUrl: newMaterial.type === 'LINK' ? newMaterial.content : fileUrl,
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
        setSelectedFile(null);
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

  // Assignment functions
  const loadAssignments = async () => {
    try {
      const response = await api.assignments.getByCourse(courseId);
      if (response.success) {
        setAssignments(response.data.assignments || []);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const handleAddAssignment = async () => {
    if (!newAssignment.title.trim() || !newAssignment.description.trim()) {
      toast.error('Title and description are required');
      return;
    }

    try {
      setCreatingAssignment(true);
      const response = await api.assignments.create({
        ...newAssignment,
        courseId,
        dueDate: newAssignment.dueDate || undefined
      });

      if (response.success) {
        setAssignments(prev => [response.data.assignment, ...prev]);
        setNewAssignment({
          title: '',
          description: '',
          dueDate: '',
          maxScore: 100
        });
        setShowAssignmentModal(false);
        toast.success('Assignment created successfully!');
      } else {
        toast.error('Failed to create assignment');
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Failed to create assignment');
    } finally {
      setCreatingAssignment(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      const response = await api.assignments.delete(assignmentId);
      if (response.success) {
        setAssignments(prev => prev.filter(a => a.id !== assignmentId));
        toast.success('Assignment deleted successfully!');
      } else {
        toast.error('Failed to delete assignment');
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to delete assignment');
    }
  };

  const handleViewSubmissions = async (assignmentId: string) => {
    try {
      setLoadingSubmissions(true);
      setSelectedAssignmentId(assignmentId);
      const response = await api.assignments.getSubmissions(assignmentId);
      if (response.success && response.data?.submissions) {
        setSubmissions(response.data.submissions);
        setShowSubmissionsModal(true);
      } else {
        toast.error('Failed to load submissions');
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleGradeSubmission = async (submissionId: string, grade: number, feedback?: string) => {
    try {
      const response = await api.assignments.gradeSubmission(submissionId, {
        score: grade,
        feedback
      });
      if (response.success) {
        // Update the local state immediately with the new grade
        setSubmissions(prev => prev.map(s =>
          s.id === submissionId
            ? {
                ...s,
                grade: grade,
                score: grade, // Backend uses 'score' field
                feedback: feedback || s.feedback,
                isGraded: true,
                status: 'GRADED'
              }
            : s
        ));
        toast.success('Submission graded successfully!');

        // Refetch submissions to ensure data consistency
        setTimeout(() => {
          if (selectedAssignmentId) {
            handleViewSubmissions(selectedAssignmentId);
          }
        }, 500);
      } else {
        toast.error(response.error?.message || 'Failed to grade submission');
      }
    } catch (error) {
      console.error('Error grading submission:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to grade submission');
    }
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
              <button
                onClick={() => {
                  setActiveTab('assignments');
                  if (assignments.length === 0) {
                    loadAssignments();
                  }
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === 'assignments'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Assignments
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
            <p className="text-gray-600 mb-6">The course you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to edit it.</p>
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
                This will be displayed as &quot;Created by&quot; on the course page
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
                        src={course.thumbnail?.startsWith('blob:')
                          ? course.thumbnail
                          : getImageUrl(course.thumbnail || '') || course.thumbnail || ''
                        }
                        alt="Course thumbnail"
                        className="w-32 h-20 object-cover rounded-lg border"
                        onError={(e) => {
                          console.error('Failed to load thumbnail:', course.thumbnail);
                          console.error('Generated URL:', getImageUrl(course.thumbnail || ''));
                          console.error('Full URL being used:', course.thumbnail?.startsWith('blob:') ? course.thumbnail : getImageUrl(course.thumbnail || '') || course.thumbnail);
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
                              if (course.thumbnail?.startsWith('/uploads/')) {
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
                Course must be both &quot;Published&quot; and &quot;Public&quot; to appear in the student course catalog
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
      ) : activeTab === 'content' ? (
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
      ) : activeTab === 'assignments' ? (
        /* Assignments Tab */
        <div className="space-y-6">
          <Card className="bg-white shadow-sm border border-slate-200">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg font-semibold text-slate-900">
                    Assignments
                  </CardTitle>
                  <CardDescription className="text-slate-600 text-sm">
                    Create and manage assignments for your students
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowAssignmentModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium w-full sm:w-auto flex-shrink-0"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Assignment
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {loadingAssignments ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : assignments.length > 0 ? (
                <div className="space-y-4">
                  {assignments.map((assignment) => {
                    const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
                    const submissionCount = assignment._count?.submissions || 0;
                    const ungradedCount = assignment.ungradedSubmissions || 0;

                    return (
                      <Card key={assignment.id} className={`border transition-all duration-200 hover:shadow-lg ${
                        isOverdue
                          ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'
                          : 'bg-white border-slate-200 hover:border-blue-200'
                      }`}>
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <div className={`p-2 rounded-lg ${isOverdue ? 'bg-red-100' : 'bg-blue-100'}`}>
                                  <ClipboardDocumentListIcon className={`h-5 w-5 ${isOverdue ? 'text-red-600' : 'text-blue-600'}`} />
                                </div>
                                <h3 className="font-bold text-lg text-slate-900">{assignment.title}</h3>
                                {isOverdue && (
                                  <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium border border-red-200">
                                    ⏰ Overdue
                                  </span>
                                )}
                              </div>

                              <p className="text-slate-600 text-sm mb-4 line-clamp-3 leading-relaxed whitespace-pre-line">
                                {assignment.description}
                              </p>

                              <div className="flex flex-wrap items-center gap-3">
                                {assignment.dueDate && (
                                  <div className={`flex items-center px-3 py-1 rounded-lg text-xs font-medium ${
                                    isOverdue
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    <CalendarIcon className="h-3 w-3 mr-1" />
                                    <span>
                                      {isOverdue ? 'Was due' : 'Due'}: {new Date(assignment.dueDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}

                                <div className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                                  <span>🎯 Max: {assignment.maxScore} pts</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <div className={`flex items-center px-3 py-1 rounded-lg text-xs font-medium ${
                                    submissionCount > 0
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    <span>
                                      📄 {submissionCount} total
                                    </span>
                                  </div>
                                  {ungradedCount > 0 && (
                                    <div className="flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-orange-100 text-orange-700 border border-orange-300">
                                      <span>
                                        ⚠️ {ungradedCount} ungraded
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs">
                                  <span>Created: {new Date(assignment.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewSubmissions(assignment.id)}
                                className={ungradedCount > 0
                                  ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-300 font-medium"
                                  : "text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 font-medium"}
                              >
                                <DocumentIcon className={`h-4 w-4 mr-2 ${ungradedCount > 0 ? 'text-orange-600' : ''}`} />
                                Review Submissions
                                {ungradedCount > 0 ? (
                                  <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                    {ungradedCount} new
                                  </span>
                                ) : submissionCount > 0 ? (
                                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                                    ✓ All graded
                                  </span>
                                ) : null}
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete "${assignment.title}"? This will also delete all ${submissionCount} submissions and their files. This action cannot be undone.`)) {
                                    handleDeleteAssignment(assignment.id);
                                  }
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 font-medium"
                              >
                                <TrashIcon className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DocumentIcon className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No assignments yet</h3>
                  <p className="text-slate-600 mb-6">Create your first assignment to get started.</p>
                  <Button
                    onClick={() => setShowAssignmentModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Create First Assignment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Add Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <Card className="w-full max-w-lg mx-auto my-8 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
                  <FolderPlusIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-900">Add New Chapter</CardTitle>
                  <CardDescription className="text-slate-600">Create a new chapter to organize your course content</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
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
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() => setShowModuleModal(false)}
                  className="order-2 sm:order-1 px-6 py-2.5 font-medium hover:bg-slate-50 border-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddModule}
                  disabled={!newModule.title.trim() || creatingModule}
                  className="order-1 sm:order-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingModule ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    'Add Chapter'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Material Modal */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <Card className="w-full max-w-lg mx-auto my-8 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
                  <DocumentIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-900">Add New Material</CardTitle>
                  <CardDescription className="text-slate-600">Add a new material to this module</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
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
                    maxSize={newMaterial.type === 'VIDEO' ? 30 * 1024 * 1024 : 10 * 1024 * 1024}
                    onFileSelect={(files) => {
                      if (files.length === 0) {
                        setSelectedFile(null);
                        return;
                      }
                      setSelectedFile(files[0]);
                    }}
                  />
                </div>
              )}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() => setShowMaterialModal(null)}
                  className="order-2 sm:order-1 px-6 py-2.5 font-medium hover:bg-slate-50 border-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddMaterial}
                  disabled={
                    !newMaterial.title.trim() ||
                    creatingMaterial ||
                    (newMaterial.type !== 'LINK' && !selectedFile && !newMaterial.fileUrl)
                  }
                  className="order-1 sm:order-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingMaterial ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    'Add Material'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assignment Creation Modal - Fully Responsive */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <Card className="w-full max-w-4xl bg-white shadow-2xl border border-slate-200 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 sticky top-0 z-10 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  <div className="p-2 sm:p-2.5 bg-blue-600 rounded-lg shadow-sm flex-shrink-0">
                    <ClipboardDocumentListIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg sm:text-xl font-semibold text-slate-900 truncate">
                      Create New Assignment
                    </CardTitle>
                    <CardDescription className="text-slate-600 text-xs sm:text-sm mt-0.5 hidden sm:block">
                      Set up a new assignment for your students
                    </CardDescription>
                  </div>
                </div>
                <button
                  onClick={() => setShowAssignmentModal(false)}
                  className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0 ml-2"
                >
                  <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              {/* Assignment Details Section */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                  <div className="h-0.5 w-6 sm:w-8 bg-blue-600 rounded-full"></div>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900">Assignment Information</h3>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:gap-5">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                      Assignment Title <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="e.g., Final Project - Web Application Development"
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                      className="border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm sm:text-base"
                    />
                    <p className="text-xs text-slate-500 mt-1">Choose a clear, descriptive title</p>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                      Assignment Instructions <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      placeholder="Describe the assignment objectives, requirements, and evaluation criteria..."
                      value={newAssignment.description}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm sm:text-base resize-none"
                    />
                    <p className="text-xs text-slate-500 mt-1">Provide clear instructions and expectations</p>
                  </div>
                </div>
              </div>

              {/* Configuration Section */}
              <div className="space-y-3 sm:space-y-4 border-t border-slate-200 pt-4 sm:pt-5">
                <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                  <div className="h-0.5 w-6 sm:w-8 bg-blue-600 rounded-full"></div>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900">Settings</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                      Due Date
                    </label>
                    <Input
                      type="datetime-local"
                      value={newAssignment.dueDate}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm sm:text-base"
                    />
                    <p className="text-xs text-slate-500 mt-1">Optional deadline for submission</p>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                      Maximum Score
                    </label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        min="1"
                        max="1000"
                        step="1"
                        placeholder="100"
                        value={newAssignment.maxScore}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, maxScore: parseInt(e.target.value) || 100 }))}
                        className="border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm sm:text-base"
                      />
                      <span className="text-xs sm:text-sm text-slate-600 whitespace-nowrap">points</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Total available points</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Fully Responsive */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-5 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAssignmentModal(false);
                    setNewAssignment({
                      title: '',
                      description: '',
                      dueDate: '',
                      maxScore: 100
                    });
                  }}
                  className="order-2 sm:order-1 w-full sm:w-auto border-slate-300 text-slate-700 hover:bg-slate-50 text-sm px-4 py-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddAssignment}
                  disabled={!newAssignment.title.trim() || !newAssignment.description.trim() || creatingAssignment}
                  className="order-1 sm:order-2 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white transition-colors text-sm px-4 py-2"
                >
                  {creatingAssignment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span className="hidden sm:inline">Creating...</span>
                      <span className="sm:hidden">Creating</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Create Assignment</span>
                      <span className="sm:hidden">Create</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assignment Submissions Modal - Mobile Optimized */}
      {showSubmissionsModal && selectedAssignmentId && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center p-1 sm:p-4 z-50">
          <Card className="w-full max-w-7xl bg-white shadow-2xl border border-slate-200 max-h-[99vh] sm:max-h-[95vh] overflow-hidden mx-1 sm:mx-4">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 p-2 sm:p-4 lg:p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  <div className="p-1.5 sm:p-2.5 bg-blue-600 rounded-lg shadow-sm flex-shrink-0">
                    <DocumentIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-xl font-semibold text-slate-900 truncate">
                      Submissions
                    </CardTitle>
                    <CardDescription className="text-slate-600 text-xs sm:text-sm mt-0.5 hidden sm:block">
                      Review and grade student submissions
                    </CardDescription>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowSubmissionsModal(false);
                    setSelectedAssignmentId(null);
                    setSubmissions([]);
                  }}
                  className="p-1 sm:p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0 ml-1 sm:ml-2"
                >
                  <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[85vh] sm:max-h-[70vh] p-2 sm:p-4 lg:p-6">
              {loadingSubmissions ? (
                <div className="flex items-center justify-center py-8 sm:py-12">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 sm:border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 sm:ml-3 text-slate-600 font-medium text-sm sm:text-base">Loading submissions...</span>
                </div>
              ) : submissions.length > 0 ? (
                <div className="space-y-2 sm:space-y-4">
                  {submissions.map((submission: Submission) => {
                    const currentGrade = submission.score ?? submission.grade;
                    const isGraded = currentGrade !== null && currentGrade !== undefined;
                    const gradePercentage = isGraded && submission.assignment?.maxScore
                      ? Math.round((currentGrade! / submission.assignment.maxScore) * 100)
                      : 0;

                    return (
                      <Card key={submission.id} className={`border transition-all duration-200 ${
                        isGraded
                          ? 'bg-green-50/30 border-green-200'
                          : 'bg-white border-slate-200 hover:border-blue-300'
                      } shadow-sm hover:shadow-md`}>
                        <CardContent className="p-2 sm:p-4 lg:p-5">
                          {/* Student Info Header - Mobile Optimized */}
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4 mb-2 sm:mb-4">
                            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                              <div className={`w-6 h-6 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                isGraded ? 'bg-green-100' : 'bg-slate-100'
                              }`}>
                                <span className={`text-xs sm:text-base font-semibold ${isGraded ? 'text-green-600' : 'text-slate-600'}`}>
                                  {submission.student?.firstName?.charAt(0)}{submission.student?.lastName?.charAt(0)}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-xs sm:text-base text-slate-900 leading-tight">
                                  {submission.student ? `${submission.student.firstName} ${submission.student.lastName}` : 'Unknown Student'}
                                </h4>
                                <div className="flex flex-col text-xs text-slate-500 mt-0.5">
                                  <span className="truncate">{submission.student?.email}</span>
                                  <span>{new Date(submission.submittedAt).toLocaleDateString()} {new Date(submission.submittedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right sm:text-right w-full sm:w-auto">
                              {isGraded ? (
                                <div className="space-y-1">
                                  <div className="text-base sm:text-lg font-bold text-green-600">
                                    {currentGrade}/{submission.assignment?.maxScore} ({gradePercentage}%)
                                  </div>
                                  <div className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full inline-block">
                                    ✓ Graded
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center sm:text-right">
                                  <div className="text-xs sm:text-sm text-slate-500 mb-1">Pending Review</div>
                                  <div className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full inline-block">
                                    ⏳ Not graded
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Submission Summary - Mobile Optimized */}
                          <div className="mb-2 sm:mb-4 p-2 sm:p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border border-slate-200">
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                              <span className="font-medium text-slate-700 text-xs sm:text-sm">Includes:</span>
                              {submission.fileUrl && submission.fileUrl.trim() !== '' && (
                                <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                  📎 File
                                </span>
                              )}
                              {submission.content && submission.content.trim() !== '' && (
                                <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                                  ✍️ Text
                                </span>
                              )}
                              {(!submission.fileUrl || submission.fileUrl.trim() === '') && (!submission.content || submission.content.trim() === '') && (
                                <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                  ⚠️ Empty
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Submission Content - Mobile Optimized */}
                          <div className="space-y-2 sm:space-y-4">
                            {/* File Submission */}
                            {submission.fileUrl && submission.fileUrl.trim() !== '' && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-4">
                                <div className="flex items-center justify-between mb-2 sm:mb-3">
                                  <h5 className="font-semibold text-blue-900 text-sm sm:text-lg flex items-center">
                                    📎 <span className="hidden sm:inline ml-1">Submitted Document</span><span className="sm:hidden ml-1">File</span>
                                  </h5>
                                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full font-medium">
                                    {(() => {
                                      const extension = submission.fileUrl.split('.').pop()?.toUpperCase();
                                      return extension || 'FILE';
                                    })()}
                                  </span>
                                </div>

                                <div className="bg-white border border-blue-200 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3">
                                  <div className="flex items-start space-x-2 sm:space-x-3">
                                    <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                                      <DocumentIcon className="h-3 w-3 sm:h-5 sm:w-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs sm:text-sm font-medium text-slate-900 break-words leading-tight">
                                        {(() => {
                                          const filename = submission.fileUrl.split('/').pop() || 'Submitted File';
                                          // Remove timestamp prefix if present (format: timestamp-filename)
                                          const cleanName = filename.includes('-')
                                            ? filename.split('-').slice(1).join('-')
                                            : filename;
                                          return cleanName || filename;
                                        })()}
                                      </p>
                                      <p className="text-xs text-slate-500 mt-0.5">
                                        {new Date(submission.submittedAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex">
                                  <a
                                    href={(() => {
                                      const fullUrl = getImageUrl(submission.fileUrl) || submission.fileUrl;
                                      console.log('Opening document with URL:', fullUrl);
                                      return fullUrl;
                                    })()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium text-center flex items-center justify-center space-x-1 sm:space-x-2"
                                  >
                                    <span>👁️</span>
                                    <span className="hidden sm:inline">Open Document</span>
                                    <span className="sm:hidden">Open</span>
                                  </a>
                                </div>
                              </div>
                            )}

                            {/* Text Submission */}
                            {submission.content && submission.content.trim() !== '' && (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 sm:p-4">
                                <div className="flex items-center justify-between mb-2 sm:mb-3">
                                  <h5 className="font-semibold text-amber-900 text-sm sm:text-lg flex items-center">
                                    ✍️ <span className="hidden sm:inline ml-1">Student&apos;s Written Response</span><span className="sm:hidden ml-1">Text</span>
                                  </h5>
                                  <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full font-medium">
                                    {submission.content.length} chars
                                  </span>
                                </div>
                                <div className="bg-white p-2 sm:p-4 rounded-lg border border-amber-200 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap max-h-48 sm:max-h-96 overflow-y-auto">
                                  {submission.content}
                                </div>
                              </div>
                            )}

                            {/* Existing Feedback */}
                            {submission.feedback && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h5 className="font-medium text-blue-900 mb-2">💬 Current Feedback</h5>
                                <p className="text-sm text-blue-800 italic">
                                  {submission.feedback}
                                </p>
                              </div>
                            )}

                            {/* Grading Section - Mobile Optimized */}
                            <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-2 sm:p-4">
                              <h5 className="font-medium text-slate-900 mb-2 sm:mb-4 text-sm sm:text-base">🎯 <span className="hidden sm:inline">Grade This Submission</span><span className="sm:hidden">Grade</span></h5>
                              <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-4 sm:gap-4">
                                <div className="sm:md:col-span-1">
                                  <label className="block text-xs font-medium text-slate-700 mb-1">Score</label>
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      min="0"
                                      max={submission.assignment?.maxScore}
                                      placeholder="0"
                                      value={currentGrade || ''}
                                      onChange={(e) => {
                                        const newGrade = parseInt(e.target.value) || 0;
                                        setSubmissions(prev => prev.map(s =>
                                          s.id === submission.id ? { ...s, grade: newGrade, score: newGrade } : s
                                        ));
                                      }}
                                      className="text-center font-bold text-base sm:text-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                    <div className="text-center text-xs text-slate-500 mt-1">
                                      out of {submission.assignment?.maxScore}
                                    </div>
                                  </div>
                                </div>
                                <div className="sm:md:col-span-2">
                                  <label className="block text-xs font-medium text-slate-700 mb-1">Feedback <span className="text-slate-500">(Optional)</span></label>
                                  <textarea
                                    placeholder="Provide feedback to help the student improve..."
                                    value={submission.feedback || ''}
                                    onChange={(e) => {
                                      const newFeedback = e.target.value;
                                      setSubmissions(prev => prev.map(s =>
                                        s.id === submission.id ? { ...s, feedback: newFeedback } : s
                                      ));
                                    }}
                                    rows={2}
                                    className="w-full px-2 py-1.5 sm:px-3 sm:py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 text-xs sm:text-sm resize-none"
                                  />
                                </div>
                                <div className="sm:md:col-span-1 flex items-end">
                                  <Button
                                    onClick={() => currentGrade !== undefined && handleGradeSubmission(submission.id, currentGrade, submission.feedback)}
                                    disabled={currentGrade === null || currentGrade === undefined}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium transition-colors text-xs sm:text-sm py-2"
                                  >
                                    <span className="hidden sm:inline">{isGraded ? '🔄 Update Grade' : '✅ Submit Grade'}</span>
                                    <span className="sm:hidden">{isGraded ? 'Update' : 'Grade'}</span>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <DocumentIcon className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-slate-900 mb-2">No submissions yet</h3>
                  <p className="text-sm sm:text-base text-slate-600 px-4">Students haven&apos;t submitted any work for this assignment yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    </div>
  );
}