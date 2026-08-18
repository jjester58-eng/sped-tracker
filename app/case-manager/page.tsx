"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "@/lib/useSupabase";

type CaseManager = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  name: string;
  grade_level: string | null;
  case_manager?: string | null;
  case_manager_id?: string | null;
};

type Goal = {
  id: string;
  student_id: string;
  goal_number: number;
  goal_description: string;
  subject: string | null;
};

type TeacherReport = {
  id: string;
  student_id: string;
  goal_id: string;
  progress_notes: string;
  review_date: string;
  teacher_id?: string | null;
  class_period?: number | null;
  school_year?: string | null;
};

export default function CaseManagerPage() {
  const supabase = useSupabase();

  const [caseManagers, setCaseManagers] = useState<CaseManager[]>([]);
  const [selectedCaseManager, setSelectedCaseManager] = useState("");

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null
  );

  const [goals, setGoals] = useState<Goal[]>([]);
  const [reports, setReports] = useState<TeacherReport[]>([]);

  const [loading, setLoading] = useState(false);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  // =========================================================
  // LOAD CASE MANAGERS
  // =========================================================

  const loadCaseManagers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("case_managers")
        .select("id, name")
        .order("name");

      if (error) throw error;

      setCaseManagers(data ?? []);
    } catch (err: any) {
      console.error("Error loading case managers:", err);
      setError(err?.message || "Unable to load case managers.");
    }
  }, [supabase]);

  // =========================================================
  // LOAD STUDENTS
  // =========================================================

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("name");

      if (error) throw error;

      setStudents(data ?? []);
    } catch (err: any) {
      console.error("Error loading students:", err);
      setError(err?.message || "Unable to load students.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadCaseManagers();
    loadStudents();
  }, [loadCaseManagers, loadStudents]);

  // =========================================================
  // FILTER STUDENTS BY CASE MANAGER
  // =========================================================
  //
  // If no case manager is selected:
  //     SHOW ALL STUDENTS
  //
  // If a case manager is selected:
  //     SHOW ONLY THAT CASE MANAGER'S STUDENTS
  //
  // =========================================================

  const caseManagerStudents = students.filter((student) => {
    // No case manager selected = ALL students
    if (!selectedCaseManager) return true;

    /*
     * Supports either:
     *   student.case_manager_id
     *
     * or, if your current database still stores the
     * case manager as text:
     *   student.case_manager
     */

    return (
      student.case_manager_id === selectedCaseManager ||
      student.case_manager ===
        caseManagers.find((cm) => cm.id === selectedCaseManager)?.name
    );
  });

  const filteredStudents = caseManagerStudents.filter((student) =>
    student.name
      .toLowerCase()
      .includes(studentSearchQuery.toLowerCase())
  );

  // =========================================================
  // LOAD GOALS
  // =========================================================

  const loadGoals = useCallback(
    async (studentId: string | null) => {
      if (!studentId) {
        setGoals([]);
        return;
      }

      setGoalsLoading(true);

      try {
        const { data, error } = await supabase
          .from("goals")
          .select(
            "id, student_id, goal_number, goal_description, subject"
          )
          .eq("student_id", studentId)
          .order("goal_number");

        if (error) throw error;

        setGoals(data ?? []);
      } catch (err: any) {
        console.error("Error loading goals:", err);
        setGoals([]);
        setError(err?.message || "Unable to load student goals.");
      } finally {
        setGoalsLoading(false);
      }
    },
    [supabase]
  );

  // =========================================================
  // LOAD TEACHER INPUT
  // =========================================================

  const loadTeacherReports = useCallback(
    async (studentId: string | null) => {
      if (!studentId) {
        setReports([]);
        return;
      }

      setReportsLoading(true);

      try {
        const { data, error } = await supabase
          .from("weekly_progress")
          .select(
            "id, student_id, goal_id, progress_notes, review_date, teacher_id, class_period, school_year"
          )
          .eq("student_id", studentId)
          .order("review_date", { ascending: false });

        if (error) throw error;

        setReports(data ?? []);
      } catch (err: any) {
        console.error("Error loading teacher input:", err);
        setReports([]);
        setError(
          err?.message || "Unable to load teacher input."
        );
      } finally {
        setReportsLoading(false);
      }
    },
    [supabase]
  );

  // =========================================================
  // SELECT STUDENT
  // =========================================================

  const handleSelectStudent = async (studentId: string) => {
    setSelectedStudentId(studentId);

    setGoals([]);
    setReports([]);

    await Promise.all([
      loadGoals(studentId),
      loadTeacherReports(studentId),
    ]);
  };

  // =========================================================
  // HELPERS
  // =========================================================

  const selectedStudent = students.find(
    (student) => student.id === selectedStudentId
  );

  const getTeacherName = (teacherId: string | null | undefined) => {
    if (!teacherId) return "Teacher";

    // This can be connected to the teachers table later.
    return "Teacher";
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        padding: "2.5rem 1.5rem",
      }}
    >
      <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "1.5rem",
            padding: "2rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          {/* Header */}
          <div
            style={{
              marginBottom: "2rem",
            }}
          >
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: "#111827",
                margin: 0,
              }}
            >
              Case Manager
            </h1>

            <p
              style={{
                color: "#374151",
                fontSize: "0.95rem",
                marginTop: "4px",
              }}
            >
              View student IEP goals and teacher progress input.
            </p>
          </div>

          {error && (
            <div
              style={{
                color: "#b91c1c",
                background: "#fee2e2",
                padding: "1rem",
                borderRadius: "1rem",
                marginBottom: "1rem",
              }}
            >
              {error}
            </div>
          )}

          {/* Case Manager Selector */}
          <div
            style={{
              backgroundColor: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "1.25rem",
              padding: "1.25rem",
              marginBottom: "2rem",
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: "0.95rem",
                fontWeight: 600,
                color: "#111827",
                marginBottom: "0.5rem",
              }}
            >
              Case Manager (Optional)
            </label>

            <select
              value={selectedCaseManager}
              onChange={(e) => {
                setSelectedCaseManager(e.target.value);
                setSelectedStudentId(null);
                setStudentSearchQuery("");
                setGoals([]);
                setReports([]);
              }}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "0.75rem",
                border: "1px solid #d1d5db",
                backgroundColor: "#f9fafb",
                color: "#111827",
                fontSize: "0.95rem",
                boxSizing: "border-box",
              }}
            >
              <option value="">
                All Case Managers / All Students
              </option>

              {caseManagers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}
                </option>
              ))}
            </select>

            <p
              style={{
                margin: "0.5rem 0 0",
                color: "#6b7280",
                fontSize: "0.8rem",
              }}
            >
              Leave blank to view all students.
            </p>
          </div>

          {/* Student Area */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 3fr",
              gap: "2rem",
            }}
          >
            {/* Student List */}
            <div>
              <input
                type="text"
                placeholder="Search students..."
                value={studentSearchQuery}
                onChange={(e) =>
                  setStudentSearchQuery(e.target.value)
                }
                style={{
                  width: "100%",
                  padding: "0.9rem",
                  borderRadius: "1rem",
                  border: "1px solid #d1d5db",
                  marginBottom: "1rem",
                  boxSizing: "border-box",
                }}
              />

              <div
                style={{
                  marginBottom: "0.75rem",
                  color: "#6b7280",
                  fontSize: "0.85rem",
                }}
              >
                {loading
                  ? "Loading students..."
                  : `${filteredStudents.length} student${
                      filteredStudents.length === 1
                        ? ""
                        : "s"
                    }`}
              </div>

              <div
                style={{
                  maxHeight: "75vh",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {filteredStudents.length === 0 ? (
                  <p
                    style={{
                      textAlign: "center",
                      color: "#9ca3af",
                      padding: "3rem 0",
                    }}
                  >
                    No students found
                  </p>
                ) : (
                  filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() =>
                        handleSelectStudent(student.id)
                      }
                      style={{
                        textAlign: "left",
                        padding: "1.1rem",
                        borderRadius: "1rem",
                        border:
                          selectedStudentId === student.id
                            ? "2px solid #2563eb"
                            : "1px solid #e5e7eb",
                        backgroundColor:
                          selectedStudentId === student.id
                            ? "#eff6ff"
                            : "white",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "600",
                          color: "#111827",
                        }}
                      >
                        {student.name}
                      </div>

                      {student.grade_level && (
                        <div
                          style={{
                            fontSize: "0.9rem",
                            color: "#6b7280",
                          }}
                        >
                          Grade {student.grade_level}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Student / Goals / Teacher Input */}
            <div>
              {!selectedStudentId ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "5rem 2rem",
                    color: "#9ca3af",
                  }}
                >
                  <p
                    style={{
                      fontSize: "4rem",
                      marginBottom: "1rem",
                    }}
                  >
                    👨‍🎓
                  </p>

                  <h3>
                    Select a student
                  </h3>

                  <p>
                    Student goals and teacher input will appear here.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.5rem",
                  }}
                >
                  {/* Student Header */}
                  <div
                    style={{
                      backgroundColor: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: "1rem",
                      padding: "1.25rem",
                    }}
                  >
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "1.4rem",
                        fontWeight: 800,
                        color: "#111827",
                      }}
                    >
                      {selectedStudent?.name}
                    </h2>

                    {selectedStudent?.grade_level && (
                      <p
                        style={{
                          margin: "0.25rem 0 0",
                          color: "#6b7280",
                        }}
                      >
                        Grade {selectedStudent.grade_level}
                      </p>
                    )}
                  </div>

                  {/* Goals */}
                  <div
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "1rem",
                      padding: "1.25rem",
                      backgroundColor: "white",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "1rem",
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "1.1rem",
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        IEP Goals
                      </h3>

                      <span
                        style={{
                          color: "#6b7280",
                          fontSize: "0.9rem",
                        }}
                      >
                        {goals.length} goal
                        {goals.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    {goalsLoading ? (
                      <p
                        style={{
                          color: "#6b7280",
                        }}
                      >
                        Loading goals...
                      </p>
                    ) : goals.length === 0 ? (
                      <p
                        style={{
                          color: "#6b7280",
                          margin: 0,
                        }}
                      >
                        No goals have been entered for this
                        student.
                      </p>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.9rem",
                        }}
                      >
                        {goals.map((goal) => (
                          <div
                            key={goal.id}
                            style={{
                              backgroundColor: "#f9fafb",
                              border:
                                "1px solid #e5e7eb",
                              borderRadius: "0.9rem",
                              padding: "1rem",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent:
                                  "space-between",
                                alignItems: "flex-start",
                                gap: "1rem",
                                marginBottom: "0.5rem",
                              }}
                            >
                              <strong
                                style={{
                                  color: "#111827",
                                }}
                              >
                                Goal {goal.goal_number}
                              </strong>

                              {goal.subject && (
                                <span
                                  style={{
                                    backgroundColor:
                                      "#eff6ff",
                                    color: "#2563eb",
                                    padding:
                                      "0.3rem 0.65rem",
                                    borderRadius:
                                      "999px",
                                    fontSize:
                                      "0.8rem",
                                    fontWeight: 600,
                                  }}
                                >
                                  {goal.subject}
                                </span>
                              )}
                            </div>

                            <div
                              style={{
                                color: "#374151",
                                lineHeight: 1.5,
                              }}
                            >
                              {goal.goal_description}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Teacher Input */}
                  <div
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "1rem",
                      padding: "1.25rem",
                      backgroundColor: "#f9fafb",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "1rem",
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "1.1rem",
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        Teacher Input
                      </h3>

                      <span
                        style={{
                          color: "#6b7280",
                          fontSize: "0.9rem",
                        }}
                      >
                        {reports.length} entr
                        {reports.length === 1
                          ? "y"
                          : "ies"}
                      </span>
                    </div>

                    {reportsLoading ? (
                      <p
                        style={{
                          color: "#6b7280",
                        }}
                      >
                        Loading teacher input...
                      </p>
                    ) : reports.length === 0 ? (
                      <p
                        style={{
                          margin: 0,
                          color: "#6b7280",
                        }}
                      >
                        No teacher input has been saved
                        for this student yet.
                      </p>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "1rem",
                        }}
                      >
                        {reports.map((report) => {
                          const goal = goals.find(
                            (g) =>
                              g.id === report.goal_id
                          );

                          return (
                            <div
                              key={report.id}
                              style={{
                                backgroundColor:
                                  "white",
                                border:
                                  "1px solid #e5e7eb",
                                borderRadius:
                                  "0.9rem",
                                padding: "1rem",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent:
                                    "space-between",
                                  gap: "1rem",
                                  marginBottom:
                                    "0.75rem",
                                  flexWrap: "wrap",
                                }}
                              >
                                <strong
                                  style={{
                                    color: "#111827",
                                  }}
                                >
                                  {goal
                                    ? `Goal ${goal.goal_number}`
                                    : "Teacher Input"}
                                </strong>

                                <span
                                  style={{
                                    color: "#6b7280",
                                    fontSize:
                                      "0.85rem",
                                  }}
                                >
                                  {report.review_date}
                                </span>
                              </div>

                              {goal && (
                                <div
                                  style={{
                                    fontSize:
                                      "0.9rem",
                                    color: "#6b7280",
                                    marginBottom:
                                      "0.75rem",
                                  }}
                                >
                                  {goal.goal_description}
                                </div>
                              )}

                              <div
                                style={{
                                  color: "#374151",
                                  lineHeight: 1.5,
                                  whiteSpace:
                                    "pre-wrap",
                                }}
                              >
                                {report.progress_notes}
                              </div>

                              {(report.class_period ||
                                report.school_year) && (
                                <div
                                  style={{
                                    marginTop:
                                      "0.75rem",
                                    paddingTop:
                                      "0.75rem",
                                    borderTop:
                                      "1px solid #f3f4f6",
                                    fontSize:
                                      "0.8rem",
                                    color: "#6b7280",
                                  }}
                                >
                                  {report.school_year && (
                                    <span>
                                      School Year:{" "}
                                      {
                                        report.school_year
                                      }
                                    </span>
                                  )}

                                  {report.class_period && (
                                    <span
                                      style={{
                                        marginLeft:
                                          "1rem",
                                      }}
                                    >
                                      Period:{" "}
                                      {
                                        report.class_period
                                      }
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}