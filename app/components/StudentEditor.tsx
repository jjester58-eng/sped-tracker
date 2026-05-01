"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

type Student = {
  id: string;
  name: string;
  grade_level: string | null;
};

type Props = {
  student: Student;
};

export default function StudentEditor({ student }: Props) {
  const supabase = getSupabase();

  const [name, setName] = useState(student.name);
  const [grade, setGrade] = useState(student.grade_level || "");

  async function save() {
    const { error } = await supabase
      .from("students")
      .update({
        name,
        grade_level: grade,
      })
      .eq("id", student.id);

    if (error) {
      console.error("Update error:", error);
      alert("Error saving student");
    } else {
      alert("Student updated");
    }
  }

  return (
    <div className="border p-4 rounded space-y-4">
      <h2 className="text-xl font-semibold">Edit Student</h2>

      <div>
        <label className="font-semibold">Name</label>
        <input
          className="border p-2 w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="font-semibold">Grade Level</label>
        <input
          className="border p-2 w-full"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        />
      </div>

      <button
        onClick={save}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Save
      </button>
    </div>
  );
}
