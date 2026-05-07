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

type Class = {
  id: string;
  class_name: string;
  data_entry_person_id: string | null;
};

type Goal = {
  id: string;
  student_id: string;
  class_id: string | null;
  goal_number: number;
  goal_description: string;
  created_at: string | null;
  updated_at: string | null;
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
  const [classes, setClasses] = useState<Class[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [progressHistory, setProgressHistory] = useState<ProgressEntry[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Student form states
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState("");

  // Goal form states
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [newGoalDesc, setNewGoalDesc] = useState("");
  const [newGoalNumber, setNewGoalNumber] = useState("");

  // Modal state
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);

  /* ============ LOAD INITIAL DATA ============ */

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [studentsRes, classesRes, goalsRes] = await Promise.all([
        supabase.from("students").select("*").order("name"),
        supabase.from("Classes").select("*").order("class_name"),
        supabase.from("goals").select("*"),
      ]);

      if (studentsRes.error) {
        setError(studentsRes.error.message);
        setStudents([]);
      } else {
        setStudents(studentsRes.data ?? []);
      }

      if (classesRes.error) {
        setError(classesRes.error.message);
        setClasses([]);
      } else {
        setClasses(classesRes.data ?? []);
      }

      if (goalsRes.error) {
        setError(goalsRes.error.message);
        setGoals([]);
      } else {
        setGoals((goalsRes.data ?? []) as Goal[]);
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
      setShowAddStudentModal(false);
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
    if (!selectedStudentId || !selectedClassId || !newGoalDesc.trim()) {
      setError("Select a student, subject, and enter a goal description");
      return;
    }

    setError(null);

    try {
      const { error } = await supabase.from("goals").insert({
        student_id: selectedStudentId,
        class_id: selectedClassId,
        goal_number: newGoalNumber ? parseInt(newGoalNumber) : 1,
        goal_description: newGoalDesc.trim(),
      });

      if (error) {
        setError(error.message);
        return;
      }

      setNewGoalDesc("");
      setNewGoalNumber("");
      setSelectedClassId(null);
      setShowAddGoalModal(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [supabase, selectedStudentId, selectedClassId, newGoalDesc, newGoalNumber, loadData]);

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

  const getClassNameById = (classId: string | null) => {
    if (!classId) return "Unknown Subject";
    return classes.find((c) => c.id === classId)?.class_name || "Unknown Subject";
  };

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
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold">Students</h2>
            <button
              onClick={() => setShowAddStudentModal(true)}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
            >
              + Add
            </button>
          </div>

          <div className="mb-4 pb-4 border-b">
            <h3 className="text-sm font-semibold mb-2">Bulk Import</h3>
            <CsvUploader onUploadSuccess={loadData} />
          </div>

          <h3 className="text-sm font-semibold mb-3">All Students ({students.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {students.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStudentId(s.id)}
                className={`w-full text-left p-2 border rounded transition-colors text-sm ${
                  selectedStudentId === s.id
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                <div className="font-medium">{s.name}</div>
                {s.grade_level && <div className="text-xs opacity-75">Grade {s.grade_level}</div>}
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
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedStudent?.name}</h2>
                  {selectedStudent?.grade_level && (
                    <p className="text-gray-600">Grade {selectedStudent.grade_level}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteStudent(selectedStudentId)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete Student
                </button>
              </div>

              {/* GOALS SECTION */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Goals by Subject</h3>
                  <button
                    onClick={() => setShowAddGoalModal(true)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    + Add Goal
                  </button>
                </div>

                {studentGoals.length === 0 ? (
                  <p className="text-gray-500 bg-gray-50 p-4 rounded">No goals yet</p>
                ) : (
                  <div className="space-y-4">
                    {classes.map((cls) => {
                      const classGoals = studentGoals.filter((g) => g.class_id === cls.id);
                      if (classGoals.length === 0) return null;

                      return (
                        <div key={cls.id} className="border p-4 rounded bg-blue-50">
                          <h4 className="font-semibold text-blue-900 mb-3">{cls.class_name}</h4>
                          <div className="space-y-2">
                            {classGoals.map((g) => (
                              <div
                                key={g.id}
                                className="bg-white border p-3 rounded flex justify-between items-start gap-2"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-sm">Goal #{g.goal_number}</div>
                                  <div className="text-sm text-gray-700 mt-1">{g.goal_description}</div>
                                </div>
                                <button
                                  onClick={() => deleteGoal(g.id)}
                                  className="text-red-600 hover:text-red-800 text-xs whitespace-nowrap"
                                >
                                  Delete
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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

      {/* ============ MODALS ============ */}

      {/* ADD STUDENT MODAL */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Add New Student</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Student Name *</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded"
                  placeholder="Enter student name"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Grade Level</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded"
                  placeholder="e.g., 5, 6, 7, 8, etc."
                  value={newStudentGrade}
                  onChange={(e) => setNewStudentGrade(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={addStudent}
                  className="flex-1 bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                >
                  Add Student
                </button>
                <button
                  onClick={() => {
                    setShowAddStudentModal(false);
                    setNewStudentName("");
                    setNewStudentGrade("");
                  }}
                  className="flex-1 bg-gray-300 text-gray-800 p-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD GOAL MODAL */}
      {showAddGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Add Goal for {selectedStudent?.name}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject/Class *</label>
                <select
                  className="w-full border p-2 rounded"
                  value={selectedClassId || ""}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  <option value="">Select a subject...</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.class_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Goal Number</label>
                <input
                  type="number"
                  className="w-full border p-2 rounded"
                  placeholder="e.g., 1, 2, 3"
                  value={newGoalNumber}
                  onChange={(e) => setNewGoalNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Goal Description *</label>
                <textarea
                  className="w-full border p-2 rounded"
                  placeholder="Describe the goal..."
                  rows={4}
                  value={newGoalDesc}
                  onChange={(e) => setNewGoalDesc(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={addGoal}
                  className="flex-1 bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                >
                  Add Goal
                </button>
                <button
                  onClick={() => {
                    setShowAddGoalModal(false);
                    setNewGoalDesc("");
                    setNewGoalNumber("");
                    setSelectedClassId(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-800 p-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}