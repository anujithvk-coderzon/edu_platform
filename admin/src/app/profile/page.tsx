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
        
        // Get user's courses
        const coursesResponse = await api.courses.getMyCourses();
        if (coursesResponse.success) {
          const userCourses = coursesResponse.data.courses || [];
          setCourses(userCourses);
          
          // Calculate stats
          const totalStudents = userCourses.reduce((sum: number, course: any) => 
            sum + (course._count?.enrollments || 0), 0);
          // Since there's no payment system implemented yet, earnings should be 0
          const totalEarnings = 0;
          const totalReviews = userCourses.reduce((sum: number, course: any) => 
            sum + (course._count?.reviews || 0), 0);
          const weightedRating = userCourses.reduce((sum: number, course: any) => 
            sum + ((course.averageRating || 0) * (course._count?.reviews || 0)), 0);
          const averageRating = totalReviews > 0 ? weightedRating / totalReviews : 0;
          
          setStats({
            totalCourses: userCourses.length,
            totalStudents,
            totalEarnings,
            averageRating,
            totalReviews,
            joinDate: userResponse.data.user.createdAt || new Date().toISOString()
          });
        }
      }
    } catch (error) {
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
    } catch (error) {
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
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded-lg w-1/4 mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-80 bg-white rounded-xl shadow-sm border border-slate-200"></div>
              <div className="lg:col-span-2 h-80 bg-white rounded-xl shadow-sm border border-slate-200"></div>
            </div>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-1">
                  Profile
                </h1>
                <p className="text-slate-600 text-sm sm:text-base">Manage your teaching profile and achievements</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card className="bg-white shadow-sm border border-slate-200">
              <CardContent className="p-4 sm:p-6">
                <div className="text-center">
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20 mx-auto mb-4">
                    <div className="h-full w-full rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar Preview"
                          className="h-full w-full object-cover"
                        />
                      ) : user?.avatar ? (
                        <img
                          src={getCdnUrl(user.avatar) || ''}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserIcon className="h-8 w-8 sm:h-10 sm:w-10 text-slate-600" />
                      )}
                    </div>
                    <button
                      onClick={handleAvatarClick}
                      className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1.5 shadow-lg transition-colors duration-200"
                      type="button"
                    >
                      <CameraIcon className="h-3 w-3" />
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
                    <div className="mb-4 space-y-2">
                      <p className="text-sm text-slate-600">Selected: {selectedAvatarFile.name}</p>
                      <div className="flex justify-center gap-2">
                        <Button
                          onClick={handleAvatarUpload}
                          disabled={avatarUploading}
                          className="text-xs px-3 py-1"
                        >
                          {avatarUploading ? 'Uploading...' : 'Upload'}
                        </Button>
                        <Button
                          onClick={handleAvatarCancel}
                          variant="outline"
                          className="text-xs px-3 py-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-1">{user?.firstName} {user?.lastName}</h2>
                  <p className="text-slate-600 text-sm px-2 py-1 bg-slate-100 rounded-full inline-block">{user?.role}</p>
                  
                  {stats.averageRating > 0 && (
                    <div className="flex items-center justify-center mt-3">
                      <div className="flex items-center">
                        {renderStars(stats.averageRating)}
                        <span className="ml-2 text-xs sm:text-sm text-slate-600">
                          {stats.averageRating.toFixed(1)} ({stats.totalReviews} reviews)
                        </span>
                      </div>
                    </div>
                  )}

                  {user?.bio && (
                    <p className="text-slate-600 text-sm mt-4 leading-relaxed bg-slate-50 p-3 rounded-lg">{user.bio}</p>
                  )}
                </div>

                <div className="mt-6 space-y-3 border-t border-slate-200 pt-4">
                  <div className="flex items-center text-sm text-slate-600 space-x-3">
                    <EnvelopeIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{user?.email}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-600 space-x-3">
                    <CalendarIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>Joined {new Date(stats.joinDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long'
                    })}</span>
                  </div>
                  {user?.timezone && (
                    <div className="flex items-center text-sm text-slate-600 space-x-3">
                      <GlobeAltIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>{user.timezone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stats Overview */}
            <Card className="bg-white shadow-sm border border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-slate-900 text-base">
                  <ChartBarIcon className="w-5 h-5 mr-2 text-slate-600" />
                  Teaching Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpenIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm text-slate-600">Total Courses</span>
                  </div>
                  <span className="text-lg font-semibold text-slate-900">{stats.totalCourses}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <UserGroupIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm text-slate-600">Total Students</span>
                  </div>
                  <span className="text-lg font-semibold text-slate-900">{stats.totalStudents.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <CurrencyDollarIcon className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-sm text-slate-600">Total Earnings</span>
                  </div>
                  <span className="text-lg font-semibold text-slate-900">${stats.totalEarnings.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <StarIcon className="w-4 h-4 text-yellow-600" />
                    </div>
                    <span className="text-sm text-slate-600">Avg. Rating</span>
                  </div>
                  <span className="text-lg font-semibold text-slate-900">
                    {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Courses and Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Courses */}
            <Card className="bg-white shadow-sm border border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle className="flex items-center text-slate-900 text-base">
                    <AcademicCapIcon className="w-5 h-5 mr-2 text-slate-600" />
                    My Courses ({stats.totalCourses})
                  </CardTitle>
                  <Link href="/my-courses">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">View All</Button>
                  </Link>
                </div>
                <CardDescription className="text-slate-600 text-sm mt-1">Courses you've created and are teaching</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {courses.length > 0 ? (
                  <div className="space-y-3">
                    {courses.slice(0, 4).map((course) => (
                      <div key={course.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <BookOpenIcon className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-slate-900 text-sm truncate mb-1">
                              {course.title}
                            </h3>
                            <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                              <span>{course._count?.enrollments || 0} students</span>
                              <span>•</span>
                              <span>${course.price}</span>
                              {course.averageRating && (
                                <>
                                  <span>•</span>
                                  <span>{course.averageRating.toFixed(1)} ★</span>
                                </>
                              )}
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                course.status === 'PUBLISHED'
                                  ? 'bg-green-100 text-green-700'
                                  : course.status === 'DRAFT'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {course.status.charAt(0) + course.status.slice(1).toLowerCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Link href={`/courses/${course.id}/edit`} className="self-end sm:self-center">
                          <Button variant="ghost" size="sm" className="w-full sm:w-auto text-xs">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    ))}
                    {courses.length > 4 && (
                      <div className="text-center pt-4">
                        <Link href="/my-courses">
                          <Button variant="outline" className="w-full sm:w-auto">
                            View {courses.length - 4} More Course{courses.length - 4 !== 1 ? 's' : ''}
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <div className="h-16 w-16 sm:h-20 sm:w-20 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                      <BookOpenIcon className="h-8 w-8 sm:h-10 sm:w-10 text-slate-600" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2 sm:mb-3">No courses yet</h3>
                    <p className="text-slate-600 mb-4 sm:mb-6 text-sm sm:text-base">Start creating courses to build your teaching profile!</p>
                    <Link href="/create-course">
                      <Button className="w-full sm:w-auto">
                        Create Your First Course
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-white shadow-sm border border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-slate-900 text-base">
                  <ChartBarIcon className="w-5 h-5 mr-2 text-slate-600" />
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-slate-600 text-sm mt-1">Your latest teaching activities and achievements</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {stats.totalCourses > 0 ? (
                    <>
                      <div className="flex items-center p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border">
                        <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpenIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-slate-900">
                            You have {stats.totalCourses} active course{stats.totalCourses !== 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-slate-600">Keep creating great content!</p>
                        </div>
                      </div>

                      {stats.totalStudents > 0 && (
                        <div className="flex items-center p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border">
                          <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <UserGroupIcon className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-slate-900">
                              {stats.totalStudents} student{stats.totalStudents !== 1 ? 's have' : ' has'} enrolled in your courses
                            </p>
                            <p className="text-xs text-slate-600">Great work reaching students!</p>
                          </div>
                        </div>
                      )}

                      {stats.totalEarnings > 0 && (
                        <div className="flex items-center p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border">
                          <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <CurrencyDollarIcon className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-slate-900">
                              Total earnings: ${stats.totalEarnings.toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-600">Revenue from all courses</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <ChartBarIcon className="h-6 w-6 text-slate-600" />
                      </div>
                      <p className="text-sm font-medium text-slate-900 mb-1">No recent activity</p>
                      <p className="text-xs text-slate-600">Start teaching to see your activity here!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}