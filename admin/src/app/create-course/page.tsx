'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import type { SelectOption } from '../../components/ui/Select';
import { FileUpload } from '../../components/ui/FileUpload';
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  CheckCircleIcon,
  BookOpenIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  AcademicCapIcon,
  ClockIcon,
  TagIcon,
  StarIcon,
  UserGroupIcon,
  PlayIcon,
  DocumentTextIcon,
  PlusIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  VideoCameraIcon,
  DocumentArrowDownIcon,
  MusicalNoteIcon
} from '@heroicons/react/24/outline';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface Material {
  id: string;
  title: string;
  type: 'video' | 'audio' | 'pdf' | 'document' | 'link';
  file?: File;
  url?: string;
  duration?: string;
  description?: string;
}

interface Chapter {
  id: string;
  title: string;
  description: string;
  materials: Material[];
}

interface CourseFormData {
  title: string;
  description: string;
  level: string;
  price: string;
  duration: string;
  tutorId: string;
  thumbnail: File | null;
  requirements: string[];
  prerequisites: string[];
  tags: string[];
  chapters: Chapter[];
}


const initialFormData: CourseFormData = {
  title: '',
  description: '',
  level: '',
  price: '',
  duration: '',
  tutorId: '',
  thumbnail: null,
  requirements: [''],
  prerequisites: [''],
  tags: [],
  chapters: []
};

const levelOptions: SelectOption[] = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' }
];

const materialTypes = [
  { value: 'video', label: 'Video Lecture', icon: VideoCameraIcon },
  { value: 'audio', label: 'Audio File', icon: MusicalNoteIcon },
  { value: 'pdf', label: 'PDF Document', icon: DocumentArrowDownIcon },
  { value: 'document', label: 'Text Document', icon: DocumentTextIcon },
  { value: 'link', label: 'External Link', icon: BookOpenIcon }
];

