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

type ReportEntry = {
  id: string;
  student_id: string;
  goal_id: string;
  progress_notes: string;
  review_date: string;
  goal_description: string;
  goal_subject: string | null;
};

export default function CaseManagerPage() {
  const supabase = useSupabase();

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [showReports, setShowReports] = useState(false);

  // Add Student Form
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState("");
  const [newCaseManager, setNewCaseManager] = useState("");

  const [newGoals, setNewGoals] = useState([
    { goal_number: 1, goal_description: "", subject: "English" }
  ]);

  const subjects = ["English", "Math", "Reading", "Writing", "Behavior", "Science", "History"];

  /* Load Students */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("name");

      setStudents(error ? [] : (data ?? []));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadReportsForStudent = useCallback(async (studentId: string | null) => {
    if (!studentId) {
      setReports([]);
      setReportsError(null);
      setShowReports(false);
      return;
    }

    setReportsLoading(true);
    setReportsError(null);
    try {
      const { data, error } = await supabase
        .from("weekly_progress")
        .select("id, student_id, goal_id, progress_notes, review_date")
        .eq("student_id", studentId)
        .order("review_date", { ascending: false });

      if (error) throw error;

      const entries = (data ?? []) as Array<{
        id: string;
        student_id: string;
        goal_id: string;
        progress_notes: string;
        review_date: string;
      }>;

      const goalIds = Array.from(new Set(entries.map((entry) => entry.goal_id).filter(Boolean)));
      const { data: goalsData, error: goalsError } = goalIds.length > 0
        ? await supabase.from("goals").select("id, goal_description, subject").in("id", goalIds)
        : { data: [], error: null };

      if (goalsError) throw goalsError;

      const goalMap = new Map(
        (goalsData ?? []).map((goal: { id: string; goal_description: string; subject: string | null }) => [goal.id, goal])
      );

      const mappedReports = entries.map((entry) => {
        const goal = goalMap.get(entry.goal_id) as { goal_description?: string; subject?: string | null } | undefined;
        return {
          ...entry,
          goal_description: goal?.goal_description ?? "Unknown goal",
          goal_subject: goal?.subject ?? null,
        };
      });

      setReports(mappedReports);
      setShowReports(true);
    } catch (err: any) {
      console.error(err);
      setReports([]);
      setReportsError(err?.message || "Unable to load teacher reports from Supabase.");
      setShowReports(true);
    } finally {
      setReportsLoading(false);
    }
  }, [supabase]);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

  /* Add Student */
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
        } as any)           // ← This fixes the "never" error
        .select()
        .single();

      if (studentError) throw studentError;

      // Insert Goals
      const goalsToInsert = newGoals
        .filter(g => g.goal_description.trim())
        .map((g, index) => ({
          student_id: student.id,
          goal_number: index + 1,
          goal_description: g.goal_description.trim(),
          subject: g.subject,
        }));

      if (goalsToInsert.length > 0) {
        const { error: goalsError } = await supabase
          .from("goals")
          .insert(goalsToInsert as any);

        if (goalsError) throw goalsError;
      }

      resetForm();
      setShowAddStudentModal(false);
      await loadData();
      setSelectedStudentId(student.id);

    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setNewStudentName("");
    setNewStudentGrade("");
    setNewCaseManager("");
    setNewGoals([{ goal_number: 1, goal_description: "", subject: "English" }]);
  };

  const addGoalField = () => {
    setNewGoals(prev => [...prev, {
      goal_number: prev.length + 1,
      goal_description: "",
      subject: "English"
    }]);
  };

  const updateGoal = (index: number, field: string, value: string) => {
    setNewGoals(prev => prev.map((goal, i) => 
      i === index ? { ...goal, [field]: value } : goal
    ));
  };

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f9fafb", padding: "2.5rem 1.5rem" }}>
      <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
        <div style={{ backgroundColor: "white", borderRadius: "1.5rem", padding: "2rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
            <div>
             <h1 style={{ 
  fontSize: "2rem", 
  fontWeight: 800,
  color: "#111827"   // FIX: strong black
}}>
  Case Manager
</h1>

<p style={{ 
  color: "#374151",  // FIX: darker gray
  fontSize: "0.95rem",
  marginTop: "4px"
}}>
  Manage students and IEP goals
</p>
            </div>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <CsvUploader onUploadSuccess={loadData} />
              <button 
                onClick={() => setShowAddStudentModal(true)}
                style={{ backgroundColor: "#16a34a", color: "white", padding: "0.75rem 1.5rem", borderRadius: "1rem", border: "none", cursor: "pointer" }}
              >
                + Add Student
              </button>
            </div>
          </div>

          {error && (
            <div style={{ color: "#b91c1c", background: "#fee2e2", padding: "1rem", borderRadius: "1rem", marginBottom: "1rem" }}>
              {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr", gap: "2rem" }}>
            {/* Students List */}
            <div>
              <input
                type="text"
                placeholder="Search students..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "0.9rem", borderRadius: "1rem", border: "1px solid #d1d5db", marginBottom: "1rem" }}
              />

              <div style={{ maxHeight: "75vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {filteredStudents.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#9ca3af", padding: "3rem 0" }}>No students found</p>
                ) : (
                  filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => {
                        setSelectedStudentId(student.id);
                        setReports([]);
                        setShowReports(false);
                      }}
                      style={{
                        textAlign: "left",
                        padding: "1.1rem",
                        borderRadius: "1rem",
                        border: selectedStudentId === student.id ? "2px solid #2563eb" : "1px solid #e5e7eb",
                        backgroundColor: selectedStudentId === student.id ? "#eff6ff" : "white",
                      }}
                    >
                      <div style={{ fontWeight: "600" }}>{student.name}</div>
                      {student.grade_level && <div style={{ fontSize: "0.9rem", color: "#6b7280" }}>Grade {student.grade_level}</div>}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Editor Area */}
            <div>
              {!selectedStudentId ? (
                <div style={{ textAlign: "center", padding: "5rem 2rem", color: "#9ca3af" }}>
                  <p style={{ fontSize: "4rem", marginBottom: "1rem" }}>👨‍🎓</p>
                  <h3>Select a student to view/edit</h3>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Student Details</h3>
                      <p style={{ margin: "0.25rem 0 0", color: "#6b7280" }}>Choose a student to view their information and reports.</p>
                    </div>
                    <button
                      onClick={() => loadReportsForStudent(selectedStudentId)}
                      disabled={reportsLoading}
                      style={{
                        backgroundColor: "#2563eb",
                        color: "white",
                        padding: "0.75rem 1.25rem",
                        borderRadius: "0.9rem",
                        border: "none",
                        cursor: reportsLoading ? "not-allowed" : "pointer",
                        opacity: reportsLoading ? 0.7 : 1,
                      }}
                    >
                      {reportsLoading ? "Loading..." : "View Teacher Reports"}
                    </button>
                  </div>

                  <StudentEditor 
                    student={students.find(s => s.id === selectedStudentId)!} 
                    onSaved={loadData} 
                  />

                  {showReports && (
                    <div style={{ border: "1px solid #e5e7eb", borderRadius: "1rem", padding: "1.25rem", backgroundColor: "#f9fafb" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>Teacher Reports</h3>
                        <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>{reports.length} entr{reports.length === 1 ? "y" : "ies"}</span>
                      </div>

                      {reportsError ? (
                        <p style={{ margin: 0, color: "#b91c1c" }}>{reportsError}</p>
                      ) : reports.length === 0 ? (
                        <p style={{ margin: 0, color: "#6b7280" }}>No teacher input has been saved for this student yet.</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                          {reports.map((report) => (
                            <div key={report.id} style={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "0.9rem", padding: "1rem" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                                <strong style={{ color: "#111827" }}>{report.goal_description}</strong>
                                <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>{report.review_date}</span>
                              </div>
                              {report.goal_subject && (
                                <div style={{ color: "#4b5563", fontSize: "0.9rem", marginBottom: "0.5rem" }}>Subject: {report.goal_subject}</div>
                              )}
                              <div style={{ whiteSpace: "pre-wrap", color: "#374151", lineHeight: 1.5 }}>{report.progress_notes}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ backgroundColor: "white", borderRadius: "1.5rem", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "2rem" }}>
              <h2 style={{ fontSize: "1.9rem", fontWeight: "bold", marginBottom: "1.5rem" }}>Add New Student</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.4rem" }}>
                <div>
                  <label style={{ display: "block", fontWeight: "500", marginBottom: "0.4rem" }}>Student Name *</label>
                  <input type="text" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} placeholder="John Smith" style={{ width: "100%", padding: "0.85rem", borderRadius: "1rem", border: "1px solid #d1d5db" }} />
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: "500", marginBottom: "0.4rem" }}>Grade Level</label>
                  <input type="text" value={newStudentGrade} onChange={(e) => setNewStudentGrade(e.target.value)} placeholder="10" style={{ width: "100%", padding: "0.85rem", borderRadius: "1rem", border: "1px solid #d1d5db" }} />
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: "500", marginBottom: "0.4rem" }}>Case Manager</label>
                  <input type="text" value={newCaseManager} onChange={(e) => setNewCaseManager(e.target.value)} placeholder="Your Name" style={{ width: "100%", padding: "0.85rem", borderRadius: "1rem", border: "1px solid #d1d5db" }} />
                </div>

                {/* Goals Section */}
                <div>
                  <label style={{ display: "block", fontWeight: "500", marginBottom: "0.8rem" }}>IEP Goals</label>
                  {newGoals.map((goal, index) => (
                    <div key={index} style={{ border: "1px solid #e5e7eb", borderRadius: "1rem", padding: "1rem", marginBottom: "1rem" }}>
                      <select 
                        value={goal.subject} 
                        onChange={(e) => updateGoal(index, "subject", e.target.value)}
                        style={{ width: "100%", padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid #d1d5db", marginBottom: "0.8rem" }}
                      >
                        {subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                      </select>
                      <textarea
                        value={goal.goal_description}
                        onChange={(e) => updateGoal(index, "goal_description", e.target.value)}
                        placeholder="Enter goal description..."
                        style={{ width: "100%", minHeight: "80px", padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid #d1d5db", resize: "vertical" }}
                      />
                    </div>
                  ))}

                  <button onClick={addGoalField} style={{ color: "#2563eb", fontSize: "0.95rem" }}>
                    + Add another goal
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "2.5rem" }}>
                <button onClick={() => { resetForm(); setShowAddStudentModal(false); }} style={{ flex: 1, padding: "1rem", border: "1px solid #d1d5db", borderRadius: "1rem" }}>
                  Cancel
                </button>
                <button onClick={addStudent} style={{ flex: 1, padding: "1rem", backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "1rem" }}>
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