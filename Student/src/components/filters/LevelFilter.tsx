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
      className="px-3 py-2 border border-[#C7D2DE] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
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