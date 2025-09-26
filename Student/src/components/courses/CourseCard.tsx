import Link from 'next/link';
import {
  BookOpenIcon,
  ClockIcon,
  StarIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import StarRating from '../ui/StarRating';
import { getImageUrl } from '../../utils/imageUtils';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  level: string;
  duration: number;
  averageRating: number;
  tutorName?: string;
  isEnrolled: boolean;
  hasReviewed?: boolean;
  enrollmentStatus?: string;
  progressPercentage?: number;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string;
  };
  category: {
    id: string;
    name: string;
  } | null;
  _count: {
    enrollments: number;
    materials: number;
    reviews: number;
  };
}

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  // Process thumbnail URL to handle both relative paths and CDN URLs
  const thumbnailUrl = getImageUrl(course.thumbnail);

  // Debug logging
  console.log('CourseCard - course.id:', course.id);
  console.log('CourseCard - thumbnail URL:', thumbnailUrl);

  const getCourseButtonState = () => {
    if (!course.isEnrolled) {
      return { text: 'View Course', href: `/courses/${course.id}` };
    }

    const isCompleted = course.enrollmentStatus === 'COMPLETED' || (course.progressPercentage && course.progressPercentage >= 100);

    if (isCompleted) {
      if (course.hasReviewed) {
        return { text: 'Completed', href: `/courses/${course.id}` };
      } else {
        return { text: 'Rate Course', href: `/courses/${course.id}` };
      }
    } else {
      return { text: 'Continue Learning', href: `/learn/${course.id}` };
    }
  };

  const getCourseStatusBadge = () => {
    if (!course.isEnrolled) return null;

    const isCompleted = course.enrollmentStatus === 'COMPLETED' || (course.progressPercentage && course.progressPercentage >= 100);

    if (isCompleted) {
      if (course.hasReviewed) {
        return { text: 'Completed', color: 'bg-green-500' };
      } else {
        return { text: 'Rate Course', color: 'bg-orange-500' };
      }
    } else {
      return { text: `${Math.min(100, Math.round(course.progressPercentage || 0))}%`, color: 'bg-blue-500' };
    }
  };

  const buttonState = getCourseButtonState();
  const statusBadge = getCourseStatusBadge();

  return (
    <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 group hover:scale-[1.02] overflow-hidden border border-slate-200/50">
      <div className="aspect-video bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-t-3xl flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent"></div>
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover rounded-t-3xl group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              console.error('Failed to load thumbnail:', thumbnailUrl);
              console.error('Original thumbnail value:', course.thumbnail);
              // Hide the broken image and show fallback
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling;
              if (fallback) {
                (fallback as HTMLElement).style.display = 'block';
              }
            }}
            onLoad={() => {
              console.log('Successfully loaded thumbnail:', thumbnailUrl);
            }}
          />
        ) : null}
        {/* Fallback icon - always present but hidden when image loads */}
        <div
          className={`relative z-10 ${thumbnailUrl ? 'hidden' : 'block'}`}
          style={{ display: thumbnailUrl ? 'none' : 'block' }}
        >
          <BookOpenIcon className="h-20 w-20 text-white opacity-90 group-hover:scale-110 transition-transform duration-300" />
        </div>
        {statusBadge && (
          <div className={`absolute top-4 right-4 ${statusBadge.color} text-white px-3 py-2 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm border border-white/20`}>
            {statusBadge.text}
          </div>
        )}
        {course.category && (
          <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-full text-sm font-medium border border-white/20">
            🏷️ {course.category.name}
          </div>
        )}
      </div>

      <div className="p-8">
        <h3 className="font-bold text-slate-900 mb-3 line-clamp-2 text-xl group-hover:text-blue-600 transition-colors duration-300">
          {course.title}
        </h3>
        <p className="text-slate-600 text-sm mb-4 line-clamp-2 leading-relaxed">
          {course.description}
        </p>

        <div className="flex items-center text-sm text-slate-600 mb-4 bg-slate-50 rounded-full px-4 py-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mr-3">
            <span className="text-white text-xs font-bold">
              {(course.tutorName || (course.creator ? `${course.creator.firstName} ${course.creator.lastName}` : 'Instructor')).charAt(0)}
            </span>
          </div>
          <span className="font-medium">
            👨‍🏫 {course.tutorName || (course.creator ? `${course.creator.firstName} ${course.creator.lastName}` : 'Instructor')}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center bg-blue-50 px-3 py-2 rounded-full">
            <ClockIcon className="h-4 w-4 mr-2 text-blue-600" />
            <span className="text-blue-800 font-medium">{course.duration ? `${course.duration}h` : 'N/A'}</span>
          </div>
          <div className="flex items-center bg-green-50 px-3 py-2 rounded-full">
            <UsersIcon className="h-4 w-4 mr-2 text-green-600" />
            <span className="text-green-800 font-medium">{course._count.enrollments}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-slate-200/50">
          <div className="flex items-center">
            <StarRating rating={course.averageRating || 0} readonly showValue size="sm" />
          </div>
          <span className={`font-bold text-2xl ${
            course.price === 0
              ? 'text-green-600 bg-green-100 px-3 py-1 rounded-full text-lg'
              : 'text-slate-900'
          }`}>
            {course.price === 0 ? '🎉 Free' : `💰 $${course.price}`}
          </span>
        </div>

        <Link href={buttonState.href}>
          <button className={`w-full py-4 rounded-2xl transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 ${
            buttonState.text === 'Completed'
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
              : buttonState.text === 'Rate Course'
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700'
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
          }`}>
            {buttonState.text === 'Continue Learning' ? '🚀 Continue Learning' :
             buttonState.text === 'Rate Course' ? '⭐ Rate Course' :
             buttonState.text === 'Completed' ? '✅ Completed' :
             '👁️ View Course'}
          </button>
        </Link>
      </div>
    </div>
  );
}