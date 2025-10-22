'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import type { SelectOption } from '../../components/ui/Select';
import {
  MagnifyingGlassIcon,
  UserIcon,
  AcademicCapIcon,
  ClockIcon,
  ChartBarIcon,
  EnvelopeIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  TrophyIcon,
  StarIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  PlayIcon,
  DocumentIcon,
  PhotoIcon,
  MusicalNoteIcon,
  LinkIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { api } from '../../lib/api';
import { Course } from '../../types/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  country?: string;
  city?: string;
  education?: string;
  institution?: string;
  occupation?: string;
  company?: string;
  isVerified?: boolean;
  isActive?: boolean;
  blocked?: boolean;
  registeredAt?: string;
  totalCourses: number;
  completedCourses: number;
  totalSpentHours: number;
  joinedAt: string;
  lastActive: string;
  totalMaterials?: number;
  completedMaterials?: number;
  totalAssignments?: number;
  submittedAssignments?: number;
  gradedAssignments?: number;
  enrollments: {
    courseId: string;
    courseTitle: string;
    enrolledAt: string;
    status: 'ACTIVE' | 'COMPLETED' | 'DROPPED';
    progressPercentage: number;
    totalMaterials?: number;
    completedMaterials?: number;
    completedMaterialsList?: {
      id: string;
      title: string;
      type: string;
      completedAt: string;
      chapter: {
        id: string;
        title: string;
        orderIndex: number;
      } | null;
    }[];
    totalAssignments?: number;
    submittedAssignments?: number;
    gradedAssignments?: number;
    submittedAssignmentsList?: {
      id: string;
      assignmentId: string;
      title: string;
      submittedAt: string;
      status: string;
      score: number | null;
      maxScore: number;
    }[];
    creator?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    } | null;
    tutor?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    } | null;
  }[];
}

interface RegisteredStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  country?: string;
  city?: string;
  education?: string;
  institution?: string;
  occupation?: string;
  company?: string;
  isVerified: boolean;
  isActive: boolean;
  blocked?: boolean;
  registeredAt: string;
  lastActive: string;
}

interface StudentsStats {
  totalStudents: number;
  activeStudents: number;
  newThisMonth: number;
  averageProgress: number;
  topPerformers: number;
  totalRevenue: number;
}

const filterOptions: SelectOption[] = [
  { value: 'all', label: 'All Students' },
  { value: 'enrolled', label: 'Course Enrolled' },
  { value: 'completed', label: 'Completed Students' },
  { value: 'new', label: 'New This Month' },
  { value: 'blocked', label: 'Blocked Students' }
];

const sortOptions: SelectOption[] = [
  { value: 'name', label: 'Name' },
  { value: 'joinedAt', label: 'Join Date' },
  { value: 'lastActive', label: 'Last Active' }
];

