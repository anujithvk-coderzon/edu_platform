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
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { api } from '../../lib/api';

interface Material {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'document' | 'link';
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
  tutorName: string;
  thumbnail: File | null;
  objectives: string[];
  requirements: string[];
  tags: string[];
  chapters: Chapter[];
}

const initialFormData: CourseFormData = {
  title: '',
  description: '',
  level: '',
  price: '0',
  duration: '',
  tutorName: '',
  thumbnail: null,
  objectives: [''],
  requirements: [''],
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
  { value: 'document', label: 'Text Document', icon: DocumentTextIcon },
  { value: 'link', label: 'External Link', icon: BookOpenIcon }
];

export default function CreateCoursePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CourseFormData>(initialFormData);
  const [errors, setErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const steps = [
    { number: 1, title: 'Basic Information', description: 'Course title and description' },
    { number: 2, title: 'Course Details', description: 'Pricing, level, and requirements' },
    { number: 3, title: 'Course Content', description: 'Chapters and materials like Udemy/Coursera' },
    { number: 4, title: 'Review & Publish', description: 'Final review and publish your course' }
  ];



  const handleInputChange = (field: keyof CourseFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: null }));
    }
  };

  const handleArrayChange = (field: 'objectives' | 'requirements', index: number, value: string) => {
    const updatedArray = [...formData[field]];
    updatedArray[index] = value;
    handleInputChange(field, updatedArray);
  };

  const addArrayItem = (field: 'objectives' | 'requirements') => {
    const updatedArray = [...formData[field], ''];
    handleInputChange(field, updatedArray);
  };

  const removeArrayItem = (field: 'objectives' | 'requirements', index: number) => {
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
    console.log(`=== VALIDATING STEP ${step} ===`);
    const newErrors: any = {};

    console.log('Form data details:', {
      title: `"${formData.title}" (length: ${formData.title?.length || 0})`,
      description: `"${formData.description}" (length: ${formData.description?.length || 0})`,
      categoryId: formData.categoryId,
      level: formData.level,
      price: formData.price
    });

    switch (step) {
      case 1:
        console.log('Validating step 1 fields...');
        
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
        
        console.log('Step 1 validation complete');
        break;
      case 2:
        // Level is optional on backend, so don't require it
        // if (!formData.level) newErrors.level = 'Please select a difficulty level';
        if (formData.price && parseFloat(formData.price) < 0) newErrors.price = 'Price cannot be negative';
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
                if (['video', 'pdf', 'document'].includes(material.type) && !material.file) {
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
    try {
      // Create the basic course first
      const courseData: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: formData.price ? parseFloat(formData.price) : 0,
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

      // Only add tutorName if it has a value
      if (formData.tutorName && formData.tutorName.trim()) {
        courseData.tutorName = formData.tutorName.trim();
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
          const thumbnailResponse = await api.uploads.courseThumbnail(formData.thumbnail, courseId);
          if (thumbnailResponse.success && thumbnailResponse.data?.url) {
            // Update the course with the thumbnail URL
            await api.courses.update(courseId, {
              thumbnail: thumbnailResponse.data.url
            });
          }
        }

        // Create chapters and modules
        for (const [chapterIndex, chapter] of formData.chapters.entries()) {
          // Create module for each chapter
          const moduleData = {
            title: chapter.title,
            description: chapter.description,
            orderIndex: chapterIndex,
            courseId: courseId
          };

          console.log('Creating module with data:', moduleData);

          const moduleResponse = await api.modules.create(moduleData);
          
          if (moduleResponse.success && moduleResponse.data?.module?.id) {
            const moduleId = moduleResponse.data.module.id;

            // Upload materials for this chapter
            for (const [materialIndex, material] of chapter.materials.entries()) {
              let fileUrl = material.url;

              // Upload file if it's not a link
              if (material.file && ['video', 'pdf', 'document'].includes(material.type)) {
                const uploadResponse = await api.uploads.material(material.file, courseId, undefined, material.type);
                if (uploadResponse.success && uploadResponse.data?.fileUrl) {
                  fileUrl = uploadResponse.data.fileUrl;
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

              await api.materials.create(materialData);
            }
          }
        }

        // Success message and redirect
        toast.success('Course created successfully!');
        router.push(`/courses/${courseId}/edit`);
      }
    } catch (error: any) {
      console.error('Full error creating course:', error);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Failed to create course. Please try again.';
      
      if (error.message) {
        if (error.message.includes('Validation failed')) {
          errorMessage = 'Please check your course information. Some fields may be missing or invalid.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Course Title <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="e.g., Complete JavaScript Bootcamp 2024"
          error={errors.title}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
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


      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Course Thumbnail
        </label>
        <FileUpload
          accept="image/*"
          onFileSelect={(files) => handleInputChange('thumbnail', files[0] || null)}
          placeholder="Upload course thumbnail image"
          maxSize={5 * 1024 * 1024}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price (USD) <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            value={formData.price}
            onChange={(e) => handleInputChange('price', e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            error={errors.price}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Estimated Duration (hours)
        </label>
        <Input
          value={formData.duration}
          onChange={(e) => handleInputChange('duration', e.target.value)}
          placeholder="e.g., 10 hours"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tutor/Organization Name
        </label>
        <Input
          value={formData.tutorName}
          onChange={(e) => handleInputChange('tutorName', e.target.value)}
          placeholder="e.g., CoderZone Academy or Your Name"
        />
        <p className="text-sm text-gray-500 mt-1">
          This will be displayed as "Created by" on the course page
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Learning Objectives
        </label>
        {formData.objectives.map((objective, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
            <Input
              value={objective}
              onChange={(e) => handleArrayChange('objectives', index, e.target.value)}
              placeholder={`Objective ${index + 1}`}
            />
            {formData.objectives.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeArrayItem('objectives', index)}
                type="button"
              >
                <XMarkIcon className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => addArrayItem('objectives')}
          type="button"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Objective
        </Button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Requirements
        </label>
        {formData.requirements.map((requirement, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => addArrayItem('requirements')}
          type="button"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Requirement
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Course Content</h3>
          <p className="text-sm text-gray-600">Structure your course like Udemy/Coursera with chapters and materials</p>
        </div>
        <Button onClick={addChapter} type="button">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Chapter
        </Button>
      </div>

      {errors.chapters && <p className="text-red-500 text-sm">{errors.chapters}</p>}

      <div className="space-y-4">
        {formData.chapters.map((chapter, chapterIndex) => (
          <Card key={chapter.id} className="border-2 border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveChapter(chapter.id, 'up')}
                      disabled={chapterIndex === 0}
                      type="button"
                    >
                      <ArrowUpIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveChapter(chapter.id, 'down')}
                      disabled={chapterIndex === formData.chapters.length - 1}
                      type="button"
                    >
                      <ArrowDownIcon className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">Chapter {chapterIndex + 1}</CardTitle>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeChapter(chapter.id)}
                  type="button"
                >
                  <XMarkIcon className="w-4 h-4" />
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
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Materials</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addMaterial(chapter.id)}
                    type="button"
                  >
                    <PlusIcon className="w-4 h-4 mr-1" />
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
                      <div key={material.id} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <MaterialIcon className="w-5 h-5 text-gray-600" />
                            <span className="text-sm font-medium">Material {materialIndex + 1}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMaterial(chapter.id, material.id)}
                            type="button"
                          >
                            <XMarkIcon className="w-4 h-4" />
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
                                material.type === 'pdf' ? 'application/pdf' :
                                'application/*,text/*'
                              }
                              onFileSelect={(files) => handleMaterialFileUpload(chapter.id, material.id, files)}
                              placeholder={`Upload ${material.type} file`}
                              maxSize={material.type === 'video' ? 500 * 1024 * 1024 : 10 * 1024 * 1024}
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
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <BookOpenIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-3">No chapters yet</p>
          <Button onClick={addChapter} type="button">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Your First Chapter
          </Button>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Review Your Course</h3>
        <p className="text-gray-600">Review all the information below and click "Create Course" to publish</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900">Title:</h4>
            <p className="text-gray-600">{formData.title || 'No title provided'}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Description:</h4>
            <p className="text-gray-600">{formData.description || 'No description provided'}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900">Level:</h4>
              <p className="text-gray-600">{levelOptions.find(l => l.value === formData.level)?.label || 'Not specified'}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Price:</h4>
              <p className="text-gray-600">${formData.price || '0.00'}</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Chapters:</h4>
            <p className="text-gray-600">{formData.chapters.length} chapter(s)</p>
            <ul className="ml-4 mt-2 space-y-1">
              {formData.chapters.map((chapter, index) => (
                <li key={chapter.id} className="text-sm text-gray-600">
                  Chapter {index + 1}: {chapter.title} ({chapter.materials.length} materials)
                </li>
              ))}
            </ul>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create New Course
          </h1>
          <p className="text-gray-600 mt-2">Build your course like Udemy/Coursera with chapters and materials</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.number} className="flex-1">
                <div className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                    ${currentStep >= step.number 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                    }
                  `}>
                    {currentStep > step.number ? (
                      <CheckCircleIcon className="w-5 h-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      flex-1 h-0.5 mx-2
                      ${currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'}
                    `} />
                  )}
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-900">{step.title}</p>
                  <p className="text-xs text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={isSubmitting}
                type="button"
              >
                <ChevronLeftIcon className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}
          </div>
          
          <div>
            {currentStep < steps.length ? (
              <Button
                onClick={nextStep}
                disabled={isSubmitting}
                type="button"
              >
                Next
                <ChevronRightIcon className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                loading={isSubmitting}
                disabled={isSubmitting}
                type="button"
              >
                {isSubmitting ? 'Creating Course...' : 'Create Course'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}