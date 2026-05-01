"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

export default function MultiStudentPicker({ subject, onChange }) {
  const [students, setStudents] = useState([]);
  const supabase = getSupabase();

  useEffect(() => {
    if (!subject) return;

    async function load() {
      const { data: goals } = await supabase
        .from("goals")
        .select("student_id, goal_description")
        .ilike("goal_description", `%${subject}%`);

      const studentIds = goals.map((g) => g.student_id);

      const { data: filteredStudents } = await supabase
        .from("students")
        .select("*")
        .in("id", studentIds);

      setStudents(filteredStudents || []);
    }

    load();
  }, [subject]);

  function toggle(student) {
    onChange((prev) =>
      prev.some((s) => s.id === student.id)
        ? prev.filter((s) => s.id !== student.id)
        : [...prev, student]
    );
  }

  return (
    <div>
      <label className="font-semibold">Select Students</label>
      <div className="space-y-2">
        {students.map((s) => (
          <div key={s.id}>
            <input type="checkbox" onChange={() => toggle(s)} />
            <span className="ml-2">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
