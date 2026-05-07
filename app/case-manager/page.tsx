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
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState("");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [newGoals, setNewGoals] = useState([{ goal_number: 1, goal_description: "", class_id: null as string | null }]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsRes, classesRes, goalsRes] = await Promise.all([
        supabase.from("students").select("*").order("name"),
        supabase.from("classes").select("*").order("class_name"),
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
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-10">
          
          <div className="flex justify-between items-center mb-12 border-b pb-8">
            <div>
              <h1 className="text-5xl font-bold text-gray-900">Case Manager</h1>
              <p className="text-xl text-gray-600 mt-2">Updated Centered Layout</p>
            </div>
            <CsvUploader onUploadSuccess={loadData} />
          </div>

          {error && <div className="bg-red-100 text-red-700 p-4 rounded-2xl mb-6">{error}</div>}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Students Sidebar */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl shadow border p-6 sticky top-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold">Students</h2>
                  <button
                    onClick={() => setShowAddStudentModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl font-medium"
                  >
                    + Add Student
                  </button>
                </div>

                <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                  {students.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStudentId(s.id)}
                      className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                        selectedStudentId === s.id 
                          ? "border-blue-600 bg-blue-50" 
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <div className="font-semibold text-lg">{s.name}</div>
                      {s.grade_level && <div className="text-sm text-gray-500">Grade {s.grade_level}</div>}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {!selectedStudentId ? (
                <div className="bg-white rounded-3xl shadow border p-20 text-center">
                  <p className="text-6xl mb-6">👈</p>
                  <h3 className="text-2xl font-medium text-gray-700">Select a student from the left</h3>
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="p-8">
              <h2 className="text-3xl font-bold mb-6">Add New Student</h2>
              {/* Modal content - same as before */}
              {/* ... keep your modal fields here ... */}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}