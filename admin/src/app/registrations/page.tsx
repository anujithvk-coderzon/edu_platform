'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  CalendarIcon,
  UserIcon,
  EnvelopeIcon,
  ClockIcon,
  UserGroupIcon,
  FunnelIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { api } from '../../lib/api';

interface RegisteredStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

type TimePeriod = '1week' | '1month' | '6months';

const timePeriodLabels = {
  '1week': 'Last 7 Days',
  '1month': 'Last 30 Days',
  '6months': 'Last 6 Months'
};

export default function RegistrationsPage() {
  const [students, setStudents] = useState<RegisteredStudent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<RegisteredStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1month');

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudentsByPeriod();
  }, [students, selectedPeriod]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.admin.getAllRegisteredStudents();

      if (response.success && response.data?.students) {
        const registeredStudents: RegisteredStudent[] = response.data.students.map((student: any) => ({
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          createdAt: student.registeredAt
        }));
        setStudents(registeredStudents);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const filterStudentsByPeriod = () => {
    const now = new Date();
    let cutoffDate = new Date();

    switch (selectedPeriod) {
      case '1week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '1month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '6months':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
    }

    const filtered = students.filter(student => {
      const registrationDate = new Date(student.createdAt);
      return registrationDate >= cutoffDate;
    });

    // Sort by most recent first
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredStudents(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="animate-pulse">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6">
              <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </div>
            <div className="h-96 bg-white rounded-xl shadow-sm border border-slate-200"></div>
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
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-2">
                    Student Registrations
                  </h1>
                  <p className="text-slate-600 text-sm sm:text-base">
                    View all student registrations on the platform
                  </p>
                </div>
                {filteredStudents.length > 1 && (
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="w-5 h-5 text-slate-500" />
                    <span className="text-sm text-slate-600">
                      {filteredStudents.length} registrations
                    </span>
                  </div>
                )}
              </div>
              <div>
                <Link href="/register-tutor">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    <AcademicCapIcon className="w-5 h-5 mr-2" />
                    Register as Tutor
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Time Period Filter */}
        <Card className="mb-6 bg-white shadow-sm border border-slate-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <FunnelIcon className="w-5 h-5 text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Filter by Time Period
              </h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(timePeriodLabels) as TimePeriod[]).map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? 'default' : 'outline'}
                  onClick={() => setSelectedPeriod(period)}
                  className={`
                    ${selectedPeriod === period
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                    }
                  `}
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {timePeriodLabels[period]}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <Card className="bg-white shadow-sm border border-slate-200">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg font-semibold text-slate-900">
              Registered Students - {timePeriodLabels[selectedPeriod]}
            </CardTitle>
            {filteredStudents.length > 1 && (
              <CardDescription className="text-slate-600 text-sm">
                Showing {filteredStudents.length} students registered in the selected period
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {filteredStudents.length > 0 ? (
              <div className="space-y-3">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:bg-white hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Student Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-base shadow-md flex-shrink-0">
                          {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <UserIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            <h3 className="text-base font-semibold text-slate-900 truncate">
                              {student.firstName} {student.lastName}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <EnvelopeIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            <p className="text-sm text-slate-600 truncate">
                              {student.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Registration Date */}
                      <div className="flex flex-col sm:items-end gap-1 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-700">
                            {formatDate(student.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 sm:justify-end">
                          <ClockIcon className="w-4 h-4 text-blue-500" />
                          <span className="text-xs text-blue-600 font-medium">
                            {getTimeAgo(student.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <UserGroupIcon className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No registrations found
                </h3>
                <p className="text-slate-600 text-sm max-w-md mx-auto">
                  No students registered in the selected time period. Try selecting a different time range.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
