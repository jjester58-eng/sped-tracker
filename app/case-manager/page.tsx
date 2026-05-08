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
  case_manager?: string | null;
};

type Class = { id: string; class_name: string };

type Goal = {
  id: string;
  student_id: string;
  class_id: string | null;
  goal_number: number;
  goal_description: string;
  subject: string;
  created_at?: string | null;
  updated_at?: string | null;
};

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
  const [newCaseManager, setNewCaseManager] = useState("");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  const [newGoals, setNewGoals] = useState<{
    goal_number: number;
    goal_description: string;
    subject: string;
    class_id: string | null;
  }[]>([
    { goal_number: 1, goal_description: "", subject: "Math", class_id: null }
  ]);

  const subjects = ["Math", "Science", "English", "History"];

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

      const rawGoals = goalsRes.error ? [] : (goalsRes.data ?? []);
      const processedGoals: Goal[] = rawGoals.map((g: any) => ({
        ...g,
        subject: g.subject || "Math",
      }));

      setGoals(processedGoals);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ============ FILTERED STUDENTS ============ */
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

  /* ============ DELETE STUDENT ============ */
  const deleteStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Delete "${studentName}" and all their data?`)) return;

    try {
      await supabase.from("goals").delete().eq("student_id", studentId);
      const { error } = await supabase.from("students").delete().eq("id", studentId);
      if (error) throw error;

      await loadData();
      if (selectedStudentId === studentId) setSelectedStudentId(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  /* ============ ADD STUDENT ============ */
  const addStudentWithGoals = async () => {
    if (!newStudentName.trim()) {
      setError("Student name is required");
      return;
    }

    try {
      const { data: student, error: studentError } = await supabase
        .from("students")
        .insert({
          name: newStudentName.trim(),
          grade_level: newStudentGrade || null,
          case_manager: newCaseManager.trim() || null,
        } as any)                    // ← This fixes the "never" error
        .select()
        .single();

      if (studentError) throw studentError;

      const goalsToInsert = newGoals
        .filter(g => g.goal_description.trim())
        .map(g => ({
          student_id: student.id,
          class_id: g.class_id,
          goal_number: g.goal_number,
          goal_description: g.goal_description.trim(),
          subject: g.subject,
        }));

      if (goalsToInsert.length > 0) {
        const { error: goalsError } = await supabase
          .from("goals")
          .insert(goalsToInsert as any);

        if (goalsError) throw goalsError;
      }

      resetAddForm();
      setShowAddStudentModal(false);

      await loadData();
      setSelectedStudentId(student.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetAddForm = () => {
    setNewStudentName("");
    setNewStudentGrade("");
    setNewCaseManager("");
    setSelectedClassIds([]);
    setNewGoals([{ goal_number: 1, goal_description: "", subject: "Math", class_id: null }]);
  };

  const addNewGoalField = () => {
    setNewGoals(prev => [...prev, {
      goal_number: prev.length + 1,
      goal_description: "",
      subject: "Math",
      class_id: null
    }]);
  };

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f9fafb", padding: "2.5rem 1.5rem", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
        <div style={{ 
          backgroundColor: "white", 
          borderRadius: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #f3f4f6",
          padding: "2rem"
        }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2.5rem" }}>
            <div>
              <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#111827" }}>Case Manager</h1>
              <p style={{ color: "#4b5563" }}>Student cases and goal tracking</p>
            </div>
            <CsvUploader onUploadSuccess={loadData} />
          </div>

          {error && (
            <div style={{ backgroundColor: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "1rem", borderRadius: "1rem", marginBottom: "1.5rem" }}>
              {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr", gap: "2rem" }}>
            {/* Students Sidebar */}
            <div>
              <div style={{ backgroundColor: "white", borderRadius: "1.5rem", padding: "1.5rem", border: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: "600" }}>Students</h2>
                  <button 
                    onClick={() => setShowAddStudentModal(true)}
                    style={{ backgroundColor: "#16a34a", color: "white", padding: "0.625rem 1.25rem", borderRadius: "1rem", border: "none", cursor: "pointer" }}
                  >
                    + Add Student
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Search students..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "1rem", border: "1px solid #d1d5db", marginBottom: "1rem" }}
                />

                <div style={{ maxHeight: "70vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {filteredStudents.length === 0 ? (
                    <p style={{ textAlign: "center", color: "#9ca3af", padding: "2rem 0" }}>
                      {studentSearchQuery ? "No students found" : "No students yet"}
                    </p>
                  ) : (
                    filteredStudents.map((student) => (
                      <div key={student.id} style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => setSelectedStudentId(student.id)}
                          style={{
                            flex: 1,
                            textAlign: "left",
                            padding: "1rem",
                            borderRadius: "1rem",
                            border: selectedStudentId === student.id ? "2px solid #2563eb" : "1px solid #e5e7eb",
                            backgroundColor: selectedStudentId === student.id ? "#eff6ff" : "transparent",
                          }}
                        >
                          <div style={{ fontWeight: "600" }}>{student.name}</div>
                          {student.grade_level && <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Grade {student.grade_level}</div>}
                          {student.case_manager && <div style={{ fontSize: "0.8rem", color: "#2563eb" }}>📋 {student.case_manager}</div>}
                        </button>
                        <button
                          onClick={() => deleteStudent(student.id, student.name)}
                          style={{ color: "#ef4444", padding: "0.75rem", background: "none", border: "none", cursor: "pointer" }}
                        >
                          🗑
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div>
              {!selectedStudentId ? (
                <div style={{ backgroundColor: "white", borderRadius: "1.5rem", padding: "4rem 2rem", textAlign: "center", border: "1px solid #f3f4f6" }}>
                  <p style={{ fontSize: "4rem", margin: "0 0 1rem" }}>👨‍🎓</p>
                  <h3>Select a student</h3>
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
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ backgroundColor: "white", borderRadius: "1.5rem", maxWidth: "36rem", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "2rem" }}>
              <h2 style={{ fontSize: "1.9rem", fontWeight: "bold", marginBottom: "1.5rem" }}>Add New Student</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.4rem" }}>
                <div>
                  <label style={{ display: "block", fontWeight: "500", marginBottom: "0.4rem" }}>Student Name *</label>
                  <input type="text" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} placeholder="John Smith" style={{ width: "100%", padding: "0.8rem", borderRadius: "1rem", border: "1px solid #d1d5db" }} />
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: "500", marginBottom: "0.4rem" }}>Grade Level</label>
                  <input type="text" value={newStudentGrade} onChange={(e) => setNewStudentGrade(e.target.value)} placeholder="5" style={{ width: "100%", padding: "0.8rem", borderRadius: "1rem", border: "1px solid #d1d5db" }} />
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: "500", marginBottom: "0.4rem" }}>Case Manager</label>
                  <input type="text" value={newCaseManager} onChange={(e) => setNewCaseManager(e.target.value)} placeholder="Jane Cooper" style={{ width: "100%", padding: "0.8rem", borderRadius: "1rem", border: "1px solid #d1d5db" }} />
                </div>

                {/* Classes & Goals sections can be added here later */}
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "2.5rem" }}>
                <button 
                  onClick={() => { resetAddForm(); setShowAddStudentModal(false); }} 
                  style={{ flex: 1, padding: "1rem", border: "1px solid #d1d5db", borderRadius: "1rem" }}
                >
                  Cancel
                </button>
                <button 
                  onClick={addStudentWithGoals} 
                  style={{ flex: 1, padding: "1rem", backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "1rem" }}
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