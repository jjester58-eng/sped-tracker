"use client";

import { useEffect, useState, useMemo } from "react";
import { useSupabase } from "@/lib/useSupabase";
import type { Student } from "./index";   // ← Shared type

type Props = {
  value: Student[];
  onChange: React.Dispatch<React.SetStateAction<Student[]>>;
  searchPlaceholder?: string;
};

export default function MultiStudentPicker({
  value,
  onChange,
  searchPlaceholder = "Search students...",
}: Props) {
  const supabase = useSupabase();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadStudents() {
      setLoading(true);
      const { data, error } = await supabase
        .from("students")
        .select("id, name, grade_level")
        .order("name");

      if (error) console.error("Error loading students:", error);
      else setStudents(data ?? []);

      setLoading(false);
    }

    loadStudents();
  }, [supabase]);

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;

    const term = searchTerm.toLowerCase().trim();
    return students.filter((s) =>
      s.name.toLowerCase().includes(term) ||
      (s.grade_level && s.grade_level.toLowerCase().includes(term))
    );
  }, [students, searchTerm]);

  const toggleStudent = (student: Student) => {
    onChange((prev) =>
      prev.some((s) => s.id === student.id)
        ? prev.filter((s) => s.id !== student.id)
        : [...prev, student]
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="font-semibold block mb-2">Select Students</label>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((student) => (
            <div
              key={student.id}
              className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium"
            >
              {student.name}
              <button
                onClick={() => onChange((prev) => prev.filter((s) => s.id !== student.id))}
                className="text-blue-600 hover:text-red-600 font-bold"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() => onChange([])}
            className="text-red-600 text-sm hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-xl p-2 bg-white">
        {loading ? (
          <p className="p-8 text-center text-gray-500">Loading students...</p>
        ) : filteredStudents.length === 0 ? (
          <p className="p-8 text-center text-gray-500">No students found</p>
        ) : (
          filteredStudents.map((student) => {
            const isSelected = value.some((s) => s.id === student.id);
            return (
              <label
                key={student.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                  isSelected ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
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