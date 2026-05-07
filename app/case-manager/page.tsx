"use client";
export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "@/lib/useSupabase";
import CsvUploader from "../components/CsvUploader";
import StudentEditor from "../components/StudentEditor";

type Student = { id: string; name: string; grade_level: string | null };
type Class = { id: string; class_name: string };
type Goal = { id: string; student_id: string; class_id: string | null; goal_number: number; goal_description: string };

export default function CaseManagerPage() {
  const supabase = useSupabase();

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  // Add Student Form State
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState("");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [newGoals, setNewGoals] = useState<{ goal_number: number; goal_description: string; class_id: string | null }[]>([
    { goal_number: 1, goal_description: "", class_id: null }
  ]);

  /* ============ LOAD DATA ============ */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsRes, classesRes, goalsRes] = await Promise.all([
        supabase.from("students").select("*").order("name"),
        supabase.from("Classes").select("*").order("class_name"),
        supabase.from("goals").select("*"),
      ]);

      setStudents(studentsRes.error ? [] : (studentsRes.data ?? []));
      setClasses(classesRes.error ? [] : (classesRes.data ?? []));
      setGoals(goalsRes.error ? [] : (goalsRes.data ?? []));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ============ ADD STUDENT WITH GOALS ============ */
  const addStudentWithGoals = async () => {
    if (!newStudentName.trim()) {
      setError("Student name is required");
      return;
    }

    try {
      const { data: student, error: studentError } = await supabase
        .from("students")
        .insert({ name: newStudentName.trim(), grade_level: newStudentGrade || null })
        .select()
        .single();

      if (studentError) throw studentError;

      const goalsToInsert = newGoals
        .filter(g => g.goal_description.trim())
        .map(g => ({
          student_id: student.id,
          class_id: g.class_id,
          goal_number: g.goal_number,
          goal_description: g.goal_description.trim()
        }));

      if (goalsToInsert.length > 0) {
        const { error: goalsError } = await supabase.from("goals").insert(goalsToInsert);
        if (goalsError) throw goalsError;
      }

      // Reset & close
      setNewStudentName("");
      setNewStudentGrade("");
      setSelectedClassIds([]);
      setNewGoals([{ goal_number: 1, goal_description: "", class_id: null }]);
      setShowAddStudentModal(false);

      await loadData();
      setSelectedStudentId(student.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const addNewGoalField = () => {
    setNewGoals([...newGoals, { goal_number: newGoals.length + 1, goal_description: "", class_id: null }]);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-6">
        {/* Big centered white card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Case Manager</h1>
              <p className="text-gray-600 mt-1">Student cases and goal tracking</p>
            </div>
            <CsvUploader onUploadSuccess={loadData} />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded-2xl mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Students Sidebar */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl shadow border border-gray-100 p-6 sticky top-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold">Students</h2>
                  <button
                    onClick={() => setShowAddStudentModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 font-medium"
                  >
                    + Add Student
                  </button>
                </div>

                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                  {students.length === 0 ? (
                    <p className="text-gray-500 py-8 text-center">No students yet</p>
                  ) : (
                    students.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => setSelectedStudentId(student.id)}
                        className={`w-full text-left p-5 rounded-2xl border transition-all ${
                          selectedStudentId === student.id
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                        }`}
                      >
                        <div className="font-semibold">{student.name}</div>
                        {student.grade_level && (
                          <div className="text-sm text-gray-500">Grade {student.grade_level}</div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              {!selectedStudentId ? (
                <div className="bg-white rounded-3xl shadow border border-gray-100 h-full min-h-[500px] flex items-center justify-center text-center">
                  <div>
                    <p className="text-6xl mb-4">👨‍🎓</p>
                    <h3 className="text-2xl font-medium text-gray-700">Select a student</h3>
                    <p className="text-gray-500 mt-2">to view details and manage goals</p>
                  </div>
                </div>
              ) : (
                <StudentEditor 
                  student={students.find(s => s.id === selectedStudentId)!} 
                  onSaved={loadData} 
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <h2 className="text-3xl font-bold mb-6">Add New Student</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Student Name</label>
                  <input
                    type="text"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="w-full border rounded-2xl px-4 py-3"
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Grade Level</label>
                  <input
                    type="text"
                    value={newStudentGrade}
                    onChange={(e) => setNewStudentGrade(e.target.value)}
                    className="w-full border rounded-2xl px-4 py-3"
                    placeholder="5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Class(es)</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-2xl p-3">
                    {classes.map((cls) => (
                      <label key={cls.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedClassIds.includes(cls.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedClassIds([...selectedClassIds, cls.id]);
                            } else {
                              setSelectedClassIds(selectedClassIds.filter(id => id !== cls.id));
                            }
                          }}
                        />
                        {cls.class_name}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Goals */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium">Initial Goals</label>
                    <button
                      type="button"
                      onClick={addNewGoalField}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      + Add another goal
                    </button>
                  </div>

                  {newGoals.map((goal, index) => (
                    <div key={index} className="border rounded-2xl p-4 mb-4 bg-gray-50">
                      <input
                        type="text"
                        placeholder="Goal description"
                        value={goal.goal_description}
                        onChange={(e) => {
                          const updated = [...newGoals];
                          updated[index].goal_description = e.target.value;
                          setNewGoals(updated);
                        }}
                        className="w-full border rounded-xl px-4 py-3"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowAddStudentModal(false)}
                  className="flex-1 py-3.5 border rounded-2xl font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={addStudentWithGoals}
                  className="flex-1 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-medium"
                >
                  Create Student
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}