export default function CreateCoursePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CourseFormData>(initialFormData);
  const [errors, setErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tutors, setTutors] = useState<SelectOption[]>([]);
  const [submissionProgress, setSubmissionProgress] = useState<string>('');
  const router = useRouter();
  const { user } = useAuth();


  const steps = [
    { number: 1, title: 'Basic Information', description: 'Course title and description' },
    { number: 2, title: 'Course Details', description: 'Pricing, level, and requirements' },
    { number: 3, title: 'Course Content', description: 'Chapters and materials like Udemy/Coursera' },
    { number: 4, title: 'Review & Publish', description: 'Final review and publish your course' }
  ];

  // Auto-assign tutor ID for logged-in Tutors, fetch tutors list for Admins
  useEffect(() => {
    // If user is a Tutor, auto-assign their ID
    if (user?.role?.toLowerCase() === 'tutor' && user.id) {
      setFormData(prev => ({ ...prev, tutorId: user.id }));
    }

    // Only fetch tutors list if user is Admin (for tutor selection)
    if (user?.role?.toLowerCase() === 'admin') {
      const fetchTutors = async () => {
        try {
          const response = await api.tutors.getAll();
          if (response.success) {
            const tutorOptions = response.data.tutors.map((tutor: any) => ({
              value: tutor.id,
              label: `${tutor.firstName} ${tutor.lastName} (${tutor.email})`
            }));
            setTutors(tutorOptions);
          }
        } catch (error) {
          console.error('Error fetching tutors:', error);
        }
      };

      fetchTutors();
    }
  }, [user]);


  const handleInputChange = (field: keyof CourseFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: null }));
    }
  };

  const handleArrayChange = (field: 'requirements' | 'prerequisites', index: number, value: string) => {
    const updatedArray = [...formData[field]];
    updatedArray[index] = value;
    handleInputChange(field, updatedArray);
  };

  const addArrayItem = (field: 'requirements' | 'prerequisites') => {
    const updatedArray = [...formData[field], ''];
    handleInputChange(field, updatedArray);
  };

  const removeArrayItem = (field: 'requirements' | 'prerequisites', index: number) => {
    const updatedArray = formData[field].filter((_, i) => i !== index);
    handleInputChange(field, updatedArray);
  };

  // Chapter Management Functions
  const addChapter = () => {
    const newChapter: Chapter = {
      id: `chapter-${Date.now()}`,
      title: '',
      description: '',
      materials: []
    };
    handleInputChange('chapters', [...formData.chapters, newChapter]);
  };

  const updateChapter = (chapterId: string, field: keyof Chapter, value: any) => {
    const updatedChapters = formData.chapters.map(chapter =>
      chapter.id === chapterId ? { ...chapter, [field]: value } : chapter
    );
    handleInputChange('chapters', updatedChapters);
  };

  const removeChapter = (chapterId: string) => {
    const updatedChapters = formData.chapters.filter(chapter => chapter.id !== chapterId);
    handleInputChange('chapters', updatedChapters);
  };

  const moveChapter = (chapterId: string, direction: 'up' | 'down') => {
    const chapters = [...formData.chapters];
    const index = chapters.findIndex(c => c.id === chapterId);
    if (direction === 'up' && index > 0) {
      [chapters[index], chapters[index - 1]] = [chapters[index - 1], chapters[index]];
    } else if (direction === 'down' && index < chapters.length - 1) {
      [chapters[index], chapters[index + 1]] = [chapters[index + 1], chapters[index]];
    }
    handleInputChange('chapters', chapters);
  };

  // Material Management Functions
  const addMaterial = (chapterId: string) => {
    const newMaterial: Material = {
      id: `material-${Date.now()}`,
      title: '',
      type: 'video',
      description: ''
    };
    
    const updatedChapters = formData.chapters.map(chapter =>
      chapter.id === chapterId
        ? { ...chapter, materials: [...chapter.materials, newMaterial] }
        : chapter
    );
    handleInputChange('chapters', updatedChapters);
  };

  const updateMaterial = (chapterId: string, materialId: string, field: keyof Material, value: any) => {
    const updatedChapters = formData.chapters.map(chapter =>
      chapter.id === chapterId
        ? {
            ...chapter,
            materials: chapter.materials.map(material =>
              material.id === materialId ? { ...material, [field]: value } : material
            )
          }
        : chapter
    );
    handleInputChange('chapters', updatedChapters);
  };

  const removeMaterial = (chapterId: string, materialId: string) => {
    const updatedChapters = formData.chapters.map(chapter =>
      chapter.id === chapterId
        ? {
            ...chapter,
            materials: chapter.materials.filter(material => material.id !== materialId)
          }
        : chapter
    );
    handleInputChange('chapters', updatedChapters);
  };

  const handleMaterialFileUpload = (chapterId: string, materialId: string, files: File[]) => {
    if (files.length > 0) {
      updateMaterial(chapterId, materialId, 'file', files[0]);
    }
  };

  const validateStep = (step: number) => {
    const newErrors: any = {};

    switch (step) {
      case 1:
        
        if (!formData.title || !formData.title.trim()) {
          console.log('VALIDATION ERROR: Title is empty');
          newErrors.title = 'Course title is required';
        } else if (formData.title.trim().length > 200) {
          console.log('VALIDATION ERROR: Title too long');
          newErrors.title = 'Course title must be less than 200 characters';
        } else {
          console.log('Title validation passed:', formData.title);
        }
        
        if (!formData.description || !formData.description.trim()) {
          console.log('VALIDATION ERROR: Description is empty');
          newErrors.description = 'Course description is required';
        } else if (formData.description.trim().length < 10) {
          console.log('VALIDATION ERROR: Description too short');
          newErrors.description = 'Course description must be at least 10 characters';
        } else {
          console.log('Description validation passed:', formData.description);
        }

        // Only validate tutor selection for Admin users (Tutors have auto-assigned tutorId)
        if (user?.role?.toLowerCase() === 'admin') {
          if (!formData.tutorId || !formData.tutorId.trim()) {
            console.log('VALIDATION ERROR: Tutor is not selected');
            newErrors.tutorId = 'Please select a tutor for this course';
          } else {
            console.log('Tutor validation passed:', formData.tutorId);
          }
        } else {
          // For Tutor users, tutorId should be auto-assigned
          console.log('Tutor validation skipped (auto-assigned):', formData.tutorId);
        }

        console.log('Step 1 validation complete');
        break;
      case 2:
        // Level is optional on backend, so don't require it
        // if (!formData.level) newErrors.level = 'Please select a difficulty level';
        if (formData.price) {
          const priceValue = parseFloat(formData.price);
          if (isNaN(priceValue)) {
            newErrors.price = 'Please enter a valid price';
          } else if (priceValue < 0) {
            newErrors.price = 'Price cannot be negative';
          } else if (priceValue > 999999) {
            newErrors.price = 'Price cannot exceed $999,999';
          }
        }
        break;
      case 3:
        if (formData.chapters.length === 0) {
          newErrors.chapters = 'Please add at least one chapter';
        } else {
          formData.chapters.forEach((chapter, chapterIndex) => {
            if (!chapter.title.trim()) {
              newErrors[`chapter-${chapter.id}-title`] = 'Chapter title is required';
            }
            if (chapter.materials.length === 0) {
              newErrors[`chapter-${chapter.id}-materials`] = 'Each chapter must have at least one material';
            } else {
              chapter.materials.forEach((material, materialIndex) => {
                if (!material.title.trim()) {
                  newErrors[`material-${material.id}-title`] = 'Material title is required';
                }
                if (material.type === 'link' && !material.url) {
                  newErrors[`material-${material.id}-url`] = 'URL is required for link materials';
                }
                if (['video', 'audio', 'pdf', 'document'].includes(material.type) && !material.file) {
                  newErrors[`material-${material.id}-file`] = 'File is required for this material type';
                }
              });
            }
          });
        }
        break;
    }

    console.log(`Step ${step} validation errors:`, newErrors);
    console.log(`Step ${step} validation result:`, Object.keys(newErrors).length === 0);
    
    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  const nextStep = () => {
    try {
      const validation = validateStep(currentStep);
      
      if (validation.isValid) {
        setCurrentStep(prev => Math.min(prev + 1, steps.length));
      } else {
        // Show specific validation errors as toast messages
        const errorMessages = Object.values(validation.errors).filter(Boolean);
        if (errorMessages.length > 0) {
          errorMessages.forEach((message: any) => {
            toast.error(message);
          });
        } else {
          toast.error('Please fill in all required fields correctly');
        }
      }
    } catch (error) {
      console.error('Error in nextStep function:', error);
      toast.error('An error occurred while validating the form');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    const validation = validateStep(currentStep);
    if (!validation.isValid) {
      // Show specific validation errors
      const errorMessages = Object.values(validation.errors).filter(Boolean);
      if (errorMessages.length > 0) {
        errorMessages.forEach((message: any) => {
          toast.error(message);
        });
      }
      return;
    }

    setIsSubmitting(true);
    setSubmissionProgress('Creating course...');
    try {
      // Create the basic course first
      const courseData: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: formData.price ? parseFloat(formData.price) : 0,
        tutorId: formData.tutorId,
        status: 'PUBLISHED',
        isPublic: true,
        requirements: formData.requirements.filter(req => req.trim() !== ''),
        prerequisites: formData.prerequisites.filter(prereq => prereq.trim() !== ''),
      };

      // Only add duration if it's a valid number
      if (formData.duration && formData.duration.trim() && !isNaN(parseInt(formData.duration))) {
        courseData.duration = parseInt(formData.duration);
      }

      // Only add level if it's a valid value
      const validLevels = ['Beginner', 'Intermediate', 'Advanced'];
      if (formData.level && formData.level.trim() && validLevels.includes(formData.level.trim())) {
        courseData.level = formData.level.trim();
      }


      // Log the data being sent for debugging
      console.log('Course data before sending:', courseData);
      console.log('FormData state:', {
        title: `"${formData.title}" (length: ${formData.title.length})`,
        description: `"${formData.description}" (length: ${formData.description.length})`,
        level: `"${formData.level}" (type: ${typeof formData.level}, length: ${formData.level?.length || 0})`,
        price: formData.price,
        duration: formData.duration
      });

      console.log('Level value details:', {
        raw: formData.level,
        trimmed: formData.level?.trim(),
        isEmpty: !formData.level || !formData.level.trim(),
        isValidOption: ['Beginner', 'Intermediate', 'Advanced'].includes(formData.level?.trim())
      });

      console.log('Sending course data:', courseData);
      const response = await api.courses.create(courseData);
      console.log('Course creation response:', response);
      
      if (response.success && response.data?.course?.id) {
        const courseId = response.data.course.id;
        console.log('Course created successfully with ID:', courseId);
        console.log('CourseId type:', typeof courseId);

        // Upload thumbnail if provided
        if (formData.thumbnail) {
          setSubmissionProgress('Uploading course thumbnail...');
          const thumbnailResponse = await api.uploads.courseThumbnail(formData.thumbnail, courseId);
          if (thumbnailResponse.success && thumbnailResponse.data?.url) {
            // Update the course with the thumbnail URL - only include valid thumbnail URL
            const thumbnailUrl = thumbnailResponse.data.url;
            if (thumbnailUrl && thumbnailUrl.trim().length > 0) {
              await api.courses.update(courseId, {
                thumbnail: thumbnailUrl.trim()
              });
            }
          }
        }

        // Create chapters and modules - optimized with parallel processing
        setSubmissionProgress(`Creating ${formData.chapters.length} modules with materials...`);
        console.log(`Starting to create ${formData.chapters.length} modules with materials...`);

        const modulePromises = formData.chapters.map(async (chapter, chapterIndex) => {
          try {
            console.log(`Creating module ${chapterIndex + 1}/${formData.chapters.length}: "${chapter.title}"`);

            // Create module for each chapter
            const moduleData = {
              title: chapter.title,
              description: chapter.description,
              orderIndex: chapterIndex,
              courseId: courseId
            };

            console.log('Creating module with data:', moduleData);

            const moduleResponse = await api.modules.create(moduleData);
            console.log('Module creation response:', moduleResponse);

            if (moduleResponse.success && moduleResponse.data?.module?.id) {
              const moduleId = moduleResponse.data.module.id;
              console.log(`Module "${chapter.title}" created successfully with ID: ${moduleId}`);

              if (chapter.materials && chapter.materials.length > 0) {
                console.log(`Creating ${chapter.materials.length} materials for module "${chapter.title}"`);

                // Process all materials for this module in parallel
                const materialPromises = chapter.materials.map(async (material, materialIndex) => {
                  try {
                    console.log(`Creating material ${materialIndex + 1}/${chapter.materials.length}: "${material.title}" (type: ${material.type})`);
                    let fileUrl = material.url;

                    // Upload file if it's not a link
                    if (material.file && ['video', 'audio', 'pdf', 'document'].includes(material.type)) {
                      console.log(`📤 Uploading ${material.type} file for material "${material.title}"`);
                      console.log(`📁 File details: ${material.file.name} (${(material.file.size / 1024 / 1024).toFixed(2)}MB, ${material.file.type})`);

                      const uploadResponse = await api.uploads.material(material.file, courseId, undefined, material.type);
                      console.log(`📨 Upload response for "${material.title}":`, uploadResponse);

                      if (uploadResponse.success && uploadResponse.data?.fileUrl) {
                        fileUrl = uploadResponse.data.fileUrl;
                        console.log(`File uploaded successfully: ${fileUrl}`);
                      } else {
                        console.error('File upload failed:', uploadResponse);
                      }
                    }

                    // Create material record
                    const materialData = {
                      title: material.title,
                      description: material.description || '',
                      type: material.type.toUpperCase(),
                      orderIndex: materialIndex,
                      courseId: courseId,
                      moduleId: moduleId,
                      isPublic: false,
                      ...(fileUrl && { fileUrl: fileUrl })
                    };

                    console.log('Creating material with data:', materialData);
                    const materialResponse = await api.materials.create(materialData);
                    console.log('Material creation response:', materialResponse);

                    if (materialResponse.success) {
                      console.log(`Material "${material.title}" created successfully`);
                    } else {
                      console.error(`Failed to create material "${material.title}":`, materialResponse);
                    }

                    return materialResponse;
                  } catch (error: any) {
                    console.error(`Error creating material "${material.title}":`, error);
                    throw new Error(`Failed to create material "${material.title}": ${error.message || 'Unknown error'}`);
                  }
                });

                // Wait for all materials in this module to complete
                const materialResults = await Promise.all(materialPromises);
                console.log(`All ${chapter.materials.length} materials created for module "${chapter.title}"`);
                return { module: moduleResponse, materials: materialResults };
              } else {
                console.log(`No materials to create for module "${chapter.title}"`);
                return { module: moduleResponse, materials: [] };
              }
            } else {
              throw new Error(`Failed to create module "${chapter.title}": ${moduleResponse.error?.message || 'Unknown error'}`);
            }
          } catch (error) {
            console.error(`Error creating module "${chapter.title}":`, error);
            throw new Error(`Failed to create module "${chapter.title}": ${error.message}`);
          }
        });

        // Wait for all modules and their materials to complete
        setSubmissionProgress('Finalizing course creation...');
        console.log('Waiting for all modules and materials to complete...');
        const allResults = await Promise.all(modulePromises);
        console.log('All modules and materials created successfully:', allResults);

        // Success message and redirect
        toast.success('Course created successfully!');
        router.push('/my-courses');
      }
    } catch (error: any) {
      console.error('Full error creating course:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);

      let errorMessage = 'Failed to create course. Please try again.';

      if (error.message) {
        if (error.message.includes('Validation failed')) {
          errorMessage = 'Please check your course information. Some fields may be missing or invalid.';
        } else if (error.message.includes('Failed to create module')) {
          errorMessage = `Module creation error: ${error.message}`;
        } else if (error.message.includes('Failed to create material')) {
          errorMessage = `Material creation error: ${error.message}`;
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }

      console.log('Final error message to user:', errorMessage);
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
      setSubmissionProgress('');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-2">
          Basic Information
        </h2>
        <p className="text-slate-600 text-sm sm:text-base">Let's start with the fundamentals of your course</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Course Title <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="e.g., Complete JavaScript Bootcamp 2024"
          error={errors.title}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Course Description <span className="text-red-500">*</span>
        </label>
        <Textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe what students will learn in this course..."
          rows={4}
          error={errors.description}
        />
      </div>

      {/* Only show tutor selection for Admin users */}
      {user?.role?.toLowerCase() === 'admin' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Assign Tutor <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.tutorId}
            onChange={(value) => handleInputChange('tutorId', value)}
            options={tutors}
            placeholder="Select a tutor for this course..."
            error={errors.tutorId}
          />
        </div>
      )}

      {/* Show assigned tutor info for Tutor users */}
      {user?.role?.toLowerCase() === 'tutor' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Course Instructor
          </label>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>{user.firstName} {user.lastName}</strong> (You)
            </div>
            <div className="text-xs text-blue-600 mt-1">
              You will be assigned as the instructor for this course
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Course Thumbnail
        </label>
        <FileUpload
          accept="image/*"
          onFileSelect={(files) => handleInputChange('thumbnail', files[0] || null)}
          placeholder="Upload course thumbnail image (optional)"
          maxSize={5 * 1024 * 1024}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-2">
          Course Details
        </h2>
        <p className="text-slate-600 text-sm sm:text-base">Pricing, level, and requirements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Difficulty Level
          </label>
          <Select
            options={levelOptions}
            value={formData.level}
            onChange={(value) => handleInputChange('level', value)}
            placeholder="Select difficulty level"
          />
          {errors.level && <p className="text-red-500 text-sm mt-1">{errors.level}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Price (USD) <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={formData.price}
            onChange={(e) => {
              const value = e.target.value;
              // Allow empty string, numbers with up to 2 decimal places
              if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                handleInputChange('price', value);
              }
            }}
            placeholder="0.00"
            error={errors.price}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Estimated Duration (hours)
        </label>
        <Input
          value={formData.duration}
          onChange={(e) => handleInputChange('duration', e.target.value)}
          placeholder="e.g., 10"
        />
      </div>



      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Requirements
        </label>
        <div className="space-y-2">
          {formData.requirements.map((requirement, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                value={requirement}
                onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                placeholder={`Requirement ${index + 1}`}
              />
              {formData.requirements.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeArrayItem('requirements', index)}
                  type="button"
                >
                  <XMarkIcon className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addArrayItem('requirements')}
          type="button"
          className="mt-2"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Requirement
        </Button>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Prerequisites
        </label>
        <div className="space-y-2">
          {formData.prerequisites.map((prerequisite, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                value={prerequisite}
                onChange={(e) => handleArrayChange('prerequisites', index, e.target.value)}
                placeholder={`Prerequisite ${index + 1}`}
              />
              {formData.prerequisites.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeArrayItem('prerequisites', index)}
                  type="button"
                >
                  <XMarkIcon className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addArrayItem('prerequisites')}
          type="button"
          className="mt-2"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Prerequisite
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-2">
          Course Content
        </h2>
        <p className="text-slate-600 text-sm sm:text-base">Structure your course with chapters and materials</p>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex-1">
          {errors.chapters && <p className="text-red-500 text-sm">{errors.chapters}</p>}
        </div>
        <Button onClick={addChapter} type="button" size="sm">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Chapter
        </Button>
      </div>

      <div className="space-y-4">
        {formData.chapters.map((chapter, chapterIndex) => (
          <Card key={chapter.id} className="bg-white shadow-sm border border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveChapter(chapter.id, 'up')}
                      disabled={chapterIndex === 0}
                      type="button"
                    >
                      <ArrowUpIcon className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveChapter(chapter.id, 'down')}
                      disabled={chapterIndex === formData.chapters.length - 1}
                      type="button"
                    >
                      <ArrowDownIcon className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-sm font-semibold text-slate-900">Chapter {chapterIndex + 1}</CardTitle>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeChapter(chapter.id)}
                  type="button"
                  className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
                >
                  <XMarkIcon className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  value={chapter.title}
                  onChange={(e) => updateChapter(chapter.id, 'title', e.target.value)}
                  placeholder="Chapter title"
                  error={errors[`chapter-${chapter.id}-title`]}
                />
              </div>
              <div>
                <Textarea
                  value={chapter.description}
                  onChange={(e) => updateChapter(chapter.id, 'description', e.target.value)}
                  placeholder="Chapter description (optional)"
                  rows={2}
                />
              </div>

              {/* Materials Section */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-slate-900">Materials</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addMaterial(chapter.id)}
                    type="button"
                  >
                    <PlusIcon className="w-3 h-3 mr-1" />
                    Add Material
                  </Button>
                </div>

                {errors[`chapter-${chapter.id}-materials`] && (
                  <p className="text-red-500 text-sm mb-2">{errors[`chapter-${chapter.id}-materials`]}</p>
                )}

                <div className="space-y-3">
                  {chapter.materials.map((material, materialIndex) => {
                    const MaterialIcon = materialTypes.find(t => t.value === material.type)?.icon || DocumentTextIcon;
                    return (
                      <div key={material.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <MaterialIcon className="w-4 h-4 text-slate-600" />
                            <span className="text-xs font-medium text-slate-900">Material {materialIndex + 1}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMaterial(chapter.id, material.id)}
                            type="button"
                            className="text-red-600 hover:text-red-700"
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Input
                              value={material.title}
                              onChange={(e) => updateMaterial(chapter.id, material.id, 'title', e.target.value)}
                              placeholder="Material title"
                              error={errors[`material-${material.id}-title`]}
                            />
                          </div>
                          <div>
                            <Select
                              options={materialTypes.map(t => ({ value: t.value, label: t.label }))}
                              value={material.type}
                              onChange={(value) => updateMaterial(chapter.id, material.id, 'type', value)}
                              placeholder="Select material type"
                            />
                          </div>
                        </div>

                        <div className="mt-3">
                          <Textarea
                            value={material.description || ''}
                            onChange={(e) => updateMaterial(chapter.id, material.id, 'description', e.target.value)}
                            placeholder="Material description (optional)"
                            rows={2}
                          />
                        </div>

                        {material.type === 'link' ? (
                          <div className="mt-3">
                            <Input
                              value={material.url || ''}
                              onChange={(e) => updateMaterial(chapter.id, material.id, 'url', e.target.value)}
                              placeholder="https://..."
                              error={errors[`material-${material.id}-url`]}
                            />
                          </div>
                        ) : (
                          <div className="mt-3">
                            <FileUpload
                              accept={
                                material.type === 'video' ? 'video/*' :
                                material.type === 'audio' ? 'audio/*' :
                                material.type === 'pdf' ? 'application/pdf' :
                                'application/*,text/*'
                              }
                              onFileSelect={(files) => handleMaterialFileUpload(chapter.id, material.id, files)}
                              placeholder={`Upload ${material.type} file`}
                              maxSize={
                                material.type === 'video' ? 200 * 1024 * 1024 : // 200MB for video
                                material.type === 'audio' ? 100 * 1024 * 1024 : // 100MB for audio
                                10 * 1024 * 1024 // 10MB for documents
                              }
                            />
                            {errors[`material-${material.id}-file`] && (
                              <p className="text-red-500 text-sm mt-1">{errors[`material-${material.id}-file`]}</p>
                            )}
                          </div>
                        )}

                        {material.type === 'video' && (
                          <div className="mt-3">
                            <Input
                              value={material.duration || ''}
                              onChange={(e) => updateMaterial(chapter.id, material.id, 'duration', e.target.value)}
                              placeholder="Duration (e.g., 15:30)"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {formData.chapters.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
          <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center mx-auto mb-4">
            <BookOpenIcon className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-900 font-semibold text-lg mb-4">No chapters yet</p>
          <Button
            onClick={addChapter}
            type="button"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Your First Chapter
          </Button>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
          <CheckCircleIcon className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-2">Review Your Course</h2>
        <p className="text-slate-600 text-sm sm:text-base">Review all the information below and click "Create Course" to publish</p>
      </div>

      <Card className="bg-white shadow-sm border border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">
            Course Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-medium text-slate-900 text-sm mb-2">
              Title:
            </h4>
            <p className="text-slate-700">{formData.title || 'No title provided'}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-medium text-slate-900 text-sm mb-2">
              Description:
            </h4>
            <p className="text-slate-700">{formData.description || 'No description provided'}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 text-sm mb-2">Level:</h4>
              <p className="text-slate-700">{levelOptions.find(l => l.value === formData.level)?.label || 'Not specified'}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 text-sm mb-2">Price:</h4>
              <p className="text-slate-700">${formData.price || 'Not set'}</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-medium text-slate-900 text-sm mb-2">Chapters:</h4>
            <p className="text-slate-700 mb-2">{formData.chapters.length} chapter(s)</p>
            {formData.chapters.length > 0 && (
              <ul className="space-y-1">
                {formData.chapters.map((chapter, index) => (
                  <li key={chapter.id} className="text-sm text-slate-600">
                    Chapter {index + 1}: {chapter.title} ({chapter.materials.length} materials)
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{errors.general}</p>
        </div>
      )}
    </div>
  );


  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 mb-2">
                Create New Course
              </h1>
              <p className="text-slate-600 text-sm sm:text-base">Build your course with chapters and materials</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <div className="flex justify-between items-center">
              {steps.map((step, index) => (
                <div key={step.number} className="flex-1">
                  <div className="flex items-center">
                    <div className={`
                      w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-sm sm:text-base font-semibold transition-all duration-200
                      ${currentStep >= step.number
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                      }
                    `}>
                      {currentStep > step.number ? (
                        <span className="text-sm sm:text-base">✓</span>
                      ) : (
                        step.number
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`
                        flex-1 h-0.5 mx-2 sm:mx-4 rounded-full transition-all duration-300
                        ${currentStep > step.number ? 'bg-blue-600' : 'bg-slate-200'}
                      `} />
                    )}
                  </div>
                  <div className="mt-2 sm:mt-3">
                    <p className="text-xs sm:text-sm font-semibold text-slate-900">{step.title}</p>
                    <p className="text-xs text-slate-600 mt-1 hidden sm:block">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <Card className="bg-white shadow-sm border border-slate-200 rounded-xl">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-6 sm:mt-8">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={isSubmitting}
                type="button"
                className="flex items-center space-x-2"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                <span>Previous</span>
              </Button>
            )}
          </div>

          <div>
            {currentStep < steps.length ? (
              <Button
                onClick={nextStep}
                disabled={isSubmitting}
                type="button"
                className="flex items-center space-x-2"
              >
                <span>Next</span>
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                type="button"
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{submissionProgress || 'Creating Course...'}</span>
                  </>
                ) : (
                  <>
                    <span>Create Course</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}