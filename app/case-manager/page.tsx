"use client";
export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "@/lib/useSupabase";
import CsvUploader from "../components/CsvUploader";
import StudentEditor from "../components/StudentEditor";

type Student = {
  id: string;
  name: string;
  grade_level: string | null;
};

type Class = { id: string; class_name: string; data_entry_person_id: string | null; };
type Goal = { id: string; student_id: string; class_id: string | null; goal_number: number; goal_description: string; };
type ProgressEntry = { id: string; student_id: string; goal_id: string; progress_notes: string; review_date: string; };

export default function CaseManagerPage() {
  const supabase = useSupabase();

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);

  // ... keep your existing form states and functions (addStudent, deleteStudent, etc.) ...

  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const studentGoals = selectedStudentId
    ? goals.filter((g) => g.student_id === selectedStudentId)
    : [];

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

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Case Manager</h1>
            <p className="text-gray-600 mt-1">Manage students, goals, and progress tracking</p>
          </div>
          <CsvUploader onUploadSuccess={loadData} />
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-6">{error}</div>
        )}

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Students Card Grid */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Students</h2>
                <button
                  onClick={() => setShowAddStudentModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition"
                >
                  + Add Student
                </button>
              </div>

              <div className="grid gap-3 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                {students.length === 0 ? (
                  <p className="text-gray-500 py-8 text-center">No students yet</p>
                ) : (
                  students.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudentId(student.id)}
                      className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 group
                        ${
                          selectedStudentId === student.id
                            ? "border-blue-600 bg-blue-50 shadow-sm"
                            : "border-gray-200 hover:border-gray-300 hover:shadow hover:-translate-y-0.5"
                        }`}
                    >
                      <div className="font-semibold text-lg text-gray-900 group-hover:text-blue-700 transition">
                        {student.name}
                      </div>
                      {student.grade_level && (
                        <div className="text-sm text-gray-500 mt-1">
                          Grade {student.grade_level}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Student Details Area */}
          <div className="lg:col-span-7 xl:col-span-8">
            {!selectedStudentId ? (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 h-full min-h-[500px] flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">👨‍🎓</div>
                  <h3 className="text-xl font-medium text-gray-700">Select a student</h3>
                  <p className="text-gray-500 mt-2">to view and manage their case</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <StudentEditor 
                  student={selectedStudent!} 
                  onSaved={loadData} 
                />

                {/* Goals Section */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-semibold">Goals</h3>
                    <button
                      onClick={() => setShowAddGoalModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2"
                    >
                      + Add Goal
                    </button>
                  </div>

                  {/* Your existing goals rendering code goes here */}
                  {studentGoals.length === 0 ? (
                    <p className="text-gray-500 bg-gray-50 p-12 rounded-2xl text-center">
                      No goals yet for this student.
                    </p>
                  ) : (
                    <div className="space-y-6">
                      {/* ... your class/goal cards ... */}
                    </div>
                  )}
                </div>

                {/* Progress History */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                  <h3 className="text-2xl font-semibold mb-6">Progress History</h3>
                  {/* ... your progress history code ... */}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}