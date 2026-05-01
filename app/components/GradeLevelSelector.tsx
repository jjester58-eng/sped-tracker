"use client";

type GradeLevelSelectorProps = {
  onChange: (value: string) => void;
};

export default function GradeLevelSelector({ onChange }: GradeLevelSelectorProps) {
  const levels = [
    "K", "1", "2", "3", "4", "5",
    "6", "7", "8", "9", "10", "11", "12"
  ];

  return (
    <select
      className="border p-2 w-full rounded"
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select Grade Level</option>
      {levels.map((lvl) => (
        <option key={lvl} value={lvl}>
          {lvl === "K" ? "Kindergarten" : `Grade ${lvl}`}
        </option>
      ))}
    </select>
  );
}
