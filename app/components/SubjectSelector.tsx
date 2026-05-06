"use client";
export const dynamic = "force-dynamic";
type Props = {
  value?: string;
  onChange: (value: string) => void;
};

const SUBJECTS = ["Reading", "Math", "Writing", "Behavior", "Speech"];

export default function SubjectSelector({ value = "", onChange }: Props) {
  return (
    <div className="space-y-2">
      <label className="font-semibold">Subject</label>

      <select
        className="border p-2 w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>
          Select subject
        </option>

        {SUBJECTS.map((subj) => (
          <option key={subj} value={subj}>
            {subj}
          </option>
        ))}
      </select>
    </div>
  );
}