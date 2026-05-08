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

type Class = { 
  id: string; 
  class_name: string;
};

export default function CaseManagerPage() {
  const supabase = useSupabase();

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);

  // Form States
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState("");
  const [newCaseManager, setNewCaseManager] = useState("");
  const [newClassName, setNewClassName] = useState("");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  /* ============ LOAD DATA ============ */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [studentsRes, classesRes] = await Promise.all([
        supabase.from("students").select("*").order("name"),
        supabase.from("Classes").select("*").order("class_name"),
      ]);

      setStudents(studentsRes.error ? [] : (studentsRes.data ?? []));
      setClasses(classesRes.error ? [] : (classesRes.data ?? []));
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

  /* ============ ADD CLASS ============ */
  const addNewClass = async () => {
    if (!newClassName.trim()) {
      setError("Class name is required");
      return;
    }

    try {
      const { error } = await supabase
        .from("Classes")
        .insert({ class_name: newClassName.trim() } as any);   // ← Fixed here

      if (error) throw error;

      setNewClassName("");
      setShowAddClassModal(false);
      await loadData();
      alert("✅ Class created successfully!");
    } catch (err: any) {
      setError(err.message);
    }
  };

  /* ============ ADD STUDENT ============ */
  const addStudent = async () => {
    if (!newStudentName.trim()) {
      setError("Student name is required");
      return;
    }

    try {
      const { data: student, error: studentError } = await supabase
        .from("students")
        .insert({
          name: newStudentName.trim(),
          grade_level: newStudentGrade.trim() || null,
          case_manager: newCaseManager.trim() || null,
        } as any)                    // ← Fixed here
        .select()
        .single();

      if (studentError) throw studentError;

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
            <div style={{ display: "flex", gap: "12px" }}>
              <CsvUploader onUploadSuccess={loadData} />
              <button 
                onClick={() => setShowAddClassModal(true)}
                style={{ backgroundColor: "#3b82f6", color: "white", padding: "0.625rem 1.25rem", borderRadius: "1rem", border: "none", cursor: "pointer", fontWeight: 500 }}
              >
                + Add Class
              </button>
            </div>
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
                        </button>
                        <button style={{ color: "#ef4444", padding: "0.75rem", background: "none", border: "none", cursor: "pointer" }}>
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
                  <p style={{ fontSize: "4rem", marginBottom: "1rem" }}>👨‍🎓</p>
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

      {/* Add Class Modal */}
      {showAddClassModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ backgroundColor: "white", borderRadius: "1.5rem", width: "100%", maxWidth: "420px", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.8rem", fontWeight: "bold", marginBottom: "1.5rem" }}>Add New Class</h2>
            
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontWeight: "500", marginBottom: "0.5rem" }}>Class Name</label>
              <input 
                type="text" 
                value={newClassName} 
                onChange={(e) => setNewClassName(e.target.value)} 
                placeholder="e.g. English 10 - Period 3"
                style={{ width: "100%", padding: "0.9rem", borderRadius: "1rem", border: "1px solid #d1d5db" }}
              />
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <button 
                onClick={() => { setNewClassName(""); setShowAddClassModal(false); }} 
                style={{ flex: 1, padding: "1rem", border: "1px solid #d1d5db", borderRadius: "1rem" }}
              >
                Cancel
              </button>
              <button 
                onClick={addNewClass} 
                style={{ flex: 1, padding: "1rem", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "1rem" }}
              >
                Create Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal - Add your full modal here if needed */}
      {showAddStudentModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          {/* Paste your full Add Student modal content here */}
        </div>
      )}
    </main>
  );
}