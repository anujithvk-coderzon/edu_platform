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

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
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
  { value: 'active', label: 'Active Students' },
  { value: 'completed', label: 'Completed Courses' },
  { value: 'new', label: 'New This Month' },
  { value: 'top', label: 'Top Performers' }
];

const sortOptions: SelectOption[] = [
  { value: 'name', label: 'Name' },
  { value: 'joinedAt', label: 'Join Date' },
  { value: 'progress', label: 'Progress' },
  { value: 'courses', label: 'Courses Enrolled' },
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
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const handleSendMessage = (studentEmail: string) => {
    // Open Gmail with the student's email as recipient
    window.open(`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(studentEmail)}`, '_blank');
  };

  useEffect(() => {
    fetchStudentsData();
  }, []);

  useEffect(() => {
    filterAndSortStudents();
  }, [students, searchTerm, filterBy, sortBy, sortOrder]);

  const fetchStudentsData = async () => {
    try {
      setLoading(true);

      // Fetch real student data from the API - this shows only enrolled students
      const studentsResponse = await api.students.getAll();
      if (studentsResponse.success) {
        const realStudents = studentsResponse.data.students || [];

        // Get total students count from database (like dashboard does)
        let totalStudentsCount = 0;
        try {
          const studentsCountResponse = await api.admin.getStudentsCount();
          if (studentsCountResponse.success && studentsCountResponse.data?.studentsCount !== undefined) {
            totalStudentsCount = studentsCountResponse.data.studentsCount;
          }
        } catch (error) {
          console.error('Error fetching students count:', error);
          // Fallback to enrolled students count
          totalStudentsCount = realStudents.length;
        }

        // Calculate stats based on enrolled students but use total count for totalStudents
        const activeStudents = realStudents.filter((s: Student) => s.enrollments.some((e: Student['enrollments'][0]) => e.status === 'ACTIVE')).length;
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const newThisMonth = realStudents.filter((s: Student) => new Date(s.joinedAt) > oneMonthAgo).length;

        const totalProgress = realStudents.reduce((sum: number, s: Student) => {
          const avgProgress = s.enrollments.length > 0
            ? s.enrollments.reduce((eSum: number, e: Student['enrollments'][0]) => eSum + e.progressPercentage, 0) / s.enrollments.length
            : 0;
          return sum + avgProgress;
        }, 0);
        const averageProgress = realStudents.length > 0 ? totalProgress / realStudents.length : 0;

        const topPerformers = realStudents.filter((s: Student) =>
          s.enrollments.some((e: Student['enrollments'][0]) => e.progressPercentage > 80)
        ).length;

        const realStats = {
          totalStudents: totalStudentsCount, // Use database count like dashboard
          activeStudents: activeStudents,
          newThisMonth: newThisMonth,
          averageProgress: averageProgress,
          topPerformers: topPerformers,
          totalRevenue: 0
        };

        setStudents(realStudents);
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
      case 'active':
        filtered = filtered.filter(s => s.enrollments.some(e => e.status === 'ACTIVE'));
        break;
      case 'completed':
        filtered = filtered.filter(s => s.completedCourses > 0);
        break;
      case 'new':
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        filtered = filtered.filter(s => new Date(s.joinedAt) > oneMonthAgo);
        break;
      case 'top':
        filtered = filtered.filter(s => s.enrollments.some(e => e.progressPercentage > 80));
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
                  <p className="text-sm font-medium text-slate-600 mb-1">Active Students</p>
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
            <CardTitle className="text-lg font-semibold text-slate-900">
              Students ({filteredStudents.length})
            </CardTitle>
            <CardDescription className="text-slate-600 text-sm">
              Manage and track your students&apos; learning journey
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {filteredStudents.length > 0 ? (
              <div className="space-y-4">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:bg-white hover:shadow-sm transition-all duration-200 cursor-pointer"
                    onClick={() => setSelectedStudent(selectedStudent?.id === student.id ? null : student)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 font-medium text-sm flex-shrink-0">
                          {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1 truncate">
                            {student.firstName} {student.lastName}
                          </h3>
                          <p className="text-sm text-slate-600 mb-3 truncate">{student.email}</p>
                          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-4 text-xs text-slate-600">
                            <span className="flex items-center">
                              <BookOpenIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{student.totalCourses} courses</span>
                            </span>
                            <span className="flex items-center">
                              <CheckCircleIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{student.completedCourses} completed</span>
                            </span>
                            <span className="flex items-center">
                              <CalendarIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{new Date(student.joinedAt).toLocaleDateString()}</span>
                            </span>
                          </div>

                          {/* Enhanced completion statistics */}
                          {(student.totalMaterials !== undefined || student.totalAssignments !== undefined) && (
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

                      <div className="flex flex-col sm:items-end gap-2 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-700">
                            {student.enrollments.length > 0 ? (student.enrollments.reduce((sum, e) => sum + e.progressPercentage, 0) / student.enrollments.length).toFixed(0) : 0}%
                          </span>
                          <div className="w-16 sm:w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{
                                width: `${student.enrollments.length > 0 ? (student.enrollments.reduce((sum, e) => sum + e.progressPercentage, 0) / student.enrollments.length) : 0}%`
                              }}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-slate-500">
                          Last active: {new Date(student.lastActive).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Expanded Student Details */}
                    {selectedStudent?.id === student.id && (
                      <div className="mt-6 pt-6 border-t-2 border-slate-200">
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
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 px-4">
                <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <UserGroupIcon className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No students found</h3>
                <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto leading-relaxed">
                  {searchTerm || filterBy !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Students will appear here once they enroll in your courses.'
                  }
                </p>
                {!searchTerm && filterBy === 'all' && (
                  <Link href="/create-course">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                      Create Course
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}