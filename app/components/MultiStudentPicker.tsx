"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/lib/useSupabase";

// Inside component:
const supabase = useSupabase();
type Student = {
  id: string;
  name: string;
};

type Goal = {
  student_id: string;
  goal_description: string;
};

type Props = {
  subject: string;
  value: Student[];
  onChange: React.Dispatch<React.SetStateAction<Student[]>>;
};

export default function MultiStudentPicker({
  subject,
  value,
  onChange,
}: Props) {
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    if (!subject) {
      setStudents([]);
      return;
    }

    async function loadStudents() {
      const { data: goals, error } = await supabase
        .from("goals")
        .select("student_id, goal_description");

      if (error) {
        console.error(error);
        setStudents([]);
        return;
      }

      const filteredIds = (goals ?? [])
        .filter((g) =>
          g.goal_description?.toLowerCase().includes(subject.toLowerCase())
        )
        .map((g) => g.student_id);

      if (filteredIds.length === 0) {
        setStudents([]);
        return;
      }

      const { data, error: studentError } = await supabase
        .from("students")
        .select("id, name")
        .in("id", filteredIds);

      if (studentError) {
        console.error(studentError);
        setStudents([]);
        return;
      }

      setStudents(data ?? []);
    }

    loadStudents();
  }, [subject]);

  function toggle(student: Student) {
    onChange((prev) =>
      prev.some((s) => s.id === student.id)
        ? prev.filter((s) => s.id !== student.id)
        : [...prev, student]
    );
  }

  return (
    <div>
      <label className="font-semibold">Select Students</label>

      <div className="space-y-2 mt-2">
        {students.length === 0 ? (
          <p className="text-sm text-gray-500">No students found</p>
        ) : (
          students.map((s) => {
            const checked = value.some((v) => v.id === s.id);

            return (
              <div key={s.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(s)}
                />
                <span className="ml-2">{s.name}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}