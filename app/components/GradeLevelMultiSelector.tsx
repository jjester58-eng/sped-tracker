"use client";

import { useState, useEffect } from "react";

type Props = {
  value: string[];
  onChange: (value: string[]) => void;
};

const commonGradeLevels = [
  "Pre-K",
  "TK",
  "K",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "Post-Secondary",
];

export default function GradeLevelMultiSelector({ value, onChange }: Props) {
  const [selected, setSelected] = useState<string[]>(value);

  // Sync with parent when value changes externally
  useEffect(() => {
    setSelected(value);
  }, [value]);

  const toggleGrade = (grade: string) => {
    const newSelection = selected.includes(grade)
      ? selected.filter((g) => g !== grade)
      : [...selected, grade];

    setSelected(newSelection);
    onChange(newSelection);
  };

  const selectAll = () => {
    setSelected([...commonGradeLevels]);
    onChange([...commonGradeLevels]);
  };

  const clearAll = () => {
    setSelected([]);
    onChange([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="font-semibold block">Grade Level(s)</label>
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            onClick={selectAll}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Select All
          </button>
          <span className="text-gray-300">•</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {commonGradeLevels.map((grade) => (
          <button
            key={grade}
            type="button"
            onClick={() => toggleGrade(grade)}
            className={`px-4 py-2.5 text-sm rounded-xl border transition-all ${
              selected.includes(grade)
                ? "bg-blue-600 text-white border-blue-600 font-medium"
                : "bg-white border-gray-300 hover:border-gray-400"
            }`}
          >
            {grade}
          </button>
        ))}
      </div>

      {selected.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-gray-500 mb-2">Selected:</p>
          <div className="flex flex-wrap gap-2">
            {selected.map((grade) => (
              <span
                key={grade}
                className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
              >
                {grade}
                <button
                  onClick={() => toggleGrade(grade)}
                  className="font-bold text-blue-400 hover:text-blue-600"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}