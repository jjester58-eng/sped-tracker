"use client";
export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "@/lib/useSupabase";
import CsvUploader from "../components/CsvUploader";

/* ============ TYPES ============ */

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

type ProgressEntry = {
  id: string;
  student_id: string;
  goal_id: string;
  progress_notes: string;
  review_date: string;
};

/* ============ COMPONENT ============ */

export default function CaseManagerPage() {
  const supabase = useSupabase();

  // States
  const [students, setStudents] = useState<Student[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [progressHistory, setProgressHistory] = useState<ProgressEntry[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newGoalDesc, setNewGoalDesc] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState("");

  /* ============ LOAD INITIAL DATA ============ */

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [studentsRes, goalsRes] = await Promise.all([
        supabase.from("students").select("id, name, grade_level").order("name"),
        supabase.from("goals").select("id, student_id, goal_description"),
      ]);

      if (studentsRes.error) {
        setError(studentsRes.error.message);
        setStudents([]);
      } else {
        setStudents(studentsRes.data ?? []);
      }

      if (goalsRes.error) {
        setError(goalsRes.error.message);
        setGoals([]);
      } else {
        setGoals(goalsRes.data ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ============ LOAD PROGRESS HISTORY ============ */

  const loadProgressHistory = useCallback(
    async (studentId: string) => {
      try {
        const { data, error } = await supabase
          .from("weekly_progress")
          .select("*")
          .eq("student_id", studentId)
          .order("review_date", { ascending: false });

        if (error) {
          setError(error.message);
          setProgressHistory([]);
        } else {
          setProgressHistory((data ?? []) as ProgressEntry[]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    },
    [supabase]
  );

  useEffect(() => {
    if (!selectedStudentId) {
      setProgressHistory([]);
      return;
    }

    loadProgressHistory(selectedStudentId);
  }, [selectedStudentId, loadProgressHistory]);

  /* ============ STUDENT OPERATIONS ============ */

  const addStudent = useCallback(async () => {
    if (!newStudentName.trim()) {
      setError("Student name is required");
      return;
    }

    setError(null);

    try {
      const { error } = await supabase.from("students").insert({
        name: newStudentName.trim(),
        grade_level: newStudentGrade || null,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setNewStudentName("");
      setNewStudentGrade("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [supabase, newStudentName, newStudentGrade, loadData]);

  const deleteStudent = useCallback(
    async (studentId: string) => {
      if (!confirm("Delete this student and all related data?")) return;

      try {
        const { error } = await supabase
          .from("students")
          .delete()
          .eq("id", studentId);

        if (error) {
          setError(error.message);
          return;
        }

        setSelectedStudentId(null);
        await loadData();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    },
    [supabase, loadData]
  );

  /* ============ GOAL OPERATIONS ============ */

  const addGoal = useCallback(async () => {
    if (!selectedStudentId || !newGoalDesc.trim()) {
      setError("Select a student and enter a goal");
      return;
    }

    setError(null);

    try {
      const { error } = await supabase.from("goals").insert({
        student_id: selectedStudentId,
        goal_description: newGoalDesc.trim(),
      });

      if (error) {
        setError(error.message);
        return;
      }

      setNewGoalDesc("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [supabase, selectedStudentId, newGoalDesc, loadData]);

  const deleteGoal = useCallback(
    async (goalId: string) => {
      if (!confirm("Delete this goal?")) return;

      try {
        const { error } = await supabase
          .from("goals")
          .delete()
          .eq("id", goalId);

        if (error) {
          setError(error.message);
          return;
        }

        await loadData();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    },
    [supabase, loadData]
  );

  /* ============ HELPERS ============ */

  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const studentGoals = selectedStudentId
    ? goals.filter((g) => g.student_id === selectedStudentId)
    : [];

  /* ============ RENDER ============ */

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Case Manager</h1>
      <p className="text-gray-600 mb-6">Manage students, goals, and progress</p>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading && <div className="text-gray-600 mb-4">Loading...</div>}

      <div className="grid md:grid-cols-3 gap-6">
        {/* LEFT PANEL - STUDENTS */}
        <div className="border p-4 rounded bg-gray-50">
          <h2 className="font-bold mb-3">Students</h2>

          <div className="mb-4 pb-4 border-b">
            <h3 className="text-sm font-semibold mb-2">Add Student</h3>
            <input
              className="w-full border p-2 mb-2 rounded"
              placeholder="Student name"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
            />

            <input
              className="w-full border p-2 mb-3 rounded"
              placeholder="Grade (optional)"
              value={newStudentGrade}
              onChange={(e) => setNewStudentGrade(e.target.value)}
            />

            <button
              onClick={addStudent}
              className="bg-blue-600 text-white w-full p-2 rounded mb-4 hover:bg-blue-700"
            >
              Add Student
            </button>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2">Bulk Import</h3>
            <CsvUploader onUploadSuccess={loadData} />
          </div>

          <h3 className="text-sm font-semibold mb-3">All Students</h3>
          <div className="space-y-2">
            {students.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStudentId(s.id)}
                className={`w-full text-left p-2 border rounded transition-colors ${
                  selectedStudentId === s.id
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                {s.name}
                {s.grade_level && (
                  <span className="text-sm ml-1">({s.grade_level})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL - DETAILS */}
        <div className="md:col-span-2">
          {!selectedStudentId ? (
            <p className="text-gray-600">Select a student to view details</p>
          ) : (
            <>
              {/* STUDENT HEADER */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{selectedStudent?.name}</h2>
                <button
                  onClick={() => deleteStudent(selectedStudentId)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete Student
                </button>
              </div>

              {/* GOALS SECTION */}
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-3">Goals</h3>

                <div className="flex gap-2 mb-3">
                  <input
                    className="flex-1 border p-2 rounded"
                    placeholder="New goal description"
                    value={newGoalDesc}
                    onChange={(e) => setNewGoalDesc(e.target.value)}
                  />
                  <button
                    onClick={addGoal}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-2">
                  {studentGoals.length === 0 ? (
                    <p className="text-gray-500">No goals yet</p>
                  ) : (
                    studentGoals.map((g) => (
                      <div
                        key={g.id}
                        className="border p-3 rounded flex justify-between items-center"
                      >
                        <span>{g.goal_description}</span>
                        <button
                          onClick={() => deleteGoal(g.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* PROGRESS SECTION */}
              <div>
                <h3 className="text-lg font-bold mb-3">Progress History</h3>

                {progressHistory.length === 0 ? (
                  <p className="text-gray-500">No progress entries yet</p>
                ) : (
                  <div className="space-y-3">
                    {progressHistory.map((p) => (
                      <div key={p.id} className="border p-3 rounded bg-gray-50">
                        <div className="text-sm text-gray-500 mb-1">
                          {new Date(p.review_date).toLocaleDateString()}
                        </div>
                        <div className="text-sm">{p.progress_notes}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}