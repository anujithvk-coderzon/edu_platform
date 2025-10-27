interface LevelFilterProps {
  levels: string[];
  selectedLevel: string;
  onLevelChange: (level: string) => void;
}

export default function LevelFilter({ levels, selectedLevel, onLevelChange }: LevelFilterProps) {
  return (
    <select
      value={selectedLevel}
      onChange={(e) => onLevelChange(e.target.value)}
      className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">All Levels</option>
      {levels.map((level) => (
        <option key={level} value={level}>
          {level}
        </option>
      ))}
    </select>
  );
}