"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useSupabase } from "@/lib/useSupabase";

// Inside component:
const supabase = useSupabase();
type Student = {
  id: string;
  name: string;
  grade_level: string | null;
};

type Props = {
  value?: string;
  onChange: (studentId: string) => void;
};

export default function StudentSelector({ value = "", onChange }: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("students")
        .select("id, name, grade_level")
        .order("name");

      if (error) {
        console.error(error);
        setError("Failed to load students");
      } else {
        setStudents(data ?? []);
      }

      setLoading(false);
    }

    load();
  }, []);

  return (
    <div className="space-y-2">
      <label className="font-semibold">Students</label>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <select
        className="border p-2 w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
      >
        <option value="">
          {loading ? "Loading..." : "Select a student"}
        </option>

        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} — Grade {s.grade_level || "N/A"}
          </option>
        ))}
      </select>
    </div>
  );
}