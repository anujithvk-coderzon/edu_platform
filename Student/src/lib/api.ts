import { ApiResponse, PaginatedResponse } from '../types/api';
import { studentStorage } from '../utils/storage';
import { env } from '../config/env';

const API_BASE_URL = env.STUDENT_API_URL;

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getToken(): string | null {
    // No longer needed since we use cookies
    return null;
  }

  private setToken(token: string): void {
    // No longer needed since backend sets cookies
  }

  private removeToken(): void {
    // No longer needed since backend clears cookies
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
      // Use cookies for authentication (student_token cookie)
      credentials: 'include',
    };

    const config = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // For auth/me endpoint, don't throw error on 401 - just return the response
        if (endpoint === '/auth/me' && response.status === 401) {
          return data;
        }

        // Check for session expired/invalidated errors
        if (response.status === 401) {
          const errorMessage = data.error?.message || '';
          const isSessionError =
            errorMessage.includes('logged in from another device') ||
            errorMessage.includes('Session expired') ||
            errorMessage.includes('Invalid session');

          if (isSessionError) {
            // Clear local storage
            studentStorage.clearStudentData();

            // Call logout endpoint to clear cookie on server
            try {
              await fetch(`${this.baseURL}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
              });
            } catch (logoutError) {
              // Ignore logout errors, cookie might already be cleared
            }

            // Redirect to login
            window.location.href = '/login?session_expired=true';
            throw new Error(errorMessage);
          }
        }

        // Enhanced error handling for validation errors
        if (data.error?.message === 'Validation failed' && data.error?.details) {
          const validationDetails = data.error.details.map((detail: any) =>
            `${detail.path || detail.param}: ${detail.msg}`
          ).join(', ');
          throw new Error(`Validation failed: ${validationDetails}`);
        }

        throw new Error(data.error?.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      // For auth/me endpoint, don't log 401 errors as they're expected
      const errorMessage = error instanceof Error ? error.message : '';
      if (!(endpoint === '/auth/me' && errorMessage.includes('401'))) {
        console.error(`API Error (${url}):`, error);
      }
      throw error;
    }
  }

  async get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
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

  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async uploadFile(endpoint: string, formData: FormData): Promise<ApiResponse> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`Upload Error (${url}):`, error);
      throw error;
    }
  }

  // Auth endpoints
  auth = {
    register: async (userData: any) => {
      // Backend now sets role-specific cookie automatically
      const response = await this.post('/auth/register', userData);
      return response;
    },
    login: async (credentials: any) => {
      // Backend now sets role-specific cookie automatically
      const response = await this.post('/auth/login', credentials);
      return response;
    },
    logout: async () => {
      // Backend now clears role-specific cookie automatically
      const response = await this.post('/auth/logout');
      return response;
    },
    getMe: () => this.get('/auth/me'),
    updateProfile: (data: any) => this.put('/auth/profile', data),
    changePassword: (data: any) => this.put('/auth/change-password', data),
    forgotPassword: (data: { email: string }) => this.post('/auth/forgot-password', data),
    verifyForgotPasswordOtp: (data: { email: string; otp: string }) =>
      this.post('/auth/verify-forgot-password-otp', data),
    resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
      this.post('/auth/reset-password', data),
  };

  // Course endpoints
  courses = {
    getAll: (params?: any) => this.get<PaginatedResponse>(`/courses?${new URLSearchParams(params || {})}`),
    getById: (id: string) => this.get<ApiResponse>(`/courses/${id}`),
    getMyCourses: () => this.get<ApiResponse>('/courses/my-courses'),
    create: (data: any) => this.post<ApiResponse>('/courses', data),
    update: (id: string, data: any) => this.put<ApiResponse>(`/courses/${id}`, data),
    delete: (id: string) => this.delete<ApiResponse>(`/courses/${id}`),
    getCategories: () => this.get<ApiResponse>('/courses/categories/all'),
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

  // Material endpoints
  materials = {
    getByCourse: (courseId: string) => this.get<ApiResponse>(`/materials/course/${courseId}`),
    getById: (id: string) => this.get<ApiResponse>(`/materials/${id}`),
    create: (data: any) => this.post<ApiResponse>('/materials', data),
    update: (id: string, data: any) => this.put<ApiResponse>(`/materials/${id}`, data),
    delete: (id: string) => this.delete<ApiResponse>(`/materials/${id}`),
    markComplete: (id: string) => this.post<ApiResponse>(`/materials/${id}/complete`),
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
  };

  // Review endpoints
  reviews = {
    submit: (data: { courseId: string; rating: number; comment?: string }) =>
      this.post<ApiResponse>('/reviews', data),
    getCourseReviews: (courseId: string) =>
      this.get<ApiResponse>(`/reviews/course/${courseId}`),
    getMyReview: (courseId: string) =>
      this.get<ApiResponse>(`/reviews/my-review/${courseId}`),
  };

  // Assignment endpoints
  assignments = {
    getByCourse: (courseId: string) =>
      this.get<ApiResponse>(`/assignments/course/${courseId}`),
    getById: (assignmentId: string) =>
      this.get<ApiResponse>(`/assignments/${assignmentId}`),
    getSubmission: (assignmentId: string) =>
      this.get<ApiResponse>(`/assignments/${assignmentId}/submission`),
    submit: (assignmentId: string, data: { content?: string; fileUrl?: string }) =>
      this.post<ApiResponse>(`/assignments/${assignmentId}/submit`, data),
    uploadFile: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return this.uploadFile('/assignments/upload', formData);
    },
  };

}

export const api = new ApiClient(API_BASE_URL);
export default api;