"use client";

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
  student: Student;
  onSaved?: () => void; // optional refresh hook
};

export default function StudentEditor({ student, onSaved }: Props) {
  const [name, setName] = useState(student.name);
  const [grade, setGrade] = useState(student.grade_level || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // ✅ FIX: keep form in sync with selected student
  useEffect(() => {
    setName(student.name);
    setGrade(student.grade_level || "");
  }, [student]);

  async function save() {
    if (!name.trim()) {
      setMessage("Name is required");
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await supabase
      .from("students")
      .update({
        name: name.trim(),
        grade_level: grade || null,
      })
      .eq("id", student.id);

    if (error) {
      console.error(error);
      setMessage("Error saving student");
    } else {
      setMessage("Student updated");
      onSaved?.(); // optional parent refresh
    }

    setLoading(false);
  }

  return (
    <div className="border p-4 rounded space-y-4">
      <h2 className="text-xl font-semibold">Edit Student</h2>

      {message && <p className="text-sm">{message}</p>}

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
        {/* 🔥 Replace this with your GradeLevelSelector later */}
      </div>

      <button
        onClick={save}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Saving..." : "Save"}
      </button>
    </div>
  );
}