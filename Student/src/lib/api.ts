import { ApiResponse, PaginatedResponse } from '../types/api';
import { studentStorage } from '../utils/storage';
import { env } from '../config/env';

const API_BASE_URL = env.STUDENT_API_URL;

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // iOS Safari blocks third-party cookies outright, so the session cookie never
  // survives on iPhone. The backend also accepts `Authorization: Bearer`, so the
  // token is kept client-side and sent as a header; the cookie still rides along
  // for browsers that allow it.
  private getToken(): string | null {
    return studentStorage.getToken();
  }

  private setToken(token: string): void {
    studentStorage.setToken(token);
  }

  private removeToken(): void {
    studentStorage.removeToken();
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      // Cookie for browsers that permit it; the header is what works on iOS.
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

        // Check for session expired error
        if (response.status === 401 && data.error?.message?.includes('logged in from another device')) {
          // Clear local storage and redirect to login
          studentStorage.clearStudentData();
          window.location.href = '/login?session_expired=true';
          throw new Error(data.error.message);
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
    const token = this.getToken();

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        // No Content-Type: FormData must set its own multipart boundary.
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Auth endpoints
  auth = {
    register: async (userData: any) => {
      const response = await this.post('/auth/register', userData);
      if (response?.data?.token) this.setToken(response.data.token);
      return response;
    },
    login: async (credentials: any) => {
      const response = await this.post('/auth/login', credentials);
      if (response?.data?.token) this.setToken(response.data.token);
      return response;
    },
    logout: async () => {
      try {
        return await this.post('/auth/logout');
      } finally {
        // Drop the local token even if the network call fails.
        this.removeToken();
      }
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
    getMy: (params?: any) => this.get<ApiResponse>(`/enrollments/my-enrollments?${new URLSearchParams(params || {})}`),
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
    getCourseReviews: (courseId: string, params?: any) =>
      this.get<ApiResponse>(`/reviews/course/${courseId}?${new URLSearchParams(params || {})}`),
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

  // Platform statistics endpoints
  platform = {
    getStats: () =>
      this.get<ApiResponse>('/platform/stats'),
  };

}

export const api = new ApiClient(API_BASE_URL);
export default api;