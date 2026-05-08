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
              className={`px-5 py-2.5 rounded-2xl text-sm font-medium transition-all border min-w-[110px]
                ${isSelected 
                  ? "bg-blue-600 text-white border-blue-600 shadow-md" 
                  : "bg-white border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700"
                }`}
            >
              {grade === "K" ? "Kindergarten" : `Grade ${grade}`}
            </button>
          );
        })}
      </div>

      {/* Selected Summary */}
      {value.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-2xl">
          <p className="text-sm text-blue-700 font-medium">
            Selected: {value
              .map(g => g === "K" ? "Kindergarten" : `Grade ${g}`)
              .join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}