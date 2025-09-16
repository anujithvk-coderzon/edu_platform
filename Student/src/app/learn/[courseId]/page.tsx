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
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    if (courseId && user) {
      fetchCourseData();
    }
  }, [courseId, user]);

  // Global protection against downloads
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+S, Ctrl+Shift+S, F12, Ctrl+U, Ctrl+Shift+I
      if (
        (e.ctrlKey || e.metaKey) && (
          e.key === 's' || e.key === 'S' ||
          e.key === 'u' || e.key === 'U' ||
          (e.shiftKey && (e.key === 'I' || e.key === 'i'))
        ) ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, []);

  // Console protection message
  useEffect(() => {
    console.clear();
    console.log('%c⚠️ WARNING', 'color: red; font-size: 20px; font-weight: bold;');
    console.log('%cContent Protection Notice:', 'color: red; font-size: 16px; font-weight: bold;');
    console.log('%cThis content is protected by copyright. Unauthorized downloading, copying, or distribution is prohibited and may result in legal action.', 'color: orange; font-size: 14px;');
    console.log('%cAll actions are monitored and logged.', 'color: red; font-size: 14px; font-weight: bold;');
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

        // Organize materials by chapters
        const materialsWithProgress = progressResponse.data.materials;
        const chapterMap = new Map<string, Module>();

        materialsWithProgress.forEach((material: Material) => {
          const chapterId = material.moduleId || 'unassigned';
          const chapterTitle = material.module?.title || 'Unassigned';
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
        // Handle null moduleId values
        const moduleA = a.moduleId || '';
        const moduleB = b.moduleId || '';
        return moduleA.localeCompare(moduleB);
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
        // Handle null moduleId values
        const moduleA = a.moduleId || '';
        const moduleB = b.moduleId || '';
        return moduleA.localeCompare(moduleB);
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
                className="w-full h-auto rounded-lg"
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
              <div className="bg-gray-100 text-gray-600 text-center p-12 rounded-lg">
                <VideoCameraIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Video content not available</p>
              </div>
            )}
          </div>
        );

      case 'PDF':
        return (
          <div className="bg-white border rounded-lg overflow-hidden">
            {currentMaterial.fileUrl ? (
              <div
                className="w-full select-none flex flex-col items-center relative"
                onContextMenu={(e) => e.preventDefault()}
                onKeyDown={(e) => {
                  // Prevent common download shortcuts
                  if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
                    e.preventDefault();
                  }
                }}
                style={{
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
              >
                <iframe
                  src={`${currentMaterial.fileUrl}#view=Fit&toolbar=0`}
                  width="100%"
                  height="1200px"
                  style={{
                    border: 'none',
                    minHeight: '1200px',
                    maxWidth: '100%',
                    margin: '0 auto',
                    display: 'block'
                  }}
                  title="PDF Viewer"
                  onLoad={() => console.log('PDF iframe loaded successfully')}
                  onError={() => console.log('PDF iframe failed to load')}
                  allow="fullscreen"
                />

                {/* Transparent overlay to prevent mouse events on iframe */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'transparent',
                    zIndex: 10,
                    pointerEvents: 'auto'
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseUp={(e) => e.preventDefault()}
                  onClick={(e) => e.preventDefault()}
                  onDoubleClick={(e) => e.preventDefault()}
                />
              </div>
            ) : currentMaterial.content ? (
              <div className="prose max-w-none p-6">
                <pre className="whitespace-pre-wrap font-sans">{currentMaterial.content}</pre>
              </div>
            ) : (
              <div className="text-center text-gray-500 p-6">
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
              <div
                className="w-full select-none flex flex-col items-center"
                onContextMenu={(e) => e.preventDefault()}
                onKeyDown={(e) => {
                  // Prevent common download shortcuts
                  if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
                    e.preventDefault();
                  }
                }}
                style={{
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
              >
                {isOfficeDocument ? (
                  // Office documents - use Google Docs Viewer or Office Online
                  <iframe
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(currentMaterial.fileUrl)}`}
                    width="100%"
                    height="1200px"
                    style={{
                      border: 'none',
                      minHeight: '1200px',
                      maxWidth: '100%',
                      margin: '0 auto',
                      display: 'block'
                    }}
                    title="Document Viewer"
                    onLoad={() => console.log('Office document loaded successfully')}
                    onError={() => console.log('Office document failed to load')}
                    allow="fullscreen"
                  />
                ) : (
                  // Other documents - try direct iframe
                  <iframe
                    src={`${currentMaterial.fileUrl}#view=Fit&toolbar=0`}
                    width="100%"
                    height="1200px"
                    style={{
                      border: 'none',
                      minHeight: '1200px',
                      maxWidth: '100%',
                      margin: '0 auto',
                      display: 'block'
                    }}
                    title="Document Viewer"
                    onLoad={() => console.log('Document loaded successfully')}
                    onError={() => console.log('Document failed to load')}
                    allow="fullscreen"
                  />
                )}

                {/* Fallback download link */}
                <div className="mt-4 text-center p-4">
                  <p className="text-sm text-gray-600 mb-2">
                    {isOfficeDocument ? 'Excel/Word/PowerPoint Document' : 'Document'} ({fileExtension.toUpperCase()})
                  </p>
                  <a
                    href={currentMaterial.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
              <div className="text-center text-gray-500 p-6">
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
    <div
      className="min-h-screen bg-gray-50 flex"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
    >
      {/* Sidebar */}
      <div className={`bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 backdrop-blur-sm border-r border-slate-200/50 transition-all duration-300 ${
        showSidebar ? 'w-80' : 'w-0'
      } overflow-hidden shadow-lg`}>
        <div className="p-6 border-b border-slate-200/50 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 truncate text-lg">{course?.title}</h2>
            <button
              onClick={() => setShowSidebar(false)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors duration-200"
            >
              <XMarkIcon className="h-5 w-5 text-slate-600" />
            </button>
          </div>
          {progress && (
            <div className="space-y-4">
              {/* Main Progress Card */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-indigo-200/50 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                    <span>📊</span>
                    <span>Learning Analytics</span>
                  </h3>
                  <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-xl text-sm font-bold">
                    {Math.min(100, Math.round(progress.stats.progressPercentage))}%
                  </span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden mb-4">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 h-4 rounded-full transition-all duration-1000 relative overflow-hidden"
                    style={{ width: `${Math.min(100, progress.stats.progressPercentage)}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50/80 rounded-xl p-3 border border-green-200/50">
                    <div className="text-2xl font-bold text-green-700">{progress.stats.completedMaterials}</div>
                    <div className="text-xs font-bold text-green-600 uppercase tracking-wide">✅ Completed</div>
                  </div>
                  <div className="bg-orange-50/80 rounded-xl p-3 border border-orange-200/50">
                    <div className="text-2xl font-bold text-orange-700">{progress.stats.totalMaterials - progress.stats.completedMaterials}</div>
                    <div className="text-xs font-bold text-orange-600 uppercase tracking-wide">⏳ Remaining</div>
                  </div>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-indigo-200/50 shadow-lg">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
                  <span>🎯</span>
                  <span>Performance Metrics</span>
                </h3>

                <div className="space-y-4">
                  {/* Time Spent */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700 flex items-center space-x-2">
                        <span>⏱️</span>
                        <span>Time Invested</span>
                      </span>
                      <span className="text-lg font-bold text-blue-700">
                        {Math.round((progress.stats.totalTimeSpent || 0) / 60)}h
                      </span>
                    </div>
                  </div>

                  {/* Completion Rate */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700 flex items-center space-x-2">
                        <span>📈</span>
                        <span>Completion Rate</span>
                      </span>
                      <span className="text-lg font-bold text-green-700">
                        {progress.stats.totalMaterials > 0 ? Math.round((progress.stats.completedMaterials / progress.stats.totalMaterials) * 100) : 0}%
                      </span>
                    </div>
                  </div>

                  {/* Learning Streak */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700 flex items-center space-x-2">
                        <span>🔥</span>
                        <span>Learning Status</span>
                      </span>
                      <span className="text-lg font-bold text-purple-700">
                        {progress.stats.completedMaterials > 0 ? 'Active' : 'Getting Started'}
                      </span>
                    </div>
                  </div>

                  {/* Module Progress */}
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-slate-700 flex items-center space-x-2">
                        <span>📚</span>
                        <span>Module Progress</span>
                      </span>
                      <span className="text-sm font-bold text-orange-700">
                        {modules.filter(m => m.materials.every(mat => mat.progress?.isCompleted)).length} of {modules.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {modules.map((module, idx) => {
                        const moduleProgress = module.materials.length > 0
                          ? (module.materials.filter(m => m.progress?.isCompleted).length / module.materials.length) * 100
                          : 0;
                        return (
                          <div key={module.id} className="flex items-center space-x-3">
                            <span className="text-xs font-bold text-slate-600 w-4">{idx + 1}</span>
                            <div className="flex-1 bg-slate-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-orange-400 to-amber-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${moduleProgress}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-orange-700">{Math.round(moduleProgress)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Achievement Section */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-indigo-200/50 shadow-lg">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
                  <span>🏆</span>
                  <span>Achievements</span>
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  {/* First Lesson */}
                  <div className={`flex items-center space-x-3 p-3 rounded-xl border-2 transition-all duration-200 ${
                    progress.stats.completedMaterials >= 1
                      ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      progress.stats.completedMaterials >= 1 ? 'bg-green-500' : 'bg-slate-300'
                    }`}>
                      <span className="text-white text-sm">🎯</span>
                    </div>
                    <div className="flex-1">
                      <div className={`font-bold text-sm ${progress.stats.completedMaterials >= 1 ? 'text-green-800' : 'text-slate-600'}`}>
                        First Step
                      </div>
                      <div className="text-xs text-slate-500">Complete your first lesson</div>
                    </div>
                    {progress.stats.completedMaterials >= 1 && (
                      <div className="text-green-600 text-xl">✓</div>
                    )}
                  </div>

                  {/* Half Way */}
                  <div className={`flex items-center space-x-3 p-3 rounded-xl border-2 transition-all duration-200 ${
                    progress.stats.progressPercentage >= 50
                      ? 'bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      progress.stats.progressPercentage >= 50 ? 'bg-blue-500' : 'bg-slate-300'
                    }`}>
                      <span className="text-white text-sm">🚀</span>
                    </div>
                    <div className="flex-1">
                      <div className={`font-bold text-sm ${progress.stats.progressPercentage >= 50 ? 'text-blue-800' : 'text-slate-600'}`}>
                        Half Way There
                      </div>
                      <div className="text-xs text-slate-500">Reach 50% completion</div>
                    </div>
                    {progress.stats.progressPercentage >= 50 && (
                      <div className="text-blue-600 text-xl">✓</div>
                    )}
                  </div>

                  {/* Course Master */}
                  <div className={`flex items-center space-x-3 p-3 rounded-xl border-2 transition-all duration-200 ${
                    progress.stats.progressPercentage >= 100
                      ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-purple-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      progress.stats.progressPercentage >= 100 ? 'bg-purple-500' : 'bg-slate-300'
                    }`}>
                      <span className="text-white text-sm">👑</span>
                    </div>
                    <div className="flex-1">
                      <div className={`font-bold text-sm ${progress.stats.progressPercentage >= 100 ? 'text-purple-800' : 'text-slate-600'}`}>
                        Course Master
                      </div>
                      <div className="text-xs text-slate-500">Complete the entire course</div>
                    </div>
                    {progress.stats.progressPercentage >= 100 && (
                      <div className="text-purple-600 text-xl">✓</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-y-auto h-full pb-20">
          {modules.map((module, moduleIndex) => (
            <div key={module.id} className="border-b border-slate-200/30 last:border-b-0">
              <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50/50 backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{moduleIndex + 1}</span>
                  </div>
                  <h3 className="font-bold text-slate-800">{module.title}</h3>
                </div>
                {module.description && (
                  <p className="text-sm text-slate-600 mt-2 ml-8 font-medium">{module.description}</p>
                )}
              </div>
              <div className="divide-y divide-slate-200/30">
                {module.materials.map((material) => (
                  <button
                    key={material.id}
                    onClick={() => handleMaterialSelect(material)}
                    className={`w-full p-4 text-left hover:bg-blue-50/50 transition-all duration-200 group ${
                      currentMaterial?.id === material.id
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-r-4 border-blue-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`p-2 rounded-xl mr-4 transition-all duration-200 group-hover:scale-110 ${
                        material.progress?.isCompleted
                          ? 'bg-green-100 border-2 border-green-200'
                          : currentMaterial?.id === material.id
                          ? 'bg-blue-100 border-2 border-blue-200'
                          : 'bg-slate-100 border-2 border-slate-200'
                      }`}>
                        {material.progress?.isCompleted ? (
                          <CheckCircleIconSolid className="h-5 w-5 text-green-600" />
                        ) : (
                          <div className={`${
                            currentMaterial?.id === material.id ? 'text-blue-600' : 'text-slate-500'
                          }`}>
                            {getMaterialIcon(material.type)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold truncate transition-colors duration-200 ${
                          currentMaterial?.id === material.id ? 'text-blue-700' : 'text-slate-800'
                        } group-hover:text-blue-600`}>
                          {material.title}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-sm text-slate-500 capitalize font-medium">
                            {material.type.toLowerCase()}
                          </p>
                          {material.progress?.isCompleted && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                              ✓ Done
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/30 backdrop-blur-sm border-b border-slate-200/50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!showSidebar && (
                <button
                  onClick={() => setShowSidebar(true)}
                  className="p-3 hover:bg-slate-100 rounded-xl transition-colors duration-200 group"
                >
                  <ListBulletIcon className="h-6 w-6 text-slate-600 group-hover:text-blue-600" />
                </button>
              )}
              <Link href={`/courses/${courseId}`}>
                <button className="flex items-center text-slate-600 hover:text-blue-600 font-medium transition-colors duration-200 bg-white/80 hover:bg-blue-50 px-4 py-2 rounded-xl border border-slate-200/50">
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  📚 Back to Course
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
            <div className="max-w-full mx-auto">
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