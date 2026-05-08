"use client";

type Props = {
  value: string[];
  onChange: React.Dispatch<React.SetStateAction<string[]>>;
};

const GRADE_LEVELS = [
  "K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"
] as const;

export default function GradeLevelMultiSelector({ value, onChange }: Props) {
  const toggleGrade = (grade: string) => {
    onChange((prev) =>
      prev.includes(grade)
        ? prev.filter((g) => g !== grade)
        : [...prev, grade]
    );
  };

  return (
    <div>
      <label className="font-semibold block mb-3">Grade Level(s)</label>
      <div className="flex flex-wrap gap-2">
        {GRADE_LEVELS.map((grade) => {
          const isSelected = value.includes(grade);
          return (
            <button
              key={grade}
              onClick={() => toggleGrade(grade)}
              className={`px-5 py-2.5 rounded-2xl text-sm font-medium transition-all border
                ${isSelected 
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
                  : "bg-white border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                }`}
            >
              {grade === "K" ? "Kindergarten" : `Grade ${grade}`}
            </button>
          );
        })}
      </div>
      
      {value.length > 0 && (
        <p className="text-sm text-gray-500 mt-3">
          Selected: {value.map(g => g === "K" ? "K" : g).join(", ")}
        </p>
      )}
    </div>
  );
}