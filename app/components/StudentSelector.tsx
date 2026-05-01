"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

type Student = {
  id: string;
  name: string;
  grade_level: string | null;
};

type Props = {
  mode: "edit";
  onStudentSelected: (student: Student) => void;
};

export default function StudentSelector({ mode, onStudentSelected }: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const supabase = getSupabase();

  useEffect(() => {
    if (!supabase) return;

    async function load() {
      const { data } = await supabase
        .from("students")
        .select("id, name, grade_level")
        .order("name");

      if (data) setStudents(data as Student[]);
    }

    load();
  }, []);

  return (
    <div className="space-y-2">
      <label className="font-semibold">Students</label>

      <select
        className="border p-2 w-full"
        onChange={(e) => {
          const student = students.find((s) => s.id === e.target.value);
          if (student) onStudentSelected(student);
        }}
      >
        <option value="">Select a student</option>
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} — Grade {s.grade_level || "N/A"}
          </option>
        ))}
      </select>
    </div>
  );
}
