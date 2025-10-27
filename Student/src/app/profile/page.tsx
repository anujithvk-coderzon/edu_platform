'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import {
  UserIcon,
  CameraIcon,
  KeyIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CakeIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getCdnUrl } from '@/utils/cdn';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [loading, setLoading] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    avatar: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    city: '',
    education: '',
    institution: '',
    occupation: '',
    company: ''
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      console.log('User hasPassword value:', user.hasPassword);
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        avatar: user.avatar || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        gender: user.gender || '',
        city: user.city || '',
        education: user.education || '',
        institution: user.institution || '',
        occupation: user.occupation || '',
        company: user.company || ''
      });
    }
  }, [user]);

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      // If there's a selected avatar file, upload it first
      let avatarUrl = profileData.avatar;
      if (selectedAvatarFile) {
        try {
          const avatarResponse = await api.uploads.avatar(selectedAvatarFile);
          if (avatarResponse.success) {
            avatarUrl = avatarResponse.data.url;
          }
        } catch (error: any) {
          toast.error('Failed to upload avatar: ' + (error.message || 'Unknown error'));
          setLoading(false);
          return;
        }
      }

      // Update profile with new data including avatar URL if changed
      const updateData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone || null,
        dateOfBirth: profileData.dateOfBirth || null,
        gender: profileData.gender || null,
        city: profileData.city || null,
        education: profileData.education || null,
        institution: profileData.institution || null,
        occupation: profileData.occupation || null,
        company: profileData.company || null,
        ...(selectedAvatarFile && avatarUrl ? { avatar: avatarUrl } : {})
      };

      const response = await api.auth.updateProfile(updateData);
      if (response.success) {
        toast.success('Profile updated successfully!');
        await refreshUser();
        // Clear selected file and preview after successful update
        setSelectedAvatarFile(null);
        setAvatarPreview('');
        // Update local state with the response data
        if (response.data?.user) {
          setProfileData({
            firstName: response.data.user.firstName || '',
            lastName: response.data.user.lastName || '',
            email: response.data.user.email || '',
            avatar: response.data.user.avatar || '',
            phone: response.data.user.phone || '',
            dateOfBirth: response.data.user.dateOfBirth ? new Date(response.data.user.dateOfBirth).toISOString().split('T')[0] : '',
            gender: response.data.user.gender || '',
            city: response.data.user.city || '',
            education: response.data.user.education || '',
            institution: response.data.user.institution || '',
            occupation: response.data.user.occupation || '',
            company: response.data.user.company || ''
          });
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const response = await api.auth.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      if (response.success) {
        toast.success('Password updated successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Create a preview URL for immediate display
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setSelectedAvatarFile(file);
    toast.success('Avatar selected. Click "Save Changes" to upload.');
  };

  // Calculate profile completion percentage
  const getProfileCompletion = () => {
    const fields = [
      profileData.firstName,
      profileData.lastName,
      profileData.phone,
      profileData.dateOfBirth,
      profileData.gender,
      profileData.city,
      profileData.education,
      profileData.institution,
      profileData.occupation,
      profileData.company,
      profileData.avatar
    ];
    const filledFields = fields.filter(field => field && field.trim() !== '').length;
    return Math.round((filledFields / fields.length) * 100);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg border border-slate-200 max-w-md">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserIcon className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Please log in</h3>
          <p className="text-slate-600">You need to be logged in to view your profile.</p>
        </div>
      </div>
    );
  }

  const profileCompletion = getProfileCompletion();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Header with Gradient */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 pt-8 pb-32 sm:pb-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">My Profile</h1>
          <p className="text-indigo-100 text-sm sm:text-base">Manage your personal information and settings</p>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 sm:-mt-32 pb-12">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-6">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center overflow-hidden ring-4 ring-white shadow-xl">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar Preview"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : profileData.avatar ? (
                    <img
                      src={getCdnUrl(profileData.avatar) || ''}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <UserIcon className="h-12 w-12 sm:h-14 sm:w-14 text-white" />
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className={`absolute bottom-0 right-0 bg-indigo-600 rounded-xl p-2.5 cursor-pointer transition-all shadow-lg hover:shadow-xl hover:scale-105 ${
                    loading ? 'bg-gray-400 cursor-not-allowed' : 'hover:bg-indigo-700'
                  }`}
                  title={loading ? 'Processing...' : 'Change avatar'}
                >
                  <CameraIcon className="h-4 w-4 text-white" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelection}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 truncate">
                  {profileData.firstName} {profileData.lastName}
                </h2>
                <p className="text-slate-600 mb-3 break-all">{profileData.email}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <EnvelopeIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Member since</span>
                    <span className="font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Profile Completion */}
              <div className="sm:ml-auto">
                <div className="bg-slate-50 rounded-xl p-4 text-center min-w-[140px]">
                  <div className="relative w-20 h-20 mx-auto mb-2">
                    <svg className="transform -rotate-90 w-20 h-20">
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        className="text-slate-200"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 32}`}
                        strokeDashoffset={`${2 * Math.PI * 32 * (1 - profileCompletion / 100)}`}
                        className="text-indigo-600 transition-all duration-500"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-slate-900">{profileCompletion}%</span>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-slate-600">Profile Complete</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 mb-6 overflow-hidden">
          <div className="border-b border-slate-200">
            <nav className="flex">
              {[
                { key: 'profile', label: 'Profile Information', icon: UserIcon },
                { key: 'security' as const, label: 'Password & Security', icon: KeyIcon }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as typeof activeTab)}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 font-medium text-sm transition-all ${
                    activeTab === key
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{key === 'profile' ? 'Profile' : 'Security'}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            {/* Avatar Selection Alert */}
            {selectedAvatarFile && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-xl">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-amber-800">
                      New avatar selected. Remember to save your changes!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAvatarFile(null);
                      setAvatarPreview('');
                      toast.success('Avatar selection cleared');
                    }}
                    className="ml-3 text-amber-500 hover:text-amber-600"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Basic Information Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-slate-600" />
                  Basic Information
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input
                    label="First Name"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                  <Input
                    label="Last Name"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label="Email Address"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      disabled
                      className="bg-slate-50"
                    />
                    <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Email cannot be changed for security reasons
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <PhoneIcon className="h-5 w-5 text-blue-600" />
                  Contact Information
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input
                    label="Phone Number"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                  <Input
                    label="City"
                    value={profileData.city}
                    onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="New York"
                  />
                </div>
              </div>
            </div>

            {/* Personal Details Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <CakeIcon className="h-5 w-5 text-purple-600" />
                  Personal Details
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input
                    label="Date of Birth"
                    type="date"
                    value={profileData.dateOfBirth}
                    onChange={(e) => setProfileData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  />
                  <Select
                    label="Gender"
                    value={profileData.gender}
                    onChange={(e) => setProfileData(prev => ({ ...prev, gender: e.target.value }))}
                    options={[
                      { value: 'Male', label: 'Male' },
                      { value: 'Female', label: 'Female' },
                      { value: 'Other', label: 'Other' },
                      { value: 'Prefer not to say', label: 'Prefer not to say' }
                    ]}
                    placeholder="Select gender"
                  />
                </div>
              </div>
            </div>

            {/* Education & Career Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <AcademicCapIcon className="h-5 w-5 text-green-600" />
                  Education & Career
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input
                    label="Education Level"
                    value={profileData.education}
                    onChange={(e) => setProfileData(prev => ({ ...prev, education: e.target.value }))}
                    placeholder="Bachelor's Degree"
                  />
                  <Input
                    label="Institution"
                    value={profileData.institution}
                    onChange={(e) => setProfileData(prev => ({ ...prev, institution: e.target.value }))}
                    placeholder="University Name"
                  />
                  <Input
                    label="Occupation"
                    value={profileData.occupation}
                    onChange={(e) => setProfileData(prev => ({ ...prev, occupation: e.target.value }))}
                    placeholder="Software Engineer"
                  />
                  <Input
                    label="Company"
                    value={profileData.company}
                    onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Company Name"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                className="px-8 py-3"
              >
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                {loading ? 'Saving Changes...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'security' && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <KeyIcon className="h-5 w-5 text-red-600" />
                Password & Security
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {user.hasPassword === false
                  ? 'Manage your account security'
                  : 'Ensure your account is using a strong password'
                }
              </p>
            </div>
            <div className="p-6">
              {user.hasPassword === false ? (
                // OAuth User - Show informative message
                <div className="max-w-2xl">
                  <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      You signed in using Google or GitHub authentication.
                    </p>
                  </div>
                </div>
              ) : (
                // Regular User - Show password change form
                <form onSubmit={handlePasswordChange} className="space-y-6 max-w-lg">
                  <Input
                    label="Current Password"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required
                    placeholder="Enter your current password"
                  />
                  <Input
                    label="New Password"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    minLength={6}
                    required
                    placeholder="Enter new password (min. 6 characters)"
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    minLength={6}
                    required
                    placeholder="Confirm your new password"
                  />

                  {/* Password Requirements */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Password Requirements:</h4>
                    <ul className="space-y-1 text-xs text-blue-800">
                      <li className="flex items-center gap-2">
                        <CheckCircleIcon className="h-4 w-4 text-blue-600" />
                        At least 6 characters long
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircleIcon className="h-4 w-4 text-blue-600" />
                        Use a unique password you don't use elsewhere
                      </li>
                    </ul>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={loading}
                      loading={loading}
                      className="px-8 py-3"
                    >
                      <KeyIcon className="h-5 w-5 mr-2" />
                      {loading ? 'Updating Password...' : 'Update Password'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
