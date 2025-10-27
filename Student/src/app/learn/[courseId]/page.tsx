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
  XMarkIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  ClockIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { getImageUrl } from '@/utils/imageUtils';
import { getCdnUrl } from '@/utils/cdn';
import ProtectedVideo from '@/components/protected/ProtectedVideo';
import CustomPDFViewer from '@/components/protected/CustomPDFViewer';
import ProtectedImage from '@/components/protected/ProtectedImage';
import { disableSaveShortcuts } from '@/utils/materialProtection';

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
    lastAccessed?: string;
    timeSpent?: number;
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
  assignments?: Assignment[];
  stats: {
    totalMaterials: number;
    completedMaterials: number;
    totalAssignments?: number;
    submittedAssignments?: number;
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

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate?: string;
  maxScore: number;
  courseId: string;
  createdAt: string;
}

interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  content?: string;
  fileUrl?: string;
  submittedAt: string;
  grade?: number;
  score?: number; // Backend uses 'score' field
  feedback?: string;
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
  const [activeTab, setActiveTab] = useState<'materials' | 'assignments'>('materials');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<Record<string, AssignmentSubmission>>({});

  useEffect(() => {
    if (courseId && user) {
      fetchCourseData();
      fetchAssignments();
    }
  }, [courseId, user]);

  // Handle initial sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShowSidebar(true);
      } else {
        // On mobile, show sidebar initially so users can see the materials list
        setShowSidebar(true);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener for resize
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Enable material protection (disable save shortcuts)
  useEffect(() => {
    const cleanup = disableSaveShortcuts();
    return () => cleanup();
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

        // Set assignments if available from the progress response
        if (progressResponse.data.assignments) {
          setAssignments(progressResponse.data.assignments);
          // Update assignment submissions
          const submissions: Record<string, AssignmentSubmission> = {};
          progressResponse.data.assignments.forEach((assignment: Assignment & { submission?: AssignmentSubmission }) => {
            if (assignment.submission) {
              submissions[assignment.id] = assignment.submission;
            }
          });
          setAssignmentSubmissions(submissions);
        }

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

        // Only auto-select material on desktop, not on mobile
        // On mobile, users should see the materials list first
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

        if (!isMobile && materialsWithProgress.length > 0) {
          const firstIncomplete = materialsWithProgress.find((m: Material) => !m.progress?.isCompleted);
          const initialMaterial = firstIncomplete || materialsWithProgress[0];
          if (initialMaterial) {
            setCurrentMaterial(initialMaterial);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
      toast.error('Failed to load course content');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoadingAssignments(true);
      console.log('Fetching assignments for course:', courseId);
      const response = await api.assignments.getByCourse(courseId);
      console.log('Assignment API response:', response);

      if (response.success) {
        // Handle different possible response structures
        const assignmentData = response.data?.assignments || response.data || [];
        console.log('Setting assignments:', assignmentData);
        setAssignments(Array.isArray(assignmentData) ? assignmentData : []);

        // Fetch submissions for each assignment
        if (Array.isArray(assignmentData)) {
          await fetchAssignmentSubmissions(assignmentData);
        }
      } else {
        console.error('Assignment fetch failed:', response);
        toast.error(response.error?.message || 'Failed to load assignments');
      }
    } catch (error: any) {
      console.error('Error fetching assignments:', error);
      toast.error(error.message || 'Failed to load assignments');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const fetchAssignmentSubmissions = async (assignmentList: Assignment[]) => {
    try {
      const submissions: Record<string, AssignmentSubmission> = {};

      for (const assignment of assignmentList) {
        try {
          const response = await api.assignments.getSubmission(assignment.id);
          if (response.success && response.data?.submission) {
            submissions[assignment.id] = response.data.submission;
          }
        } catch (error) {
          console.error(`Error fetching submission for assignment ${assignment.id}:`, error);
        }
      }

      setAssignmentSubmissions(submissions);

      // Recalculate progress when submissions are loaded
      if (progress) {
        recalculateProgress(submissions);
      }
    } catch (error) {
      console.error('Error fetching assignment submissions:', error);
    }
  };

  const recalculateProgress = (submissions?: Record<string, AssignmentSubmission>) => {
    if (!progress) return;

    const currentSubmissions = submissions || assignmentSubmissions;
    const completedCount = progress.materials.filter(m => m.progress?.isCompleted).length;
    const completedAssignments = Object.keys(currentSubmissions).length;
    const totalAssignments = progress.stats.totalAssignments || assignments.length;

    // Calculate progress based on both materials and assignments
    const totalItems = progress.stats.totalMaterials + totalAssignments;
    const completedItems = completedCount + completedAssignments;
    const newProgressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    setProgress(prev => prev ? {
      ...prev,
      stats: {
        ...prev.stats,
        completedMaterials: completedCount,
        submittedAssignments: completedAssignments,
        totalAssignments: totalAssignments,
        progressPercentage: newProgressPercentage
      },
      enrollment: {
        ...prev.enrollment,
        progressPercentage: newProgressPercentage
      }
    } : null);
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
          progress: {
            isCompleted: true,
            lastAccessed: prev.progress?.lastAccessed,
            timeSpent: prev.progress?.timeSpent
          }
        } : null);

        // Update progress data
        if (progress) {
          const updatedMaterials = progress.materials.map(m =>
            m.id === currentMaterial.id
              ? {
                  ...m,
                  progress: {
                    isCompleted: true,
                    lastAccessed: m.progress?.lastAccessed,
                    timeSpent: m.progress?.timeSpent
                  }
                }
              : m
          );

          const completedCount = updatedMaterials.filter(m => m.progress?.isCompleted).length;
          const completedAssignments = Object.keys(assignmentSubmissions).length;
          const totalAssignments = assignments.length;

          // Calculate progress based on both materials and assignments
          const totalItems = progress.stats.totalMaterials + totalAssignments;
          const completedItems = completedCount + completedAssignments;
          const newProgressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

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
                ? {
                    ...m,
                    progress: {
                      isCompleted: true,
                      lastAccessed: m.progress?.lastAccessed,
                      timeSpent: m.progress?.timeSpent
                    }
                  }
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
        return <DocumentTextIcon className="h-5 w-5" />;
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
          <div className="w-full max-w-5xl mx-auto">
            {currentMaterial.fileUrl ? (
              <ProtectedVideo
                src={currentMaterial.fileUrl}
                className="w-full"
                watermarkText={user?.email || 'Protected Content'}
              />
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
          <div className="bg-white border rounded-lg overflow-hidden p-4">
            {currentMaterial.fileUrl ? (
              <div className="w-full max-w-4xl mx-auto">
                <CustomPDFViewer
                  src={getCdnUrl(currentMaterial.fileUrl) || ''}
                  className="w-full"
                />
              </div>
            ) : currentMaterial.content ? (
              <div className="prose max-w-none p-6 protected-content" onContextMenu={(e) => e.preventDefault()}>
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


      case 'LINK':
        return (
          <div className="bg-white border rounded-lg p-6">
            {currentMaterial.fileUrl ? (
              <div className="text-center">
                <LinkIcon className="h-16 w-16 mx-auto mb-4 text-indigo-500" />
                <h3 className="text-lg font-medium mb-4 text-slate-900">External Resource</h3>
                <a
                  href={getCdnUrl(currentMaterial.fileUrl) || ''}
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex flex-col lg:flex-row">
      {/* Mobile Sidebar Backdrop */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar */}
      {showSidebar && (
        <div className="w-full sm:w-96 lg:w-80 xl:w-96 bg-white border-r border-slate-200/80 overflow-hidden fixed lg:relative inset-0 z-50 lg:z-auto shadow-2xl lg:shadow-none transition-all duration-300">
          <div className="p-4 sm:p-5 lg:p-6 border-b border-slate-200/80 bg-gradient-to-r from-white to-slate-50/50">
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <h2 className="font-bold text-slate-900 truncate text-base sm:text-lg lg:text-xl">{course?.title}</h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="p-2 hover:bg-slate-100 active:bg-slate-200 rounded-xl transition-all flex-shrink-0 lg:hidden"
              >
                <XMarkIcon className="h-5 w-5 text-slate-600" />
              </button>
            </div>
            {progress && (
              <div className="space-y-4">
                {/* Main Progress Card */}
                <div className="bg-gradient-to-br from-white via-white to-blue-50/30 border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                      <div className="h-8 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
                      Course Progress
                    </h3>
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-md flex-shrink-0">
                      {Math.min(100, Math.round(progress.stats.progressPercentage))}%
                    </div>
                  </div>

                  <div className="relative w-full bg-slate-100 rounded-full h-3 overflow-hidden mb-4 shadow-inner">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out shadow-lg"
                      style={{ width: `${Math.min(100, progress.stats.progressPercentage)}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100/50 hover:shadow-md transition-all duration-300">
                      <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{progress.stats.completedMaterials}</div>
                      <div className="text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wide mt-1">Materials</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 border border-green-100/50 hover:shadow-md transition-all duration-300">
                      <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{progress.stats.submittedAssignments || Object.keys(assignmentSubmissions).length}</div>
                      <div className="text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wide mt-1">Tasks</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 text-center py-2 bg-slate-50/50 rounded-lg border border-slate-100">
                    <span className="font-semibold text-slate-700">{(progress.stats.totalMaterials + (progress.stats.totalAssignments || assignments.length)) - progress.stats.completedMaterials - (progress.stats.submittedAssignments || Object.keys(assignmentSubmissions).length)}</span> items remaining
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 bg-gradient-to-r from-slate-100 to-slate-50 p-1.5 rounded-xl border border-slate-200/50">
                  <button
                    onClick={() => setActiveTab('materials')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 min-h-[44px] ${
                      activeTab === 'materials'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                        : 'bg-white text-slate-600 hover:text-indigo-600 hover:shadow-md border border-slate-200/50'
                    }`}
                  >
                    <DocumentTextIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">Materials</span>
                    <span className="sm:hidden">Lessons</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('assignments');
                      fetchAssignments();
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 min-h-[44px] ${
                      activeTab === 'assignments'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                        : 'bg-white text-slate-600 hover:text-indigo-600 hover:shadow-md border border-slate-200/50'
                    }`}
                  >
                    <ClipboardDocumentListIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">Assignments</span>
                    <span className="sm:hidden">Tasks</span>
                  </button>
                </div>

              </div>
            )}
          </div>

          <div className="overflow-y-auto h-full pb-20 px-3 sm:px-4">
            {activeTab === 'materials' ? (
              modules.map((module, moduleIndex) => (
              <div key={module.id} className="mb-4 rounded-xl overflow-hidden border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="p-3 sm:p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 border-b border-indigo-100/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <span className="text-white text-sm sm:text-base font-bold">{moduleIndex + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">{module.title}</h3>
                      {module.description && (
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{module.description}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-white">
                  {module.materials.map((material) => (
                    <button
                      key={material.id}
                      onClick={() => handleMaterialSelect(material)}
                      className={`w-full p-3 sm:p-4 text-left transition-all duration-300 border-b border-slate-100 last:border-b-0 min-h-[60px] hover:bg-slate-50 active:bg-slate-100 ${
                        currentMaterial?.id === material.id
                          ? 'bg-gradient-to-r from-indigo-50 via-purple-50/50 to-transparent border-l-4 !border-l-indigo-600 shadow-sm'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl flex-shrink-0 transition-all duration-300 ${
                          material.progress?.isCompleted
                            ? 'bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/30'
                            : currentMaterial?.id === material.id
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30'
                            : 'bg-gradient-to-br from-slate-100 to-slate-200'
                        }`}>
                          {material.progress?.isCompleted ? (
                            <CheckCircleIconSolid className="h-5 w-5 text-white" />
                          ) : (
                            <div className={`h-5 w-5 ${
                              currentMaterial?.id === material.id ? 'text-white' : 'text-slate-500'
                            }`}>
                              {getMaterialIcon(material.type)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-semibold truncate text-sm ${
                            currentMaterial?.id === material.id ? 'text-indigo-900' : 'text-slate-900'
                          }`}>
                            {material.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500 capitalize font-medium">
                              {material.type.toLowerCase()}
                            </span>
                            {material.progress?.isCompleted && (
                              <span className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-0.5 rounded-full font-semibold shadow-sm">
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
            ))
            ) : (
              /* Assignments Tab */
              <div className="p-4">
                {loadingAssignments ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-2 text-slate-600 text-sm">Loading assignments...</span>
                  </div>
                ) : assignments.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {assignments.map((assignment) => {
                      return <AssignmentListItem key={assignment.id} assignment={assignment} onSelect={(a) => {
                        setSelectedAssignment(a);
                        setShowSubmissionModal(true);
                      }} />;
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ClipboardDocumentListIcon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    <h3 className="text-sm font-medium text-slate-900 mb-1">No assignments yet</h3>
                    <p className="text-xs text-slate-600">Assignments will appear here when they are created.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 p-3 sm:p-4 lg:p-5 shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-2 sm:gap-3">
              {!showSidebar && (
                <button
                  onClick={() => setShowSidebar(true)}
                  className="p-2 sm:p-2.5 hover:bg-indigo-50 active:bg-indigo-100 rounded-xl transition-all duration-300 border border-slate-200 hover:border-indigo-300 shadow-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <ListBulletIcon className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                </button>
              )}
              <Link href={`/courses/${courseId}`} className="hidden sm:block">
                <button className="flex items-center gap-2 text-slate-700 hover:text-indigo-600 font-semibold transition-all duration-300 bg-white hover:bg-indigo-50 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-md text-sm">
                  <ArrowLeftIcon className="h-4 w-4 flex-shrink-0" />
                  <span>Back to Course</span>
                </button>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousMaterial}
                disabled={!progress || progress.materials.filter(m => m.moduleId).findIndex(m => m.id === currentMaterial?.id) === 0}
                className="p-2.5 bg-white hover:bg-indigo-50 active:bg-indigo-100 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-md disabled:hover:bg-white disabled:hover:border-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700" />
              </button>
              <button
                onClick={handleNextMaterial}
                disabled={!progress || progress.materials.filter(m => m.moduleId).findIndex(m => m.id === currentMaterial?.id) === progress.materials.filter(m => m.moduleId).length - 1}
                className="p-2.5 bg-white hover:bg-indigo-50 active:bg-indigo-100 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-md disabled:hover:bg-white disabled:hover:border-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ArrowRightIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8">
          {currentMaterial && progress ? (
            <div className="max-w-6xl mx-auto">
              {/* Material Header */}
              <div className="mb-4 sm:mb-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/80 p-4 sm:p-5 lg:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex-shrink-0 shadow-lg shadow-indigo-500/30">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 text-white">
                      {getMaterialIcon(currentMaterial.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 mb-2 leading-tight">{currentMaterial.title}</h1>
                    {currentMaterial.description && (
                      <p className="text-slate-600 text-sm sm:text-base line-clamp-2">{currentMaterial.description}</p>
                    )}
                  </div>
                  {currentMaterial.progress?.isCompleted && (
                    <div className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 sm:px-4 py-2 rounded-full flex-shrink-0 shadow-lg shadow-green-500/30">
                      <CheckCircleIconSolid className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-xs sm:text-sm font-semibold hidden sm:inline">Completed</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="bg-gradient-to-r from-slate-100 to-slate-50 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200 shadow-sm">
                    Lesson {progress.materials.filter(m => m.moduleId).findIndex(m => m.id === currentMaterial.id) + 1} of {progress.materials.filter(m => m.moduleId).length}
                  </span>
                  <span className="capitalize bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/30">{currentMaterial.type.toLowerCase()}</span>
                </div>
              </div>

              {/* Material Content */}
              <div className="mb-3 sm:mb-4 md:mb-6">
                {renderMaterialContent()}
              </div>

              {/* Action Button */}
              {!currentMaterial.progress?.isCompleted && (
                <div className="flex justify-center">
                  <button
                    onClick={handleMarkComplete}
                    disabled={markingComplete}
                    className="group bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 text-sm sm:text-base font-semibold shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/60 hover:scale-105 active:scale-95 min-h-[56px]"
                  >
                    {markingComplete ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-2 border-white border-t-transparent"></div>
                        <span>Marking Complete...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform" />
                        <span>Mark as Complete</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center px-4 py-12 bg-white rounded-3xl border border-slate-200 shadow-lg max-w-md">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-3xl opacity-20"></div>
                  <DocumentTextIcon className="relative h-16 w-16 sm:h-20 sm:w-20 text-indigo-600 mx-auto" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">No Lesson Selected</h3>
                <p className="text-slate-600 text-sm sm:text-base mb-6">Choose a lesson from the sidebar to begin your learning journey.</p>
                <button
                  onClick={() => setShowSidebar(true)}
                  className="lg:hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 min-h-[48px]"
                >
                  Browse Lessons
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assignment Submission Modal */}
      {showSubmissionModal && selectedAssignment && (
        <AssignmentSubmissionModal
          assignment={selectedAssignment}
          courseId={courseId}
          onClose={() => {
            setShowSubmissionModal(false);
            setSelectedAssignment(null);
          }}
          onSubmit={async () => {
            // Refresh submissions after a new submission is made
            await fetchAssignmentSubmissions(assignments);
          }}
        />
      )}
    </div>
  );
}

// Assignment List Item Component
interface AssignmentListItemProps {
  assignment: Assignment;
  onSelect: (assignment: Assignment) => void;
}

function AssignmentListItem({ assignment, onSelect }: AssignmentListItemProps) {
  const [hasSubmission, setHasSubmission] = useState(false);
  const [submissionGrade, setSubmissionGrade] = useState<number | null>(null);

  useEffect(() => {
    const checkSubmission = async () => {
      try {
        const response = await api.assignments.getSubmission(assignment.id);
        if (response.success && response.data?.submission) {
          setHasSubmission(true);
          // Use score field (backend) or fall back to grade field for compatibility
          const currentGrade = response.data.submission.score ?? response.data.submission.grade;
          setSubmissionGrade(currentGrade ?? null);
        }
      } catch (error) {
        setHasSubmission(false);
        setSubmissionGrade(null);
      }
    };
    checkSubmission();
  }, [assignment.id]);

  const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
  const isGraded = submissionGrade !== null;

  return (
    <button
      onClick={() => onSelect(assignment)}
      className={`w-full p-2.5 sm:p-3 md:p-4 text-left border rounded-lg sm:rounded-xl transition-all duration-200 hover:shadow-md ${
        hasSubmission
          ? isGraded
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:from-green-100 hover:to-emerald-100'
            : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 hover:from-blue-100 hover:to-cyan-100'
          : isOverdue
          ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200 hover:from-red-100 hover:to-pink-100'
          : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-indigo-200'
      }`}
    >
      <div className="flex flex-col w-full">
        <div className="flex items-start flex-1 min-w-0">
          <div className={`p-1 sm:p-1.5 rounded-lg mr-2 flex-shrink-0 ${
            hasSubmission
              ? isGraded
                ? 'bg-green-100 border border-green-200'
                : 'bg-blue-100 border border-blue-200'
              : isOverdue
              ? 'bg-red-100 border border-red-200'
              : 'bg-indigo-100 border border-indigo-200'
          }`}>
            <ClipboardDocumentListIcon className={`h-4 w-4 ${
              hasSubmission
                ? isGraded
                  ? 'text-green-600'
                  : 'text-blue-600'
                : isOverdue
                ? 'text-red-600'
                : 'text-indigo-600'
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="mb-1.5 sm:mb-2">
              <h4 className="font-semibold text-xs sm:text-sm text-slate-900 break-words line-clamp-2 mb-1">
                {assignment.title}
              </h4>
              <div className="flex flex-wrap gap-1">
                {hasSubmission && (
                  <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium inline-block whitespace-nowrap ${
                    isGraded
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}>
                    {isGraded ? '✓ Graded' : '📤 Submitted'}
                  </span>
                )}
                {!hasSubmission && isOverdue && (
                  <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 border border-red-200 inline-block whitespace-nowrap">
                    ⏰ Overdue
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mb-2 sm:mb-3 line-clamp-2 break-words">
              {assignment.description}
            </p>
            <div className="flex flex-col gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                {assignment.dueDate && (
                  <div className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg whitespace-nowrap ${
                    isOverdue
                      ? 'bg-red-100 text-red-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    <CalendarIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                    <span className={`${isOverdue ? 'font-medium' : ''} truncate max-w-[120px] sm:max-w-none`}>
                      {isOverdue ? 'Due' : 'Due'} {new Date(assignment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )}
                <div className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-100 text-slate-600 rounded-md sm:rounded-lg whitespace-nowrap">
                  <span className="truncate">Max: {assignment.maxScore}pts</span>
                </div>
              </div>
              {isGraded && (
                <div className="flex items-center gap-1 flex-wrap">
                  <div className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 text-green-700 rounded-md sm:rounded-lg font-medium border border-green-200 whitespace-nowrap">
                    <span className="truncate">📊 {submissionGrade}/{assignment.maxScore}</span>
                  </div>
                  <div className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 text-green-700 rounded-md sm:rounded-lg font-medium border border-green-200 whitespace-nowrap">
                    <span>{Math.round((submissionGrade! / assignment.maxScore) * 100)}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

// Assignment Submission Modal Component
interface AssignmentSubmissionModalProps {
  assignment: Assignment;
  courseId: string;
  onClose: () => void;
  onSubmit?: () => Promise<void>;
}

function AssignmentSubmissionModal({ assignment, courseId, onClose, onSubmit }: AssignmentSubmissionModalProps) {
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>('');

  useEffect(() => {
    fetchSubmission();
  }, [assignment.id]);

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      const response = await api.assignments.getSubmission(assignment.id);
      console.log('Submission response:', response);

      if (response.success) {
        if (response.data?.submission && response.data.submission !== null) {
          // Submission exists
          setSubmission(response.data.submission);
          setSubmissionText(response.data.submission.content || '');
          setUploadedFileUrl(response.data.submission.fileUrl || '');
        } else {
          // No submission exists (submission is null)
          setSubmission(null);
          setSubmissionText('');
          setUploadedFileUrl('');
        }
      } else {
        // API call failed
        setSubmission(null);
        setSubmissionText('');
        setUploadedFileUrl('');
      }
    } catch (error) {
      console.error('Error fetching submission:', error);
      // If there's an error (like 404), assume no submission exists
      setSubmission(null);
      setSubmissionText('');
      setUploadedFileUrl('');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setSubmissionFile(file);
    toast.success('File selected! Click submit to upload and submit your assignment.');
  };

  const handleSubmit = async () => {
    if (!submissionText.trim() && !submissionFile) {
      toast.error('Please provide either text or upload a file.');
      return;
    }

    try {
      setSubmitting(true);
      let fileUrl = '';

      // Upload file if selected
      if (submissionFile) {
        const uploadResponse = await api.assignments.uploadFile(submissionFile);
        console.log('Upload response:', uploadResponse); // Debug log
        if (uploadResponse.success) {
          // Fix: Use fileUrl from the response, not url
          fileUrl = uploadResponse.data.fileUrl || uploadResponse.data.url;
          console.log('File URL to be submitted:', fileUrl); // Debug log
        } else {
          toast.error('Failed to upload file. Please try again.');
          return;
        }
      }

      const submissionData: { content?: string; fileUrl?: string } = {};

      if (submissionText.trim()) {
        submissionData.content = submissionText.trim();
      }

      if (fileUrl) {
        submissionData.fileUrl = fileUrl;
      }

      console.log('Submitting assignment with data:', submissionData); // Debug log

      const response = await api.assignments.submit(assignment.id, submissionData);

      if (response.success) {
        toast.success('Assignment submitted successfully!');
        await fetchSubmission(); // Refresh submission data
        if (onSubmit) {
          await onSubmit(); // Refresh parent state and recalculate progress
        }
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      console.error('Error message:', error.message);
      toast.error(error.message || 'Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
  const canSubmit = !submission && !isOverdue;

  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[98vh] sm:max-h-[90vh] mx-2 sm:mx-4 flex flex-col">
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 flex-shrink-0">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900 truncate pr-2">{assignment.title}</h2>
              <p className="text-slate-600 mt-1 text-xs sm:text-sm line-clamp-2 sm:line-clamp-none whitespace-pre-line">{assignment.description}</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 text-xs sm:text-sm text-slate-500">
                {assignment.dueDate && (
                  <div className="flex items-center">
                    <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className={`${isOverdue ? 'text-red-600' : ''} truncate`}>
                      <span className="hidden sm:inline">Due </span>{new Date(assignment.dueDate).toLocaleDateString()}
                      {isOverdue && <span className="hidden sm:inline"> (Overdue)</span>}
                      {isOverdue && <span className="sm:hidden text-red-600"> - Overdue</span>}
                    </span>
                  </div>
                )}
                <div className="flex items-center">
                  <span className="truncate">
                    <span className="hidden sm:inline">Max Score: </span>
                    <span className="sm:hidden">Max: </span>
                    {assignment.maxScore} pts
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
            >
              <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-6 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-6 sm:py-8">
              <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-slate-600 text-sm sm:text-base">Loading submission...</span>
            </div>
          ) : submission ? (
            /* Show existing submission */
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800 mb-2">Submission Completed</h3>
                <p className="text-sm text-green-700">
                  Submitted on {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'Unknown date'}
                </p>
                {(() => {
                  const currentGrade = submission.score ?? submission.grade;
                  return currentGrade !== null && currentGrade !== undefined && (
                    <p className="text-sm text-green-700 mt-1">
                      Grade: {currentGrade}/{assignment.maxScore} ({Math.round((currentGrade / assignment.maxScore) * 100)}%)
                    </p>
                  );
                })()}
              </div>

              {submission.content && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Text Submission</h4>
                  <div className="bg-slate-50 border rounded-lg p-4">
                    <p className="text-slate-700 whitespace-pre-wrap">{submission.content}</p>
                  </div>
                </div>
              )}

              {submission.fileUrl && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">File Submission</h4>
                  <a
                    href={getCdnUrl(submission.fileUrl) || submission.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <PaperClipIcon className="h-4 w-4 mr-2" />
                    View Submitted File
                  </a>
                </div>
              )}

              {submission.feedback && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Feedback</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800">{submission.feedback}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Show submission form */
            <div className="space-y-6">
              {isOverdue ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-medium text-red-800 mb-1">Assignment Overdue</h3>
                  <p className="text-sm text-red-700">
                    This assignment was due on {assignment.dueDate ? new Date(assignment.dueDate).toLocaleString() : 'Unknown date'}.
                    You can no longer submit.
                  </p>
                </div>
              ) : assignment.dueDate ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 mb-1">Assignment Open</h3>
                  <p className="text-sm text-blue-700">
                    Due: {new Date(assignment.dueDate).toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-800 mb-1">Assignment Open</h3>
                  <p className="text-sm text-green-700">
                    No due date specified. You can submit anytime.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                  Written Response
                </label>
                <textarea
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={5}
                  disabled={!canSubmit}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:cursor-not-allowed transition-colors text-sm text-slate-900 resize-none"
                />
                <p className="text-xs text-slate-500 mt-1">{submissionText.length} characters</p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2 sm:mb-3">
                  File Upload <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                {submissionFile ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                      <div className="p-1.5 sm:p-2 bg-blue-100 rounded-full flex-shrink-0">
                        <PaperClipIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-blue-900 truncate">{submissionFile.name}</p>
                        <p className="text-xs text-blue-700">
                          {(submissionFile.size / 1024 / 1024).toFixed(2)} MB • Ready to submit
                        </p>
                      </div>
                    </div>
                    {canSubmit && (
                      <button
                        onClick={() => {
                          setSubmissionFile(null);
                        }}
                        className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium px-2 sm:px-3 py-1 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 sm:p-8 text-center bg-white hover:border-slate-400 transition-colors">
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileSelect(file);
                        }
                      }}
                      disabled={!canSubmit}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.doc,.docx,.txt,.zip,.jpg,.jpeg,.png,.ppt,.pptx,.xls,.xlsx"
                    />
                    <label
                      htmlFor="file-upload"
                      className={`cursor-pointer ${!canSubmit ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <div className="space-y-3">
                        <div className="p-3 bg-slate-100 rounded-full w-fit mx-auto">
                          <PaperClipIcon className="h-8 w-8 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            Choose a file to upload
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            PDF, DOC, DOCX, TXT, ZIP, Images, PPT, XLS (Max 25MB)
                          </p>
                        </div>
                        <div className="text-xs text-slate-400">
                          File will be uploaded when you click Submit
                        </div>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {!loading && !submission && (
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-t border-slate-200 bg-slate-50 flex-shrink-0">
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-3">
              <button
                onClick={onClose}
                className="order-2 sm:order-1 w-full sm:w-auto px-4 py-2.5 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium min-h-[42px]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting || (!submissionText.trim() && !submissionFile)}
                className="order-1 sm:order-2 w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-medium text-sm min-h-[42px]"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span className="hidden sm:inline">Submitting Assignment...</span>
                    <span className="sm:hidden">Submitting...</span>
                  </>
                ) : (
                  <>
                    <PaperClipIcon className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Submit Assignment</span>
                    <span className="sm:hidden">Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}