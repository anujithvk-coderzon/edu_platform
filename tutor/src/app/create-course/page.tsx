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
  categoryId: string;
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
  categoryId: '',
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
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
  { value: 'ALL_LEVELS', label: 'All Levels' }
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
  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const steps = [
    { number: 1, title: 'Basic Information', description: 'Course title, description, and category' },
    { number: 2, title: 'Course Details', description: 'Pricing, level, and requirements' },
    { number: 3, title: 'Course Content', description: 'Chapters and materials like Udemy/Coursera' },
    { number: 4, title: 'Review & Publish', description: 'Final review and publish your course' }
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.courses.getCategories();
      if (response.success && response.data?.categories) {
        const categoryOptions = response.data.categories.map((cat: any) => ({
          value: cat.id,
          label: cat.name
        }));
        setCategories(categoryOptions);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      const errorMessage = 'Failed to load categories. Please refresh the page.';
      setErrors({ ...errors, categories: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      setErrors({ ...errors, newCategory: 'Category name is required' });
      return;
    }

    try {
      setLoading(true);
      console.log('Creating category:', { name: newCategory.name.trim(), description: newCategory.description.trim() });
      
      // Log current cookies to debug authentication
      console.log('Document cookies:', document.cookie);
      console.log('Local storage token:', localStorage.getItem('token'));
      
      const response = await api.courses.createCategory({
        name: newCategory.name.trim(),
        description: newCategory.description.trim() || undefined
      });
      
      console.log('Category creation response:', response);
      
      if (response.success && response.data?.category) {
        const newCategoryOption = {
          value: response.data.category.id,
          label: response.data.category.name
        };
        setCategories([...categories, newCategoryOption]);
        handleInputChange('categoryId', response.data.category.id);
        setNewCategory({ name: '', description: '' });
        setShowNewCategoryForm(false);
        setErrors({ ...errors, newCategory: undefined });
        toast.success(`Category "${newCategoryOption.label}" created successfully!`);
      } else {
        throw new Error(response.error?.message || 'Unknown error occurred');
      }
    } catch (error: any) {
      console.error('Full error object:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      let errorMessage = 'Failed to create category. Please try again.';
      
      if (error.message) {
        if (error.message.includes('already exists')) {
          errorMessage = 'A category with this name already exists.';
        } else if (error.message.includes('Authentication') || error.message.includes('401')) {
          errorMessage = 'Authentication failed. Please log out and log back in, then try again.';
        } else if (error.message.includes('Validation')) {
          errorMessage = 'Please check your category name and description.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      setErrors({ ...errors, newCategory: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CourseFormData, value: any) => {
    // Add debugging for categoryId changes
    if (field === 'categoryId') {
      console.log('CategoryId changing from:', formData.categoryId, 'to:', value);
      console.log('Value type:', typeof value, 'Value:', value);
    }
    
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
      const courseData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        categoryId: formData.categoryId,
        level: formData.level || undefined,
        price: formData.price ? parseFloat(formData.price) : 0,
        duration: formData.duration || '0',
        tutorName: formData.tutorName.trim() || undefined,
        // Note: objectives, requirements, and tags will be handled separately in future versions
      };

      // Log the data being sent for debugging
      console.log('Course data before sending:', courseData);
      console.log('FormData state:', {
        title: `"${formData.title}" (length: ${formData.title.length})`,
        description: `"${formData.description}" (length: ${formData.description.length})`,
        categoryId: formData.categoryId,
        level: formData.level,
        price: formData.price,
        duration: formData.duration
      });

      // Additional debugging for category issue
      console.log('Category debugging:', {
        categoryIdValue: formData.categoryId,
        categoryIdType: typeof formData.categoryId,
        categoriesAvailable: categories.length,
        categoriesList: categories
      });

      // Check if categoryId is missing or invalid
      if (!formData.categoryId) {
        if (categories.length === 0) {
          throw new Error('Please create a category first, then select it for your course');
        } else {
          throw new Error('Please select a category before creating the course');
        }
      }

      // Temporary validation bypass - let's see what gets sent to the backend
      console.log('FORCING COURSE CREATION - bypassing frontend validation');
      console.log('Will send categoryId:', formData.categoryId);

      console.log('Sending course data:', courseData);
      const response = await api.courses.create(courseData);
      console.log('Course creation response:', response);
      
      if (response.success && response.data?.course?.id) {
        const courseId = response.data.course.id;
        console.log('Course created successfully with ID:', courseId);
        console.log('CourseId type:', typeof courseId);

        // Upload thumbnail if provided
        if (formData.thumbnail) {
          await api.uploads.courseThumbnail(formData.thumbnail, courseId);
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
        } else if (error.message.includes('Category is required')) {
          errorMessage = 'Please select or create a category for your course.';
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
          Category <span className="text-red-500">*</span>
        </label>
        <div className="space-y-3">
          {errors.categories && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{errors.categories}</p>
            </div>
          )}
          
          {categories.length === 0 && !errors.categories && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-600 text-sm">No categories available. Create your first category below!</p>
            </div>
          )}
          
          <Select
            options={categories}
            value={formData.categoryId}
            onChange={(value) => handleInputChange('categoryId', value)}
            placeholder={categories.length === 0 ? "No categories available" : "Select a category"}
            disabled={categories.length === 0}
          />
          
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowNewCategoryForm(!showNewCategoryForm)}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              {showNewCategoryForm ? 'Cancel' : 'Create New Category'}
            </Button>
          </div>

          {showNewCategoryForm && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
              <div>
                <Input
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="Category name (e.g., Web Development)"
                  error={errors.newCategory}
                />
              </div>
              <div>
                <Textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Category description (optional)"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateCategory}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  {loading ? 'Creating...' : 'Create Category'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowNewCategoryForm(false);
                    setNewCategory({ name: '', description: '' });
                    setErrors({ ...errors, newCategory: undefined });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
        {errors.categoryId && <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>}
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
            Difficulty Level <span className="text-red-500">*</span>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

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