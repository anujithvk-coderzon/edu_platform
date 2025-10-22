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
  type: 'video' | 'pdf' | 'link';
  file?: File;
  url?: string;
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
  isPaid: boolean;
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
  isPaid: false,
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
  { value: 'pdf', label: 'PDF Document', icon: DocumentArrowDownIcon },
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
          // Fetch only active tutors for course assignment
          const response = await api.tutors.getAll(true);
          if (response.success) {
            const tutorOptions = response.data.tutors.map((tutor: any) => ({
              value: tutor.id,
              label: `${tutor.firstName} ${tutor.lastName} (${tutor.email})`
            }));
            setTutors(tutorOptions);
          }
        } catch (error: any) {
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

        // Validate price only if course is paid
        if (formData.isPaid) {
          if (!formData.price || !formData.price.trim()) {
            newErrors.price = 'Price is required for paid courses';
          } else {
            const priceValue = parseFloat(formData.price);
            if (isNaN(priceValue)) {
              newErrors.price = 'Please enter a valid price';
            } else if (priceValue <= 0) {
              newErrors.price = 'Price must be greater than 0 for paid courses';
            } else if (priceValue > 999999) {
              newErrors.price = 'Price cannot exceed $999,999';
            }
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
                if (['video', 'pdf'].includes(material.type) && !material.file) {
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
    } catch (error: any) {
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
        price: formData.isPaid && formData.price ? parseFloat(formData.price) : 0,
        tutorId: formData.tutorId,
        status: 'PUBLISHED',
        isPublic: true,
        requirements: formData.requirements.filter(req => req.trim() !== ''),
        prerequisites: formData.prerequisites.filter(prereq => prereq.trim() !== ''),
      };

      // Only add level if it's a valid value
      const validLevels = ['Beginner', 'Intermediate', 'Advanced'];
      if (formData.level && formData.level.trim() && validLevels.includes(formData.level.trim())) {
        courseData.level = formData.level.trim();
      }

      // Add duration if provided
      if (formData.duration && formData.duration.trim()) {
        courseData.duration = formData.duration.trim();
      }

      console.log('Sending course data:', courseData);
      const response = await api.courses.create(courseData);
      console.log('Course creation response:', response);

      if (response.success && response.data?.course?.id) {
        const courseId = response.data.course.id;
        const courseTitle = formData.title.trim();
        console.log('Course created successfully with ID:', courseId);

        // Upload thumbnail if provided (non-critical - continue even if it fails)
        if (formData.thumbnail) {
          try {
            setSubmissionProgress('Uploading course thumbnail...');
            const thumbnailResponse = await api.uploads.courseThumbnail(formData.thumbnail, courseId);
            if (thumbnailResponse.success && thumbnailResponse.data?.url) {
              const thumbnailUrl = thumbnailResponse.data.url;
              if (thumbnailUrl && thumbnailUrl.trim().length > 0) {
                await api.courses.update(courseId, {
                  thumbnail: thumbnailUrl.trim()
                });
                console.log('✅ Thumbnail uploaded successfully');
              }
            }
          } catch (thumbnailError: any) {
            console.warn('⚠️ Thumbnail upload failed:', thumbnailError.message);
          }
        }

        // Create modules/chapters first (quick operation)
        setSubmissionProgress('Creating course structure...');
        console.log(`Creating ${formData.chapters.length} modules...`);

        const moduleCreationPromises = formData.chapters.map(async (chapter, chapterIndex) => {
          const moduleData = {
            title: chapter.title,
            description: chapter.description,
            orderIndex: chapterIndex,
            courseId: courseId
          };

          const moduleResponse = await api.modules.create(moduleData);

          if (moduleResponse.success && moduleResponse.data?.module?.id) {
            return {
              moduleId: moduleResponse.data.module.id,
              chapter: chapter,
              chapterIndex: chapterIndex
            };
          } else {
            throw new Error(`Failed to create module "${chapter.title}"`);
          }
        });

        const createdModules = await Promise.all(moduleCreationPromises);
        console.log('All modules created successfully');

        // Show success and navigate immediately
        toast.success(`Course "${courseTitle}" created successfully! Materials are being processed in the background.`, {
          duration: 5000
        });

        // Navigate to my-courses immediately
        router.push('/my-courses');

        // Continue processing materials in the background
        processCourseMaterials(courseId, courseTitle, createdModules);
      }
    } catch (error: any) {
      console.error('Error creating course:', error);

      let errorMessage = 'Failed to create course. Please try again.';

      if (error.message) {
        if (error.message.includes('Validation failed')) {
          errorMessage = 'Please check your course information. Some fields may be missing or invalid.';
        } else if (error.message.includes('Failed to create module')) {
          errorMessage = error.message;
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }

      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
      setSubmissionProgress('');
    }
  };

  // Process materials in the background after navigation
  const processCourseMaterials = async (
    courseId: string,
    courseTitle: string,
    createdModules: Array<{ moduleId: string; chapter: Chapter; chapterIndex: number }>
  ) => {
    let totalMaterials = 0;
    let successfulMaterials = 0;
    let failedMaterials = 0;
    let hasVideoMaterials = false;

    console.log('Starting background material processing...');

    try {
      for (const { moduleId, chapter, chapterIndex } of createdModules) {
        if (chapter.materials && chapter.materials.length > 0) {
          totalMaterials += chapter.materials.length;

          for (const [materialIndex, material] of chapter.materials.entries()) {
            try {
              console.log(`Processing material: "${material.title}" (${material.type})`);
              let fileUrl = material.url;

              // Upload file if it's not a link
              if (material.file && ['video', 'pdf'].includes(material.type)) {
                console.log(`📤 Uploading ${material.type}: "${material.title}" (${(material.file.size / 1024 / 1024).toFixed(2)}MB)`);

                const uploadResponse = await api.uploads.material(material.file, courseId, undefined, material.type);

                if (uploadResponse.success && uploadResponse.data?.fileUrl) {
                  fileUrl = uploadResponse.data.fileUrl;
                  console.log(`✅ File uploaded: ${fileUrl}`);

                  if (uploadResponse.data?.isVideo || material.type === 'video') {
                    hasVideoMaterials = true;
                  }
                } else {
                  console.error('❌ File upload failed:', uploadResponse);
                  throw new Error('File upload failed');
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

              const materialResponse = await api.materials.create(materialData);

              if (materialResponse.success) {
                successfulMaterials++;
                console.log(`✅ Material created: "${material.title}"`);
              } else {
                failedMaterials++;
                console.error(`❌ Failed to create material: "${material.title}"`);
              }
            } catch (error: any) {
              failedMaterials++;
              console.error(`❌ Error processing material "${material.title}":`, error);
            }
          }
        }
      }

      // Show final status toast
      if (failedMaterials === 0) {
        if (hasVideoMaterials) {
          toast.success(
            `✅ All materials uploaded successfully for "${courseTitle}"! Videos will take some time to fully process. Please be patient, you'll be able to view them soon.`,
            { duration: 8000 }
          );
        } else {
          toast.success(
            `✅ All materials processed successfully for "${courseTitle}"!`,
            { duration: 6000 }
          );
        }
      } else if (successfulMaterials > 0) {
        if (hasVideoMaterials) {
          toast.error(
            `⚠️ "${courseTitle}": ${successfulMaterials} materials uploaded, ${failedMaterials} failed. Videos will take time to process. Please check and re-upload failed materials.`,
            { duration: 10000 }
          );
        } else {
          toast.error(
            `⚠️ "${courseTitle}": ${successfulMaterials} materials uploaded, ${failedMaterials} failed. Please check and re-upload failed materials.`,
            { duration: 8000 }
          );
        }
      } else {
        toast.error(
          `❌ Failed to upload materials for "${courseTitle}". Please edit the course to add materials.`,
          { duration: 8000 }
        );
      }

    } catch (error: any) {
      console.error('Background material processing error:', error);
      toast.error(
        `⚠️ Some materials for "${courseTitle}" failed to process. Please check the course and re-upload if needed.${hasVideoMaterials ? ' Note: Videos take time to fully process.' : ''}`,
        { duration: 8000 }
      );
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
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-900 mb-1.5 sm:mb-2">
          Basic Information
        </h2>
        <p className="text-slate-600 text-xs sm:text-sm md:text-base">Let's start with the fundamentals of your course</p>
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        <label className="block text-xs sm:text-sm font-medium text-slate-700">
          Course Title <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="e.g., Complete JavaScript Bootcamp 2024"
          error={errors.title}
        />
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        <label className="block text-xs sm:text-sm font-medium text-slate-700">
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
        <div className="space-y-1.5 sm:space-y-2">
          <label className="block text-xs sm:text-sm font-medium text-slate-700">
            Assign Tutor <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.tutorId}
            onChange={(value) => handleInputChange('tutorId', value)}
            options={tutors}
            placeholder="Select a tutor for this course..."
          />
          {errors.tutorId && (
            <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.tutorId}</p>
          )}
        </div>
      )}

      {/* Show assigned tutor info for Tutor users */}
      {user?.role?.toLowerCase() === 'tutor' && (
        <div className="space-y-1.5 sm:space-y-2">
          <label className="block text-xs sm:text-sm font-medium text-slate-700">
            Course Instructor
          </label>
          <div className="p-2.5 sm:p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <div className="text-xs sm:text-sm text-blue-800">
              <strong>{user.firstName} {user.lastName}</strong> (You)
            </div>
            <div className="text-[10px] sm:text-xs text-blue-600 mt-0.5 sm:mt-1">
              You will be assigned as the instructor for this course
            </div>
          </div>
        </div>
      )}

      <div className="space-y-1.5 sm:space-y-2">
        <label className="block text-xs sm:text-sm font-medium text-slate-700">
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
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-900 mb-1.5 sm:mb-2">
          Course Details
        </h2>
        <p className="text-slate-600 text-xs sm:text-sm md:text-base">Pricing, level, and requirements</p>
      </div>

      {/* Course Type Selection */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-lg p-4 sm:p-6">
        <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-3">
          Course Type <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => {
              handleInputChange('isPaid', false);
              handleInputChange('price', '');
            }}
            className={`
              relative flex items-center justify-center p-4 rounded-lg border-2 transition-all
              ${!formData.isPaid
                ? 'border-green-500 bg-green-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${!formData.isPaid ? 'border-green-500' : 'border-slate-300'}
              `}>
                {!formData.isPaid && <div className="w-3 h-3 rounded-full bg-green-500"></div>}
              </div>
              <div className="text-left">
                <p className={`text-sm font-semibold ${!formData.isPaid ? 'text-green-700' : 'text-slate-700'}`}>
                  Free Course
                </p>
                <p className="text-xs text-slate-500">Open to all students</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleInputChange('isPaid', true)}
            className={`
              relative flex items-center justify-center p-4 rounded-lg border-2 transition-all
              ${formData.isPaid
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${formData.isPaid ? 'border-blue-500' : 'border-slate-300'}
              `}>
                {formData.isPaid && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
              </div>
              <div className="text-left">
                <p className={`text-sm font-semibold ${formData.isPaid ? 'text-blue-700' : 'text-slate-700'}`}>
                  Paid Course
                </p>
                <p className="text-xs text-slate-500">Requires purchase</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
            Difficulty Level
          </label>
          <Select
            options={levelOptions}
            value={formData.level}
            onChange={(value) => handleInputChange('level', value)}
            placeholder="Select difficulty level"
          />
          {errors.level && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.level}</p>}
        </div>

        {formData.isPaid && (
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
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
              placeholder="49.99"
              error={errors.price}
            />
          </div>
        )}

        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
            Course Duration
          </label>
          <Input
            type="text"
            value={formData.duration}
            onChange={(e) => handleInputChange('duration', e.target.value)}
            placeholder="e.g., 10 hours"
            error={errors.duration}
          />
          <p className="text-xs text-slate-500 mt-1">Total course duration (e.g., "10 hours", "5.5 hours")</p>
        </div>
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2 sm:mb-3">
          Requirements
        </label>
        <div className="space-y-1.5 sm:space-y-2">
          {formData.requirements.map((requirement, index) => (
            <div key={index} className="flex items-center gap-1.5 sm:gap-2">
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
                  <XMarkIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
          className="mt-1.5 sm:mt-2"
        >
          <PlusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
          <span className="text-xs sm:text-sm">Add Requirement</span>
        </Button>
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2 sm:mb-3">
          Prerequisites
        </label>
        <div className="space-y-1.5 sm:space-y-2">
          {formData.prerequisites.map((prerequisite, index) => (
            <div key={index} className="flex items-center gap-1.5 sm:gap-2">
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
                  <XMarkIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
          className="mt-1.5 sm:mt-2"
        >
          <PlusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
          <span className="text-xs sm:text-sm">Add Prerequisite</span>
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-900 mb-1.5 sm:mb-2">
          Course Content
        </h2>
        <p className="text-slate-600 text-xs sm:text-sm md:text-base">Structure your course with chapters and materials</p>
      </div>

      {/* Error message display */}
      {errors.chapters && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-500 text-xs sm:text-sm">{errors.chapters}</p>
        </div>
      )}

      <div className="space-y-3 sm:space-y-4">
        {formData.chapters.map((chapter, chapterIndex) => (
          <Card key={chapter.id} className="bg-white shadow-sm border border-slate-200 rounded-lg sm:rounded-xl">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6 bg-gradient-to-r from-slate-50 to-blue-50/30">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveChapter(chapter.id, 'up')}
                      disabled={chapterIndex === 0}
                      type="button"
                      className="p-1 sm:p-1.5"
                    >
                      <ArrowUpIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveChapter(chapter.id, 'down')}
                      disabled={chapterIndex === formData.chapters.length - 1}
                      type="button"
                      className="p-1 sm:p-1.5"
                    >
                      <ArrowDownIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </Button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xs sm:text-sm font-semibold text-slate-900 truncate">Chapter {chapterIndex + 1}</CardTitle>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeChapter(chapter.id)}
                  type="button"
                  className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50 p-1 sm:p-1.5 flex-shrink-0"
                >
                  <XMarkIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6">
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
              <div className="border-t border-slate-200 pt-3 sm:pt-4">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h4 className="text-xs sm:text-sm font-medium text-slate-900">Materials</h4>
                </div>

                {errors[`chapter-${chapter.id}-materials`] && (
                  <p className="text-red-500 text-xs sm:text-sm mb-1.5 sm:mb-2">{errors[`chapter-${chapter.id}-materials`]}</p>
                )}

                <div className="space-y-2 sm:space-y-3">
                  {chapter.materials.map((material, materialIndex) => {
                    const MaterialIcon = materialTypes.find(t => t.value === material.type)?.icon || DocumentTextIcon;
                    return (
                      <div key={material.id} className="border border-slate-200 rounded-lg p-2.5 sm:p-3 bg-gradient-to-r from-slate-50 to-blue-50/20">
                        <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                            <MaterialIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 flex-shrink-0" />
                            <span className="text-[10px] sm:text-xs font-medium text-slate-900 truncate">Material {materialIndex + 1}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMaterial(chapter.id, material.id)}
                            type="button"
                            className="text-red-600 hover:text-red-700 p-1 flex-shrink-0"
                          >
                            <XMarkIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
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

                        <div className="mt-2 sm:mt-3">
                          <Textarea
                            value={material.description || ''}
                            onChange={(e) => updateMaterial(chapter.id, material.id, 'description', e.target.value)}
                            placeholder="Material description (optional)"
                            rows={2}
                          />
                        </div>

                        {material.type === 'link' ? (
                          <div className="mt-2 sm:mt-3">
                            <Input
                              value={material.url || ''}
                              onChange={(e) => updateMaterial(chapter.id, material.id, 'url', e.target.value)}
                              placeholder="https://..."
                              error={errors[`material-${material.id}-url`]}
                            />
                          </div>
                        ) : (
                          <div className="mt-2 sm:mt-3">
                            <FileUpload
                              accept={
                                material.type === 'video' ? 'video/*' :
                                material.type === 'pdf' ? 'application/pdf' :
                                'video/*'
                              }
                              onFileSelect={(files) => handleMaterialFileUpload(chapter.id, material.id, files)}
                              placeholder={`Upload ${material.type} file`}
                              maxSize={
                                material.type === 'video' ? 200 * 1024 * 1024 : // 200MB for video
                                10 * 1024 * 1024 // 10MB for PDF
                              }
                            />
                            {errors[`material-${material.id}-file`] && (
                              <p className="text-red-500 text-xs sm:text-sm mt-1">{errors[`material-${material.id}-file`]}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Material Button - Placed at bottom of materials list */}
                <div className="mt-3 sm:mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addMaterial(chapter.id)}
                    type="button"
                    className="w-full"
                  >
                    <PlusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                    <span className="text-xs sm:text-sm">Add Material</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Chapter Button - Placed at bottom of all chapters */}
      {formData.chapters.length > 0 && (
        <div className="flex justify-center">
          <Button onClick={addChapter} type="button" size="md" className="w-full sm:w-auto">
            <PlusIcon className="w-4 h-4 mr-2" />
            <span className="text-sm">Add Another Chapter</span>
          </Button>
        </div>
      )}

      {formData.chapters.length === 0 && (
        <div className="text-center py-8 sm:py-12 border-2 border-dashed border-slate-300 rounded-lg bg-gradient-to-r from-slate-50 to-blue-50/30">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-200 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <BookOpenIcon className="w-6 h-6 sm:w-8 sm:h-8 text-slate-600" />
          </div>
          <p className="text-slate-900 font-semibold text-base sm:text-lg mb-3 sm:mb-4 px-3">No chapters yet</p>
          <Button
            onClick={addChapter}
            type="button"
            className="w-auto"
          >
            <PlusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="text-xs sm:text-sm">Add Your First Chapter</span>
          </Button>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-4 sm:mb-6">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-sm">
          <CheckCircleIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
        </div>
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-900 mb-1.5 sm:mb-2">Review Your Course</h2>
        <p className="text-slate-600 text-xs sm:text-sm md:text-base px-3">Review all the information below and click "Create Course" to publish</p>
      </div>

      <Card className="bg-white shadow-sm border border-slate-200 rounded-lg sm:rounded-xl">
        <CardHeader className="p-3 sm:p-4 md:p-6 bg-gradient-to-r from-slate-50 to-blue-50/30">
          <CardTitle className="text-base sm:text-lg font-semibold text-slate-900">
            Course Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6">
          <div className="bg-gradient-to-r from-slate-50 to-blue-50/20 rounded-lg p-3 sm:p-4">
            <h4 className="font-medium text-slate-900 text-xs sm:text-sm mb-1.5 sm:mb-2">
              Title:
            </h4>
            <p className="text-slate-700 text-xs sm:text-sm md:text-base">{formData.title || 'No title provided'}</p>
          </div>
          <div className="bg-gradient-to-r from-slate-50 to-blue-50/20 rounded-lg p-3 sm:p-4">
            <h4 className="font-medium text-slate-900 text-xs sm:text-sm mb-1.5 sm:mb-2">
              Description:
            </h4>
            <p className="text-slate-700 text-xs sm:text-sm md:text-base">{formData.description || 'No description provided'}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-gradient-to-r from-slate-50 to-blue-50/20 rounded-lg p-3 sm:p-4">
              <h4 className="font-medium text-slate-900 text-xs sm:text-sm mb-1.5 sm:mb-2">Level:</h4>
              <p className="text-slate-700 text-xs sm:text-sm">{levelOptions.find(l => l.value === formData.level)?.label || 'Not specified'}</p>
            </div>
            <div className="bg-gradient-to-r from-slate-50 to-blue-50/20 rounded-lg p-3 sm:p-4">
              <h4 className="font-medium text-slate-900 text-xs sm:text-sm mb-1.5 sm:mb-2">Course Type:</h4>
              {formData.isPaid ? (
                <div>
                  <p className="text-blue-700 font-semibold text-xs sm:text-sm">Paid Course</p>
                  <p className="text-slate-700 text-xs sm:text-sm mt-1">Price: ${formData.price}</p>
                </div>
              ) : (
                <p className="text-green-700 font-semibold text-xs sm:text-sm">Free Course</p>
              )}
            </div>
            <div className="bg-gradient-to-r from-slate-50 to-blue-50/20 rounded-lg p-3 sm:p-4">
              <h4 className="font-medium text-slate-900 text-xs sm:text-sm mb-1.5 sm:mb-2">Duration:</h4>
              <p className="text-slate-700 text-xs sm:text-sm">{formData.duration || 'Not specified'}</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-slate-50 to-blue-50/20 rounded-lg p-3 sm:p-4">
            <h4 className="font-medium text-slate-900 text-xs sm:text-sm mb-1.5 sm:mb-2">Chapters:</h4>
            <p className="text-slate-700 text-xs sm:text-sm mb-1.5 sm:mb-2">{formData.chapters.length} chapter(s)</p>
            {formData.chapters.length > 0 && (
              <ul className="space-y-1">
                {formData.chapters.map((chapter, index) => (
                  <li key={chapter.id} className="text-xs sm:text-sm text-slate-600">
                    Chapter {index + 1}: {chapter.title} ({chapter.materials.length} materials)
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
          <p className="text-red-600 text-xs sm:text-sm">{errors.general}</p>
        </div>
      )}
    </div>
  );


  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 md:mb-12">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 md:p-6">
            <div className="text-center">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-slate-900 mb-1.5 sm:mb-2">
                Create New Course
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm md:text-base">Build your course with chapters and materials</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 md:p-6">
            <div className="flex justify-between items-center">
              {steps.map((step, index) => (
                <div key={step.number} className="flex-1">
                  <div className="flex items-center">
                    <div className={`
                      w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center text-xs sm:text-sm md:text-base font-semibold transition-all duration-200 shadow-sm
                      ${currentStep >= step.number
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                      }
                    `}>
                      {currentStep > step.number ? (
                        <span className="text-xs sm:text-sm md:text-base">✓</span>
                      ) : (
                        step.number
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`
                        flex-1 h-0.5 mx-1.5 sm:mx-2 md:mx-4 rounded-full transition-all duration-300
                        ${currentStep > step.number ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-slate-200'}
                      `} />
                    )}
                  </div>
                  <div className="mt-1.5 sm:mt-2 md:mt-3">
                    <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-slate-900 leading-tight">{step.title}</p>
                    <p className="text-[10px] sm:text-xs text-slate-600 mt-0.5 sm:mt-1 hidden sm:block leading-tight">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <Card className="bg-white shadow-sm border border-slate-200 rounded-lg sm:rounded-xl">
          <CardContent className="p-3 sm:p-4 md:p-6 lg:p-8">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-4 sm:mt-6 md:mt-8 gap-2">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={isSubmitting}
                type="button"
                className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
              >
                <ChevronLeftIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Back</span>
              </Button>
            )}
          </div>

          <div>
            {currentStep < steps.length ? (
              <Button
                onClick={nextStep}
                disabled={isSubmitting}
                type="button"
                className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
              >
                <span>Next</span>
                <ChevronRightIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                type="button"
                className="flex items-center gap-1.5 sm:gap-2 bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">{submissionProgress || 'Creating Course...'}</span>
                    <span className="sm:hidden">Creating...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Create Course</span>
                    <span className="sm:hidden">Create</span>
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