'use client';

import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { FileUpload } from '../../components/ui/FileUpload';
import { 
  UserIcon,
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { api } from '../../lib/api';
import { User } from '../../types/api';

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    bio: '',
    avatar: '',
    timezone: '',
    language: 'en',
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    theme: 'light'
  });

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'account', name: 'Account', icon: CogIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'privacy', name: 'Privacy & Security', icon: ShieldCheckIcon },
    { id: 'appearance', name: 'Appearance', icon: PaintBrushIcon },
    { id: 'preferences', name: 'Preferences', icon: GlobeAltIcon }
  ];

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await api.auth.getMe();
      if (response.success) {
        const userData = response.data.user;
        setUser(userData);
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          bio: userData.bio || '',
          avatar: userData.avatar || '',
          timezone: userData.timezone || 'UTC',
          language: userData.language || 'en',
          emailNotifications: userData.emailNotifications ?? true,
          pushNotifications: userData.pushNotifications ?? true,
          marketingEmails: userData.marketingEmails ?? false,
          theme: userData.theme || 'light'
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await api.users.updateProfile(formData);
      if (response.success) {
        // Show success message
        alert('Settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    try {
      const response = await api.uploads.avatar(file);
      if (response.success) {
        handleInputChange('avatar', response.data.avatarUrl);
        // Show success message
        alert('Avatar uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="lg:col-span-3 h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter your last name"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <Textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
              <div className="flex items-center space-x-4">
                <div className="h-20 w-20 rounded-full bg-gray-100 overflow-hidden">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <UserIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <FileUpload
                  onFileSelect={handleAvatarUpload}
                  accept="image/*"
                  placeholder="Click to change picture"
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                <Select
                  value={formData.timezone}
                  onChange={(value) => handleInputChange('timezone', value)}
                  options={[
                    { value: 'UTC', label: 'UTC' },
                    { value: 'America/New_York', label: 'Eastern Time' },
                    { value: 'America/Chicago', label: 'Central Time' },
                    { value: 'America/Denver', label: 'Mountain Time' },
                    { value: 'America/Los_Angeles', label: 'Pacific Time' },
                    { value: 'Europe/London', label: 'London' },
                    { value: 'Europe/Paris', label: 'Paris' },
                    { value: 'Asia/Tokyo', label: 'Tokyo' },
                    { value: 'Asia/Shanghai', label: 'Shanghai' }
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <Select
                  value={formData.language}
                  onChange={(value) => handleInputChange('language', value)}
                  options={[
                    { value: 'en', label: 'English' },
                    { value: 'es', label: 'Spanish' },
                    { value: 'fr', label: 'French' },
                    { value: 'de', label: 'German' },
                    { value: 'ja', label: 'Japanese' },
                    { value: 'zh', label: 'Chinese' }
                  ]}
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <Input type="password" placeholder="Enter current password" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <Input type="password" placeholder="Enter new password" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                    <Input type="password" placeholder="Confirm new password" />
                  </div>
                </div>
                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                  Update Password
                </Button>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.emailNotifications}
                    onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
                  <p className="text-sm text-gray-500">Receive push notifications in browser</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.pushNotifications}
                    onChange={(e) => handleInputChange('pushNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Marketing Emails</h3>
                  <p className="text-sm text-gray-500">Receive marketing and promotional emails</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.marketingEmails}
                    onChange={(e) => handleInputChange('marketingEmails', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">Privacy Settings</h3>
              <p className="text-sm text-yellow-700">Manage your privacy and data settings here.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Profile Visibility</h3>
                <Select
                  value="public"
                  onChange={() => {}}
                  options={[
                    { value: 'public', label: 'Public - Anyone can see your profile' },
                    { value: 'private', label: 'Private - Only you can see your profile' },
                    { value: 'students', label: 'Students Only - Only your students can see' }
                  ]}
                />
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Data Export</h3>
                <p className="text-sm text-gray-600 mb-3">Download a copy of your data</p>
                <Button variant="outline">
                  Request Data Export
                </Button>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-red-600 mb-2">Danger Zone</h3>
                <p className="text-sm text-gray-600 mb-3">Permanently delete your account and all associated data</p>
                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
              <Select
                value={formData.theme}
                onChange={(value) => handleInputChange('theme', value)}
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'system', label: 'System Default' }
                ]}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="border-2 border-blue-200 rounded-lg p-4 bg-white">
                <div className="h-20 bg-gradient-to-br from-blue-50 to-white rounded mb-2"></div>
                <p className="text-xs text-center text-gray-600">Light Theme</p>
              </div>
              <div className="border-2 border-gray-700 rounded-lg p-4 bg-gray-900">
                <div className="h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded mb-2"></div>
                <p className="text-xs text-center text-white">Dark Theme</p>
              </div>
              <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-100">
                <div className="h-20 bg-gradient-to-br from-gray-200 to-gray-100 rounded mb-2"></div>
                <p className="text-xs text-center text-gray-600">Auto</p>
              </div>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Course Duration</label>
              <Select
                value="flexible"
                onChange={() => {}}
                options={[
                  { value: 'flexible', label: 'Flexible (Student-paced)' },
                  { value: '30', label: '30 days' },
                  { value: '60', label: '60 days' },
                  { value: '90', label: '90 days' },
                  { value: '180', label: '6 months' },
                  { value: '365', label: '1 year' }
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Course Price</label>
              <Input
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course Categories</label>
              <div className="space-y-2">
                {['Programming', 'Design', 'Business', 'Marketing', 'Photography', 'Music'].map(category => (
                  <label key={category} className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 mr-2" />
                    <span className="text-sm text-gray-700">{category}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <tab.icon className={`w-5 h-5 mr-3 ${
                    activeTab === tab.id ? 'text-white' : 'text-gray-400'
                  }`} />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>
                  {tabs.find(tab => tab.id === activeTab)?.name}
                </CardTitle>
                <CardDescription>
                  Configure your {tabs.find(tab => tab.id === activeTab)?.name.toLowerCase()} settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderTabContent()}
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}