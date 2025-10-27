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
  tutor?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
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
      return { text: `${Math.min(100, Math.round(course.progressPercentage || 0))}%`, color: 'bg-indigo-600' };
    }
  };

  const buttonState = getCourseButtonState();
  const statusBadge = getCourseStatusBadge();

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-md hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300 group hover:scale-[1.01] sm:hover:scale-[1.02] overflow-hidden border border-slate-200/50">
      <div className="aspect-video bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-t-2xl sm:rounded-t-3xl flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent"></div>
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover rounded-t-2xl sm:rounded-t-3xl group-hover:scale-105 sm:group-hover:scale-110 transition-transform duration-500"
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
          <div className={`absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 ${statusBadge.color} px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 md:py-2 rounded-full text-xs sm:text-sm font-bold shadow-md sm:shadow-lg backdrop-blur-sm border border-white/20`} style={{ color: 'white' }}>
            {statusBadge.text}
          </div>
        )}
        {course.category && (
          <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-2 sm:left-3 md:left-4 bg-black/80 backdrop-blur-sm px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 md:py-2 rounded-full text-xs sm:text-sm font-medium border border-white/20" style={{ color: 'white' }}>
            🏷️ {course.category.name}
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 md:p-6 lg:p-8">
        <h3 className="font-bold text-slate-900 mb-2 sm:mb-2.5 md:mb-3 line-clamp-2 text-base sm:text-lg md:text-xl group-hover:text-blue-600 transition-colors duration-300">
          {course.title}
        </h3>
        <p className="text-slate-600 text-xs sm:text-sm mb-3 sm:mb-3.5 md:mb-4 line-clamp-2 leading-relaxed">
          {course.description}
        </p>

        <div className="flex items-center text-xs sm:text-sm text-slate-600 mb-3 sm:mb-3.5 md:mb-4 bg-slate-50 rounded-full px-3 sm:px-3.5 md:px-4 py-1.5 sm:py-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mr-2 sm:mr-2.5 md:mr-3">
            <span className="text-white text-xs font-bold">
              {(course.tutor ? `${course.tutor.firstName} ${course.tutor.lastName}` :
                course.tutorName ||
                (course.creator ? `${course.creator.firstName} ${course.creator.lastName}` : 'Instructor')).charAt(0)}
            </span>
          </div>
          <span className="font-medium">
            👨‍🏫 {course.tutor ? `${course.tutor.firstName} ${course.tutor.lastName}` :
                course.tutorName ||
                (course.creator ? `${course.creator.firstName} ${course.creator.lastName}` : 'Instructor')}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs sm:text-sm mb-3 sm:mb-3.5 md:mb-4">
          <div className="flex items-center bg-blue-50 px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 rounded-full">
            <ClockIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-blue-600" />
            <span className="text-blue-800 font-medium">{course.duration ? `${course.duration}h` : 'N/A'}</span>
          </div>
          <div className="flex items-center bg-green-50 px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 rounded-full">
            <UsersIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-green-600" />
            <span className="text-green-800 font-medium">{course._count.enrollments}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6 p-3 sm:p-3.5 md:p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl sm:rounded-2xl border border-slate-200/50">
          <div className="flex items-center">
            <StarRating rating={course.averageRating || 0} readonly showValue size="sm" />
          </div>
          {course.price === 0 ? (
            <span className="font-bold text-sm sm:text-base md:text-lg text-white bg-gradient-to-r from-green-500 to-green-600 px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded-full shadow-md">
              🎉 FREE
            </span>
          ) : (
            <span className="font-bold text-base sm:text-lg md:text-xl lg:text-2xl text-slate-900">
              💰 ${course.price}
            </span>
          )}
        </div>

        <Link href={buttonState.href}>
          <button className={`w-full py-3 sm:py-3.5 md:py-4 rounded-xl sm:rounded-2xl transition-all duration-300 font-bold text-sm sm:text-base md:text-lg shadow-md hover:shadow-lg sm:hover:shadow-xl hover:scale-[1.02] sm:hover:scale-105 ${
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