'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  UserIcon,
  CameraIcon,
  KeyIcon
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
    avatar: ''
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        avatar: user.avatar || ''
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
            avatar: response.data.user.avatar || ''
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
    toast.success('Avatar selected. Click "Update Profile" to save changes.');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl p-8 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Please log in</h3>
          <p className="text-slate-600">You need to be logged in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar Preview"
                    className="h-full w-full object-cover"
                  />
                ) : profileData.avatar ? (
                  <img
                    src={getCdnUrl(profileData.avatar) || ''}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-10 w-10 text-slate-400" />
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className={`absolute bottom-0 right-0 bg-indigo-600 rounded-lg p-2 cursor-pointer transition-colors shadow-sm ${
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
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                {profileData.firstName || user.firstName} {profileData.lastName || user.lastName}
              </h1>
              <p className="text-slate-600 mt-1">{profileData.email || user.email}</p>
              <p className="text-xs text-slate-500 mt-2">
                Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'profile', label: 'Profile', icon: UserIcon },
                { key: 'security', label: 'Security', icon: KeyIcon }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as typeof activeTab)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="max-w-lg">
                <h3 className="text-lg font-medium text-slate-900 mb-4">
                  Personal Information
                </h3>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  </div>
                  <Input
                    label="Email Address"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    disabled
                    className="bg-slate-50"
                  />
                  <p className="text-xs text-slate-500">Email cannot be changed</p>
                  {selectedAvatarFile && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-amber-700">
                          You have selected a new avatar. Click "Update Profile" to save it.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAvatarFile(null);
                            setAvatarPreview('');
                            toast.success('Avatar selection cleared');
                          }}
                          className="text-sm text-amber-600 hover:text-amber-800 underline"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      loading={loading}
                    >
                      {loading ? 'Updating...' : 'Update Profile'}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="max-w-lg">
                <h3 className="text-lg font-medium text-slate-900 mb-4">
                  Change Password
                </h3>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required
                  />
                  <Input
                    label="New Password"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    minLength={6}
                    required
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    minLength={6}
                    required
                  />
                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      loading={loading}
                    >
                      {loading ? 'Updating...' : 'Change Password'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}