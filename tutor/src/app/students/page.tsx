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

  useEffect(() => {
    fetchStudentsData();
  }, []);

  useEffect(() => {
    filterAndSortStudents();
  }, [students, searchTerm, filterBy, sortBy, sortOrder]);

  const fetchStudentsData = async () => {
    try {
      setLoading(true);
      
      // Get tutor's courses first
      const coursesResponse = await api.courses.getMyCourses();
      if (coursesResponse.success) {
        const tutorCourses = coursesResponse.data.courses || [];
        setCourses(tutorCourses);
        
        // Generate mock student data based on actual courses
        const mockStudentsData = generateMockStudents(tutorCourses);
        setStudents(mockStudentsData);
        
        // Calculate statistics
        const calculatedStats = calculateStats(mockStudentsData, tutorCourses);
        setStats(calculatedStats);
      }
    } catch (error) {
      console.error('Error fetching students data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockStudents = (courses: Course[]): Student[] => {
    const mockStudents: Student[] = [];
    const studentNames = [
      { firstName: 'Alice', lastName: 'Johnson', email: 'alice.johnson@email.com' },
      { firstName: 'Bob', lastName: 'Smith', email: 'bob.smith@email.com' },
      { firstName: 'Carol', lastName: 'Davis', email: 'carol.davis@email.com' },
      { firstName: 'David', lastName: 'Wilson', email: 'david.wilson@email.com' },
      { firstName: 'Emma', lastName: 'Brown', email: 'emma.brown@email.com' },
      { firstName: 'Frank', lastName: 'Miller', email: 'frank.miller@email.com' },
      { firstName: 'Grace', lastName: 'Taylor', email: 'grace.taylor@email.com' },
      { firstName: 'Henry', lastName: 'Anderson', email: 'henry.anderson@email.com' },
      { firstName: 'Ivy', lastName: 'Thomas', email: 'ivy.thomas@email.com' },
      { firstName: 'Jack', lastName: 'Moore', email: 'jack.moore@email.com' }
    ];

    courses.forEach((course) => {
      const enrollmentCount = course._count?.enrollments || 0;
      for (let i = 0; i < Math.min(enrollmentCount, 5); i++) {
        const student = studentNames[Math.floor(Math.random() * studentNames.length)];
        const studentId = `${course.id}-student-${i}`;
        
        const existingStudent = mockStudents.find(s => s.email === student.email);
        
        if (existingStudent) {
          // Add enrollment to existing student
          existingStudent.enrollments.push({
            courseId: course.id,
            courseTitle: course.title,
            enrolledAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
            status: Math.random() > 0.8 ? 'COMPLETED' : Math.random() > 0.1 ? 'ACTIVE' : 'DROPPED',
            progressPercentage: Math.floor(Math.random() * 100)
          });
          existingStudent.totalCourses++;
          if (existingStudent.enrollments[existingStudent.enrollments.length - 1].status === 'COMPLETED') {
            existingStudent.completedCourses++;
          }
        } else {
          // Create new student
          const enrollmentStatus = Math.random() > 0.8 ? 'COMPLETED' : Math.random() > 0.1 ? 'ACTIVE' : 'DROPPED';
          mockStudents.push({
            id: studentId,
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
            totalCourses: 1,
            completedCourses: enrollmentStatus === 'COMPLETED' ? 1 : 0,
            totalSpentHours: Math.floor(Math.random() * 100) + 10,
            joinedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
            lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            enrollments: [{
              courseId: course.id,
              courseTitle: course.title,
              enrolledAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
              status: enrollmentStatus,
              progressPercentage: Math.floor(Math.random() * 100)
            }]
          });
        }
      }
    });

    return mockStudents;
  };

  const calculateStats = (studentsData: Student[], coursesData: Course[]): StudentsStats => {
    const totalStudents = studentsData.length;
    const activeStudents = studentsData.filter(s => 
      s.enrollments.some(e => e.status === 'ACTIVE')
    ).length;
    
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const newThisMonth = studentsData.filter(s => 
      new Date(s.joinedAt) > oneMonthAgo
    ).length;
    
    const totalProgress = studentsData.reduce((sum, s) => 
      sum + s.enrollments.reduce((enrollmentSum, e) => enrollmentSum + e.progressPercentage, 0), 0
    );
    const totalEnrollments = studentsData.reduce((sum, s) => sum + s.enrollments.length, 0);
    const averageProgress = totalEnrollments > 0 ? totalProgress / totalEnrollments : 0;
    
    const topPerformers = studentsData.filter(s => 
      s.enrollments.some(e => e.progressPercentage > 80)
    ).length;
    
    const totalRevenue = coursesData.reduce((sum, course) => 
      sum + ((course._count?.enrollments || 0) * course.price), 0
    );

    return {
      totalStudents,
      activeStudents,
      newThisMonth,
      averageProgress,
      topPerformers,
      totalRevenue
    };
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
      let valueA: any, valueB: any;
      
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
          valueA = a.enrollments.reduce((sum, e) => sum + e.progressPercentage, 0) / a.enrollments.length;
          valueB = b.enrollments.reduce((sum, e) => sum + e.progressPercentage, 0) / b.enrollments.length;
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

      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    setFilteredStudents(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DROPPED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Students
          </h1>
          <p className="text-gray-600 mt-2">Track your students' progress and engagement</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <UserGroupIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Students</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.activeStudents}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <AcademicCapIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Progress</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.averageProgress.toFixed(0)}%</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <ChartBarIcon className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Top Performers</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.topPerformers}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <TrophyIcon className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search students by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-4">
                <Select
                  value={filterBy}
                  onChange={setFilterBy}
                  options={filterOptions}
                  className="min-w-[150px]"
                />
                
                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  options={sortOptions}
                  className="min-w-[120px]"
                />
                
                <Button
                  variant="outline"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="flex items-center"
                >
                  {sortOrder === 'asc' ? (
                    <ArrowUpIcon className="w-4 h-4" />
                  ) : (
                    <ArrowDownIcon className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserGroupIcon className="w-5 h-5 mr-2" />
              Students ({filteredStudents.length})
            </CardTitle>
            <CardDescription>
              Manage and track your students' learning journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredStudents.length > 0 ? (
              <div className="space-y-4">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer"
                    onClick={() => setSelectedStudent(selectedStudent?.id === student.id ? null : student)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {student.firstName} {student.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">{student.email}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center">
                              <BookOpenIcon className="w-3 h-3 mr-1" />
                              {student.totalCourses} courses
                            </span>
                            <span className="flex items-center">
                              <CheckCircleIcon className="w-3 h-3 mr-1" />
                              {student.completedCourses} completed
                            </span>
                            <span className="flex items-center">
                              <ClockIcon className="w-3 h-3 mr-1" />
                              {student.totalSpentHours}h spent
                            </span>
                            <span className="flex items-center">
                              <CalendarIcon className="w-3 h-3 mr-1" />
                              Joined {new Date(student.joinedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-600">
                            Avg Progress: {(student.enrollments.reduce((sum, e) => sum + e.progressPercentage, 0) / student.enrollments.length).toFixed(0)}%
                          </span>
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${(student.enrollments.reduce((sum, e) => sum + e.progressPercentage, 0) / student.enrollments.length)}%` 
                              }}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Last active: {new Date(student.lastActive).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Expanded Student Details */}
                    {selectedStudent?.id === student.id && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-4">Course Enrollments</h4>
                        <div className="grid gap-3">
                          {student.enrollments.map((enrollment, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900">{enrollment.courseTitle}</h5>
                                  <p className="text-sm text-gray-600">
                                    Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">
                                      {enrollment.progressPercentage}% Complete
                                    </p>
                                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                                      <div 
                                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                        style={{ width: `${enrollment.progressPercentage}%` }}
                                      />
                                    </div>
                                  </div>
                                  <span className={`flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(enrollment.status)}`}>
                                    {getStatusIcon(enrollment.status)}
                                    <span className="ml-1">{enrollment.status}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex justify-end mt-4 space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center"
                          >
                            <EnvelopeIcon className="w-4 h-4 mr-2" />
                            Send Message
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center"
                          >
                            <EyeIcon className="w-4 h-4 mr-2" />
                            View Profile
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserGroupIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || filterBy !== 'all' 
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'Students will appear here once they enroll in your courses.'
                  }
                </p>
                {!searchTerm && filterBy === 'all' && (
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Create Your First Course
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}