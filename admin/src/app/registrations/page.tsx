'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface TutorRequest {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
}

export default function TutorRegistrationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<TutorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!authLoading && user?.role?.toLowerCase() === 'tutor') {
      router.push('/');
      return;
    }

    if (user) {
      fetchRequests();
    }
  }, [user, authLoading, router]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response: any = await api.get(`/tutor-requests`);

      if (response.success && response.data) {
        setRequests(response.data.requests);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to fetch tutor requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    if (!confirm('Are you sure you want to accept this tutor registration request?')) {
      return;
    }

    try {
      setProcessing(requestId);
      const response: any = await api.post(`/tutor-requests/${requestId}/accept`);

      if (response.success) {
        alert('Tutor request accepted successfully! Welcome email has been sent.');
        fetchRequests(); // Refresh the list

        // Notify Navbar to update the count
        window.dispatchEvent(new Event('tutorRequestUpdated'));
      }
    } catch (error: any) {
      alert(error.message || 'Failed to accept tutor request');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm('Are you sure you want to reject this tutor registration request? A rejection email will be sent.')) {
      return;
    }

    try {
      setProcessing(requestId);
      const response: any = await api.post(`/tutor-requests/${requestId}/reject`);

      if (response.success) {
        alert('Tutor request rejected. Rejection email has been sent.');
        fetchRequests(); // Refresh the list

        // Notify Navbar to update the count
        window.dispatchEvent(new Event('tutorRequestUpdated'));
      }
    } catch (error: any) {
      alert(error.message || 'Failed to reject tutor request');
    } finally {
      setProcessing(null);
    }
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

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading tutor registration requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Pending Tutor Registration Requests</h1>
          <p className="mt-2 text-slate-600">
            Review and approve or reject tutor registration requests
          </p>
          {requests.length > 0 && (
            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
              <ClockIcon className="w-4 h-4 mr-2" />
              {requests.length} pending {requests.length === 1 ? 'request' : 'requests'}
            </div>
          )}
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <Card className="p-12 text-center">
            <UserIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900">No pending requests</h3>
            <p className="mt-1 text-sm text-slate-500">
              There are no pending tutor registration requests at this time.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {request.firstName} {request.lastName}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            PENDING
                          </span>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-slate-500">
                          <EnvelopeIcon className="h-4 w-4 mr-1" />
                          {request.email}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-500">
                      <p>Submitted: {formatDate(request.createdAt)}</p>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-0 md:ml-6 flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => handleAccept(request.id)}
                      disabled={processing === request.id}
                      className="bg-green-600 hover:bg-green-700 text-white inline-flex items-center"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      {processing === request.id ? 'Accepting...' : 'Accept'}
                    </Button>
                    <Button
                      onClick={() => handleReject(request.id)}
                      disabled={processing === request.id}
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50 inline-flex items-center"
                    >
                      <XCircleIcon className="h-4 w-4 mr-2" />
                      {processing === request.id ? 'Rejecting...' : 'Reject'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
