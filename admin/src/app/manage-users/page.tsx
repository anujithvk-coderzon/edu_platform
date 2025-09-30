'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Cog6ToothIcon, UserIcon } from '@heroicons/react/24/outline';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading tutors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Cog6ToothIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Manage Users</h1>
              <p className="text-slate-600">Manage tutor accounts and their status</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <p className="text-sm text-slate-600">Total Tutors</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{tutors.length}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-slate-600">Active Tutors</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {tutors.filter(t => t.isActive).length}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-slate-600">Inactive Tutors</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {tutors.filter(t => !t.isActive).length}
            </p>
          </Card>
        </div>

        {/* Tutors List */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">All Tutors</h2>
          </div>

          {tutors.length === 0 ? (
            <div className="p-8 text-center">
              <UserIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No tutors found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {tutors.map((tutor) => (
                    <tr key={tutor.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {tutor.avatar ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={getCdnUrl(tutor.avatar) || ''}
                                alt={`${tutor.firstName} ${tutor.lastName}`}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-slate-500" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900">
                              {tutor.firstName} {tutor.lastName}
                            </div>
                            <div className="text-sm text-slate-500">
                              Joined {new Date(tutor.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{tutor.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          {tutor._count?.createdCourses || 0} courses
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          tutor.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {tutor.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          onClick={() => toggleTutorStatus(tutor.id, tutor.isActive)}
                          disabled={updatingId === tutor.id}
                          variant={tutor.isActive ? 'outline' : 'default'}
                          className={tutor.isActive ? 'text-red-600 border-red-300 hover:bg-red-50' : 'bg-green-600 hover:bg-green-700'}
                        >
                          {updatingId === tutor.id ? (
                            'Updating...'
                          ) : tutor.isActive ? (
                            'Deactivate'
                          ) : (
                            'Activate'
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}