"use client";

type Props = {
  onChange: (value: string) => void;
};

export default function SubjectSelector({ onChange }: Props) {
  const subjects = ["Reading", "Math", "Writing", "Behavior", "Speech"];

  return (
    <div className="space-y-2">
      <label className="font-semibold">Subject</label>

      <select
        className="border p-2 w-full"
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select subject</option>
        {subjects.map((subj) => (
          <option key={subj} value={subj}>
            {subj}
          </option>
        ))}
      </select>
    </div>
  );
}
