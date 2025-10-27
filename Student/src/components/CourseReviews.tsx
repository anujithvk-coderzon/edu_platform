'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import StarRating from './ui/StarRating';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { getCdnUrl } from '@/utils/cdn';

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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const REVIEWS_PER_PAGE = 10;

  useEffect(() => {
    if (courseId) {
      fetchReviews(1, false);
    }
  }, [courseId]);

  const fetchReviews = async (pageNum: number, append: boolean) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await api.reviews.getCourseReviews(courseId, {
        page: pageNum,
        limit: REVIEWS_PER_PAGE
      });

      if (response.success) {
        const newReviews = response.data.reviews || [];

        if (append) {
          setReviews(prev => [...prev, ...newReviews]);
        } else {
          setReviews(newReviews);
        }

        setTotalReviews(response.data.totalReviews || 0);

        // Check if there are more reviews to load
        const totalPages = Math.ceil((response.data.totalReviews || 0) / REVIEWS_PER_PAGE);
        setHasMore(pageNum < totalPages);
      }
    } catch (error) {
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReviews(nextPage, true);
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
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-50 rounded-lg p-5 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                <div className="h-3 bg-slate-200 rounded w-full"></div>
                <div className="h-3 bg-slate-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Individual Reviews */}
      {reviews.length > 0 ? (
        <>
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="bg-slate-50 rounded-lg p-5 hover:bg-slate-100 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {review.student.avatar ? (
                      <img
                        src={getCdnUrl(review.student.avatar) || ''}
                        alt={`${review.student.firstName} ${review.student.lastName}`}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        <span className="text-indigo-600 font-semibold text-sm">
                          {getInitials(review.student.firstName, review.student.lastName)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-slate-900">
                        {review.student.firstName} {review.student.lastName}
                      </h4>
                      <span className="text-xs text-slate-500">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    <div className="mb-2">
                      <StarRating rating={review.rating} readonly size="sm" />
                    </div>
                    {review.comment && (
                      <p className="text-slate-700 text-sm leading-relaxed">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex flex-col items-center gap-3 pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 bg-white border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:border-indigo-500 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
              >
                {loadingMore ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-400 border-t-transparent"></div>
                    Loading...
                  </div>
                ) : (
                  `Load More Reviews`
                )}
              </button>
              <p className="text-xs text-slate-500">
                Showing {reviews.length} of {totalReviews} reviews
              </p>
            </div>
          )}

          {/* All Loaded Message */}
          {!hasMore && reviews.length > 0 && (
            <div className="text-center pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                All {totalReviews} reviews loaded
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="bg-slate-50 rounded-lg p-8 text-center">
          <UserCircleIcon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 mb-1">No Reviews Yet</h3>
          <p className="text-sm text-slate-600">Be the first to review this course!</p>
        </div>
      )}
    </div>
  );
}