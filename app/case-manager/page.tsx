"use client";
export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "@/lib/useSupabase";
import CsvUploader from "../components/CsvUploader";
import StudentEditor from "../components/StudentEditor";   // ← Import here

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

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [progressHistory, setProgressHistory] = useState<ProgressEntry[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);

  // Form states (kept for modals)
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState("");
  const [newGoalClassId, setNewGoalClassId] = useState<string | null>(null);
  const [newGoalNumber, setNewGoalNumber] = useState("1");
  const [newGoalDesc, setNewGoalDesc] = useState("");

  /* ============ LOAD DATA ============ */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [studentsRes, classesRes, goalsRes] = await Promise.all([
        supabase.from("students").select("*").order("name"),
        supabase.from("Classes").select("*").order("class_name"),
        supabase.from("goals").select("*"),
      ]);

      setStudents(studentsRes.error ? [] : (studentsRes.data ?? []));
      setClasses(classesRes.error ? [] : (classesRes.data ?? []));
      setGoals(goalsRes.error ? [] : (goalsRes.data ?? []));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ... keep your loadProgressHistory function and useEffect ...

  /* ============ STUDENT OPERATIONS ============ */
  const deleteStudent = useCallback(async (studentId: string) => {
    if (!confirm("Delete this student and all related data?")) return;

    try {
      const { error } = await supabase.from("students").delete().eq("id", studentId);
      if (error) throw error;

      setSelectedStudentId(null);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  }, [supabase, loadData]);

  // ... keep your addStudentWithGoal and addGoal functions ...

  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const studentGoals = selectedStudentId
    ? goals.filter((g) => g.student_id === selectedStudentId)
    : [];

  /* ============ RENDER ============ */
  return (
    <main className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Case Manager</h1>
          <p className="text-gray-600">Manage students, goals, and progress</p>
        </div>
        <CsvUploader onUploadSuccess={loadData} />
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      <div className="grid md:grid-cols-3 gap-6">
        {/* LEFT PANEL - Students List */}
        <div className="border p-4 rounded bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold">Students</h2>
            <button
              onClick={() => setShowAddStudentModal(true)}
              className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700"
            >
              + Add Student
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {students.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStudentId(s.id)}
                className={`w-full text-left p-3 border rounded transition-colors ${
                  selectedStudentId === s.id ? "bg-blue-600 text-white" : "hover:bg-gray-100"
                }`}
              >
                <div className="font-medium">{s.name}</div>
                {s.grade_level && <div className="text-xs opacity-75">Grade {s.grade_level}</div>}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL - Student Details + Editor */}
        <div className="md:col-span-2 space-y-6">
          {!selectedStudentId ? (
            <p className="text-gray-600 py-12 text-center">Select a student to view and edit details</p>
          ) : (
            <>
              {/* Student Editor */}
              <StudentEditor 
                student={selectedStudent!} 
                onSaved={loadData} 
              />

              {/* Goals Section */}
              <div className="border p-5 rounded-lg bg-white">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Goals by Subject</h3>
                  <button
                    onClick={() => setShowAddGoalModal(true)}
                    className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700"
                  >
                    + Add Goal
                  </button>
                </div>

                {/* ... existing goals rendering code ... */}
                {studentGoals.length === 0 ? (
                  <p className="text-gray-500 bg-gray-50 p-6 rounded text-center">No goals yet for this student.</p>
                ) : (
                  // Your existing goals grouped by class...
                  <div className="space-y-4">
                    {classes.map((cls) => {
                      const classGoals = studentGoals.filter((g) => g.class_id === cls.id);
                      if (classGoals.length === 0) return null;
                      return (
                        <div key={cls.id} className="border p-4 rounded bg-blue-50">
                          <h4 className="font-semibold mb-3">{cls.class_name}</h4>
                          {/* goal cards */}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Progress History */}
              <div className="border p-5 rounded-lg bg-white">
                <h3 className="text-lg font-bold mb-4">Progress History</h3>
                {/* ... your existing progress history code ... */}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Student & Add Goal Modals (keep your existing modals) */}
      {/* ... your modals code ... */}
    </main>
  );
}