import Link from 'next/link';
import {
  BookOpenIcon,
  ClockIcon,
  StarIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  level: string;
  duration: number;
  averageRating: number;
  isEnrolled: boolean;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string;
  };
  category: {
    id: string;
    name: string;
  };
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
  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-600 rounded-t-lg flex items-center justify-center relative">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover rounded-t-lg" />
        ) : (
          <BookOpenIcon className="h-16 w-16 text-white opacity-80" />
        )}
        {course.isEnrolled && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Enrolled
          </div>
        )}
        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
          {course.category.name}
        </div>
      </div>

      <div className="p-6">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{course.description}</p>

        <div className="text-sm text-gray-600 mb-3">
          by {course.creator ? `${course.creator.firstName} ${course.creator.lastName}` : 'Instructor'}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-1" />
            {course.duration ? `${course.duration}h` : 'N/A'}
          </div>
          <div className="flex items-center">
            <UsersIcon className="h-4 w-4 mr-1" />
            {course._count.enrollments}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`h-4 w-4 ${i < Math.floor(course.averageRating || 0) ? 'fill-current' : ''}`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600 ml-2">
              {course.averageRating?.toFixed(1) || 'N/A'}
            </span>
          </div>
          <span className="font-bold text-lg text-gray-900">
            {course.price === 0 ? 'Free' : `$${course.price}`}
          </span>
        </div>

        <Link href={`/courses/${course.id}`}>
          <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
            {course.isEnrolled ? 'Continue Learning' : 'View Course'}
          </button>
        </Link>
      </div>
    </div>
  );
}