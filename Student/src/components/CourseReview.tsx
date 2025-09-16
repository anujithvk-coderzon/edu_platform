'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import StarRating from './ui/StarRating';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

interface CourseReviewProps {
  courseId: string;
  onReviewSubmitted?: () => void;
}

export default function CourseReview({ courseId, onReviewSubmitted }: CourseReviewProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('CourseReview: user=', user, 'courseId=', courseId);
    if (user && courseId) {
      fetchExistingReview();
    } else {
      setLoading(false);
    }
  }, [user, courseId]);

  const fetchExistingReview = async () => {
    try {
      setLoading(true);
      const response = await api.reviews.getMyReview(courseId);
      if (response.success && response.data.review) {
        const review = response.data.review;
        setExistingReview(review);
        setRating(review.rating);
        setComment(review.comment || '');
      }
    } catch (error) {
      console.error('Error fetching existing review:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.reviews.submit({
        courseId,
        rating,
        comment: comment.trim() || undefined
      });

      if (response.success) {
        toast.success(existingReview ? 'Review updated successfully!' : 'Review submitted successfully!');
        setExistingReview(response.data.review);
        if (onReviewSubmitted) {
          onReviewSubmitted();
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {existingReview ? 'Update Your Review' : 'Rate This Course'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Rating *
          </label>
          <StarRating
            rating={rating}
            onRatingChange={setRating}
            size="lg"
          />
        </div>

        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Your Review (Optional)
          </label>
          <textarea
            id="comment"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
            placeholder="Share your experience with this course..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {comment.length}/500
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
}