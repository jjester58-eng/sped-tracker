"use client";

type Subject = {
  id: string;
  name: string;
};

type Props = {
  value: string;
  onChange: (val: string) => void;
  subjects?: Subject[];
  loading?: boolean;
};

const DEFAULT_SUBJECTS = [
  "Reading",
  "Math",
  "Writing",
  "Behavior",
  "Speech",
];

export default function SubjectSelector({
  value,
  onChange,
  subjects,
  loading = false,
}: Props) {
  const list = subjects && subjects.length > 0 ? subjects : DEFAULT_SUBJECTS;

  return (
    <div className="space-y-2">
      <label className="font-semibold block">Subject</label>

      <select
        className="border p-2 w-full rounded-lg"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
      >
        <option value="">Select subject</option>

        {loading ? (
          <option disabled>Loading...</option>
        ) : (
          list.map((subj) =>
            typeof subj === "string" ? (
              <option key={subj} value={subj}>
                {subj}
              </option>
            ) : (
              <option key={subj.id} value={subj.name}>
                {subj.name}
              </option>
            )
          )
        )}
      </select>
    </div>
  );
}