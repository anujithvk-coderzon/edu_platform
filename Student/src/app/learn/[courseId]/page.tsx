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
          <div className="rounded-lg overflow-hidden">
            {currentMaterial.fileUrl ? (
              <video
                controls
                className="w-full md:w-5/6 h-auto rounded-lg mx-auto max-h-80 md:max-h-none"
                src={getCdnUrl(currentMaterial.fileUrl) || ''}
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
                  src={`${getCdnUrl(currentMaterial.fileUrl)}#toolbar=0&navpanes=0&scrollbar=1&statusbar=1&zoom=1&view=FitH`}
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

                  <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3">
                    <div className="bg-slate-50 rounded-lg p-2 md:p-3 border border-slate-200">
                      <div className="text-xl md:text-2xl font-semibold text-slate-900">{progress.stats.completedMaterials}</div>
                      <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">Materials Done</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2 md:p-3 border border-slate-200">
                      <div className="text-xl md:text-2xl font-semibold text-slate-900">{progress.stats.submittedAssignments || Object.keys(assignmentSubmissions).length}</div>
                      <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">Assignments Done</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 text-center">
                    {(progress.stats.totalMaterials + (progress.stats.totalAssignments || assignments.length)) - progress.stats.completedMaterials - (progress.stats.submittedAssignments || Object.keys(assignmentSubmissions).length)} items remaining
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab('materials')}
                    className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'materials'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <DocumentTextIcon className="h-4 w-4" />
                    <span>Materials</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('assignments');
                      // Refetch assignments when tab is accessed to get latest data
                      fetchAssignments();
                    }}
                    className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'assignments'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ClipboardDocumentListIcon className="h-4 w-4" />
                    <span>Assignments</span>
                  </button>
                </div>

              </div>
            )}
          </div>

          <div className="overflow-y-auto h-full pb-20">
            {activeTab === 'materials' ? (
              modules.map((module, moduleIndex) => (
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
      className={`w-full p-3 sm:p-4 text-left border rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-md ${
        hasSubmission
          ? isGraded
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:from-green-100 hover:to-emerald-100'
            : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 hover:from-blue-100 hover:to-cyan-100'
          : isOverdue
          ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200 hover:from-red-100 hover:to-pink-100'
          : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-indigo-200'
      }`}
    >
      <div className="flex flex-col">
        <div className="flex items-start flex-1 min-w-0">
          <div className={`p-1.5 sm:p-2 rounded-xl mr-2 sm:mr-3 flex-shrink-0 ${
            hasSubmission
              ? isGraded
                ? 'bg-green-100 border border-green-200'
                : 'bg-blue-100 border border-blue-200'
              : isOverdue
              ? 'bg-red-100 border border-red-200'
              : 'bg-indigo-100 border border-indigo-200'
          }`}>
            <ClipboardDocumentListIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${
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
            <div className="mb-2">
              <h4 className="font-semibold text-sm sm:text-base text-slate-900 break-words line-clamp-2 mb-1">
                {assignment.title}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {hasSubmission && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium inline-block ${
                    isGraded
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}>
                    {isGraded ? '✓ Graded' : '📤 Submitted'}
                  </span>
                )}
                {!hasSubmission && isOverdue && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 border border-red-200 inline-block">
                    ⏰ Overdue
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-3 line-clamp-2 whitespace-pre-line">
              {assignment.description}
            </p>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                {assignment.dueDate && (
                  <div className={`inline-flex items-center px-2 py-1 rounded-lg ${
                    isOverdue
                      ? 'bg-red-100 text-red-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    <CalendarIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className={`${isOverdue ? 'font-medium' : ''}`}>
                      {isOverdue ? 'Was due' : 'Due'} {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">
                  <span>Max: {assignment.maxScore} pts</span>
                </div>
              </div>
              {isGraded && (
                <div className="inline-flex items-center gap-1 flex-wrap">
                  <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-lg font-medium border border-green-200">
                    <span>📊 Score: {submissionGrade}/{assignment.maxScore}</span>
                  </div>
                  <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-lg font-medium border border-green-200">
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:cursor-not-allowed transition-colors text-sm resize-none"
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