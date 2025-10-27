'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import {
  UserIcon,
  AcademicCapIcon,
  StarIcon,
  CalendarIcon,
  ChartBarIcon,
  BookOpenIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  PencilIcon,
  MapPinIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  CameraIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { api } from '../../lib/api';
import { User, Course } from '../../types/api';
import { getCdnUrl } from '../../utils/cdn';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalReviews: 0,
    joinDate: ''
  });
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      // Get user data
      const userResponse = await api.auth.getMe();
      if (userResponse.success) {
        setUser(userResponse.data.user);

        // Get analytics data for accurate counts
        const analyticsResponse = await api.analytics.getTutorAnalytics();
        if (analyticsResponse.success && analyticsResponse.data) {
          const { analytics } = analyticsResponse.data;

          setStats({
            totalCourses: analytics.courses.total,
            totalStudents: analytics.students.total,
            totalEarnings: analytics.revenue.total,
            averageRating: analytics.engagement.avgRating,
            totalReviews: analytics.engagement.totalReviews,
            joinDate: userResponse.data.user.createdAt || new Date().toISOString()
          });
        }

        // Get user's courses for display
        const coursesResponse = await api.courses.getMyCourses();
        if (coursesResponse.success) {
          const userCourses = coursesResponse.data.courses || [];
          setCourses(userCourses);
        }
      }
    } catch (error: any) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setSelectedAvatarFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!selectedAvatarFile) {
      toast.error('Please select an avatar image');
      return;
    }

    try {
      setAvatarUploading(true);

      const response = await api.uploads.avatar(selectedAvatarFile);

      if (response.success) {
        toast.success('Avatar updated successfully!');

        // Update user state with new avatar
        setUser(prev => prev ? {
          ...prev,
          avatar: response.data.user.avatar
        } : null);

        // Clear preview and selected file
        setAvatarPreview('');
        setSelectedAvatarFile(null);

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        toast.error(response.error?.message || 'Failed to upload avatar');
      }
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarCancel = () => {
    setSelectedAvatarFile(null);
    setAvatarPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderStars = (rating: number, size: string = 'w-4 h-4') => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= Math.floor(rating) ? (
          <StarIconSolid key={i} className={`${size} text-yellow-400`} />
        ) : (
          <StarIcon key={i} className={`${size} text-gray-300`} />
        )
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Header with Gradient */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 pt-8 pb-44 sm:pb-52">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center ring-2 ring-white/30">
              <UserIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold" style={{ color: 'white' }}>Profile</h1>
              <p className="text-sm sm:text-base mt-1" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Manage your teaching profile and achievements</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-36 sm:-mt-44 pb-12">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <div className="text-center">
                  <div className="relative h-24 w-24 mx-auto mb-4">
                    <div className="h-full w-full rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center overflow-hidden shadow-lg">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar Preview"
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : user?.avatar ? (
                        <img
                          src={getCdnUrl(user.avatar) || ''}
                          alt="Profile"
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <UserIcon className="h-12 w-12 text-slate-400" />
                      )}
                    </div>
                    <button
                      onClick={handleAvatarClick}
                      className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2.5 border-2 border-white shadow-lg transition-colors"
                      type="button"
                    >
                      <CameraIcon className="h-4 w-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                  </div>

                  {/* Avatar Upload Actions */}
                  {selectedAvatarFile && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                      <p className="text-xs text-slate-700 font-semibold truncate">Selected: {selectedAvatarFile.name}</p>
                      <div className="flex justify-center gap-2">
                        <Button
                          onClick={handleAvatarUpload}
                          disabled={avatarUploading}
                          className="text-xs px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md"
                        >
                          {avatarUploading ? (
                            <div className="flex items-center gap-1.5">
                              <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Uploading...</span>
                            </div>
                          ) : 'Upload'}
                        </Button>
                        <Button
                          onClick={handleAvatarCancel}
                          className="text-xs px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  <h2 className="text-xl font-bold text-slate-900 mb-2">{user?.firstName} {user?.lastName}</h2>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-600 shadow-md" style={{ color: 'white' }}>
                    {user?.role}
                  </span>

                  {stats.averageRating > 0 && (
                    <div className="flex items-center justify-center mt-4">
                      <div className="flex items-center gap-1 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                        {renderStars(stats.averageRating, 'w-4 h-4')}
                        <span className="ml-1.5 text-sm font-bold text-slate-900">
                          {stats.averageRating.toFixed(1)}
                        </span>
                        <span className="text-xs text-slate-600">
                          ({stats.totalReviews})
                        </span>
                      </div>
                    </div>
                  )}

                  {user?.bio && (
                    <p className="text-slate-700 text-sm mt-4 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">{user.bio}</p>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                    <EnvelopeIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-500 mb-0.5">Email</p>
                    <p className="text-sm font-medium text-slate-900 break-all">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200">
                  <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                    <CalendarIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-500 mb-0.5">Joined</p>
                    <p className="text-sm font-medium text-slate-900">{new Date(stats.joinDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</p>
                  </div>
                </div>
                {user?.timezone && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200">
                    <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                      <GlobeAltIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-500 mb-0.5">Timezone</p>
                      <p className="text-sm font-medium text-slate-900">{user.timezone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Courses */}
          <div className="lg:col-span-2">
            {/* Courses */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <AcademicCapIcon className="w-5 h-5 text-slate-600" />
                      My Courses ({stats.totalCourses})
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">Courses you've created and are teaching</p>
                  </div>
                  <Link href="/my-courses">
                    <Button className="w-full sm:w-auto text-xs px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md font-semibold">
                      View More Courses
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {courses.length > 0 ? (
                  <div className="space-y-3">
                    {courses.slice(0, 5).map((course) => (
                      <div key={course.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                            <BookOpenIcon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm mb-1.5 line-clamp-1">
                              {course.title}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <div className="flex items-center gap-1.5">
                                <UserGroupIcon className="w-3.5 h-3.5 text-slate-500" />
                                <span className="font-medium text-slate-700">{course._count?.enrollments || 0}</span>
                              </div>
                              <span className="text-slate-400">•</span>
                              <span className="font-semibold text-green-600">${course.price}</span>
                              {course.averageRating && (
                                <>
                                  <span className="text-slate-400">•</span>
                                  <div className="flex items-center gap-1">
                                    <StarIcon className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                    <span className="font-medium text-slate-700">{course.averageRating.toFixed(1)}</span>
                                  </div>
                                </>
                              )}
                            </div>
                            <div className="mt-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                                course.status === 'PUBLISHED'
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : course.status === 'DRAFT'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-slate-50 text-slate-700 border-slate-200'
                              }`}>
                                {course.status.charAt(0) + course.status.slice(1).toLowerCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Link href={`/courses/${course.id}/edit`} className="self-end sm:self-center">
                          <Button className="w-full sm:w-auto text-xs px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1.5 shadow-sm font-semibold">
                            <PencilIcon className="w-3.5 h-3.5" />
                            Edit
                          </Button>
                        </Link>
                      </div>
                    ))}
                    {courses.length > 5 && (
                      <div className="text-center pt-4 border-t border-slate-200 mt-2">
                        <Link href="/my-courses">
                          <Button className="w-full sm:w-auto text-xs px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md">
                            View More Courses
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-slate-100 border-2 border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
                      <BookOpenIcon className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No courses yet</h3>
                    <p className="text-slate-600 mb-6 text-sm max-w-md mx-auto">Start creating courses to build your teaching profile and reach students worldwide!</p>
                    <Link href="/create-course">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg">
                        Create Your First Course
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}