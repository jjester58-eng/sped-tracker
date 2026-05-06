"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/lib/useSupabase";

// Inside component:
const supabase = useSupabase();
/* ---------------- TYPES ---------------- */

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

/* ---------------- COMPONENT ---------------- */

export default function CaseManagerPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [progressHistory, setProgressHistory] = useState<ProgressEntry[]>([]);

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newGoalDesc, setNewGoalDesc] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState("");

  /* ---------------- LOAD DATA ---------------- */

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);

    const [studentsRes, goalsRes] = await Promise.all([
      supabase.from("students").select("id, name, grade_level").order("name"),
      supabase.from("goals").select("id, student_id, goal_description"),
    ]);

    if (studentsRes.error) {
      setError(studentsRes.error.message);
    } else {
      setStudents(studentsRes.data ?? []);
    }

    if (goalsRes.error) {
      setError(goalsRes.error.message);
    } else {
      setGoals(goalsRes.data ?? []);
    }

    setLoading(false);
  }

  /* ---------------- LOAD PROGRESS ---------------- */

  useEffect(() => {
    if (!selectedStudentId) return;

    loadProgressHistory(selectedStudentId);
  }, [selectedStudentId]);

  async function loadProgressHistory(studentId: string) {
    const { data, error } = await supabase
      .from("weekly_progress")
      .select("*")
      .eq("student_id", studentId)
      .order("review_date", { ascending: false });

    if (error) {
      setError(error.message);
      return;
    }

    setProgressHistory((data ?? []) as ProgressEntry[]);
  }

  /* ---------------- STUDENT ---------------- */

  async function addStudent() {
    if (!newStudentName.trim()) {
      setError("Student name is required");
      return;
    }

    setError(null);

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
    loadData();
  }

  async function deleteStudent(studentId: string) {
    if (!confirm("Delete this student and all related data?")) return;

    const { error } = await supabase
      .from("students")
      .delete()
      .eq("id", studentId);

    if (error) {
      setError(error.message);
      return;
    }

    setSelectedStudentId(null);
    loadData();
  }

  /* ---------------- GOALS ---------------- */

  async function addGoal() {
  if (!selectedStudentId || !newGoalDesc.trim()) {
    setError("Select a student and enter a goal");
    return;
  }

  const { error } = await supabase.from("goals").insert({
    student_id: selectedStudentId,
    goal_description: newGoalDesc.trim(),
    goal_number: 1,
  });

  if (error) {
    setError(error.message);
    return;
  }

  setNewGoalDesc("");
  loadData();
}

async function deleteGoal(goalId: string) {
  if (!confirm("Delete this goal?")) return;

  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", goalId);

  if (error) {
    setError(error.message);
    return;
  }

  loadData();
}
  /* ---------------- HELPERS ---------------- */

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const studentGoals = selectedStudentId
    ? goals.filter((g) => g.student_id === selectedStudentId)
    : [];

  /* ---------------- UI ---------------- */

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Case Manager</h1>
      <p className="text-gray-600 mb-6">
        Manage students, goals, and progress
      </p>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="border p-4 rounded bg-gray-50">
          <h2 className="font-bold mb-3">Students</h2>

          <input
            className="w-full border p-2 mb-2"
            placeholder="Student name"
            value={newStudentName}
            onChange={(e) => setNewStudentName(e.target.value)}
          />

          <input
            className="w-full border p-2 mb-3"
            placeholder="Grade (optional)"
            value={newStudentGrade}
            onChange={(e) => setNewStudentGrade(e.target.value)}
          />

          <button
            onClick={addStudent}
            className="bg-blue-600 text-white w-full p-2 rounded mb-4"
          >
            Add Student
          </button>

          <div className="space-y-2">
            {students.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStudentId(s.id)}
                className={`w-full text-left p-2 border rounded ${
                  selectedStudentId === s.id ? "bg-blue-600 text-white" : ""
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="md:col-span-2">
          {!selectedStudentId ? (
            <p>Select a student</p>
          ) : (
            <>
              <div className="flex justify-between mb-4">
                <h2 className="text-xl font-bold">
                  {selectedStudent?.name}
                </h2>

                <button
                  onClick={() => deleteStudent(selectedStudentId)}
                  className="text-red-600"
                >
                  Delete
                </button>
              </div>

              {/* Goals */}
              <div className="mb-6">
                <h3 className="font-bold mb-2">Goals</h3>

                <input
                  className="w-full border p-2 mb-2"
                  placeholder="New goal"
                  value={newGoalDesc}
                  onChange={(e) => setNewGoalDesc(e.target.value)}
                />

                <button
                  onClick={addGoal}
                  className="bg-blue-600 text-white px-3 py-1 rounded mb-3"
                >
                  Add Goal
                </button>

                {studentGoals.map((g) => (
                  <div
                    key={g.id}
                    className="border p-2 mb-2 flex justify-between"
                  >
                    <span>{g.goal_description}</span>
                    <button
                      onClick={() => deleteGoal(g.id)}
                      className="text-red-600"
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>

              {/* Progress */}
              <div>
                <h3 className="font-bold mb-2">Progress</h3>

                {progressHistory.length === 0 ? (
                  <p>No progress yet</p>
                ) : (
                  progressHistory.map((p) => (
                    <div key={p.id} className="border p-2 mb-2">
                      <div className="text-xs text-gray-500">
                        {new Date(p.review_date).toLocaleDateString()}
                      </div>
                      <div>{p.progress_notes}</div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}