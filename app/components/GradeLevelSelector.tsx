"use client";
export const dynamic = "force-dynamic";
type GradeLevelSelectorProps = {
  value?: string;
  onChange: (value: string) => void;
};

const GRADE_LEVELS = [
  "K", "1", "2", "3", "4", "5",
  "6", "7", "8", "9", "10", "11", "12",
] as const;

export default function GradeLevelSelector({
  value = "",
  onChange,
}: GradeLevelSelectorProps) {
  return (
    <select
      className="border p-2 w-full rounded"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select Grade Level</option>

      {GRADE_LEVELS.map((lvl) => (
        <option key={lvl} value={lvl}>
          {lvl === "K" ? "Kindergarten" : `Grade ${lvl}`}
        </option>
      ))}
    </select>
  );
}