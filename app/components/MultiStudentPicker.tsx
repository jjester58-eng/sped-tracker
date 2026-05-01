"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

type Student = {
  id: string;
  name: string;
};

type Props = {
  subject: string;
  onChange: React.Dispatch<React.SetStateAction<Student[]>>;
};

export default function MultiStudentPicker({ subject, onChange }: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const supabase = getSupabase();

  useEffect(() => {
    if (!subject || !supabase) return;

    async function loadStudents() {
      const { data: goals, error } = await supabase
        .from("goals")
        .select("student_id, goal_description")
        .ilike("goal_description", `%${subject}%`);

      if (error) {
        console.error("Goals fetch error:", error);
        setStudents([]);
        return;
      }

      const studentIds = (goals || [])
        .map((g: any) => g.student_id)
        .filter(Boolean);

      if (studentIds.length === 0) {
        setStudents([]);
        return;
      }

      const { data: filteredStudents, error: studentError } = await supabase
        .from("students")
        .select("id, name")
        .in("id", studentIds);

      if (studentError) {
        console.error("Students fetch error:", studentError);
        setStudents([]);
        return;
      }

      setStudents((filteredStudents || []) as Student[]);
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
          students.map((s) => (
            <div key={s.id} className="flex items-center">
              <input type="checkbox" onChange={() => toggle(s)} />
              <span className="ml-2">{s.name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
