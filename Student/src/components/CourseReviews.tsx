'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import StarRating from './ui/StarRating';
import { UserCircleIcon } from '@heroicons/react/24/outline';

interface ReviewData {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  student: {
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

interface CourseReviewsProps {
  courseId: string;
}

export default function CourseReviews({ courseId }: CourseReviewsProps) {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      fetchReviews();
    }
  }, [courseId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await api.reviews.getCourseReviews(courseId);
      if (response.success) {
        setReviews(response.data.reviews);
        setAverageRating(response.data.averageRating);
        setTotalReviews(response.data.totalReviews);
        setRatingDistribution(response.data.ratingDistribution);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      {totalReviews > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Course Reviews</h3>
            <div className="text-right">
              <div className="flex items-center">
                <StarRating rating={averageRating} readonly showValue size="lg" />
              </div>
              <p className="text-sm text-gray-600">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700 w-8">{star}★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{
                      width: totalReviews > 0 ? `${(ratingDistribution[star] / totalReviews) * 100}%` : '0%'
                    }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-8">{ratingDistribution[star] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual Reviews */}
      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg border p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {review.student.avatar ? (
                    <img
                      src={review.student.avatar}
                      alt={`${review.student.firstName} ${review.student.lastName}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {getInitials(review.student.firstName, review.student.lastName)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {review.student.firstName} {review.student.lastName}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  <div className="mb-3">
                    <StarRating rating={review.rating} readonly size="sm" />
                  </div>
                  {review.comment && (
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg border p-8 text-center">
            <UserCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
            <p className="text-gray-600">Be the first to review this course!</p>
          </div>
        )}
      </div>
    </div>
  );
}