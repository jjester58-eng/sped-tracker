"use client";

import { useEffect, useState, useMemo } from "react";
import { useSupabase } from "@/lib/useSupabase";
import type { Student } from "./index";

type Props = {
  value: Student[];
  onChange: React.Dispatch<React.SetStateAction<Student[]>>;
  subject?: string;
  gradeLevels?: string[];
  searchPlaceholder?: string;
};

export default function MultiStudentPicker({
  value,
  onChange,
  subject = "",
  gradeLevels = [],
  searchPlaceholder = "Search students...",
}: Props) {
  const supabase = useSupabase();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Load students
  useEffect(() => {
    async function loadStudents() {
      setLoading(true);
      const { data, error } = await supabase
        .from("students")
        .select("id, name, grade_level")
        .order("name");

      if (error) console.error(error);
      else setStudents(data ?? []);

      setLoading(false);
    }
    loadStudents();
  }, [supabase]);

  // Filter students by grade + search term
  const filteredStudents = useMemo(() => {
    let result = [...students];

    // Filter by grade level(s)
    if (gradeLevels.length > 0) {
      result = result.filter((s) => 
        s.grade_level && gradeLevels.includes(s.grade_level)
      );
    }

    // Search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter((s) =>
        s.name.toLowerCase().includes(term) ||
        (s.grade_level && s.grade_level.toLowerCase().includes(term))
      );
    }

    return result;
  }, [students, gradeLevels, searchTerm]);

  const toggleStudent = (student: Student) => {
    onChange((prev) =>
      prev.some((s) => s.id === student.id)
        ? prev.filter((s) => s.id !== student.id)
        : [...prev, student]
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <label className="font-semibold block mb-4">Students</label>

      <input
        type="text"
        placeholder={searchPlaceholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-xl p-2 bg-gray-50">
        {loading ? (
          <p className="p-8 text-center text-gray-500">Loading students...</p>
        ) : filteredStudents.length === 0 ? (
          <p className="p-8 text-center text-gray-500">
            No students match your filters
          </p>
        ) : (
          filteredStudents.map((student) => {
            const isSelected = value.some((s) => s.id === student.id);
            return (
              <label
                key={student.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                  isSelected ? "bg-blue-50 border border-blue-200" : "hover:bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleStudent(student)}
                  className="w-5 h-5 accent-blue-600"
                />
                <div>
                  <div className="font-medium">{student.name}</div>
                  <div className="text-sm text-gray-500">
                    Grade {student.grade_level || "N/A"}
                  </div>
                </div>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}