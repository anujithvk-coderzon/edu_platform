export type UserRole = 'STUDENT' | 'TUTOR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  price: number;
  duration?: number;
  level?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isPublic: boolean;
  creatorId: string;
  categoryId?: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  category?: {
    id: string;
    name: string;
  };
  averageRating?: number;
  isEnrolled?: boolean;
  _count?: {
    enrollments: number;
    materials: number;
    reviews: number;
  };
}

export interface Material {
  id: string;
  title: string;
  description?: string;
  type: 'PDF' | 'VIDEO' | 'AUDIO' | 'IMAGE' | 'DOCUMENT' | 'LINK';
  fileUrl?: string;
  content?: string;
  orderIndex: number;
  isPublic: boolean;
  courseId: string;
  moduleId?: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  module?: {
    id: string;
    title: string;
  };
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'DROPPED';
  enrolledAt: string;
  completedAt?: string;
  progressPercentage: number;
  course?: Course;
  completedMaterials?: number;
  totalTimeSpent?: number;
}

export interface Progress {
  id: string;
  userId: string;
  courseId: string;
  materialId?: string;
  isCompleted: boolean;
  timeSpent: number;
  lastAccessed: string;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: any;
  };
  message?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data?: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  } & { [key: string]: any };
  error?: {
    message: string;
    details?: any;
  };
}