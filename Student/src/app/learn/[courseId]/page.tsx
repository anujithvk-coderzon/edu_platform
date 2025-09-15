'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  PhotoIcon,
  MusicalNoteIcon,
  LinkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ListBulletIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

interface Material {
  id: string;
  title: string;
  description: string;
  type: string;
  fileUrl: string;
  content: string;
  orderIndex: number;
  moduleId: string;
  progress: {
    isCompleted: boolean;
    lastAccessed: string;
    timeSpent: number;
  } | null;
}

interface Module {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  materials: Material[];
}

interface Progress {
  enrollment: {
    id: string;
    progressPercentage: number;
    status: string;
  };
  materials: Material[];
  stats: {
    totalMaterials: number;
    completedMaterials: number;
    progressPercentage: number;
    totalTimeSpent: number;
  };
}

interface Course {
  id: string;
  title: string;
  description: string;
  creator: {
    firstName: string;
    lastName: string;
  };
}

export default function LearnPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentMaterial, setCurrentMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    if (courseId && user) {
      fetchCourseData();
    }
  }, [courseId, user]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);

      // Fetch course details
      const courseResponse = await api.courses.getById(courseId);
      if (courseResponse.success) {
        setCourse(courseResponse.data.course);
      }

      // Fetch progress and materials
      const progressResponse = await api.enrollments.getProgress(courseId);
      if (progressResponse.success) {
        setProgress(progressResponse.data);

        // Organize materials by modules
        const materialsWithProgress = progressResponse.data.materials;
        const moduleMap = new Map<string, Module>();

        materialsWithProgress.forEach((material: Material) => {
          if (!moduleMap.has(material.moduleId)) {
            moduleMap.set(material.moduleId, {
              id: material.moduleId,
              title: `Module ${material.moduleId}`,
              description: '',
              orderIndex: 0,
              materials: []
            });
          }
          moduleMap.get(material.moduleId)!.materials.push(material);
        });

        const organizedModules = Array.from(moduleMap.values()).map(module => ({
          ...module,
          materials: module.materials.sort((a, b) => a.orderIndex - b.orderIndex)
        }));

        setModules(organizedModules);

        // Set current material to first incomplete or first material
        const firstIncomplete = materialsWithProgress.find((m: Material) => !m.progress?.isCompleted);
        const initialMaterial = firstIncomplete || materialsWithProgress[0];
        if (initialMaterial) {
          setCurrentMaterial(initialMaterial);
        }
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
      toast.error('Failed to load course content');
    } finally {
      setLoading(false);
    }
  };

  const handleMaterialSelect = (material: Material) => {
    setCurrentMaterial(material);
  };

  const handleMarkComplete = async () => {
    if (!currentMaterial) return;

    try {
      setMarkingComplete(true);
      const response = await api.materials.markComplete(currentMaterial.id);
      if (response.success) {
        toast.success('Material marked as complete!');

        // Update local state
        setCurrentMaterial(prev => prev ? {
          ...prev,
          progress: { ...(prev.progress || {}), isCompleted: true }
        } : null);

        // Update progress data
        if (progress) {
          const updatedMaterials = progress.materials.map(m =>
            m.id === currentMaterial.id
              ? { ...m, progress: { ...(m.progress || {}), isCompleted: true } }
              : m
          );

          const completedCount = updatedMaterials.filter(m => m.progress?.isCompleted).length;
          const newProgressPercentage = Math.round((completedCount / progress.stats.totalMaterials) * 100);

          setProgress(prev => prev ? {
            ...prev,
            materials: updatedMaterials,
            stats: {
              ...prev.stats,
              completedMaterials: completedCount,
              progressPercentage: newProgressPercentage
            },
            enrollment: {
              ...prev.enrollment,
              progressPercentage: newProgressPercentage
            }
          } : null);

          // Update modules
          setModules(prev => prev.map(module => ({
            ...module,
            materials: module.materials.map(m =>
              m.id === currentMaterial.id
                ? { ...m, progress: { ...(m.progress || {}), isCompleted: true } }
                : m
            )
          })));
        }

        // Auto-advance to next material
        setTimeout(() => {
          handleNextMaterial();
        }, 1500);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark material as complete');
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleNextMaterial = () => {
    if (!currentMaterial || !progress) return;

    const allMaterials = progress.materials.sort((a, b) => {
      if (a.moduleId !== b.moduleId) {
        return a.moduleId.localeCompare(b.moduleId);
      }
      return a.orderIndex - b.orderIndex;
    });

    const currentIndex = allMaterials.findIndex(m => m.id === currentMaterial.id);
    if (currentIndex < allMaterials.length - 1) {
      setCurrentMaterial(allMaterials[currentIndex + 1]);
    }
  };

  const handlePreviousMaterial = () => {
    if (!currentMaterial || !progress) return;

    const allMaterials = progress.materials.sort((a, b) => {
      if (a.moduleId !== b.moduleId) {
        return a.moduleId.localeCompare(b.moduleId);
      }
      return a.orderIndex - b.orderIndex;
    });

    const currentIndex = allMaterials.findIndex(m => m.id === currentMaterial.id);
    if (currentIndex > 0) {
      setCurrentMaterial(allMaterials[currentIndex - 1]);
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'VIDEO':
        return <VideoCameraIcon className="h-5 w-5" />;
      case 'PDF':
      case 'DOCUMENT':
        return <DocumentTextIcon className="h-5 w-5" />;
      case 'AUDIO':
        return <MusicalNoteIcon className="h-5 w-5" />;
      case 'IMAGE':
        return <PhotoIcon className="h-5 w-5" />;
      case 'LINK':
        return <LinkIcon className="h-5 w-5" />;
      default:
        return <DocumentTextIcon className="h-5 w-5" />;
    }
  };

  const renderMaterialContent = () => {
    if (!currentMaterial) return null;

    switch (currentMaterial.type.toUpperCase()) {
      case 'VIDEO':
        return (
          <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
            {currentMaterial.fileUrl ? (
              <video
                controls
                className="w-full h-full rounded-lg"
                src={currentMaterial.fileUrl}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="text-white text-center">
                <VideoCameraIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Video content not available</p>
              </div>
            )}
          </div>
        );

      case 'PDF':
      case 'DOCUMENT':
        return (
          <div className="bg-white border rounded-lg p-6">
            {currentMaterial.fileUrl ? (
              <iframe
                src={currentMaterial.fileUrl}
                className="w-full h-96 border rounded"
                title={currentMaterial.title}
              />
            ) : currentMaterial.content ? (
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans">{currentMaterial.content}</pre>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <DocumentTextIcon className="h-16 w-16 mx-auto mb-4" />
                <p>Document content not available</p>
              </div>
            )}
          </div>
        );

      case 'AUDIO':
        return (
          <div className="bg-white border rounded-lg p-6">
            {currentMaterial.fileUrl ? (
              <audio controls className="w-full">
                <source src={currentMaterial.fileUrl} />
                Your browser does not support the audio tag.
              </audio>
            ) : (
              <div className="text-center text-gray-500">
                <MusicalNoteIcon className="h-16 w-16 mx-auto mb-4" />
                <p>Audio content not available</p>
              </div>
            )}
          </div>
        );

      case 'IMAGE':
        return (
          <div className="bg-white border rounded-lg p-6">
            {currentMaterial.fileUrl ? (
              <img
                src={currentMaterial.fileUrl}
                alt={currentMaterial.title}
                className="w-full h-auto rounded-lg"
              />
            ) : (
              <div className="text-center text-gray-500">
                <PhotoIcon className="h-16 w-16 mx-auto mb-4" />
                <p>Image not available</p>
              </div>
            )}
          </div>
        );

      case 'LINK':
        return (
          <div className="bg-white border rounded-lg p-6">
            {currentMaterial.fileUrl ? (
              <div className="text-center">
                <LinkIcon className="h-16 w-16 mx-auto mb-4 text-blue-500" />
                <h3 className="text-lg font-medium mb-4">External Resource</h3>
                <a
                  href={currentMaterial.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Open Link
                </a>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <LinkIcon className="h-16 w-16 mx-auto mb-4" />
                <p>Link not available</p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="bg-white border rounded-lg p-6">
            <div className="prose max-w-none">
              {currentMaterial.content || 'Content not available'}
            </div>
          </div>
        );
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Please log in</h3>
          <p className="text-gray-600 mb-4">You need to be logged in to access course content.</p>
          <Link href="/login">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Log In
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white border-r transition-all duration-300 ${
        showSidebar ? 'w-80' : 'w-0'
      } overflow-hidden`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 truncate">{course?.title}</h2>
            <button
              onClick={() => setShowSidebar(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          {progress && (
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{Math.round(progress.stats.progressPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.stats.progressPercentage}%` }}
                />
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {progress.stats.completedMaterials} of {progress.stats.totalMaterials} completed
              </div>
            </div>
          )}
        </div>

        <div className="overflow-y-auto h-full pb-20">
          {modules.map((module) => (
            <div key={module.id} className="border-b">
              <div className="p-4 bg-gray-50">
                <h3 className="font-medium text-gray-900">{module.title}</h3>
                {module.description && (
                  <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                )}
              </div>
              <div className="divide-y">
                {module.materials.map((material) => (
                  <button
                    key={material.id}
                    onClick={() => handleMaterialSelect(material)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      currentMaterial?.id === material.id ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full mr-3 ${
                        material.progress?.isCompleted ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {material.progress?.isCompleted ? (
                          <CheckCircleIconSolid className="h-4 w-4 text-green-600" />
                        ) : (
                          getMaterialIcon(material.type)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{material.title}</h4>
                        <p className="text-sm text-gray-600 capitalize">{material.type.toLowerCase()}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!showSidebar && (
                <button
                  onClick={() => setShowSidebar(true)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>
              )}
              <Link href={`/courses/${courseId}`}>
                <button className="flex items-center text-gray-600 hover:text-gray-800">
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  Back to Course
                </button>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousMaterial}
                disabled={!progress || progress.materials.findIndex(m => m.id === currentMaterial?.id) === 0}
                className="p-2 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextMaterial}
                disabled={!progress || progress.materials.findIndex(m => m.id === currentMaterial?.id) === progress.materials.length - 1}
                className="p-2 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6">
          {currentMaterial && progress ? (
            <div className="max-w-4xl mx-auto">
              {/* Material Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  {getMaterialIcon(currentMaterial.type)}
                  <h1 className="text-2xl font-bold text-gray-900">{currentMaterial.title}</h1>
                  {currentMaterial.progress?.isCompleted && (
                    <CheckCircleIconSolid className="h-6 w-6 text-green-600" />
                  )}
                </div>
                {currentMaterial.description && (
                  <p className="text-gray-600">{currentMaterial.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                  <span>
                    Material {progress.materials.findIndex(m => m.id === currentMaterial.id) + 1} of {progress.materials.length}
                  </span>
                  <span>•</span>
                  <span className="capitalize">{currentMaterial.type.toLowerCase()}</span>
                </div>
              </div>

              {/* Material Content */}
              <div className="mb-6">
                {renderMaterialContent()}
              </div>

              {/* Action Button */}
              {!currentMaterial.progress?.isCompleted && (
                <div className="text-center">
                  <button
                    onClick={handleMarkComplete}
                    disabled={markingComplete}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
                  >
                    {markingComplete ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Marking Complete...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Mark as Complete
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No content selected</h3>
              <p className="text-gray-600">Select a lesson from the sidebar to start learning.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}