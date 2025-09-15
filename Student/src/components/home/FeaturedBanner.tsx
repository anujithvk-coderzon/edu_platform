interface FeaturedBannerProps {
  course?: {
    id: string;
    title: string;
    description: string;
    enrollmentCount: number;
  };
  onExplore?: () => void;
}

export default function FeaturedBanner({ course, onExplore }: FeaturedBannerProps) {
  if (!course) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white mb-8">
      <h2 className="text-3xl font-bold mb-4">{course.title}</h2>
      <p className="text-lg text-blue-100 mb-6">
        {course.description} Join {course.enrollmentCount} students already learning!
      </p>
      <button
        onClick={onExplore}
        className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
      >
        Explore Course
      </button>
    </div>
  );
}