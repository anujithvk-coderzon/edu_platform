interface Category {
  id: string;
  name: string;
  _count: {
    courses: number;
  };
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoryFilter({ categories, selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <select
      value={selectedCategory}
      onChange={(e) => onCategoryChange(e.target.value)}
      className="px-3 py-2 border border-[#C7D2DE] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
    >
      <option value="">All Categories</option>
      {categories.map((category) => (
        <option key={category.id} value={category.name}>
          {category.name} ({category._count.courses})
        </option>
      ))}
    </select>
  );
}