'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import {
  Cog6ToothIcon,
  UserIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  BookOpenIcon,
  CalendarIcon,
  EnvelopeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { getCdnUrl } from '../../utils/cdn';
import toast from 'react-hot-toast';

interface Tutor {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    createdCourses: number;
  };
}

export default function ManageUsersPage() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchTutors();
  }, []);

  const fetchTutors = async () => {
    try {
      setLoading(true);
      const response = await api.tutors.getAll();
      if (response.success) {
        setTutors(response.data.tutors || []);
      }
    } catch (error: any) {
      console.error('Error fetching tutors:', error);
      toast.error('Failed to load tutors');
    } finally {
      setLoading(false);
    }
  };

  const toggleTutorStatus = async (tutorId: string, currentStatus: boolean) => {
    try {
      setUpdatingId(tutorId);
      const response = await api.admin.toggleTutorStatus(tutorId, !currentStatus);

      if (response.success) {
        setTutors(prev => prev.map(tutor =>
          tutor.id === tutorId ? { ...tutor, isActive: !currentStatus } : tutor
        ));
        toast.success(`Tutor ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      } else {
        toast.error(response.error?.message || 'Failed to update tutor status');
      }
    } catch (error: any) {
      console.error('Error toggling tutor status:', error);
      toast.error(error.message || 'Failed to update tutor status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (tutorId: string) => {
    try {
      setDeletingId(tutorId);
      const response = await api.admin.deleteUser(tutorId);

      if (response.success) {
        setTutors(prev => prev.filter(tutor => tutor.id !== tutorId));
        toast.success('User deleted successfully');
        setDeleteConfirmId(null);
      } else {
        toast.error(response.error?.message || 'Failed to delete user');
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter tutors based on search and status
  const filteredTutors = tutors.filter(tutor => {
    // Handle search filter
    const trimmedQuery = searchQuery.trim().toLowerCase();
    const matchesSearch = trimmedQuery === '' ||
      (tutor.firstName?.toLowerCase() || '').includes(trimmedQuery) ||
      (tutor.lastName?.toLowerCase() || '').includes(trimmedQuery) ||
      (tutor.email?.toLowerCase() || '').includes(trimmedQuery) ||
      `${tutor.firstName} ${tutor.lastName}`.toLowerCase().includes(trimmedQuery);

    // Handle status filter
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && tutor.isActive) ||
      (filterStatus === 'inactive' && !tutor.isActive);

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: tutors.length,
    active: tutors.filter(t => t.isActive).length,
    inactive: tutors.filter(t => !t.isActive).length,
    totalCourses: tutors.reduce((sum, t) => sum + (t._count?.createdCourses || 0), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading tutors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Header with Gradient */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 pt-8 pb-44 sm:pb-52">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center ring-2 ring-white/30">
              <Cog6ToothIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Manage Users</h1>
              <p className="text-blue-100 text-sm sm:text-base mt-1">Control tutor accounts and permissions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-36 sm:-mt-44 pb-12">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4 sm:p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <UserGroupIcon className="h-5 w-5 text-white" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-600">Total Tutors</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-blue-600 to-blue-700 bg-clip-text text-transparent">{stats.total}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4 sm:p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircleIcon className="h-5 w-5 text-white" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-600">Active</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-green-600 to-green-700 bg-clip-text text-transparent">{stats.active}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4 sm:p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <XCircleIcon className="h-5 w-5 text-white" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-600">Inactive</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-amber-600 to-amber-700 bg-clip-text text-transparent">{stats.inactive}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4 sm:p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpenIcon className="h-5 w-5 text-white" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-600">Total Courses</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-purple-600 to-purple-700 bg-clip-text text-transparent">{stats.totalCourses}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none transition-all text-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'All', count: stats.total },
                { key: 'active', label: 'Active', count: stats.active },
                { key: 'inactive', label: 'Inactive', count: stats.inactive }
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilterStatus(key as typeof filterStatus)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                    filterStatus === key
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tutors List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5 text-slate-600" />
              All Tutors ({filteredTutors.length})
            </h2>
          </div>

          {filteredTutors.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UserIcon className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No tutors found</h3>
              <p className="text-slate-600">
                {searchQuery ? 'Try adjusting your search criteria' : 'No tutors available'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Tutor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Courses
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {filteredTutors.map((tutor) => (
                      <tr key={tutor.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="relative h-10 w-10 flex-shrink-0">
                              {tutor.avatar ? (
                                <img
                                  className="h-10 w-10 rounded-lg object-cover border border-slate-200"
                                  src={getCdnUrl(tutor.avatar) || ''}
                                  alt={`${tutor.firstName} ${tutor.lastName}`}
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                                  <UserIcon className="h-5 w-5 text-slate-400" />
                                </div>
                              )}
                              {/* Status Indicator */}
                              <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                                tutor.isActive ? 'bg-green-500' : 'bg-slate-400'
                              }`}></div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-slate-900">
                                {tutor.firstName} {tutor.lastName}
                              </div>
                              <div className="text-xs text-slate-500">
                                Joined {new Date(tutor.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-600">
                            {tutor.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                              <BookOpenIcon className="h-3.5 w-3.5 text-slate-600" />
                            </div>
                            <span className="text-sm font-semibold text-slate-900">{tutor._count?.createdCourses || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                            tutor.isActive
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {tutor.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {deleteConfirmId === tutor.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs text-amber-700 font-medium mr-2">Confirm deletion?</span>
                              <Button
                                onClick={() => handleDeleteUser(tutor.id)}
                                disabled={deletingId === tutor.id}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:bg-red-400"
                              >
                                {deletingId === tutor.id ? (
                                  <div className="flex items-center gap-1.5">
                                    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Deleting...</span>
                                  </div>
                                ) : (
                                  'Confirm'
                                )}
                              </Button>
                              <Button
                                onClick={() => setDeleteConfirmId(null)}
                                disabled={deletingId === tutor.id}
                                className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                onClick={() => toggleTutorStatus(tutor.id, tutor.isActive)}
                                disabled={updatingId === tutor.id || deletingId === tutor.id}
                                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                                  tutor.isActive
                                    ? 'bg-white hover:bg-slate-50 border border-slate-300 text-slate-700'
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                              >
                                {updatingId === tutor.id ? (
                                  <div className="flex items-center gap-1.5">
                                    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Updating...</span>
                                  </div>
                                ) : tutor.isActive ? (
                                  <div className="flex items-center gap-1.5">
                                    <XCircleIcon className="h-3.5 w-3.5" />
                                    <span>Deactivate</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <CheckCircleIcon className="h-3.5 w-3.5" />
                                    <span>Activate</span>
                                  </div>
                                )}
                              </Button>

                              <Button
                                onClick={() => setDeleteConfirmId(tutor.id)}
                                disabled={updatingId === tutor.id || deletingId === tutor.id}
                                className="px-2.5 py-1.5 bg-white hover:bg-red-50 border border-slate-300 hover:border-red-300 text-slate-600 hover:text-red-600 rounded-lg transition-colors disabled:opacity-50"
                                title="Delete user"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden p-4 space-y-3">
                {filteredTutors.map((tutor) => (
                  <div key={tutor.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-md transition-all">
                    {/* Card Header */}
                    <div className="p-4 border-b border-slate-100">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          {tutor.avatar ? (
                            <img
                              className="h-12 w-12 rounded-lg object-cover border border-slate-200"
                              src={getCdnUrl(tutor.avatar) || ''}
                              alt={`${tutor.firstName} ${tutor.lastName}`}
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-slate-400" />
                            </div>
                          )}
                          {/* Status Indicator */}
                          <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                            tutor.isActive ? 'bg-green-500' : 'bg-slate-400'
                          }`} title={tutor.isActive ? 'Active' : 'Inactive'}></div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-slate-900 truncate">
                                {tutor.firstName} {tutor.lastName}
                              </h3>
                              <p className="text-xs text-slate-500 truncate mt-0.5">
                                {tutor.email}
                              </p>
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium flex-shrink-0 ${
                              tutor.isActive
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-slate-50 text-slate-600 border border-slate-200'
                            }`}>
                              {tutor.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Body - Stats */}
                    <div className="px-4 py-3 bg-slate-50">
                      <div className="grid grid-cols-2 gap-3">
                        {/* Courses Stat */}
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                            <BookOpenIcon className="h-4 w-4 text-slate-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-slate-500 font-medium">Courses</p>
                            <p className="text-sm font-semibold text-slate-900">{tutor._count?.createdCourses || 0}</p>
                          </div>
                        </div>

                        {/* Joined Stat */}
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                            <CalendarIcon className="h-4 w-4 text-slate-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-slate-500 font-medium">Joined</p>
                            <p className="text-xs font-semibold text-slate-900">
                              {new Date(tutor.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer - Actions */}
                    <div className="p-3 border-t border-slate-100">
                      {deleteConfirmId === tutor.id ? (
                        <div className="space-y-2">
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                            <p className="text-xs font-medium text-amber-900">
                              Confirm deletion of this user?
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              onClick={() => handleDeleteUser(tutor.id)}
                              disabled={deletingId === tutor.id}
                              className="bg-red-600 hover:bg-red-700 text-white text-xs py-2 rounded-lg font-medium transition-colors disabled:bg-red-400"
                            >
                              {deletingId === tutor.id ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span>Deleting...</span>
                                </div>
                              ) : (
                                'Confirm'
                              )}
                            </Button>
                            <Button
                              onClick={() => setDeleteConfirmId(null)}
                              disabled={deletingId === tutor.id}
                              className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs py-2 rounded-lg font-medium transition-colors"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                          <Button
                            onClick={() => toggleTutorStatus(tutor.id, tutor.isActive)}
                            disabled={updatingId === tutor.id || deletingId === tutor.id}
                            className={`text-xs py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                              tutor.isActive
                                ? 'bg-white hover:bg-slate-50 border border-slate-300 text-slate-700'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          >
                            {updatingId === tutor.id ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Updating...</span>
                              </div>
                            ) : tutor.isActive ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <XCircleIcon className="h-3.5 w-3.5" />
                                <span>Deactivate</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5">
                                <CheckCircleIcon className="h-3.5 w-3.5" />
                                <span>Activate</span>
                              </div>
                            )}
                          </Button>
                          <Button
                            onClick={() => setDeleteConfirmId(tutor.id)}
                            disabled={updatingId === tutor.id || deletingId === tutor.id}
                            className="px-3 bg-white hover:bg-red-50 border border-slate-300 hover:border-red-300 text-slate-600 hover:text-red-600 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete user"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
