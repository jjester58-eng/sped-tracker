"use client";

type Props = {
  value: string[];
  onChange: React.Dispatch<React.SetStateAction<string[]>>;
};

const GRADE_LEVELS = ["9", "10", "11", "12", "K", "1", "2", "3", "4", "5", "6", "7", "8"];

export default function GradeLevelMultiSelector({ value, onChange }: Props) {
  const toggleGrade = (grade: string) => {
    onChange((prev) =>
      prev.includes(grade)
        ? prev.filter((g) => g !== grade)
        : [...prev, grade]
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {GRADE_LEVELS.map((grade) => {
        const isSelected = value.includes(grade);
        return (
          <button
            key={grade}
            onClick={() => toggleGrade(grade)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition border
              ${isSelected 
                ? "bg-blue-600 text-white border-blue-600" 
                : "bg-white border-gray-300 hover:border-gray-400"
              }`}
          >
            {grade === "K" ? "Kindergarten" : `Grade ${grade}`}
          </button>
        );
      })}
    </div>
  );
}