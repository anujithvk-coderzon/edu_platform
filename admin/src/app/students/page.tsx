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
  BookOpenIcon
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
  enrollments: {
    courseId: string;
    courseTitle: string;
    enrolledAt: string;
    status: 'ACTIVE' | 'COMPLETED' | 'DROPPED';
    progressPercentage: number;
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

      // Fetch real student data from the API
      const studentsResponse = await api.students.getAll();
      if (studentsResponse.success) {
        const realStudents = studentsResponse.data.students || [];
        const realStats = studentsResponse.data.stats || {
          totalStudents: 0,
          activeStudents: 0,
          newThisMonth: 0,
          averageProgress: 0,
          topPerformers: 0,
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
    } catch (error) {
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
              <p className="text-slate-600 text-sm sm:text-base">Track your students' progress and engagement</p>
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
              Manage and track your students' learning journey
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
                              <ClockIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{student.totalSpentHours}h</span>
                            </span>
                            <span className="flex items-center">
                              <CalendarIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{new Date(student.joinedAt).toLocaleDateString()}</span>
                            </span>
                          </div>
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
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <h4 className="text-base font-semibold text-slate-900 mb-4">
                          Course Enrollments
                        </h4>
                        <div className="space-y-3 sm:space-y-4">
                          {student.enrollments.map((enrollment, index) => (
                            <div key={index} className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-sm font-semibold text-slate-900 mb-1 truncate">{enrollment.courseTitle}</h5>
                                  <p className="text-xs text-slate-600">
                                    Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-shrink-0">
                                  <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-start">
                                    <p className="text-xs font-medium text-slate-700 mb-0 sm:mb-1">
                                      {enrollment.progressPercentage}% Complete
                                    </p>
                                    <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-blue-600 rounded-full"
                                        style={{ width: `${enrollment.progressPercentage}%` }}
                                      />
                                    </div>
                                  </div>
                                  <span className={`px-2 py-1 rounded text-xs font-medium w-fit ${getStatusColor(enrollment.status)}`}>
                                    {enrollment.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-center sm:justify-end mt-4">
                          <Button
                            onClick={() => handleSendMessage(student.email)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm w-full sm:w-auto"
                          >
                            <EnvelopeIcon className="w-4 h-4 mr-2" />
                            Send Message
                          </Button>
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
                      Create Your First Course
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