const getMaterialIcon = (type: string) => {
  switch (type.toUpperCase()) {
    case 'VIDEO':
      return <PlayIcon className="w-3 h-3" />;
    case 'PDF':
    case 'DOCUMENT':
      return <DocumentIcon className="w-3 h-3" />;
    case 'IMAGE':
      return <PhotoIcon className="w-3 h-3" />;
    case 'AUDIO':
      return <MusicalNoteIcon className="w-3 h-3" />;
    case 'LINK':
      return <LinkIcon className="w-3 h-3" />;
    default:
      return <DocumentTextIcon className="w-3 h-3" />;
  }
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<StudentsStats>({
    totalStudents: 0,
    activeStudents: 0,
    newThisMonth: 0,
    averageProgress: 0,
    topPerformers: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('enrolled');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const handleSendMessage = (studentEmail: string) => {
    // Open Gmail with the student's email as recipient
    window.open(`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(studentEmail)}`, '_blank');
  };

  const handleBlockStudent = async (studentId: string, studentName: string) => {
    const confirmed = confirm(
      `Are you sure you want to block "${studentName}"?\n\nThis student will not be able to log in to their account until you unblock them.`
    );

    if (!confirmed) return;

    try {
      const response = await api.admin.blockStudent(studentId);

      if (response.success) {
        setStudents(prev => prev.map(student =>
          student.id === studentId ? { ...student, blocked: true } : student
        ));
        toast.success(`${studentName} has been blocked successfully`);
      } else {
        toast.error(response.error?.message || 'Failed to block student');
      }
    } catch (error: any) {
      console.error('Error blocking student:', error);
      toast.error(error.message || 'Failed to block student');
    }
  };

  const handleUnblockStudent = async (studentId: string, studentName: string) => {
    const confirmed = confirm(
      `Are you sure you want to unblock "${studentName}"?\n\nThis student will be able to log in to their account again.`
    );

    if (!confirmed) return;

    try {
      const response = await api.admin.unblockStudent(studentId);

      if (response.success) {
        setStudents(prev => prev.map(student =>
          student.id === studentId ? { ...student, blocked: false } : student
        ));
        toast.success(`${studentName} has been unblocked successfully`);
      } else {
        toast.error(response.error?.message || 'Failed to unblock student');
      }
    } catch (error: any) {
      console.error('Error unblocking student:', error);
      toast.error(error.message || 'Failed to unblock student');
    }
  };

  useEffect(() => {
    fetchStudentsData();
  }, []);

  // Adjust sort order based on sort field
  useEffect(() => {
    if (sortBy === 'name') {
      setSortOrder('asc'); // A-Z for names
    } else if (sortBy === 'joinedAt' || sortBy === 'lastActive') {
      setSortOrder('desc'); // Newest first for dates
    }
  }, [sortBy]);

  useEffect(() => {
    filterAndSortStudents();
  }, [students, searchTerm, filterBy, sortBy, sortOrder]);

  const fetchStudentsData = async () => {
    try {
      setLoading(true);

      // Fetch all registered students with full details
      let allRegisteredStudents: RegisteredStudent[] = [];
      try {
        const registeredResponse = await api.admin.getAllRegisteredStudents();
        if (registeredResponse.success) {
          allRegisteredStudents = registeredResponse.data.students || [];
        }
      } catch (error) {
        console.error('Error fetching registered students:', error);
      }

      // Fetch real student data from the API - this shows only enrolled students
      const studentsResponse = await api.students.getAll();
      if (studentsResponse.success) {
        const enrolledStudents = studentsResponse.data.students || [];

        // Merge enrolled students data with registered students data
        const mergedStudents = allRegisteredStudents.map((regStudent) => {
          const enrolledData = enrolledStudents.find((es: Student) => es.id === regStudent.id);

          if (enrolledData) {
            // Student has enrollments - merge data
            return {
              ...enrolledData,
              phone: regStudent.phone,
              dateOfBirth: regStudent.dateOfBirth,
              gender: regStudent.gender,
              country: regStudent.country,
              city: regStudent.city,
              education: regStudent.education,
              institution: regStudent.institution,
              occupation: regStudent.occupation,
              company: regStudent.company,
              isVerified: regStudent.isVerified,
              isActive: regStudent.isActive,
              blocked: regStudent.blocked,
              registeredAt: regStudent.registeredAt,
            };
          } else {
            // Student has no enrollments - create basic structure
            return {
              ...regStudent,
              totalCourses: 0,
              completedCourses: 0,
              totalSpentHours: 0,
              joinedAt: regStudent.registeredAt,
              lastActive: regStudent.lastActive,
              enrollments: [],
            };
          }
        });

        // Get total students count from database (like dashboard does)
        let totalStudentsCount = allRegisteredStudents.length;

        // Calculate stats based on all registered students
        const activeStudents = mergedStudents.filter((s: Student) => s.enrollments.some((e: Student['enrollments'][0]) => e.status === 'ACTIVE')).length;
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const newThisMonth = mergedStudents.filter((s: Student) => new Date(s.joinedAt) > oneMonthAgo).length;

        const totalProgress = mergedStudents.reduce((sum: number, s: Student) => {
          const avgProgress = s.enrollments.length > 0
            ? s.enrollments.reduce((eSum: number, e: Student['enrollments'][0]) => eSum + e.progressPercentage, 0) / s.enrollments.length
            : 0;
          return sum + avgProgress;
        }, 0);
        const averageProgress = mergedStudents.length > 0 ? totalProgress / mergedStudents.length : 0;

        const topPerformers = mergedStudents.filter((s: Student) =>
          s.enrollments.some((e: Student['enrollments'][0]) => e.progressPercentage > 80)
        ).length;

        const realStats = {
          totalStudents: totalStudentsCount,
          activeStudents: activeStudents,
          newThisMonth: newThisMonth,
          averageProgress: averageProgress,
          topPerformers: topPerformers,
          totalRevenue: 0
        };

        setStudents(mergedStudents);
        setStats(realStats);
      }

      // Also get tutor's courses for reference
      const coursesResponse = await api.courses.getMyCourses();
      if (coursesResponse.success) {
        const tutorCourses = coursesResponse.data.courses || [];
        setCourses(tutorCourses);
      }
    } catch (error: any) {
      console.error('Error fetching students data:', error);
      // Fall back to empty data
      setStudents([]);
      setStats({
        totalStudents: 0,
        activeStudents: 0,
        newThisMonth: 0,
        averageProgress: 0,
        topPerformers: 0,
        totalRevenue: 0
      });
    } finally {
      setLoading(false);
    }
  };


  const filterAndSortStudents = () => {
    let filtered = [...students];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    switch (filterBy) {
      case 'enrolled':
        filtered = filtered.filter(s => s.enrollments && s.enrollments.length > 0);
        break;
      case 'completed':
        filtered = filtered.filter(s => s.completedCourses > 0);
        break;
      case 'new':
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        filtered = filtered.filter(s => new Date(s.joinedAt) > oneMonthAgo);
        break;
      case 'blocked':
        filtered = filtered.filter(s => s.blocked === true);
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valueA: string | number | Date;
      let valueB: string | number | Date;

      switch (sortBy) {
        case 'name':
          valueA = `${a.firstName} ${a.lastName}`;
          valueB = `${b.firstName} ${b.lastName}`;
          break;
        case 'joinedAt':
          valueA = new Date(a.joinedAt);
          valueB = new Date(b.joinedAt);
          break;
        case 'progress':
          valueA = a.enrollments.length > 0
            ? a.enrollments.reduce((sum, e) => sum + e.progressPercentage, 0) / a.enrollments.length
            : 0;
          valueB = b.enrollments.length > 0
            ? b.enrollments.reduce((sum, e) => sum + e.progressPercentage, 0) / b.enrollments.length
            : 0;
          break;
        case 'courses':
          valueA = a.totalCourses;
          valueB = b.totalCourses;
          break;
        case 'lastActive':
          valueA = new Date(a.lastActive);
          valueB = new Date(b.lastActive);
          break;
        default:
          valueA = a.firstName;
          valueB = b.firstName;
      }

      // Handle comparison for different types
      if (valueA instanceof Date && valueB instanceof Date) {
        return sortOrder === 'asc'
          ? valueA.getTime() - valueB.getTime()
          : valueB.getTime() - valueA.getTime();
      }

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
      }

      // String comparison
      const strA = String(valueA).toLowerCase();
      const strB = String(valueB).toLowerCase();

      if (sortOrder === 'asc') {
        return strA > strB ? 1 : strA < strB ? -1 : 0;
      } else {
        return strB > strA ? 1 : strB < strA ? -1 : 0;
      }
    });

    setFilteredStudents(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800';
      case 'DROPPED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'ACTIVE':
        return <ClockIcon className="w-4 h-4" />;
      case 'DROPPED':
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <ExclamationTriangleIcon className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="animate-pulse">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6 sm:mb-8">
              <div className="h-6 sm:h-8 bg-slate-200 rounded w-1/2 sm:w-1/3 mx-auto mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4 sm:w-1/2 mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 sm:h-24 bg-white rounded-xl shadow-sm border border-slate-200"></div>
              ))}
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6">
              <div className="h-4 bg-slate-200 rounded w-full mb-4"></div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="h-10 bg-slate-200 rounded w-full sm:w-1/3"></div>
                <div className="h-10 bg-slate-200 rounded w-full sm:w-32"></div>
              </div>
            </div>
            <div className="h-80 sm:h-96 bg-white rounded-xl shadow-sm border border-slate-200"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-2">
                My Students
              </h1>
              <p className="text-slate-600 text-sm sm:text-base">Track your students&apos; progress and engagement</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-white shadow-sm border border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Total Students</p>
                  <p className="text-2xl font-semibold text-slate-900">{stats.totalStudents}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UserGroupIcon className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Actively Enrolled</p>
                  <p className="text-2xl font-semibold text-slate-900">{stats.activeStudents}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <AcademicCapIcon className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Avg Progress</p>
                  <p className="text-2xl font-semibold text-slate-900">{stats.averageProgress.toFixed(0)}%</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Top Performers</p>
                  <p className="text-2xl font-semibold text-slate-900">{stats.topPerformers}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <TrophyIcon className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6 bg-white shadow-sm border border-slate-200 relative z-10">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="w-full relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <MagnifyingGlassIcon className="w-4 h-4 text-slate-400" />
                </div>
                <Input
                  placeholder="Search students by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 relative z-20">
                <Select
                  value={filterBy}
                  onChange={setFilterBy}
                  options={filterOptions}
                  className="w-full sm:w-auto sm:min-w-[140px]"
                />

                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  options={sortOptions}
                  className="w-full sm:w-auto sm:min-w-[120px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <Card className="bg-white shadow-sm border border-slate-200">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900 mb-1">
                  Students ({filteredStudents.length})
                </CardTitle>
                <CardDescription className="text-slate-600 text-sm">
                  {filterBy === 'enrolled' ? 'Currently enrolled students' :
                   filterBy === 'completed' ? 'Students who completed courses' :
                   filterBy === 'new' ? 'New registrations this month' :
                   filterBy === 'blocked' ? 'Students blocked by administrator' :
                   'All registered students'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {filteredStudents.length > 0 ? (
              <div className="space-y-4">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="bg-white border-2 border-slate-200 rounded-xl p-4 sm:p-5 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 cursor-pointer"
                    onClick={() => setSelectedStudent(selectedStudent?.id === student.id ? null : student)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                          {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                              {student.firstName} {student.lastName}
                            </h3>
                            {/* Enrollment Status Badge */}
                            {student.enrollments && student.enrollments.length > 0 ? (
                              student.completedCourses > 0 && student.completedCourses === student.totalCourses ? (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex-shrink-0">
                                  ✓ Completed
                                </span>
                              ) : student.enrollments.some(e => e.status === 'ACTIVE') ? (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full flex-shrink-0">
                                  • Enrolled
                                </span>
                              ) : null
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full flex-shrink-0">
                                Not Enrolled
                              </span>
                            )}
                            {/* Blocked Status Badge */}
                            {student.blocked && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full flex-shrink-0 border border-red-300">
                                🚫 Blocked
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-3 truncate">{student.email}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                            {student.enrollments && student.enrollments.length > 0 && (
                              <>
                                <span className="flex items-center bg-blue-50 px-2 py-1 rounded-md">
                                  <BookOpenIcon className="w-3 h-3 mr-1 flex-shrink-0 text-blue-600" />
                                  <span className="font-medium text-blue-700">{student.totalCourses} {student.totalCourses === 1 ? 'course' : 'courses'}</span>
                                </span>
                                {student.completedCourses > 0 && (
                                  <span className="flex items-center bg-green-50 px-2 py-1 rounded-md">
                                    <CheckCircleIcon className="w-3 h-3 mr-1 flex-shrink-0 text-green-600" />
                                    <span className="font-medium text-green-700">{student.completedCourses} completed</span>
                                  </span>
                                )}
                              </>
                            )}
                            <span className="flex items-center">
                              <CalendarIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span className="truncate">Joined {new Date(student.joinedAt).toLocaleDateString()}</span>
                            </span>
                          </div>

                          {/* Enhanced completion statistics - Only show for enrolled students */}
                          {student.enrollments && student.enrollments.length > 0 && (student.totalMaterials !== undefined || student.totalAssignments !== undefined) && (
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                                {/* Materials Stats */}
                                <div className="bg-blue-50 rounded-lg p-2 text-center border border-blue-100">
                                  <DocumentTextIcon className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                                  <div className="text-xs font-medium text-blue-700">
                                    {student.completedMaterials || 0}/{student.totalMaterials || 0}
                                  </div>
                                  <div className="text-xs text-blue-600">Materials</div>
                                </div>

                                {/* Assignments Stats */}
                                <div className="bg-green-50 rounded-lg p-2 text-center border border-green-100">
                                  <ClipboardDocumentListIcon className="w-4 h-4 text-green-500 mx-auto mb-1" />
                                  <div className="text-xs font-medium text-green-700">
                                    {student.submittedAssignments || 0}/{student.totalAssignments || 0}
                                  </div>
                                  <div className="text-xs text-green-600">Assignments</div>
                                </div>

                                {/* Graded Stats */}
                                {student.gradedAssignments !== undefined && student.gradedAssignments > 0 && (
                                  <div className="bg-emerald-50 rounded-lg p-2 text-center border border-emerald-100">
                                    <CheckCircleIcon className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                                    <div className="text-xs font-medium text-emerald-700">
                                      {student.gradedAssignments}
                                    </div>
                                    <div className="text-xs text-emerald-600">Graded</div>
                                  </div>
                                )}

                                {/* Remaining Items */}
                                {(() => {
                                  const totalItems = (student.totalMaterials || 0) + (student.totalAssignments || 0);
                                  const completedItems = (student.completedMaterials || 0) + (student.submittedAssignments || 0);
                                  const remaining = totalItems - completedItems;
                                  return remaining > 0 ? (
                                    <div className="bg-orange-50 rounded-lg p-2 text-center border border-orange-100">
                                      <ClockIcon className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                                      <div className="text-xs font-medium text-orange-700">
                                        {remaining}
                                      </div>
                                      <div className="text-xs text-orange-600">Remaining</div>
                                    </div>
                                  ) : (
                                    <div className="bg-green-50 rounded-lg p-2 text-center border border-green-100">
                                      <TrophyIcon className="w-4 h-4 text-green-500 mx-auto mb-1" />
                                      <div className="text-xs font-medium text-green-700">
                                        All Done!
                                      </div>
                                      <div className="text-xs text-green-600">Complete</div>
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Progress Summary */}
                              <div className="text-center">
                                <div className="text-xs text-slate-600">
                                  Overall completion across all courses
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex flex-col items-end gap-2">
                          {student.enrollments && student.enrollments.length > 0 ? (
                            <>
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <div className="text-lg font-bold text-indigo-600">
                                    {(student.enrollments.reduce((sum, e) => sum + e.progressPercentage, 0) / student.enrollments.length).toFixed(0)}%
                                  </div>
                                  <div className="text-xs text-slate-500">Avg Progress</div>
                                </div>
                                <div className="w-16 sm:w-20 h-16 sm:h-20">
                                  <svg className="transform -rotate-90 w-full h-full">
                                    <circle
                                      cx="50%"
                                      cy="50%"
                                      r="30"
                                      stroke="currentColor"
                                      strokeWidth="6"
                                      fill="transparent"
                                      className="text-slate-200"
                                    />
                                    <circle
                                      cx="50%"
                                      cy="50%"
                                      r="30"
                                      stroke="currentColor"
                                      strokeWidth="6"
                                      fill="transparent"
                                      strokeDasharray={`${2 * Math.PI * 30}`}
                                      strokeDashoffset={`${2 * Math.PI * 30 * (1 - (student.enrollments.reduce((sum, e) => sum + e.progressPercentage, 0) / student.enrollments.length) / 100)}`}
                                      className="text-indigo-600 transition-all duration-300"
                                    />
                                  </svg>
                                </div>
                              </div>
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <ClockIcon className="w-3 h-3" />
                                {new Date(student.lastActive).toLocaleDateString()}
                              </p>
                            </>
                          ) : (
                            <div className="text-right">
                              <div className="text-sm text-slate-500 mb-1">No progress yet</div>
                              <p className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                                <CalendarIcon className="w-3 h-3" />
                                {new Date(student.lastActive).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {/* Block/Unblock Button - Always Visible */}
                          <div onClick={(e) => e.stopPropagation()}>
                            {student.blocked ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnblockStudent(student.id, `${student.firstName} ${student.lastName}`)}
                                className="border-green-300 text-green-700 hover:bg-green-50 whitespace-nowrap text-xs px-2 py-1 h-auto"
                              >
                                <CheckCircleIcon className="w-3 h-3 mr-1" />
                                Unblock
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBlockStudent(student.id, `${student.firstName} ${student.lastName}`)}
                                className="border-red-300 text-red-700 hover:bg-red-50 whitespace-nowrap text-xs px-2 py-1 h-auto"
                              >
                                <XCircleIcon className="w-3 h-3 mr-1" />
                                Block
                              </Button>
                            )}
                          </div>
                        </div>
                        {/* Expand/Collapse Indicator */}
                        <div className="ml-2">
                          <ChevronDownIcon
                            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                              selectedStudent?.id === student.id ? 'transform rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Student Details */}
                    {selectedStudent?.id === student.id && (
                      <div className="mt-6 pt-6 border-t-2 border-slate-200">
                        {/* Student Information */}
                        <div className="mb-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-5 border-2 border-slate-300">
                          <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <UserIcon className="w-5 h-5" />
                            Student Details
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Full Name */}
                            <div className="bg-white rounded-lg p-3 border border-slate-200">
                              <div className="text-xs font-medium text-slate-500 mb-1">Full Name</div>
                              <div className="text-sm font-semibold text-slate-900">
                                {student.firstName} {student.lastName}
                              </div>
                            </div>

                            {/* Email */}
                            <div className="bg-white rounded-lg p-3 border border-slate-200">
                              <div className="text-xs font-medium text-slate-500 mb-1">Email</div>
                              <div className="text-sm font-semibold text-slate-900 truncate">
                                {student.email}
                              </div>
                            </div>

                            {/* Mobile Number */}
                            {student.phone && (
                              <div className="bg-white rounded-lg p-3 border border-slate-200">
                                <div className="text-xs font-medium text-slate-500 mb-1">Mobile Number</div>
                                <div className="text-sm font-semibold text-slate-900">
                                  {student.phone}
                                </div>
                              </div>
                            )}

                            {/* Date of Birth */}
                            {student.dateOfBirth && (
                              <div className="bg-white rounded-lg p-3 border border-slate-200">
                                <div className="text-xs font-medium text-slate-500 mb-1">Date of Birth</div>
                                <div className="text-sm font-semibold text-slate-900">
                                  {new Date(student.dateOfBirth).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Gender */}
                            {student.gender && (
                              <div className="bg-white rounded-lg p-3 border border-slate-200">
                                <div className="text-xs font-medium text-slate-500 mb-1">Gender</div>
                                <div className="text-sm font-semibold text-slate-900">
                                  {student.gender}
                                </div>
                              </div>
                            )}

                            {/* Country */}
                            {student.country && (
                              <div className="bg-white rounded-lg p-3 border border-slate-200">
                                <div className="text-xs font-medium text-slate-500 mb-1">Country</div>
                                <div className="text-sm font-semibold text-slate-900">
                                  {student.country}
                                </div>
                              </div>
                            )}

                            {/* City */}
                            {student.city && (
                              <div className="bg-white rounded-lg p-3 border border-slate-200">
                                <div className="text-xs font-medium text-slate-500 mb-1">City</div>
                                <div className="text-sm font-semibold text-slate-900">
                                  {student.city}
                                </div>
                              </div>
                            )}

                            {/* Education */}
                            {student.education && (
                              <div className="bg-white rounded-lg p-3 border border-slate-200">
                                <div className="text-xs font-medium text-slate-500 mb-1">Education Level</div>
                                <div className="text-sm font-semibold text-slate-900">
                                  {student.education}
                                </div>
                              </div>
                            )}

                            {/* Institution */}
                            {student.institution && (
                              <div className="bg-white rounded-lg p-3 border border-slate-200">
                                <div className="text-xs font-medium text-slate-500 mb-1">Institution</div>
                                <div className="text-sm font-semibold text-slate-900">
                                  {student.institution}
                                </div>
                              </div>
                            )}

                            {/* Occupation */}
                            {student.occupation && (
                              <div className="bg-white rounded-lg p-3 border border-slate-200">
                                <div className="text-xs font-medium text-slate-500 mb-1">Occupation</div>
                                <div className="text-sm font-semibold text-slate-900">
                                  {student.occupation}
                                </div>
                              </div>
                            )}

                            {/* Company */}
                            {student.company && (
                              <div className="bg-white rounded-lg p-3 border border-slate-200">
                                <div className="text-xs font-medium text-slate-500 mb-1">Company</div>
                                <div className="text-sm font-semibold text-slate-900">
                                  {student.company}
                                </div>
                              </div>
                            )}

                            {/* Registration Date */}
                            {student.registeredAt && (
                              <div className="bg-white rounded-lg p-3 border border-slate-200">
                                <div className="text-xs font-medium text-slate-500 mb-1">Registered On</div>
                                <div className="text-sm font-semibold text-slate-900">
                                  {new Date(student.registeredAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Verification Status */}
                            <div className="bg-white rounded-lg p-3 border border-slate-200">
                              <div className="text-xs font-medium text-slate-500 mb-1">Account Status</div>
                              <div className="flex gap-2 flex-wrap">
                                {student.isVerified ? (
                                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                                    ✓ Verified
                                  </span>
                                ) : (
                                  <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-semibold">
                                    ⚠ Unverified
                                  </span>
                                )}
                                {student.isActive ? (
                                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                                    Active
                                  </span>
                                ) : (
                                  <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-semibold">
                                    Inactive
                                  </span>
                                )}
                                {student.blocked ? (
                                  <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-semibold">
                                    🚫 Blocked
                                  </span>
                                ) : (
                                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                                    ✓ Not Blocked
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Block/Unblock Actions */}
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <div className="flex gap-3 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSendMessage(student.email)}
                                className="border-blue-300 text-blue-700 hover:bg-blue-50"
                              >
                                <EnvelopeIcon className="w-4 h-4 mr-1.5" />
                                Send Email
                              </Button>
                              {student.blocked ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUnblockStudent(student.id, `${student.firstName} ${student.lastName}`)}
                                  className="border-green-300 text-green-700 hover:bg-green-50"
                                >
                                  <CheckCircleIcon className="w-4 h-4 mr-1.5" />
                                  Unblock Student
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleBlockStudent(student.id, `${student.firstName} ${student.lastName}`)}
                                  className="border-red-300 text-red-700 hover:bg-red-50"
                                >
                                  <XCircleIcon className="w-4 h-4 mr-1.5" />
                                  Block Student
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Enrollment Details - Only show if student has enrollments */}
                        {student.enrollments && student.enrollments.length > 0 ? (
                          <>
                            {/* Section Header with Summary Stats */}
                            <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                  <h4 className="text-lg font-bold text-slate-900 mb-1">
                                    Enrolled Courses Overview
                                  </h4>
                                  <p className="text-sm text-slate-600">
                                    Detailed progress tracking across all enrolled courses
                                  </p>
                                </div>
                                <div className="flex gap-4">
                                  <div className="text-center px-4 py-2 bg-white rounded-lg shadow-sm">
                                    <div className="text-2xl font-bold text-blue-600">{student.enrollments.length}</div>
                                    <div className="text-xs text-slate-600 font-medium">Total Courses</div>
                                  </div>
                                  <div className="text-center px-4 py-2 bg-white rounded-lg shadow-sm">
                                    <div className="text-2xl font-bold text-green-600">{student.completedCourses}</div>
                                    <div className="text-xs text-slate-600 font-medium">Completed</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Course Cards */}
                            <div className="space-y-6">
                          {student.enrollments.map((enrollment, index) => {
                            const materialCompletionRate = enrollment.totalMaterials ?
                              Math.round(((enrollment.completedMaterials || 0) / enrollment.totalMaterials) * 100) : 0;
                            const assignmentCompletionRate = enrollment.totalAssignments ?
                              Math.round(((enrollment.submittedAssignments || 0) / enrollment.totalAssignments) * 100) : 0;

                            const totalItems = (enrollment.totalMaterials || 0) + (enrollment.totalAssignments || 0);
                            const completedItems = (enrollment.completedMaterials || 0) + (enrollment.submittedAssignments || 0);
                            const remainingItems = totalItems - completedItems;

                            // Calculate ungraded assignments (submitted but not graded)
                            const ungradedAssignments = (enrollment.submittedAssignments || 0) - (enrollment.gradedAssignments || 0);

                            return (
                              <div key={index} className="bg-white border-2 border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                                {/* Course Header Section */}
                                <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-4 sm:p-5 border-b-2 border-slate-200 rounded-t-xl">
                                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                    {/* Left: Course Info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                                          <BookOpenIcon className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h5 className="text-base sm:text-lg font-bold text-slate-900 mb-2 line-clamp-2">
                                            {enrollment.courseTitle}
                                          </h5>
                                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
                                            <div className="flex items-center gap-1">
                                              <CalendarIcon className="w-4 h-4 text-slate-500" />
                                              <span className="font-medium">Enrolled:</span>
                                              <span>{new Date(enrollment.enrolledAt).toLocaleDateString()}</span>
                                            </div>
                                            {enrollment.creator && (
                                              <div className="flex items-center gap-1">
                                                <UserIcon className="w-4 h-4 text-slate-500" />
                                                <span className="font-medium">Creator:</span>
                                                <span>{enrollment.creator.firstName} {enrollment.creator.lastName}</span>
                                              </div>
                                            )}
                                            {enrollment.tutor && (
                                              <div className="flex items-center gap-1">
                                                <AcademicCapIcon className="w-4 h-4 text-slate-500" />
                                                <span className="font-medium">Tutor:</span>
                                                <span>{enrollment.tutor.firstName} {enrollment.tutor.lastName}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Right: Progress & Status */}
                                    <div className="flex items-center gap-4">
                                      <div className="text-center px-4 py-3 bg-white rounded-lg shadow-sm border border-slate-200">
                                        <div className="text-2xl font-bold text-indigo-600 mb-1">
                                          {enrollment.progressPercentage}%
                                        </div>
                                        <div className="text-xs text-slate-600 font-medium">Progress</div>
                                        <div className="w-24 bg-slate-200 rounded-full h-2 mt-2">
                                          <div
                                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${enrollment.progressPercentage}%` }}
                                          />
                                        </div>
                                      </div>
                                      <span className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm ${getStatusColor(enrollment.status)}`}>
                                        {enrollment.status}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Progress Metrics Section */}
                                <div className="p-5 sm:p-6 bg-slate-50">
                                  <h6 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">
                                    Performance Metrics
                                  </h6>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Materials Progress Card */}
                                    <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500 shadow-sm">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                                          </div>
                                          <span className="text-sm font-bold text-slate-700">Learning Materials</span>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex items-baseline justify-between">
                                          <span className="text-2xl font-bold text-blue-600">
                                            {enrollment.completedMaterials || 0}
                                          </span>
                                          <span className="text-sm text-slate-500">
                                            of {enrollment.totalMaterials || 0}
                                          </span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-2">
                                          <div
                                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${materialCompletionRate}%` }}
                                          />
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                          <span className="font-medium text-blue-600">{materialCompletionRate}% Complete</span>
                                          {(enrollment.totalMaterials || 0) > (enrollment.completedMaterials || 0) && (
                                            <span className="text-orange-600 font-medium">
                                              {(enrollment.totalMaterials || 0) - (enrollment.completedMaterials || 0)} Remaining
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Assignments Progress Card */}
                                    <div className="bg-white rounded-lg p-4 border-l-4 border-green-500 shadow-sm">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                            <ClipboardDocumentListIcon className="w-5 h-5 text-green-600" />
                                          </div>
                                          <span className="text-sm font-bold text-slate-700">Assignments</span>
                                        </div>
                                        {ungradedAssignments > 0 && (
                                          <div className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                                            {ungradedAssignments} Pending
                                          </div>
                                        )}
                                      </div>
                                      {(enrollment.totalAssignments || 0) > 0 ? (
                                        <div className="space-y-2">
                                          <div className="flex items-baseline justify-between">
                                            <span className="text-2xl font-bold text-green-600">
                                              {enrollment.submittedAssignments || 0}
                                            </span>
                                            <span className="text-sm text-slate-500">
                                              of {enrollment.totalAssignments || 0}
                                            </span>
                                          </div>
                                          <div className="w-full bg-slate-200 rounded-full h-2">
                                            <div
                                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                              style={{ width: `${assignmentCompletionRate}%` }}
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <div className="flex justify-between items-center text-xs">
                                              <span className="font-medium text-green-600">{assignmentCompletionRate}% Submitted</span>
                                              {(enrollment.totalAssignments || 0) > (enrollment.submittedAssignments || 0) && (
                                                <span className="text-slate-600">
                                                  {(enrollment.totalAssignments || 0) - (enrollment.submittedAssignments || 0)} Pending
                                                </span>
                                              )}
                                            </div>
                                            {enrollment.gradedAssignments !== undefined && enrollment.gradedAssignments > 0 && (
                                              <div className="text-xs text-emerald-600 font-medium">
                                                ✓ {enrollment.gradedAssignments} Graded
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-center py-2">
                                          <div className="text-sm text-slate-500 font-medium">No Assignments</div>
                                          <div className="text-xs text-slate-400">None created yet</div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Overall Summary Card */}
                                    <div className="bg-white rounded-lg p-4 border-l-4 border-indigo-500 shadow-sm">
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                          <ChartBarIcon className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">Overall Summary</span>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex items-baseline justify-between">
                                          <span className="text-2xl font-bold text-indigo-600">
                                            {completedItems}
                                          </span>
                                          <span className="text-sm text-slate-500">
                                            of {totalItems} items
                                          </span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-2">
                                          <div
                                            className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${enrollment.progressPercentage}%` }}
                                          />
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                          <span className="font-medium text-indigo-600">{enrollment.progressPercentage}% Complete</span>
                                          {remainingItems > 0 && (
                                            <span className="text-orange-600 font-medium">
                                              {remainingItems} Remaining
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Detailed Activity Sections */}
                                {(enrollment.completedMaterialsList && enrollment.completedMaterialsList.length > 0) ||
                                 (enrollment.submittedAssignmentsList && enrollment.submittedAssignmentsList.length > 0) ? (
                                  <div className="p-5 sm:p-6 border-t-2 border-slate-200">
                                    <h6 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">
                                      Detailed Activity Log
                                    </h6>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                      {/* Completed Materials Section */}
                                      {enrollment.completedMaterialsList && enrollment.completedMaterialsList.length > 0 && (
                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
                                          <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
                                                <DocumentTextIcon className="w-6 h-6 text-white" />
                                              </div>
                                              <div>
                                                <h6 className="text-sm font-bold text-blue-900">
                                                  Completed Materials
                                                </h6>
                                                <p className="text-xs text-blue-700">
                                                  {enrollment.completedMaterialsList.length} items finished
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                            {enrollment.completedMaterialsList
                                              .sort((a, b) => {
                                                if (a.chapter && b.chapter) {
                                                  if (a.chapter.orderIndex !== b.chapter.orderIndex) {
                                                    return a.chapter.orderIndex - b.chapter.orderIndex;
                                                  }
                                                }
                                                return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
                                              })
                                              .map((material, idx) => (
                                                <div key={idx} className="bg-white rounded-lg p-3 border border-blue-200 shadow-sm hover:shadow-md transition-all">
                                                  <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                      {getMaterialIcon(material.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                      <div className="font-semibold text-slate-900 text-sm mb-1 line-clamp-2">
                                                        {material.title}
                                                      </div>
                                                      {material.chapter && (
                                                        <div className="text-xs text-blue-700 font-medium mb-1">
                                                          📖 {material.chapter.title}
                                                        </div>
                                                      )}
                                                      <div className="text-xs text-slate-500 flex items-center gap-1">
                                                        <CheckCircleIcon className="w-3 h-3 text-green-500" />
                                                        {new Date(material.completedAt).toLocaleDateString()}
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Submitted Assignments Section */}
                                      {enrollment.submittedAssignmentsList && enrollment.submittedAssignmentsList.length > 0 && (
                                        <div className={`rounded-xl p-4 border-2 ${
                                          ungradedAssignments > 0
                                            ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
                                            : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
                                        }`}>
                                          <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-md ${
                                                ungradedAssignments > 0 ? 'bg-orange-500' : 'bg-green-500'
                                              }`}>
                                                <ClipboardDocumentListIcon className="w-6 h-6 text-white" />
                                              </div>
                                              <div>
                                                <h6 className={`text-sm font-bold ${
                                                  ungradedAssignments > 0 ? 'text-orange-900' : 'text-green-900'
                                                }`}>
                                                  Submitted Assignments
                                                </h6>
                                                <p className={`text-xs ${
                                                  ungradedAssignments > 0 ? 'text-orange-700' : 'text-green-700'
                                                }`}>
                                                  {enrollment.submittedAssignmentsList.length} submissions
                                                  {ungradedAssignments > 0 && ` • ${ungradedAssignments} pending review`}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                            {enrollment.submittedAssignmentsList
                                              .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                                              .map((assignment, idx) => (
                                                <div key={idx} className={`bg-white rounded-lg p-3 border-2 shadow-sm hover:shadow-md transition-all ${
                                                  assignment.status === 'GRADED' ? 'border-green-200' : 'border-orange-200'
                                                }`}>
                                                  <div className="flex items-start gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                      assignment.status === 'GRADED' ? 'bg-green-100' : 'bg-orange-100'
                                                    }`}>
                                                      <ClipboardDocumentListIcon className={`w-5 h-5 ${
                                                        assignment.status === 'GRADED' ? 'text-green-600' : 'text-orange-600'
                                                      }`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                      <div className="font-semibold text-slate-900 text-sm mb-2 line-clamp-2">
                                                        {assignment.title}
                                                      </div>
                                                      <div className="flex flex-wrap items-center gap-2">
                                                        <div className="text-xs text-slate-500 flex items-center gap-1">
                                                          <CalendarIcon className="w-3 h-3" />
                                                          {new Date(assignment.submittedAt).toLocaleDateString()}
                                                        </div>
                                                        {assignment.status === 'GRADED' && assignment.score !== null ? (
                                                          <div className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-bold">
                                                            ✓ {assignment.score}/{assignment.maxScore} Points
                                                          </div>
                                                        ) : (
                                                          <div className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-xs font-bold">
                                                            ⏳ Awaiting Grade
                                                          </div>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-8 px-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                            <BookOpenIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                            <h5 className="text-lg font-semibold text-slate-700 mb-1">No Enrollments Yet</h5>
                            <p className="text-sm text-slate-500">This student hasn&apos;t enrolled in any courses yet.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16 px-4">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <UserGroupIcon className="w-10 h-10 text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No students found</h3>
                <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto leading-relaxed">
                  {searchTerm ? (
                    <>No students match your search &quot;<span className="font-semibold">{searchTerm}</span>&quot;. Try a different search term.</>
                  ) : filterBy === 'enrolled' ? (
                    'No enrolled students yet. Students will appear here once they enroll in your courses.'
                  ) : filterBy === 'completed' ? (
                    'No students have completed any courses yet.'
                  ) : filterBy === 'new' ? (
                    'No new students registered in the last month.'
                  ) : filterBy === 'blocked' ? (
                    'No blocked students. All students have access to their accounts.'
                  ) : (
                    'No registered students found.'
                  )}
                </p>
                {!searchTerm && filterBy === 'enrolled' && (
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/create-course">
                      <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        Create a Course
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => setFilterBy('all')}
                      className="border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      View All Students
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}