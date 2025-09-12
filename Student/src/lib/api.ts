import { ApiResponse, PaginatedResponse } from '../types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

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
        throw new Error(data.error?.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      // For auth/me endpoint, don't log 401 errors as they're expected
      if (!(endpoint === '/auth/me' && error.message?.includes('401'))) {
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
}

export const api = new ApiClient(API_BASE_URL);
export default api;