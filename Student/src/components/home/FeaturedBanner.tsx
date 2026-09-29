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
    <div className="bg-[#1D4ED8] rounded-lg p-8 text-white mb-8">
      <h2 className="text-3xl font-bold mb-4">{course.title}</h2>
      <p className="text-lg text-[#DBE7FE] mb-6">
        {course.description} Join {course.enrollmentCount} students already learning!
      </p>
      <button
        onClick={onExplore}
        className="bg-white text-[#1D4ED8] px-6 py-3 rounded-lg font-semibold hover:bg-[#E9EEF4] transition-colors"
      >
        Explore Course
      </button>
    </div>
  );
}