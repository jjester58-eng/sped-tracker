"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

type Student = {
  id: string;
  name: string;
  grade_level: string | null;
};

type Goal = {
  id: string;
  student_id: string;
  goal_description: string;
};

export default function TeacherInputPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [gradeFilter, setGradeFilter] = useState("");
  const [progress, setProgress] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = getSupabase();
    if (!supabase) return;

    setLoading(true);

    const [studentsRes, goalsRes] = await Promise.all([
      supabase.from("students").select("id, name, grade_level").order("name"),
      supabase.from("goals").select("id, student_id, goal_description"),
    ]);

    if (studentsRes.error) {
      setError(studentsRes.error.message);
    } else {
      setStudents(studentsRes.data || []);
    }

    if (goalsRes.error) {
      setError(goalsRes.error.message);
    } else {
      setGoals(goalsRes.data || []);
    }

    setLoading(false);
  }

  function toggleStudent(id: string) {
    setSelectedStudentIds((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : [...prev, id]
    );
  }

  function handleNotesChange(goalId: string, notes: string) {
    setProgress((prev) => ({ ...prev, [goalId]: notes }));
  }

  function clearFilters() {
    setSelectedStudentIds([]);
    setGradeFilter("");
    setProgress({});
  }

  const filteredStudents = students.filter((student) => {
    return !gradeFilter || student.grade_level === gradeFilter;
  });

  const visibleGoals = goals.filter((g) =>
    selectedStudentIds.includes(g.student_id)
  );

  async function saveProgress() {
    const supabase = getSupabase();
    if (!supabase) return;

    if (Object.keys(progress).length === 0) {
      setError("Enter notes before saving.");
      return;
    }

    setLoading(true);
    setError(null);

    const entries = Object.entries(progress)
      .map(([goal_id, notes]) => {
        const goal = goals.find((g) => g.id === goal_id);
        if (!goal) return null;

        return {
          student_id: goal.student_id,
          goal_id,
          progress_notes: notes.trim(),
          review_date: new Date().toISOString(),
        };
      })
      .filter(Boolean);

    if (entries.length === 0) {
      setError("No valid entries to save.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("weekly_progress")
      .insert(entries as any);

    if (error) {
      setError(error.message);
    } else {
      setSuccessMsg("Progress saved successfully!");
      setProgress({});
      setTimeout(() => setSuccessMsg(null), 3000);
    }

    setLoading(false);
  }

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Teacher Input</h1>
      <p className="text-gray-600 mb-6">Record progress on IEP goals</p>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {successMsg && <p className="text-green-600 mb-4">{successMsg}</p>}

      {/* Filters */}
      <div className="mb-8 border p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">Filters</h2>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Students */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Students
            </label>
            <div className="max-h-60 overflow-y-auto border rounded p-2">
              {filteredStudents.map((student) => (
                <label key={student.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(student.id)}
                    onChange={() => toggleStudent(student.id)}
                  />
                  <span>
                    {student.name}{" "}
                    {student.grade_level && `(Gr ${student.grade_level})`}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Grade */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Grade Level
            </label>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="">All Grades</option>
              {[...new Set(students.map((s) => s.grade_level).filter(Boolean))]
                .map((grade) => (
                  <option key={grade} value={grade ?? ""}>
                    Grade {grade}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <button
          onClick={clearFilters}
          className="mt-4 border px-3 py-1 rounded"
        >
          Clear Filters
        </button>
      </div>

      {/* Goals */}
      {selectedStudentIds.length === 0 ? (
        <p className="text-gray-500 text-center">
          Select students to begin.
        </p>
      ) : (
        <div>
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Goals ({visibleGoals.length})
            </h2>

            <button
              onClick={saveProgress}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>

          {visibleGoals.map((goal) => {
            const student = students.find(
              (s) => s.id === goal.student_id
            );

            return (
              <div key={goal.id} className="border p-4 mb-4 rounded">
                <p className="font-semibold">
                  {student?.name}
                  {student?.grade_level &&
                    ` (Gr ${student.grade_level})`}
                </p>

                <p className="mb-2">{goal.goal_description}</p>

                <textarea
                  value={progress[goal.id] || ""}
                  onChange={(e) =>
                    handleNotesChange(goal.id, e.target.value)
                  }
                  className="w-full border p-2 rounded"
                  rows={3}
                  placeholder="Enter notes..."
                />
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}