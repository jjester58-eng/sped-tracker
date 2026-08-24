"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useSupabase } from "@/lib/useSupabase";

type CaseManager = {
  id: string;
  name: string;
};

type Teacher = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  name: string;
  grade_level: string | null;
  case_manager?: string | null;
  status?: string | null;
  graduation_year?: number | null;
};

type Goal = {
  id: string;
  student_id: string;
  goal_number: number | null;
  goal_description: string;
  subject: string | null;
};

type TeacherReport = {
  id: string;
  student_id: string;
  goal_id: string | null;
  progress_notes: string | null;
  notes: string | null;
  review_date: string | null;
  created_at: string | null;
  teacher_id: string | null;
  class_period: string | null;
  accommodations_used: string | null;
  school_year: string | null;
};

export default function CaseManagerPage() {
  const supabase = useSupabase();

  const [caseManagers, setCaseManagers] = useState<CaseManager[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedCaseManager, setSelectedCaseManager] = useState("");

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [reports, setReports] = useState<TeacherReport[]>([]);

  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"observations" | "goals">("observations");

  const loadLookups = useCallback(async () => {
    try {
      const [cmRes, teacherRes] = await Promise.all([
        supabase.from("case_managers").select("id, name").order("name"),
        supabase.from("teachers").select("id, name").order("name"),
      ]);

      if (cmRes.data) setCaseManagers(cmRes.data);
      if (teacherRes.data) {
        setTeachers(
          (teacherRes.data as any[])
            .filter((t) => t.name)
            .map((t) => ({ id: t.id || t.name || "", name: t.name || "" }))
        );
      }
    } catch (err: any) {
      console.error("Error loading lookups:", err);
    }
  }, [supabase]);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: studentErr } = await supabase
        .from("students")
        .select("id, name, grade_level, case_manager, status, graduation_year, is_active")
        .order("name");

      if (studentErr) throw studentErr;

      setStudents(
        (data ?? []).filter((s: any) => s.is_active !== false) as Student[]
      );
    } catch (err: any) {
      console.error("Error loading students:", err);
      setError(err?.message || "Unable to load students.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadLookups();
    loadStudents();
  }, [loadLookups, loadStudents]);

  const filteredStudents = useMemo(() => {
    const term = studentSearchQuery.toLowerCase().trim();

    return students.filter((student) => {
      let matchesCM = true;
      if (selectedCaseManager) {
        const cmObj = caseManagers.find((cm) => cm.id === selectedCaseManager);
        const cmName = cmObj ? cmObj.name : selectedCaseManager;
        matchesCM =
          student.case_manager?.toLowerCase() === cmName.toLowerCase() ||
          student.case_manager === selectedCaseManager;
      }

      const matchesSearch =
        !term ||
        student.name.toLowerCase().includes(term) ||
        (student.grade_level && student.grade_level.toLowerCase().includes(term)) ||
        (student.case_manager && student.case_manager.toLowerCase().includes(term));

      return matchesCM && matchesSearch;
    });
  }, [students, selectedCaseManager, studentSearchQuery, caseManagers]);

  const handleSelectStudent = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setDetailsLoading(true);
    setError(null);

    try {
      const [goalsRes, progressRes] = await Promise.all([
        supabase
          .from("goals")
          .select("id, student_id, goal_number, goal_description, subject")
          .eq("student_id", studentId)
          .order("goal_number", { ascending: true }),

        supabase
          .from("weekly_progress")
          .select(
            "id, student_id, goal_id, progress_notes, notes, review_date, created_at, teacher_id, class_period, accommodations_used, school_year"
          )
          .eq("student_id", studentId)
          .order("created_at", { ascending: false }),
      ]);

      if (goalsRes.error) console.error("Goals error:", goalsRes.error);
      if (progressRes.error) console.error("Progress error:", progressRes.error);

      setGoals((goalsRes.data ?? []) as Goal[]);
      setReports((progressRes.data ?? []) as TeacherReport[]);
    } catch (err: any) {
      console.error("Error loading student details:", err);
      setError(err?.message || "Failed to load student reports.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const resolveTeacherName = (teacherId: string | null) => {
    if (!teacherId) return "Teacher / Staff";
    const found = teachers.find((t) => t.id === teacherId || t.name === teacherId);
    return found ? found.name : "Teacher";
  };

  const formatTimestamp = (created_at: string | null, review_date: string | null) => {
    if (created_at) {
      const d = new Date(created_at);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (review_date) {
      return review_date;
    }
    return "Date not recorded";
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        padding: "2rem 1.5rem",
        fontFamily: "inherit",
      }}
    >
      <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "1.25rem",
            padding: "1.75rem 2rem",
            marginBottom: "1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            border: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                backgroundColor: "#f3e8ff",
                color: "#7e22ce",
                padding: "0.35rem 0.75rem",
                borderRadius: "999px",
                fontSize: "0.8rem",
                fontWeight: 700,
                marginBottom: "0.4rem",
              }}
            >
              <span>👁️</span>
              <span>Case Manager & Admin View-Only Portal</span>
            </div>
            <h1
              style={{
                fontSize: "1.85rem",
                fontWeight: 800,
                color: "#0f172a",
                margin: 0,
              }}
            >
              Caseload & Observation Log
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.95rem", margin: "0.25rem 0 0" }}>
              Review teacher observation feeds, timestamps, accommodations, and IEP goals.
            </p>
          </div>

          {selectedStudent && (
            <button
              onClick={() => window.print()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.65rem 1.1rem",
                borderRadius: "0.65rem",
                backgroundColor: "#f1f5f9",
                color: "#334155",
                border: "1px solid #cbd5e1",
                fontSize: "0.88rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <span>🖨️</span> Print / Export Report
            </button>
          )}
        </div>

        {error && (
          <div
            style={{
              padding: "1rem 1.25rem",
              borderRadius: "0.75rem",
              backgroundColor: "#fef2f2",
              color: "#991b1b",
              border: "1px solid #fecaca",
              marginBottom: "1.5rem",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "320px 1fr",
            gap: "1.5rem",
            alignItems: "start",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1.25rem",
              padding: "1.5rem",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ marginBottom: "1.25rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#475569",
                  marginBottom: "0.35rem",
                }}
              >
                Case Manager (Optional Filter)
              </label>
              <select
                value={selectedCaseManager}
                onChange={(e) => {
                  setSelectedCaseManager(e.target.value);
                  setSelectedStudentId(null);
                }}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "0.65rem",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#f8fafc",
                  color: "#0f172a",
                  fontSize: "0.9rem",
                  boxSizing: "border-box",
                }}
              >
                <option value="">All Students (No filter)</option>
                {caseManagers.map((cm) => (
                  <option key={cm.id} value={cm.id}>
                    {cm.name}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: "0.72rem", color: "#94a3b8", display: "block", marginTop: "0.25rem" }}>
                Admins can leave this blank to see all students.
              </span>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <input
                type="text"
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                placeholder="Search students..."
                style={{
                  width: "100%",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "0.65rem",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.9rem",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.5rem",
                fontSize: "0.8rem",
                color: "#64748b",
                fontWeight: 600,
              }}
            >
              <span>Students ({filteredStudents.length})</span>
            </div>

            <div
              style={{
                maxHeight: "65vh",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {loading ? (
                <p style={{ textAlign: "center", color: "#94a3b8", padding: "2rem 0" }}>
                  Loading students...
                </p>
              ) : filteredStudents.length === 0 ? (
                <p style={{ textAlign: "center", color: "#94a3b8", padding: "2rem 0" }}>
                  No students found
                </p>
              ) : (
                filteredStudents.map((student) => {
                  const isSelected = student.id === selectedStudentId;
                  return (
                    <button
                      key={student.id}
                      onClick={() => handleSelectStudent(student.id)}
                      style={{
                        textAlign: "left",
                        padding: "0.85rem 1rem",
                        borderRadius: "0.75rem",
                        border: isSelected
                          ? "1.5px solid #2563eb"
                          : "1px solid #f1f5f9",
                        backgroundColor: isSelected ? "#eff6ff" : "#f8fafc",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "0.95rem",
                          color: isSelected ? "#1d4ed8" : "#0f172a",
                        }}
                      >
                        {student.name}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          marginTop: "0.3rem",
                          fontSize: "0.78rem",
                          color: "#64748b",
                        }}
                      >
                        <span>Grade {student.grade_level || "N/A"}</span>
                        {student.case_manager && (
                          <>
                            <span>•</span>
                            <span style={{ color: "#7e22ce", fontWeight: 600 }}>
                              CM: {student.case_manager}
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1.25rem",
              padding: "1.75rem 2rem",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              minHeight: "450px",
            }}
          >
            {selectedStudent ? (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    borderBottom: "1px solid #f1f5f9",
                    paddingBottom: "1.25rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        fontSize: "1.6rem",
                        fontWeight: 800,
                        color: "#0f172a",
                        margin: 0,
                      }}
                    >
                      {selectedStudent.name}
                    </h2>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        marginTop: "0.4rem",
                        fontSize: "0.88rem",
                        color: "#475569",
                      }}
                    >
                      <span><strong>Grade:</strong> {selectedStudent.grade_level || "N/A"}</span>
                      <span><strong>Case Manager:</strong> {selectedStudent.case_manager || "Unassigned"}</span>
                      {selectedStudent.graduation_year && (
                        <span><strong>Grad Year:</strong> {selectedStudent.graduation_year}</span>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      backgroundColor: "#f1f5f9",
                      padding: "0.25rem",
                      borderRadius: "0.65rem",
                      gap: "0.25rem",
                    }}
                  >
                    <button
                      onClick={() => setActiveTab("observations")}
                      style={{
                        padding: "0.45rem 0.9rem",
                        borderRadius: "0.5rem",
                        border: "none",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        backgroundColor: activeTab === "observations" ? "white" : "transparent",
                        color: activeTab === "observations" ? "#0f172a" : "#64748b",
                        boxShadow: activeTab === "observations" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                      }}
                    >
                      Teacher Observations ({reports.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("goals")}
                      style={{
                        padding: "0.45rem 0.9rem",
                        borderRadius: "0.5rem",
                        border: "none",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        backgroundColor: activeTab === "goals" ? "white" : "transparent",
                        color: activeTab === "goals" ? "#0f172a" : "#64748b",
                        boxShadow: activeTab === "goals" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                      }}
                    >
                      IEP Goals ({goals.length})
                    </button>
                  </div>
                </div>

                {detailsLoading ? (
                  <p style={{ textAlign: "center", color: "#94a3b8", padding: "4rem 0" }}>
                    Loading observations...
                  </p>
                ) : activeTab === "observations" ? (
                  <div>
                    {reports.length === 0 ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "3.5rem 1.5rem",
                          backgroundColor: "#f8fafc",
                          borderRadius: "1rem",
                          border: "1px dashed #cbd5e1",
                        }}
                      >
                        <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}>
                          📭
                        </span>
                        <h3 style={{ margin: "0 0 0.25rem", color: "#334155", fontWeight: 700 }}>
                          No observations recorded yet
                        </h3>
                        <p style={{ margin: 0, color: "#64748b", fontSize: "0.88rem" }}>
                          Entries submitted by teachers on the Teacher Input page will appear here with full timestamps.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {reports.map((report) => (
                          <div
                            key={report.id}
                            style={{
                              backgroundColor: "#ffffff",
                              borderRadius: "0.85rem",
                              border: "1px solid #e2e8f0",
                              padding: "1.25rem",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: "0.5rem",
                                marginBottom: "0.75rem",
                                borderBottom: "1px solid #f1f5f9",
                                paddingBottom: "0.5rem",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                <span
                                  style={{
                                    backgroundColor: "#dbeafe",
                                    color: "#1e40af",
                                    padding: "0.25rem 0.65rem",
                                    borderRadius: "999px",
                                    fontSize: "0.78rem",
                                    fontWeight: 700,
                                  }}
                                >
                                  {resolveTeacherName(report.teacher_id)}
                                </span>
                                {report.class_period && (
                                  <span
                                    style={{
                                      backgroundColor: "#f1f5f9",
                                      color: "#475569",
                                      padding: "0.25rem 0.55rem",
                                      borderRadius: "0.4rem",
                                      fontSize: "0.75rem",
                                      fontWeight: 600,
                                    }}
                                  >
                                    Period {report.class_period}
                                  </span>
                                )}
                              </div>

                              <span
                                style={{
                                  fontSize: "0.78rem",
                                  color: "#64748b",
                                  fontWeight: 500,
                                }}
                              >
                                ⏱️ {formatTimestamp(report.created_at, report.review_date)}
                              </span>
                            </div>

                            <div
                              style={{
                                fontSize: "0.92rem",
                                color: "#1e293b",
                                lineHeight: "1.5",
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {report.progress_notes || report.notes || "No additional notes provided."}
                            </div>

                            {report.accommodations_used && (
                              <div
                                style={{
                                  marginTop: "0.85rem",
                                  paddingTop: "0.65rem",
                                  borderTop: "1px dashed #e2e8f0",
                                  display: "flex",
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                  gap: "0.35rem",
                                }}
                              >
                                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>
                                  Accommodations:
                                </span>
                                {report.accommodations_used.split(",").map((acc, idx) => (
                                  <span
                                    key={idx}
                                    style={{
                                      backgroundColor: "#f0fdf4",
                                      color: "#166534",
                                      border: "1px solid #bbf7d0",
                                      padding: "0.15rem 0.5rem",
                                      borderRadius: "999px",
                                      fontSize: "0.72rem",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {acc.trim()}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {goals.length === 0 ? (
                      <p style={{ textAlign: "center", color: "#94a3b8", padding: "3rem 0" }}>
                        No IEP goals entered for this student.
                      </p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {goals.map((goal, index) => (
                          <div
                            key={goal.id}
                            style={{
                              backgroundColor: "#f8fafc",
                              borderRadius: "0.75rem",
                              border: "1px solid #e2e8f0",
                              padding: "1rem 1.25rem",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "0.4rem",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.82rem",
                                  fontWeight: 700,
                                  color: "#2563eb",
                                }}
                              >
                                Goal #{goal.goal_number || index + 1}
                              </span>
                              {goal.subject && (
                                <span
                                  style={{
                                    backgroundColor: "#e0f2fe",
                                    color: "#0369a1",
                                    padding: "0.2rem 0.5rem",
                                    borderRadius: "999px",
                                    fontSize: "0.72rem",
                                    fontWeight: 600,
                                  }}
                                >
                                  {goal.subject}
                                </span>
                              )}
                            </div>
                            <p style={{ margin: 0, fontSize: "0.92rem", color: "#334155", lineHeight: "1.4" }}>
                              {goal.goal_description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "380px",
                  textAlign: "center",
                  color: "#94a3b8",
                }}
              >
                <span style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>👈</span>
                <h3 style={{ margin: "0 0 0.35rem", color: "#475569", fontWeight: 700 }}>
                  Select a student to view observation timeline
                </h3>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b", maxWidth: "340px" }}>
                  Pick any student from the caseload list on the left to inspect teacher inputs, timestamps, and IEP goals.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}