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
  CurrencyRupeeIcon,
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
import toast from 'react-hot-toast';
import { formatPrice } from '@/utils/currency';

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
          <StarIconSolid key={i} className={`${size} text-[#FDB022]`} />
        ) : (
          <StarIcon key={i} className={`${size} text-[#C7D2DE]`} />
        )
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F8FA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1D4ED8] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-[#475569] font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FA]">
      {/* Hero Header with Gradient */}
      <div className="bg-[#1D4ED8] pt-8 pb-44 sm:pb-52">
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
            <div className="bg-white rounded-2xl shadow-xl border border-[#DDE3EA] overflow-hidden">
              <div className="p-6 border-b border-[#DDE3EA]">
                <div className="text-center">
                  <div className="relative h-24 w-24 mx-auto mb-4">
                    <div className="h-full w-full rounded-full bg-[#E9EEF4] border-2 border-[#DDE3EA] flex items-center justify-center overflow-hidden shadow-lg">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar Preview"
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : user?.avatar ? (
                        <img
                          src={user.avatar || ''}
                          alt="Profile"
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <UserIcon className="h-12 w-12 text-[#94A3B8]" />
                      )}
                    </div>
                    <button
                      onClick={handleAvatarClick}
                      className="absolute bottom-0 right-0 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded-full p-2.5 border-2 border-white shadow-lg transition-colors"
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
                    <div className="mb-4 p-3 bg-[#EFF4FF] border border-[#C7D7FE] rounded-xl space-y-2">
                      <p className="text-xs text-[#334155] font-semibold truncate">Selected: {selectedAvatarFile.name}</p>
                      <div className="flex justify-center gap-2">
                        <Button
                          onClick={handleAvatarUpload}
                          disabled={avatarUploading}
                          className="text-xs px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded-lg shadow-md"
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
                          className="text-xs px-4 py-2 bg-white border border-[#C7D2DE] text-[#334155] hover:bg-[#F6F8FA] rounded-lg"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  <h2 className="text-xl font-bold text-[#0F172A] mb-2">{user?.firstName} {user?.lastName}</h2>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#1D4ED8] shadow-md" style={{ color: 'white' }}>
                    {user?.role}
                  </span>

                  {stats.averageRating > 0 && (
                    <div className="flex items-center justify-center mt-4">
                      <div className="flex items-center gap-1 bg-[#F6F8FA] px-4 py-2 rounded-lg border border-[#DDE3EA] shadow-sm">
                        {renderStars(stats.averageRating, 'w-4 h-4')}
                        <span className="ml-1.5 text-sm font-bold text-[#0F172A]">
                          {stats.averageRating.toFixed(1)}
                        </span>
                        <span className="text-xs text-[#475569]">
                          ({stats.totalReviews})
                        </span>
                      </div>
                    </div>
                  )}

                  {user?.bio && (
                    <p className="text-[#334155] text-sm mt-4 leading-relaxed bg-[#F6F8FA] p-3 rounded-lg border border-[#DDE3EA]">{user.bio}</p>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div className="flex items-start gap-3 p-3 bg-[#F6F8FA] rounded-xl hover:bg-[#E9EEF4] transition-colors border border-[#DDE3EA]">
                  <div className="w-10 h-10 bg-[#1D4ED8] rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                    <EnvelopeIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#64748B] mb-0.5">Email</p>
                    <p className="text-sm font-medium text-[#0F172A] break-all">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-[#F6F8FA] rounded-xl hover:bg-[#E9EEF4] transition-colors border border-[#DDE3EA]">
                  <div className="w-10 h-10 bg-[#079455] rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                    <CalendarIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-[#64748B] mb-0.5">Joined</p>
                    <p className="text-sm font-medium text-[#0F172A]">{new Date(stats.joinDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</p>
                  </div>
                </div>
                {user?.timezone && (
                  <div className="flex items-start gap-3 p-3 bg-[#F6F8FA] rounded-xl hover:bg-[#E9EEF4] transition-colors border border-[#DDE3EA]">
                    <div className="w-10 h-10 bg-[#1D4ED8] rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                      <GlobeAltIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-[#64748B] mb-0.5">Timezone</p>
                      <p className="text-sm font-medium text-[#0F172A]">{user.timezone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Courses */}
          <div className="lg:col-span-2">
            {/* Courses */}
            <div className="bg-white rounded-2xl shadow-xl border border-[#DDE3EA] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#DDE3EA]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-[#0F172A] flex items-center gap-2">
                      <AcademicCapIcon className="w-5 h-5 text-[#475569]" />
                      My Courses ({stats.totalCourses})
                    </h3>
                    <p className="text-sm text-[#475569] mt-1">Courses you've created and are teaching</p>
                  </div>
                  <Link href="/my-courses">
                    <Button className="w-full sm:w-auto text-xs px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded-lg shadow-md font-semibold">
                      View More Courses
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {courses.length > 0 ? (
                  <div className="space-y-3">
                    {courses.slice(0, 5).map((course) => (
                      <div key={course.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#F6F8FA] hover:bg-[#E9EEF4] rounded-xl transition-colors border border-[#DDE3EA]">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-11 h-11 bg-[#1D4ED8] rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                            <BookOpenIcon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-[#0F172A] text-sm mb-1.5 line-clamp-1">
                              {course.title}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <div className="flex items-center gap-1.5">
                                <UserGroupIcon className="w-3.5 h-3.5 text-[#64748B]" />
                                <span className="font-medium text-[#334155]">{course._count?.enrollments || 0}</span>
                              </div>
                              <span className="text-[#94A3B8]">•</span>
                              <span className="font-semibold text-[#079455]">{formatPrice(course.price)}</span>
                              {course.averageRating && (
                                <>
                                  <span className="text-[#94A3B8]">•</span>
                                  <div className="flex items-center gap-1">
                                    <StarIcon className="w-3.5 h-3.5 text-[#F79009] fill-[#F79009]" />
                                    <span className="font-medium text-[#334155]">{course.averageRating.toFixed(1)}</span>
                                  </div>
                                </>
                              )}
                            </div>
                            <div className="mt-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                                course.status === 'PUBLISHED'
                                  ? 'bg-[#ECFDF3] text-[#067647] border-[#ABEFC6]'
                                  : course.status === 'DRAFT'
                                  ? 'bg-[#FFFAEB] text-[#B45309] border-[#FEDF89]'
                                  : 'bg-[#F6F8FA] text-[#334155] border-[#DDE3EA]'
                              }`}>
                                {course.status.charAt(0) + course.status.slice(1).toLowerCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Link href={`/courses/${course.id}/edit`} className="self-end sm:self-center">
                          <Button className="w-full sm:w-auto text-xs px-4 py-2 bg-[#334155] hover:bg-[#1E293B] text-white rounded-lg flex items-center gap-1.5 shadow-sm font-semibold">
                            <PencilIcon className="w-3.5 h-3.5" />
                            Edit
                          </Button>
                        </Link>
                      </div>
                    ))}
                    {courses.length > 5 && (
                      <div className="text-center pt-4 border-t border-[#DDE3EA] mt-2">
                        <Link href="/my-courses">
                          <Button className="w-full sm:w-auto text-xs px-6 py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded-lg font-semibold shadow-md">
                            View More Courses
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-[#E9EEF4] border-2 border-[#DDE3EA] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
                      <BookOpenIcon className="w-10 h-10 text-[#94A3B8]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#0F172A] mb-2">No courses yet</h3>
                    <p className="text-[#475569] mb-6 text-sm max-w-md mx-auto">Start creating courses to build your teaching profile and reach students worldwide!</p>
                    <Link href="/create-course">
                      <Button className="bg-[#1D4ED8] hover:bg-[#1E40AF] text-white px-8 py-3 rounded-lg font-semibold shadow-lg">
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