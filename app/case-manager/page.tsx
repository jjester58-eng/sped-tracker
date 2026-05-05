"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

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

export default function CaseManagerPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressHistory, setProgressHistory] = useState<any[]>([]);

  const [newGoalDesc, setNewGoalDesc] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState("");

  /* LOAD DATA */
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);

    const [studentsRes, goalsRes] = await Promise.all([
      supabase
        .from("students")
        .select("id, name, grade_level")
        .order("name"),
      supabase
        .from("goals")
        .select("id, student_id, goal_description"),
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

  /* LOAD PROGRESS HISTORY */
  useEffect(() => {
    if (selectedStudentId) {
      loadProgressHistory(selectedStudentId);
    }
  }, [selectedStudentId]);

  async function loadProgressHistory(studentId: string) {
    const { data, error } = await supabase
      .from("weekly_progress")
      .select("*")
      .eq("student_id", studentId)
      .order("review_date", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setProgressHistory(data || []);
    }
  }

  /* ADD NEW STUDENT */
  async function addStudent() {
    if (!newStudentName.trim()) {
      setError("Please enter a student name");
      return;
    }

    const { error } = await supabase
      .from("students")
      .insert([
        {
          name: newStudentName.trim(),
          grade_level: newStudentGrade || null,
        },
      ] as any);

    if (error) {
      setError(error.message);
    } else {
      setNewStudentName("");
      setNewStudentGrade("");
      loadData();
    }
  }

  /* ADD NEW GOAL */
  async function addGoal() {
    if (!selectedStudentId || !newGoalDesc.trim()) {
      setError("Please enter a goal description");
      return;
    }

    const { error } = await supabase
      .from("goals")
      .insert([
        {
          student_id: selectedStudentId,
          goal_description: newGoalDesc.trim(),
        },
      ] as any);

    if (error) {
      setError(error.message);
    } else {
      setNewGoalDesc("");
      loadData();
    }
  }

  /* DELETE STUDENT */
  async function deleteStudent(studentId: string) {
    if (!confirm("Are you sure? This will delete the student and all associated data.")) {
      return;
    }

    const { error } = await supabase
      .from("students")
      .delete()
      .eq("id", studentId);

    if (error) {
      setError(error.message);
    } else {
      loadData();
      setSelectedStudentId(null);
    }
  }

  /* DELETE GOAL */
  async function deleteGoal(goalId: string) {
    if (!confirm("Are you sure you want to delete this goal?")) {
      return;
    }

    const { error } = await supabase
      .from("goals")
      .delete()
      .eq("id", goalId);

    if (error) {
      setError(error.message);
    } else {
      loadData();
    }
  }

  /* HELPERS */
  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const studentGoals = selectedStudentId
    ? goals.filter((g) => g.student_id === selectedStudentId)
    : [];

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Case Manager</h1>
      <p className="text-gray-600 mb-6">Manage students, IEP goals, and track progress</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* LEFT: STUDENT LIST */}
        <div className="md:col-span-1 border rounded p-4 bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">Students</h2>

          {/* Add New Student */}
          <div className="mb-6 pb-6 border-b space-y-2">
            <input
              type="text"
              placeholder="Student name"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              className="w-full border p-2 rounded text-sm"
            />
            <input
              type="text"
              placeholder="Grade (optional)"
              value={newStudentGrade}
              onChange={(e) => setNewStudentGrade(e.target.value)}
              className="w-full border p-2 rounded text-sm"
            />
            <button
              onClick={addStudent}
              className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium"
            >
              Add Student
            </button>
          </div>

          {/* Student List */}
          <div className="space-y-2">
            {students.map((student) => {
              const count = goals.filter((g) => g.student_id === student.id).length;
              return (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudentId(student.id)}
                  className={`w-full text-left p-3 rounded transition ${
                    selectedStudentId === student.id
                      ? "bg-blue-600 text-white"
                      : "bg-white hover:bg-gray-100 border"
                  }`}
                >
                  <p className="font-semibold text-sm">{student.name}</p>
                  <p
                    className={`text-xs ${
                      selectedStudentId === student.id ? "text-blue-100" : "text-gray-600"
                    }`}
                  >
                    {student.grade_level && `Grade ${student.grade_level}`}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      selectedStudentId === student.id ? "text-blue-100" : "text-gray-500"
                    }`}
                  >
                    {count} goal{count !== 1 ? "s" : ""}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT: STUDENT DETAIL */}
        <div className="md:col-span-2">
          {!selectedStudentId ? (
            <p className="text-gray-500 text-center py-12">Select a student to view details</p>
          ) : (
            <>
              {/* HEADER */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedStudent?.name}</h2>
                  {selectedStudent?.grade_level && (
                    <p className="text-gray-600">Grade {selectedStudent.grade_level}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteStudent(selectedStudentId)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete Student
                </button>
              </div>

              {/* GOALS SECTION */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4">IEP Goals</h3>

                {/* Add Goal Form */}
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded space-y-2">
                  <input
                    type="text"
                    placeholder="Enter new goal..."
                    value={newGoalDesc}
                    onChange={(e) => setNewGoalDesc(e.target.value)}
                    className="w-full border p-2 rounded"
                  />
                  <button
                    onClick={addGoal}
                    className="bg-blue-600 text-white px-4 py-2 rounded font-medium"
                  >
                    Add Goal
                  </button>
                </div>

                {/* Goals List */}
                {studentGoals.length === 0 ? (
                  <p className="text-gray-500">No goals yet</p>
                ) : (
                  <div className="space-y-3">
                    {studentGoals.map((goal) => (
                      <div key={goal.id} className="border p-4 rounded flex justify-between items-start">
                        <p className="text-sm">{goal.goal_description}</p>
                        <button
                          onClick={() => deleteGoal(goal.id)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium ml-2 whitespace-nowrap"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PROGRESS HISTORY SECTION */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Progress History</h3>
                {progressHistory.length === 0 ? (
                  <p className="text-gray-500">No progress entries yet</p>
                ) : (
                  <div className="space-y-3">
                    {progressHistory.map((entry) => (
                      <div key={entry.id} className="border p-4 rounded">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm font-semibold text-gray-700">
                            {new Date(entry.review_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {goals.find((g) => g.id === entry.goal_id)?.goal_description}
                          </p>
                        </div>
                        <p className="text-sm text-gray-800">{entry.progress_notes}</p>
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