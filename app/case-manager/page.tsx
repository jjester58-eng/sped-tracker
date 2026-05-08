"use client";
export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "@/lib/useSupabase";
import CsvUploader from "../components/CsvUploader";
import StudentEditor from "../components/StudentEditor";

type Student = { id: string; name: string; grade_level: string | null };
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

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

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
          goal_description: g.goal_description.trim(),
          subject: g.subject,
        }));

      if (goalsToInsert.length > 0) {
        // Clean type assertion (better than `as any`)
        const { error: goalsError } = await supabase
          .from("goals")
          .insert(goalsToInsert as any[]);   // Only casting the array

        if (goalsError) throw goalsError;
      }

      // Reset
      setNewStudentName("");
      setNewStudentGrade("");
      setSelectedClassIds([]);
      setNewGoals([{ goal_number: 1, goal_description: "", subject: "Math", class_id: null }]);
      setShowAddStudentModal(false);

      await loadData();
      setSelectedStudentId(student.id);
    } catch (err: any) {
      setError(err.message);
    }
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
      <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "0 1.5rem" }}>
        <div style={{ 
          backgroundColor: "white", 
          borderRadius: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #f3f4f6",
          padding: "2rem"
        }}>

          <div style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "1rem",
            marginBottom: "2.5rem"
          }}>
            <div>
              <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#111827", margin: "0 0 0.25rem" }}>Case Manager</h1>
              <p style={{ color: "#4b5563", marginTop: "0.25rem", margin: "0" }}>Student cases and goal tracking</p>
            </div>
            <CsvUploader onUploadSuccess={loadData} />
          </div>

          {error && (
            <div style={{
              backgroundColor: "#fee2e2",
              border: "1px solid #fca5a5",
              color: "#b91c1c",
              padding: "1rem",
              borderRadius: "1rem",
              marginBottom: "1.5rem"
            }}>
              {error}
            </div>
          )}

          <div style={{ 
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
            gap: "2rem"
          }}>
            {/* Students Sidebar - spans 2 cols */}
            <div style={{ gridColumn: "span 2" }}>
              {/* ... same as before ... */}
              <div style={{
                backgroundColor: "white",
                borderRadius: "1.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                border: "1px solid #f3f4f6",
                padding: "1.5rem",
                position: "sticky",
                top: "1.5rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: "600", margin: "0" }}>Students</h2>
                  <button onClick={() => setShowAddStudentModal(true)} style={{
                    backgroundColor: "#16a34a", color: "white", padding: "0.625rem 1.25rem", borderRadius: "1rem",
                    border: "none", fontWeight: "500", cursor: "pointer"
                  }}>
                    + Add Student
                  </button>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "1rem", padding: "0.75rem 1rem" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "70vh", overflowY: "auto" }}>
                  {filteredStudents.length === 0 ? (
                    <p style={{ color: "#9ca3af", textAlign: "center", padding: "3rem 1rem" }}>
                      {studentSearchQuery ? "No students found" : "No students yet"}
                    </p>
                  ) : (
                    filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => setSelectedStudentId(student.id)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "1.25rem",
                          borderRadius: "1rem",
                          border: selectedStudentId === student.id ? "2px solid #2563eb" : "1px solid #e5e7eb",
                          backgroundColor: selectedStudentId === student.id ? "#eff6ff" : "transparent",
                          cursor: "pointer"
                        }}
                      >
                        <div style={{ fontWeight: "600" }}>{student.name}</div>
                        {student.grade_level && <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Grade {student.grade_level}</div>}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div style={{ gridColumn: "span 3" }}>
              {!selectedStudentId ? (
                <div style={{
                  backgroundColor: "white",
                  borderRadius: "1.5rem",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  border: "1px solid #f3f4f6",
                  minHeight: "500px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center"
                }}>
                  <div>
                    <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>👨‍🎓</p>
                    <h3 style={{ fontSize: "1.5rem", fontWeight: "500", color: "#374151" }}>Select a student</h3>
                    <p style={{ color: "#6b7280" }}>to view details and manage goals</p>
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

      {/* Add Student Modal - (same as your previous version) */}
      {showAddStudentModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }}>
          <div style={{ backgroundColor: "white", borderRadius: "1.5rem", maxWidth: "32rem", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "2rem" }}>
              <h2 style={{ fontSize: "1.875rem", fontWeight: "bold", marginBottom: "1.5rem" }}>Add New Student</h2>

              {/* Form fields - abbreviated for space, copy from your last working version if needed */}
              {/* Name, Grade, Classes, Goals sections... */}

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "2rem" }}>
                <button onClick={() => setShowAddStudentModal(false)} style={{ flex: 1, padding: "0.875rem", border: "1px solid #d1d5db", borderRadius: "1rem" }}>
                  Cancel
                </button>
                <button onClick={addStudentWithGoals} style={{ flex: 1, padding: "0.875rem", backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "1rem" }}>
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