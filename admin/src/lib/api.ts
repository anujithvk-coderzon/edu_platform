import { ApiResponse, PaginatedResponse } from '../types/api';
import { env } from '../config/env';

interface RequestConfig {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  credentials?: RequestCredentials;
}

interface ErrorResponse {
  error?: {
    message?: string;
    details?: Array<{
      path?: string;
      param?: string;
      msg: string;
    }>;
  };
}

const API_BASE_URL = env.ADMIN_API_URL;

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    };

    const config: RequestInit = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (parseError) {
          // Handle JSON parsing errors
          throw new Error(`Failed to parse response as JSON. Status: ${response.status}`);
        }
      } else {
        // Handle non-JSON responses (like HTML error pages)
        throw new Error(`Server returned non-JSON response. Status: ${response.status}. Content-Type: ${contentType || 'unknown'}`);
      }

      if (!response.ok) {
        // For auth/me endpoint, don't throw error on 401 - just return the response
        if (endpoint === '/auth/me' && response.status === 401) {
          return data;
        }

        // Enhanced error handling for different response types
        const errorResponse = data as ErrorResponse;

        // If validation failed, include details in the error
        if (errorResponse.error?.message === 'Validation failed' && errorResponse.error?.details) {
          const validationDetails = errorResponse.error.details.map((detail: any) =>
            `${detail.path || detail.param}: ${detail.msg}`
          ).join(', ');
          throw new Error(`Validation failed: ${validationDetails}`);
        }

        // Handle different HTTP status codes
        switch (response.status) {
          case 401:
            throw new Error('Access denied. Please log in again.');
          case 403:
            throw new Error('You do not have permission to perform this action.');
          case 404:
            throw new Error('The requested resource was not found.');
          case 429:
            throw new Error('Too many requests. Please try again later.');
          case 500:
            throw new Error('Internal server error. Please try again later.');
          default:
            throw new Error(errorResponse.error?.message || `HTTP error! status: ${response.status}`);
        }
      }

      return data;
    } catch (error) {
      // Re-throw the error without logging sensitive data
      throw error;
    }
  }

  async get<T = any>(endpoint: string, params?: any): Promise<T> {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request<T>(`${endpoint}${query}`, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async uploadFile(endpoint: string, formData: FormData): Promise<ApiResponse> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 300000); // 5 minutes timeout

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Upload timed out. Please check your connection and try again.');
        } else if (error.message.includes('Failed to fetch')) {
          throw new Error('Network error. Please check your internet connection.');
        }
      }
      throw error;
    }
  }

  // Auth endpoints
  auth = {
    register: (userData: any) => this.post('/auth/register', userData),
    login: (credentials: any) => this.post('/auth/login', credentials),
    logout: () => this.post('/auth/logout'),
    getMe: () => this.get('/auth/me'),
    updateProfile: (data: any) => this.put('/auth/profile', data),
    changePassword: (data: any) => this.put('/auth/change-password', data),
  };

  // Course endpoints
  courses = {
    getAll: (params?: any) => this.get<PaginatedResponse>(`/courses?${new URLSearchParams(params || {})}`),
    getById: (id: string) => this.get<ApiResponse>(`/courses/${id}`),
    getMyCourses: (params?: any) => this.get<ApiResponse>(`/courses/my-courses${params ? '?' + new URLSearchParams(params) : ''}`),
    create: (data: any) => this.post<ApiResponse>('/courses', data),
    update: (id: string, data: any) => this.put<ApiResponse>(`/courses/${id}`, data),
    delete: (id: string) => this.delete<ApiResponse>(`/courses/${id}`),
    submitForReview: (id: string) => this.put<ApiResponse>(`/courses/${id}/submit-review`),
    publish: (id: string) => this.put<ApiResponse>(`/courses/${id}/publish`),
    reject: (id: string, reason?: string) => this.put<ApiResponse>(`/courses/${id}/reject`, { reason }),
    getPendingCount: () => this.get<ApiResponse>('/courses/pending/count'),
    getPending: () => this.get<ApiResponse>('/courses/pending'),
    getCategories: () => this.get<ApiResponse>('/courses/categories/all'),
    createCategory: (data: { name: string; description?: string }) => this.post<ApiResponse>('/categories', data),
  };

  // Enrollment endpoints
  enrollments = {
    enroll: (courseId: string) => this.post<ApiResponse>('/enrollments/enroll', { courseId }),
    getMy: () => this.get<ApiResponse>('/enrollments/my-enrollments'),
    getProgress: (courseId: string) => this.get<ApiResponse>(`/enrollments/progress/${courseId}`),
    updateStatus: (enrollmentId: string, status: string) =>
      this.put<ApiResponse>(`/enrollments/${enrollmentId}/status`, { status }),
    cancel: (enrollmentId: string) => this.delete<ApiResponse>(`/enrollments/${enrollmentId}`),
  };

  // Module endpoints
  modules = {
    getByCourse: (courseId: string) => this.get<ApiResponse>(`/modules/course/${courseId}`),
    getById: (id: string) => this.get<ApiResponse>(`/modules/${id}`),
    create: (data: any) => this.post<ApiResponse>('/modules', data),
    update: (id: string, data: any) => this.put<ApiResponse>(`/modules/${id}`, data),
    delete: (id: string) => this.delete<ApiResponse>(`/modules/${id}`),
  };

  // Material endpoints
  materials = {
    getByCourse: (courseId: string) => this.get<ApiResponse>(`/materials/course/${courseId}`),
    getById: (id: string) => this.get<ApiResponse>(`/materials/${id}`),
    create: (data: any) => this.post<ApiResponse>('/materials', data),
    update: (id: string, data: any) => this.put<ApiResponse>(`/materials/${id}`, data),
    delete: (id: string) => this.delete<ApiResponse>(`/materials/${id}`),
    markComplete: (id: string) => this.post<ApiResponse>(`/materials/${id}/complete`),
  };

  // User endpoints
  users = {
    updateProfile: (data: any) => this.put<ApiResponse>('/users/profile', data),
    uploadAvatar: (formData: FormData) => this.uploadFile('/users/avatar', formData),
    changePassword: (data: any) => this.put<ApiResponse>('/users/change-password', data),
    deleteAccount: () => this.delete<ApiResponse>('/users/account'),
    exportData: () => this.get<ApiResponse>('/users/export-data'),
  };

  // Upload endpoints
  uploads = {
    single: (file: File, type?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      if (type) formData.append('type', type);
      return this.uploadFile('/uploads/single', formData);
    },
    avatar: (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return this.uploadFile('/uploads/avatar', formData);
    },
    courseThumbnail: (file: File, courseId?: string) => {
      const formData = new FormData();
      formData.append('thumbnail', file);
      if (courseId) formData.append('courseId', courseId);
      return this.uploadFile('/uploads/course-thumbnail', formData);
    },
    material: (file: File, courseId?: string, materialId?: string, type?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      if (courseId) formData.append('courseId', courseId);
      if (materialId) formData.append('materialId', materialId);
      if (type) formData.append('type', type);
      return this.uploadFile('/uploads/material', formData);
    },
    batch: (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      return this.uploadFile('/uploads/batch', formData);
    },
    deleteFile: (url: string, materialId?: string, courseId?: string) => {
      return this.delete<ApiResponse>(`/uploads/file`, {
        url,
        materialId,
        courseId
      });
    }
  };

  // Analytics endpoints
  analytics = {
    getTutorAnalytics: () => this.get<ApiResponse>('/analytics/tutor'),
    getCourseCompletion: (courseId: string) => this.get<ApiResponse>(`/analytics/course/${courseId}/completion`)
  };

  // Students endpoints
  students = {
    getAll: () => this.get<ApiResponse>('/students'),
    getById: (id: string) => this.get<ApiResponse>(`/students/${id}`),
  };

  // Tutors endpoints
  tutors = {
    getAll: (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.status) queryParams.append('status', params.status);
      const queryString = queryParams.toString();
      return this.get<ApiResponse>(`/tutors${queryString ? `?${queryString}` : ''}`);
    },
  };

  // Assignment endpoints
  assignments = {
    create: (data: {
      title: string;
      description: string;
      dueDate?: string;
      maxScore?: number;
      courseId: string;
    }) => this.post<ApiResponse>('/assignments', data),

    getByCourse: (courseId: string) => this.get<ApiResponse>(`/assignments/course/${courseId}`),

    getById: (id: string) => this.get<ApiResponse>(`/assignments/${id}`),

    update: (id: string, data: {
      title?: string;
      description?: string;
      dueDate?: string;
      maxScore?: number;
    }) => this.put<ApiResponse>(`/assignments/${id}`, data),

    getSubmissions: (assignmentId: string) => this.get<ApiResponse>(`/assignments/${assignmentId}/submissions`),

    gradeSubmission: (submissionId: string, data: {
      score: number;
      feedback?: string;
    }) => this.put<ApiResponse>(`/assignments/submissions/${submissionId}/grade`, data),

    delete: (id: string) => this.delete<ApiResponse>(`/assignments/${id}`)
  };

  // Admin endpoints
  admin = {
    getStudentsCount: () => this.get<ApiResponse>('/students/count'),
    getAllRegisteredStudents: (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.status) queryParams.append('status', params.status);
      const queryString = queryParams.toString();
      return this.get<ApiResponse>(`/students/registered${queryString ? `?${queryString}` : ''}`);
    },
    getStatsOverview: () => this.get<ApiResponse>('/students/stats/overview'),
    getStudentStats: () => this.get<ApiResponse>('/students/stats/detailed'),
    toggleTutorStatus: (tutorId: string, isActive: boolean) =>
      this.put<ApiResponse>(`/admin/tutors/${tutorId}/status`, { isActive }),
    deleteUser: (userId: string) => this.delete<ApiResponse>(`/students/${userId}`),
    blockStudent: (studentId: string) => this.put<ApiResponse>(`/students/${studentId}/block`, {}),
    unblockStudent: (studentId: string) => this.put<ApiResponse>(`/students/${studentId}/unblock`, {})
  };
}

export const api = new ApiClient(API_BASE_URL);
export default api;