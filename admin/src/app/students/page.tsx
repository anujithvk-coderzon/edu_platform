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
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('enrolled');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedEnrollmentIndex, setSelectedEnrollmentIndex] = useState<number | null>(null);

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

        const realStats = {
          totalStudents: totalStudentsCount,
          activeStudents: activeStudents,
          newThisMonth: newThisMonth,
          averageProgress: averageProgress,
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {[1, 2, 3].map((i) => (
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
      {/* Hero Header with Gradient */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 pt-6 pb-32 sm:pt-8 sm:pb-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center ring-2 ring-white/30">
              <UserGroupIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold" style={{ color: 'white' }}>
                My Students
              </h1>
              <p className="text-xs sm:text-sm md:text-base mt-0.5 sm:mt-1" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                Track your students&apos; progress and engagement
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 sm:-mt-32 pb-8 sm:pb-12">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-slate-200 p-3 sm:p-4 md:p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-slate-600">Total Students</p>
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-br from-blue-600 to-blue-700 bg-clip-text text-transparent">
              {stats.totalStudents}
            </p>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-slate-200 p-3 sm:p-4 md:p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <AcademicCapIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-slate-600">Active Enrolled</p>
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-br from-green-600 to-green-700 bg-clip-text text-transparent">
              {stats.activeStudents}
            </p>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-slate-200 p-3 sm:p-4 md:p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <ChartBarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-slate-600">Avg Progress</p>
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-br from-purple-600 to-purple-700 bg-clip-text text-transparent">
              {stats.averageProgress.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Search Bar - Mobile Optimized */}
        <div className="mb-3 sm:mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-4 w-full border-2 border-slate-300 rounded-lg sm:rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Filters - Mobile Optimized */}
        <div className="mb-3 sm:mb-6 bg-white rounded-lg sm:rounded-xl shadow-lg border border-slate-200">
          <div className="p-2 sm:p-4">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Select
                value={filterBy}
                onChange={setFilterBy}
                options={filterOptions}
                className="w-full"
              />
              <Select
                value={sortBy}
                onChange={setSortBy}
                options={sortOptions}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-3 sm:px-6 py-2.5 sm:py-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <UserGroupIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <h3 className="text-sm sm:text-lg font-semibold text-slate-900">
                Students ({filteredStudents.length})
              </h3>
            </div>
          </div>
          <div className="p-2 sm:p-6">
            {filteredStudents.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="bg-white border border-slate-200 rounded-lg sm:rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200"
                  >
                    {/* Student Card Header - Always Visible */}
                    <div
                      className="p-2.5 sm:p-4 cursor-pointer active:bg-slate-50"
                      onClick={() => {
                        if (selectedStudent?.id === student.id) {
                          setSelectedStudent(null);
                          setSelectedEnrollmentIndex(null);
                        } else {
                          setSelectedStudent(student);
                          setSelectedEnrollmentIndex(null);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0 shadow-md">
                          {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                            {student.firstName} {student.lastName}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 truncate">{student.email}</p>
                        </div>
                        <ChevronDownIcon
                          className={`w-5 h-5 sm:w-6 sm:h-6 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                            selectedStudent?.id === student.id ? 'rotate-180' : ''
                          }`}
                        />
                      </div>

                      {/* Status & Quick Stats */}
                      <div className="space-y-1.5 sm:space-y-2">
                        {/* Status Badge */}
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          {student.enrollments && student.enrollments.length > 0 ? (
                            student.completedCourses > 0 && student.completedCourses === student.totalCourses ? (
                              <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 bg-green-50 text-green-700 text-xs sm:text-sm font-semibold rounded-md sm:rounded-lg border border-green-200">
                                <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                                All Completed
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-50 text-blue-700 text-xs sm:text-sm font-semibold rounded-md sm:rounded-lg border border-blue-200">
                                <BookOpenIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                                {student.totalCourses} Course{student.totalCourses !== 1 ? 's' : ''}
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-50 text-slate-600 text-xs sm:text-sm font-semibold rounded-md sm:rounded-lg border border-slate-200">
                              Not Enrolled
                            </span>
                          )}
                          {student.blocked && (
                            <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 bg-red-50 text-red-700 text-xs sm:text-sm font-semibold rounded-md sm:rounded-lg border border-red-300">
                              <XCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                              Blocked
                            </span>
                          )}
                          {student.completedCourses > 0 && (
                            <span className="inline-flex items-center gap-1 text-green-600 font-medium text-xs">
                              <CheckCircleIcon className="w-3 h-3" />
                              {student.completedCourses} Done
                            </span>
                          )}
                        </div>

                        {/* Progress Bar - Only for enrolled students */}
                        {student.enrollments && student.enrollments.length > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] sm:text-xs font-medium text-slate-600">Progress</span>
                              <span className="text-xs sm:text-sm font-bold text-indigo-600">
                                {(student.enrollments.reduce((sum, e) => sum + e.progressPercentage, 0) / student.enrollments.length).toFixed(0)}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 sm:h-2">
                              <div
                                className="bg-gradient-to-r from-indigo-600 to-blue-600 h-1.5 sm:h-2 rounded-full transition-all"
                                style={{ width: `${(student.enrollments.reduce((sum, e) => sum + e.progressPercentage, 0) / student.enrollments.length).toFixed(0)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Meta Info */}
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500">
                          <CalendarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span>Joined {new Date(student.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons - Always Visible */}
                    <div className="px-2.5 sm:px-4 pb-2.5 sm:pb-4 flex gap-1.5 sm:gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendMessage(student.email)}
                        className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50 py-1.5 sm:py-2.5 text-xs sm:text-sm font-medium"
                      >
                        <EnvelopeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                        Email
                      </Button>
                      {student.blocked ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnblockStudent(student.id, `${student.firstName} ${student.lastName}`)}
                          className="flex-1 border-green-300 text-green-700 hover:bg-green-50 py-1.5 sm:py-2.5 text-xs sm:text-sm font-medium"
                        >
                          <CheckCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                          Unblock
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBlockStudent(student.id, `${student.firstName} ${student.lastName}`)}
                          className="flex-1 border-red-300 text-red-700 hover:bg-red-50 py-1.5 sm:py-2.5 text-xs sm:text-sm font-medium"
                        >
                          <XCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                          Block
                        </Button>
                      )}
                    </div>

                    {/* Expanded Student Details */}
                    {selectedStudent?.id === student.id && (
                      <div className="border-t-2 border-slate-100 bg-slate-50 p-2.5 sm:p-4">
                        {/* Quick Stats - Only for enrolled students */}
                        {student.enrollments && student.enrollments.length > 0 && (student.totalMaterials !== undefined || student.totalAssignments !== undefined) && (
                          <div className="mb-2.5 sm:mb-4">
                            <p className="text-[10px] sm:text-xs font-bold text-slate-700 mb-2 sm:mb-3 uppercase tracking-wide">Learning Progress</p>
                            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                              <div className="bg-white rounded-lg p-2 sm:p-3 border border-slate-200 text-center">
                                <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mx-auto mb-1 sm:mb-1.5" />
                                <div className="text-sm sm:text-lg font-bold text-blue-700">
                                  {student.completedMaterials || 0}/{student.totalMaterials || 0}
                                </div>
                                <div className="text-[10px] sm:text-xs text-slate-600">Materials</div>
                              </div>
                              <div className="bg-white rounded-lg p-2 sm:p-3 border border-slate-200 text-center">
                                <ClipboardDocumentListIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mx-auto mb-1 sm:mb-1.5" />
                                <div className="text-sm sm:text-lg font-bold text-green-700">
                                  {student.submittedAssignments || 0}/{student.totalAssignments || 0}
                                </div>
                                <div className="text-[10px] sm:text-xs text-slate-600">Assignments</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Student Information */}
                        {(student.phone || student.dateOfBirth || student.gender || student.country || student.city ||
                          student.education || student.institution || student.occupation || student.company || student.registeredAt) && (
                          <div className="bg-white rounded-lg p-2.5 sm:p-4 border border-slate-200">
                            <h4 className="text-[10px] sm:text-sm font-bold text-slate-700 mb-2 sm:mb-3 uppercase tracking-wide">Additional Details</h4>
                            <div className="space-y-1.5 sm:space-y-2.5">
                              {student.phone && (
                                <div className="flex justify-between items-center py-1 sm:py-1.5 border-b border-slate-100">
                                  <span className="text-[10px] sm:text-xs text-slate-500">Phone</span>
                                  <span className="text-[10px] sm:text-xs font-medium text-slate-900">{student.phone}</span>
                                </div>
                              )}
                              {student.dateOfBirth && (
                                <div className="flex justify-between items-center py-1 sm:py-1.5 border-b border-slate-100">
                                  <span className="text-[10px] sm:text-xs text-slate-500">Birth</span>
                                  <span className="text-[10px] sm:text-xs font-medium text-slate-900">
                                    {new Date(student.dateOfBirth).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                  </span>
                                </div>
                              )}
                              {student.gender && (
                                <div className="flex justify-between items-center py-1 sm:py-1.5 border-b border-slate-100">
                                  <span className="text-[10px] sm:text-xs text-slate-500">Gender</span>
                                  <span className="text-[10px] sm:text-xs font-medium text-slate-900">{student.gender}</span>
                                </div>
                              )}
                              {student.country && (
                                <div className="flex justify-between items-center py-1 sm:py-1.5 border-b border-slate-100">
                                  <span className="text-[10px] sm:text-xs text-slate-500">Country</span>
                                  <span className="text-[10px] sm:text-xs font-medium text-slate-900">{student.country}</span>
                                </div>
                              )}
                              {student.city && (
                                <div className="flex justify-between items-center py-1 sm:py-1.5 border-b border-slate-100">
                                  <span className="text-[10px] sm:text-xs text-slate-500">City</span>
                                  <span className="text-[10px] sm:text-xs font-medium text-slate-900">{student.city}</span>
                                </div>
                              )}
                              {student.education && (
                                <div className="flex justify-between items-start py-1 sm:py-1.5 border-b border-slate-100 gap-2">
                                  <span className="text-[10px] sm:text-xs text-slate-500 flex-shrink-0">Education</span>
                                  <span className="text-[10px] sm:text-xs font-medium text-slate-900 text-right">{student.education}</span>
                                </div>
                              )}
                              {student.institution && (
                                <div className="flex justify-between items-start py-1 sm:py-1.5 border-b border-slate-100 gap-2">
                                  <span className="text-[10px] sm:text-xs text-slate-500 flex-shrink-0">Institution</span>
                                  <span className="text-[10px] sm:text-xs font-medium text-slate-900 text-right">{student.institution}</span>
                                </div>
                              )}
                              {student.occupation && (
                                <div className="flex justify-between items-start py-1 sm:py-1.5 border-b border-slate-100 gap-2">
                                  <span className="text-[10px] sm:text-xs text-slate-500 flex-shrink-0">Job</span>
                                  <span className="text-[10px] sm:text-xs font-medium text-slate-900 text-right">{student.occupation}</span>
                                </div>
                              )}
                              {student.company && (
                                <div className="flex justify-between items-start py-1 sm:py-1.5 border-b border-slate-100 gap-2">
                                  <span className="text-[10px] sm:text-xs text-slate-500 flex-shrink-0">Company</span>
                                  <span className="text-[10px] sm:text-xs font-medium text-slate-900 text-right">{student.company}</span>
                                </div>
                              )}
                              {student.registeredAt && (
                                <div className="flex justify-between items-center py-1 sm:py-1.5 border-b border-slate-100">
                                  <span className="text-[10px] sm:text-xs text-slate-500">Registered</span>
                                  <span className="text-[10px] sm:text-xs font-medium text-slate-900">
                                    {new Date(student.registeredAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between items-center py-1 sm:py-1.5">
                                <span className="text-[10px] sm:text-xs text-slate-500">Status</span>
                                <div>
                                  {student.isVerified ? (
                                    <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-semibold border border-green-200">
                                      ✓ Verified
                                    </span>
                                  ) : (
                                    <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-orange-50 text-orange-700 rounded-full font-semibold border border-orange-200">
                                      ⚠ Unverified
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Enrollment Details - Only show if student has enrollments */}
                        {student.enrollments && student.enrollments.length > 0 ? (
                          <>
                            {/* Section Header with Summary Stats */}
                            <div className="mb-2.5 sm:mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-2 sm:p-3 border border-blue-200">
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                                    Enrolled Courses
                                  </h4>
                                  <p className="text-[9px] sm:text-[10px] text-slate-600 mt-0.5">
                                    {selectedEnrollmentIndex !== null ? 'Tap course to close details' : 'Tap a course to view details'}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <div className="text-center px-2 sm:px-3 py-1 sm:py-1.5 bg-white rounded-md shadow-sm">
                                    <div className="text-sm sm:text-lg font-bold text-blue-600">{student.enrollments.length}</div>
                                    <div className="text-[9px] sm:text-[10px] text-slate-600">Total</div>
                                  </div>
                                  <div className="text-center px-2 sm:px-3 py-1 sm:py-1.5 bg-white rounded-md shadow-sm">
                                    <div className="text-sm sm:text-lg font-bold text-green-600">{student.completedCourses}</div>
                                    <div className="text-[9px] sm:text-[10px] text-slate-600">Done</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Course List - Clickable Cards */}
                            <div className="space-y-2 sm:space-y-3">
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

                            const isSelected = selectedEnrollmentIndex === index;

                            return (
                              <div key={index} className="bg-white border border-slate-200 rounded-lg sm:rounded-xl shadow-sm overflow-hidden">
                                {/* Course Header Section - Always Visible & Clickable */}
                                <div
                                  className="bg-gradient-to-r from-slate-50 to-slate-100 p-2 sm:p-3 border-b border-slate-200 cursor-pointer active:bg-slate-100 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEnrollmentIndex(isSelected ? null : index);
                                  }}
                                >
                                  <div className="flex items-start gap-2 sm:gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                                      <BookOpenIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h5 className="text-xs sm:text-sm font-bold text-slate-900 mb-1 sm:mb-2 line-clamp-2">
                                        {enrollment.courseTitle}
                                      </h5>
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="space-y-0.5 sm:space-y-1">
                                          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-600">
                                            <CalendarIcon className="w-3 h-3 flex-shrink-0" />
                                            <span>{new Date(enrollment.enrolledAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                                          </div>
                                          {enrollment.creator && (
                                            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-600">
                                              <UserIcon className="w-3 h-3 flex-shrink-0" />
                                              <span className="truncate">{enrollment.creator.firstName} {enrollment.creator.lastName}</span>
                                            </div>
                                          )}
                                        </div>
                                        {/* Progress Badge */}
                                        <div className="text-center px-2 sm:px-3 py-1 sm:py-1.5 bg-white rounded-md shadow-sm border border-slate-200 flex-shrink-0">
                                          <div className="text-sm sm:text-lg font-bold text-indigo-600">
                                            {enrollment.progressPercentage}%
                                          </div>
                                          <div className="text-[9px] sm:text-[10px] text-slate-600">Progress</div>
                                        </div>
                                      </div>
                                    </div>
                                    <ChevronDownIcon
                                      className={`w-5 h-5 sm:w-6 sm:h-6 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                                        isSelected ? 'rotate-180' : ''
                                      }`}
                                    />
                                  </div>

                                  {/* Quick Summary - Always visible */}
                                  <div className="mt-2 flex items-center gap-2 sm:gap-3 flex-wrap">
                                    <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-slate-600">
                                      <DocumentTextIcon className="w-3 h-3 text-blue-500" />
                                      <span>{enrollment.completedMaterials || 0}/{enrollment.totalMaterials || 0} Materials</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-slate-600">
                                      <ClipboardDocumentListIcon className="w-3 h-3 text-green-500" />
                                      <span>{enrollment.submittedAssignments || 0}/{enrollment.totalAssignments || 0} Assignments</span>
                                    </div>
                                    {ungradedAssignments > 0 && (
                                      <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[9px] font-bold">
                                        {ungradedAssignments} Pending Grade
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Detailed Course Info - Only shown when selected */}
                                {isSelected && (
                                  <>

                                {/* Progress Metrics Section */}
                                <div className="p-2 sm:p-3 bg-slate-50">
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {/* Materials Progress Card */}
                                    <div className="bg-white rounded-lg p-2 sm:p-3 border-l-2 sm:border-l-4 border-blue-500 shadow-sm">
                                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                                        <div className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-100 rounded-md flex items-center justify-center flex-shrink-0">
                                          <DocumentTextIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                                        </div>
                                        <span className="text-[10px] sm:text-xs font-bold text-slate-700">Materials</span>
                                      </div>
                                      <div className="space-y-1 sm:space-y-1.5">
                                        <div className="flex items-baseline justify-between">
                                          <span className="text-base sm:text-xl font-bold text-blue-600">
                                            {enrollment.completedMaterials || 0}
                                          </span>
                                          <span className="text-[10px] sm:text-xs text-slate-500">
                                            / {enrollment.totalMaterials || 0}
                                          </span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-1.5 sm:h-2">
                                          <div
                                            className="bg-blue-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${materialCompletionRate}%` }}
                                          />
                                        </div>
                                        <div className="text-[9px] sm:text-[10px] font-medium text-blue-600">
                                          {materialCompletionRate}% Complete
                                        </div>
                                      </div>
                                    </div>

                                    {/* Assignments Progress Card */}
                                    <div className="bg-white rounded-lg p-2 sm:p-3 border-l-2 sm:border-l-4 border-green-500 shadow-sm">
                                      <div className="flex items-center justify-between gap-1 mb-1.5 sm:mb-2">
                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                          <div className="w-6 h-6 sm:w-7 sm:h-7 bg-green-100 rounded-md flex items-center justify-center flex-shrink-0">
                                            <ClipboardDocumentListIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                                          </div>
                                          <span className="text-[10px] sm:text-xs font-bold text-slate-700">Assignments</span>
                                        </div>
                                        {ungradedAssignments > 0 && (
                                          <div className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[9px] sm:text-[10px] font-bold">
                                            {ungradedAssignments} Pending
                                          </div>
                                        )}
                                      </div>
                                      {(enrollment.totalAssignments || 0) > 0 ? (
                                        <div className="space-y-1 sm:space-y-1.5">
                                          <div className="flex items-baseline justify-between">
                                            <span className="text-base sm:text-xl font-bold text-green-600">
                                              {enrollment.submittedAssignments || 0}
                                            </span>
                                            <span className="text-[10px] sm:text-xs text-slate-500">
                                              / {enrollment.totalAssignments || 0}
                                            </span>
                                          </div>
                                          <div className="w-full bg-slate-200 rounded-full h-1.5 sm:h-2">
                                            <div
                                              className="bg-green-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                                              style={{ width: `${assignmentCompletionRate}%` }}
                                            />
                                          </div>
                                          <div className="text-[9px] sm:text-[10px] font-medium text-green-600">
                                            {assignmentCompletionRate}% Submitted
                                            {enrollment.gradedAssignments !== undefined && enrollment.gradedAssignments > 0 && (
                                              <span className="text-emerald-600 ml-2">• {enrollment.gradedAssignments} Graded</span>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-center py-1.5">
                                          <div className="text-[10px] sm:text-xs text-slate-500">No Assignments</div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Overall Summary Card */}
                                    <div className="bg-white rounded-lg p-2 sm:p-3 border-l-2 sm:border-l-4 border-indigo-500 shadow-sm">
                                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                                        <div className="w-6 h-6 sm:w-7 sm:h-7 bg-indigo-100 rounded-md flex items-center justify-center flex-shrink-0">
                                          <ChartBarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
                                        </div>
                                        <span className="text-[10px] sm:text-xs font-bold text-slate-700">Overall</span>
                                      </div>
                                      <div className="space-y-1 sm:space-y-1.5">
                                        <div className="flex items-baseline justify-between">
                                          <span className="text-base sm:text-xl font-bold text-indigo-600">
                                            {completedItems}
                                          </span>
                                          <span className="text-[10px] sm:text-xs text-slate-500">
                                            / {totalItems} items
                                          </span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-1.5 sm:h-2">
                                          <div
                                            className="bg-indigo-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${enrollment.progressPercentage}%` }}
                                          />
                                        </div>
                                        <div className="text-[9px] sm:text-[10px] font-medium text-indigo-600">
                                          {enrollment.progressPercentage}% Complete
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Detailed Activity Sections */}
                                {(enrollment.completedMaterialsList && enrollment.completedMaterialsList.length > 0) ||
                                 (enrollment.submittedAssignmentsList && enrollment.submittedAssignmentsList.length > 0) ? (
                                  <div className="p-2 sm:p-3 border-t border-slate-200">
                                    <h6 className="text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                                      Activity Log
                                    </h6>
                                    <div className="grid grid-cols-1 gap-2">
                                      {/* Completed Materials Section */}
                                      {enrollment.completedMaterialsList && enrollment.completedMaterialsList.length > 0 && (
                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-blue-200 sm:border-2">
                                          <div className="flex items-center justify-between mb-2 sm:mb-3">
                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-md sm:rounded-lg flex items-center justify-center shadow-md">
                                                <DocumentTextIcon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                                              </div>
                                              <div>
                                                <h6 className="text-[10px] sm:text-xs font-bold text-blue-900">
                                                  Completed Materials
                                                </h6>
                                                <p className="text-[9px] sm:text-[10px] text-blue-700">
                                                  {enrollment.completedMaterialsList.length} items finished
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="space-y-1.5 sm:space-y-2 max-h-48 sm:max-h-60 overflow-y-auto pr-1 sm:pr-2">
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
                                                <div key={idx} className="bg-white rounded-md sm:rounded-lg p-2 sm:p-2.5 border border-blue-200 shadow-sm">
                                                  <div className="flex items-start gap-1.5 sm:gap-2">
                                                    <div className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-100 rounded-md flex items-center justify-center flex-shrink-0">
                                                      {getMaterialIcon(material.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                      <div className="font-semibold text-slate-900 text-[10px] sm:text-xs mb-0.5 sm:mb-1 line-clamp-2">
                                                        {material.title}
                                                      </div>
                                                      {material.chapter && (
                                                        <div className="text-[9px] sm:text-[10px] text-blue-700 font-medium mb-0.5 truncate">
                                                          📖 {material.chapter.title}
                                                        </div>
                                                      )}
                                                      <div className="text-[9px] sm:text-[10px] text-slate-500 flex items-center gap-0.5 sm:gap-1">
                                                        <CheckCircleIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-500" />
                                                        {new Date(material.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                                        <div className={`rounded-lg sm:rounded-xl p-2 sm:p-3 border sm:border-2 ${
                                          ungradedAssignments > 0
                                            ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
                                            : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
                                        }`}>
                                          <div className="flex items-center justify-between mb-2 sm:mb-3">
                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center shadow-md ${
                                                ungradedAssignments > 0 ? 'bg-orange-500' : 'bg-green-500'
                                              }`}>
                                                <ClipboardDocumentListIcon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                                              </div>
                                              <div>
                                                <h6 className={`text-[10px] sm:text-xs font-bold ${
                                                  ungradedAssignments > 0 ? 'text-orange-900' : 'text-green-900'
                                                }`}>
                                                  Submitted Assignments
                                                </h6>
                                                <p className={`text-[9px] sm:text-[10px] ${
                                                  ungradedAssignments > 0 ? 'text-orange-700' : 'text-green-700'
                                                }`}>
                                                  {enrollment.submittedAssignmentsList.length} submissions
                                                  {ungradedAssignments > 0 && ` • ${ungradedAssignments} pending`}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="space-y-1.5 sm:space-y-2 max-h-48 sm:max-h-60 overflow-y-auto pr-1 sm:pr-2">
                                            {enrollment.submittedAssignmentsList
                                              .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                                              .map((assignment, idx) => (
                                                <div key={idx} className={`bg-white rounded-md sm:rounded-lg p-2 sm:p-2.5 border shadow-sm ${
                                                  assignment.status === 'GRADED' ? 'border-green-200' : 'border-orange-200'
                                                }`}>
                                                  <div className="flex items-start gap-1.5 sm:gap-2">
                                                    <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                                                      assignment.status === 'GRADED' ? 'bg-green-100' : 'bg-orange-100'
                                                    }`}>
                                                      <ClipboardDocumentListIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                                                        assignment.status === 'GRADED' ? 'text-green-600' : 'text-orange-600'
                                                      }`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                      <div className="font-semibold text-slate-900 text-[10px] sm:text-xs mb-1 sm:mb-1.5 line-clamp-2">
                                                        {assignment.title}
                                                      </div>
                                                      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                                                        <div className="text-[9px] sm:text-[10px] text-slate-500 flex items-center gap-0.5 sm:gap-1">
                                                          <CalendarIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                          {new Date(assignment.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </div>
                                                        {assignment.status === 'GRADED' && assignment.score !== null ? (
                                                          <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 text-green-700 rounded-md text-[9px] sm:text-[10px] font-bold">
                                                            ✓ {assignment.score}/{assignment.maxScore}
                                                          </div>
                                                        ) : (
                                                          <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-orange-100 text-orange-700 rounded-md text-[9px] sm:text-[10px] font-bold">
                                                            ⏳ Pending
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
                                  </>
                                )}
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
              <div className="text-center py-8 sm:py-12 md:py-16 px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-sm">
                  <UserGroupIcon className="w-8 h-8 sm:w-10 sm:h-10 text-slate-500" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1.5 sm:mb-2">No students found</h3>
                <p className="text-slate-600 text-xs sm:text-sm mb-4 sm:mb-6 max-w-md mx-auto leading-relaxed">
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
          </div>
        </div>
      </div>
    </div>
  );
}