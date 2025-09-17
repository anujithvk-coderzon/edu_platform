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
  module?: {
    id: string;
    title: string;
    description: string;
    orderIndex: number;
  } | null;
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
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    if (courseId && user) {
      fetchCourseData();
    }
  }, [courseId, user]);

  // Handle initial sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShowSidebar(true);
      } else {
        setShowSidebar(false);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener for resize
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);



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

        // Organize materials by chapters, excluding unassigned materials
        const materialsWithProgress = progressResponse.data.materials.filter((material: Material) => material.moduleId);
        const chapterMap = new Map<string, Module>();

        materialsWithProgress.forEach((material: Material) => {
          const chapterId = material.moduleId!;
          const chapterTitle = material.module?.title || '';
          const chapterDescription = material.module?.description || '';
          const chapterOrderIndex = material.module?.orderIndex || 0;

          if (!chapterMap.has(chapterId)) {
            chapterMap.set(chapterId, {
              id: chapterId,
              title: chapterTitle,
              description: chapterDescription,
              orderIndex: chapterOrderIndex,
              materials: []
            });
          }
          chapterMap.get(chapterId)!.materials.push(material);
        });

        const organizedChapters = Array.from(chapterMap.values()).map(chapter => ({
          ...chapter,
          materials: chapter.materials.sort((a, b) => a.orderIndex - b.orderIndex)
        })).sort((a, b) => a.orderIndex - b.orderIndex);

        setModules(organizedChapters);

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
    // Auto-close sidebar on mobile when material is selected
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
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

    const allMaterials = progress.materials.filter(m => m.moduleId).sort((a, b) => {
      if (a.moduleId !== b.moduleId) {
        return a.moduleId!.localeCompare(b.moduleId!);
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

    const allMaterials = progress.materials.filter(m => m.moduleId).sort((a, b) => {
      if (a.moduleId !== b.moduleId) {
        return a.moduleId!.localeCompare(b.moduleId!);
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
          <div className="rounded-lg overflow-hidden">
            {currentMaterial.fileUrl ? (
              <video
                controls
                className="w-full md:w-5/6 h-auto rounded-lg mx-auto max-h-80 md:max-h-none"
                src={currentMaterial.fileUrl}
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                onKeyDown={(e) => {
                  // Prevent common download shortcuts
                  if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
                    e.preventDefault();
                  }
                }}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="bg-slate-100 text-slate-600 text-center p-6 md:p-12 rounded-lg border border-slate-200">
                <VideoCameraIcon className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 opacity-50" />
                <p className="text-sm md:text-base">Video content not available</p>
              </div>
            )}
          </div>
        );

      case 'PDF':
        return (
          <div className="bg-white border rounded-lg overflow-hidden">
            {currentMaterial.fileUrl ? (
              <div className="w-full max-w-4xl lg:mx-auto">
                <iframe
                  src={`${currentMaterial.fileUrl}#toolbar=0&navpanes=0&scrollbar=1&statusbar=1&zoom=1&view=FitH`}
                  className="w-full h-96 sm:h-[500px] md:h-[600px] lg:h-[700px] xl:h-[800px]"
                />

              </div>
            ) : currentMaterial.content ? (
              <div className="prose max-w-none p-6">
                <pre className="whitespace-pre-wrap font-sans">{currentMaterial.content}</pre>
              </div>
            ) : (
              <div className="text-center text-slate-500 p-6">
                <DocumentTextIcon className="h-16 w-16 mx-auto mb-4" />
                <p>PDF content not available</p>
              </div>
            )}
          </div>
        );

      case 'DOCUMENT':
        const getFileExtension = (url: string) => {
          return url.split('.').pop()?.toLowerCase() || '';
        };

        const fileExtension = getFileExtension(currentMaterial.fileUrl || '');
        const isOfficeDocument = ['xlsx', 'xls', 'docx', 'doc', 'pptx', 'ppt'].includes(fileExtension);

        return (
          <div className="bg-white border rounded-lg overflow-hidden">
            {currentMaterial.fileUrl ? (
              <div className="w-full max-w-4xl lg:mx-auto">
                {isOfficeDocument ? (
                  // Office documents - use Google Docs Viewer or Office Online
                  <iframe
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(currentMaterial.fileUrl)}`}
                    className="w-full h-96 sm:h-[500px] md:h-[600px] lg:h-[700px] xl:h-[800px]"
                  />
                ) : (
                  // Other documents - try direct iframe
                  <iframe
                    src={`${currentMaterial.fileUrl}#toolbar=0&navpanes=0&scrollbar=1&statusbar=1&zoom=1&view=FitH`}
                    className="w-full h-96 sm:h-[500px] md:h-[600px] lg:h-[700px] xl:h-[800px]"
                  />
                )}

                {/* Fallback download link */}
                <div className="mt-4 text-center p-4">
                  <p className="text-sm text-slate-600 mb-2">
                    {isOfficeDocument ? 'Excel/Word/PowerPoint Document' : 'Document'} ({fileExtension.toUpperCase()})
                  </p>
                  <a
                    href={currentMaterial.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </a>
                </div>
              </div>
            ) : currentMaterial.content ? (
              <div className="prose max-w-none p-6">
                <pre className="whitespace-pre-wrap font-sans">{currentMaterial.content}</pre>
              </div>
            ) : (
              <div className="text-center text-slate-500 p-6">
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
              <audio
                controls
                className="w-auto"
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                onKeyDown={(e) => {
                  // Prevent common download shortcuts
                  if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
                    e.preventDefault();
                  }
                }}
              >
                <source src={currentMaterial.fileUrl} />
                Your browser does not support the audio tag.
              </audio>
            ) : (
              <div className="text-center text-slate-500">
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
                className="max-w-full h-auto rounded-lg"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                style={{
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
              />
            ) : (
              <div className="text-center text-slate-500">
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
                <LinkIcon className="h-16 w-16 mx-auto mb-4 text-indigo-500" />
                <h3 className="text-lg font-medium mb-4 text-slate-900">External Resource</h3>
                <a
                  href={currentMaterial.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Open Link
                </a>
              </div>
            ) : (
              <div className="text-center text-slate-500">
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Please log in</h3>
          <p className="text-slate-600 mb-4">You need to be logged in to access course content.</p>
          <Link href="/login">
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Log In
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Sidebar Backdrop */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar */}
      {showSidebar && (
        <div className="w-full md:w-80 bg-white border-r border-slate-200 overflow-hidden fixed md:relative inset-0 z-50 md:z-auto">
          <div className="p-4 md:p-6 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900 truncate text-base md:text-lg">{course?.title}</h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-slate-600" />
              </button>
            </div>
            {progress && (
              <div className="space-y-4">
                {/* Main Progress Card */}
                <div className="bg-white border border-slate-200 rounded-lg p-4 md:p-6">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <h3 className="text-base md:text-lg font-semibold text-slate-900">
                      Progress Overview
                    </h3>
                    <span className="bg-indigo-600 text-white px-2 md:px-3 py-1 rounded-md text-xs md:text-sm font-medium">
                      {Math.min(100, Math.round(progress.stats.progressPercentage))}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-lg h-2 md:h-3 overflow-hidden mb-3 md:mb-4">
                    <div
                      className="bg-indigo-600 h-2 md:h-3 rounded-lg transition-all duration-500"
                      style={{ width: `${Math.min(100, progress.stats.progressPercentage)}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <div className="bg-slate-50 rounded-lg p-2 md:p-3 border border-slate-200">
                      <div className="text-xl md:text-2xl font-semibold text-slate-900">{progress.stats.completedMaterials}</div>
                      <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">Completed</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2 md:p-3 border border-slate-200">
                      <div className="text-xl md:text-2xl font-semibold text-slate-900">{progress.stats.totalMaterials - progress.stats.completedMaterials}</div>
                      <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">Remaining</div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          <div className="overflow-y-auto h-full pb-20">
            {modules.map((module, moduleIndex) => (
              <div key={module.id} className="border-b border-slate-200 last:border-b-0">
                <div className="p-3 md:p-4 bg-slate-50">
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <div className="w-5 h-5 md:w-6 md:h-6 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-medium">{moduleIndex + 1}</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm md:text-base truncate">{module.title}</h3>
                  </div>
                  {module.description && (
                    <p className="text-xs md:text-sm text-slate-600 mt-2 ml-7 md:ml-9 line-clamp-2">{module.description}</p>
                  )}
                </div>
                <div className="divide-y divide-slate-200">
                  {module.materials.map((material) => (
                    <button
                      key={material.id}
                      onClick={() => handleMaterialSelect(material)}
                      className={`w-full p-3 md:p-4 text-left hover:bg-slate-50 transition-colors ${
                        currentMaterial?.id === material.id
                          ? 'bg-indigo-50 border-r-4 border-indigo-600'
                          : ''
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`p-1.5 md:p-2 rounded-lg mr-2 md:mr-4 flex-shrink-0 ${
                          material.progress?.isCompleted
                            ? 'bg-green-100 border border-green-200'
                            : currentMaterial?.id === material.id
                            ? 'bg-indigo-100 border border-indigo-200'
                            : 'bg-slate-100 border border-slate-200'
                        }`}>
                          {material.progress?.isCompleted ? (
                            <CheckCircleIconSolid className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                          ) : (
                            <div className={`${
                              currentMaterial?.id === material.id ? 'text-indigo-600' : 'text-slate-500'
                            }`}>
                              <div className="w-4 h-4 md:w-5 md:h-5">
                                {getMaterialIcon(material.type)}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium truncate text-sm md:text-base ${
                            currentMaterial?.id === material.id ? 'text-indigo-900' : 'text-slate-900'
                          }`}>
                            {material.title}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-xs md:text-sm text-slate-600 capitalize">
                              {material.type.toLowerCase()}
                            </p>
                            {material.progress?.isCompleted && (
                              <span className="text-xs bg-green-100 text-green-700 px-1.5 md:px-2 py-0.5 rounded-full font-medium">
                                Completed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-3 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              {!showSidebar && (
                <button
                  onClick={() => setShowSidebar(true)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ListBulletIcon className="h-5 w-5 md:h-6 md:w-6 text-slate-600" />
                </button>
              )}
              <Link href={`/courses/${courseId}`}>
                <button className="flex items-center text-slate-600 hover:text-indigo-600 font-medium transition-colors bg-white hover:bg-slate-50 px-2 md:px-4 py-1.5 md:py-2 rounded-lg border border-slate-200 text-sm md:text-base">
                  <ArrowLeftIcon className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Back to Course</span>
                  <span className="sm:hidden">Back</span>
                </button>
              </Link>
            </div>

            <div className="flex items-center gap-1 md:gap-2">
              <button
                onClick={handlePreviousMaterial}
                disabled={!progress || progress.materials.filter(m => m.moduleId).findIndex(m => m.id === currentMaterial?.id) === 0}
                className="p-1.5 md:p-2 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeftIcon className="h-3 w-3 md:h-4 md:w-4 text-slate-600" />
              </button>
              <button
                onClick={handleNextMaterial}
                disabled={!progress || progress.materials.filter(m => m.moduleId).findIndex(m => m.id === currentMaterial?.id) === progress.materials.filter(m => m.moduleId).length - 1}
                className="p-1.5 md:p-2 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowRightIcon className="h-3 w-3 md:h-4 md:w-4 text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-3 md:p-6 bg-slate-50">
          {currentMaterial && progress ? (
            <div className="max-w-full mx-auto">
              {/* Material Header */}
              <div className="mb-4 md:mb-6">
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <div className="text-slate-600 flex-shrink-0">
                    <div className="w-5 h-5 md:w-6 md:h-6">
                      {getMaterialIcon(currentMaterial.type)}
                    </div>
                  </div>
                  <h1 className="text-lg md:text-2xl font-semibold text-slate-900 truncate">{currentMaterial.title}</h1>
                  {currentMaterial.progress?.isCompleted && (
                    <CheckCircleIconSolid className="h-5 w-5 md:h-6 md:w-6 text-green-600 flex-shrink-0" />
                  )}
                </div>
                {currentMaterial.description && (
                  <p className="text-slate-600 text-sm md:text-base line-clamp-2 md:line-clamp-none">{currentMaterial.description}</p>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm text-slate-500 mt-2">
                  <span>
                    Material {progress.materials.filter(m => m.moduleId).findIndex(m => m.id === currentMaterial.id) + 1} of {progress.materials.filter(m => m.moduleId).length}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="capitalize">{currentMaterial.type.toLowerCase()}</span>
                </div>
              </div>

              {/* Material Content */}
              <div className="mb-4 md:mb-6">
                {renderMaterialContent()}
              </div>

              {/* Action Button */}
              {!currentMaterial.progress?.isCompleted && (
                <div className="text-center">
                  <button
                    onClick={handleMarkComplete}
                    disabled={markingComplete}
                    className="bg-indigo-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto text-sm md:text-base"
                  >
                    {markingComplete ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        <span className="hidden sm:inline">Marking Complete...</span>
                        <span className="sm:hidden">Marking...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                        <span className="hidden sm:inline">Mark as Complete</span>
                        <span className="sm:hidden">Complete</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 md:py-12 px-4">
              <DocumentTextIcon className="h-12 w-12 md:h-16 md:w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-base md:text-lg font-medium text-slate-900 mb-2">No content selected</h3>
              <p className="text-slate-600 text-sm md:text-base">Select a lesson from the sidebar to start learning.</p>
              <button
                onClick={() => setShowSidebar(true)}
                className="mt-4 md:hidden bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                Open Course Content
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}