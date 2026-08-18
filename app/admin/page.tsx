"use client";

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
  case_manager: string | null;
};

type StudentStatus = "active" | "inactive" | "archived";

export default function AdminPage() {
  const supabase = useSupabase();

  /* =========================================================
     STATE
     ========================================================= */

  const [activeSection, setActiveSection] = useState<
    "students" | "caseManagers" | "files"
  >("students");

  const [students, setStudents] = useState<Student[]>([]);
  const [caseManagers, setCaseManagers] = useState<CaseManager[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [studentSearch, setStudentSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  /* Student editing */

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  /* Case manager editing */

  const [editingCaseManager, setEditingCaseManager] =
    useState<CaseManager | null>(null);

  const [newCaseManagerName, setNewCaseManagerName] = useState("");

  /* File upload */

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  /* =========================================================
     LOAD DATA
     ========================================================= */

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [studentsResult, caseManagersResult] = await Promise.all([
        supabase
          .from("students")
          .select("id, name, grade_level, case_manager")
          .order("name"),

        supabase
          .from("case_managers")
          .select("id, name")
          .order("name"),
      ]);

      if (studentsResult.error) {
        throw studentsResult.error;
      }

      if (caseManagersResult.error) {
        throw caseManagersResult.error;
      }

      setStudents((studentsResult.data ?? []) as Student[]);
      setCaseManagers((caseManagersResult.data ?? []) as CaseManager[]);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to load administration data.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* =========================================================
     HELPERS
     ========================================================= */

  const showSuccess = (message: string) => {
    setSuccess(message);
    setError(null);

    setTimeout(() => {
      setSuccess(null);
    }, 3000);
  };

  const showError = (message: string) => {
    setError(message);
    setSuccess(null);
  };

  /*
   * TEMPORARY STATUS HANDLING
   *
   * Your current students table only shows:
   * id, name, grade_level, case_manager
   *
   * When you add database status fields, these functions
   * are the places we will connect them.
   */

  const getStudentStatus = (student: Student): StudentStatus => {
    /*
     * Until the database has status fields, all existing
     * students are treated as active.
     */
    return "active";
  };

  /* =========================================================
     STUDENT FILTERING
     ========================================================= */

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name
      .toLowerCase()
      .includes(studentSearch.toLowerCase());

    const status = getStudentStatus(student);

    if (showArchived) {
      return matchesSearch && status === "archived";
    }

    return matchesSearch && status !== "archived";
  });

  /* =========================================================
     STUDENT ACTIONS
     ========================================================= */

  const saveStudent = async () => {
    if (!editingStudent) return;

    if (!editingStudent.name.trim()) {
      showError("Student name is required.");
      return;
    }

    try {
      const { error } = await supabase
        .from("students")
        .update({
          name: editingStudent.name.trim(),
          grade_level: editingStudent.grade_level,
          case_manager: editingStudent.case_manager,
        })
        .eq("id", editingStudent.id);

      if (error) throw error;

      setStudents((prev) =>
        prev.map((student) =>
          student.id === editingStudent.id ? editingStudent : student
        )
      );

      setEditingStudent(null);
      showSuccess("Student updated successfully.");
    } catch (err: any) {
      console.error(err);
      showError(err?.message || "Unable to update student.");
    }
  };

  const advanceStudent = async (student: Student) => {
    const currentGrade = parseInt(student.grade_level || "", 10);

    if (Number.isNaN(currentGrade)) {
      showError(`Unable to determine the current grade for ${student.name}.`);
      return;
    }

    if (currentGrade >= 12) {
      showSuccess(`${student.name} is already in Grade 12.`);
      return;
    }

    const newGrade = String(currentGrade + 1);

    try {
      const { error } = await supabase
        .from("students")
        .update({
          grade_level: newGrade,
        })
        .eq("id", student.id);

      if (error) throw error;

      setStudents((prev) =>
        prev.map((s) =>
          s.id === student.id
            ? { ...s, grade_level: newGrade }
            : s
        )
      );

      showSuccess(`${student.name} advanced to Grade ${newGrade}.`);
    } catch (err: any) {
      console.error(err);
      showError(err?.message || "Unable to advance student.");
    }
  };

  const deactivateStudent = async (student: Student) => {
    /*
     * This will be connected to the student status field
     * when that field is added to Supabase.
     */
    showSuccess(
      `Deactivate requested for ${student.name}. Database status field will be connected next.`
    );
  };

  const activateStudent = async (student: Student) => {
    /*
     * This will be connected to the student status field
     * when that field is added to Supabase.
     */
    showSuccess(
      `Activate requested for ${student.name}. Database status field will be connected next.`
    );
  };

  const archiveStudent = async (student: Student) => {
    /*
     * Graduated/archive status will be connected once the
     * database has an archived/status field.
     */
    showSuccess(
      `Archive requested for ${student.name}. Database archive field will be connected next.`
    );
  };

  const restoreStudent = async (student: Student) => {
    showSuccess(
      `Restore requested for ${student.name}. Database archive field will be connected next.`
    );
  };

  /* =========================================================
     CASE MANAGER ACTIONS
     ========================================================= */

  const addCaseManager = async () => {
    const name = newCaseManagerName.trim();

    if (!name) {
      showError("Enter a case manager name.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("case_managers")
        .insert({
          name,
        })
        .select("id, name")
        .single();

      if (error) throw error;

      setCaseManagers((prev) =>
        [...prev, data as CaseManager].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );

      setNewCaseManagerName("");
      showSuccess("Case manager added.");
    } catch (err: any) {
      console.error(err);
      showError(err?.message || "Unable to add case manager.");
    }
  };

  const saveCaseManager = async () => {
    if (!editingCaseManager) return;

    if (!editingCaseManager.name.trim()) {
      showError("Case manager name is required.");
      return;
    }

    try {
      const { error } = await supabase
        .from("case_managers")
        .update({
          name: editingCaseManager.name.trim(),
        })
        .eq("id", editingCaseManager.id);

      if (error) throw error;

      setCaseManagers((prev) =>
        prev
          .map((cm) =>
            cm.id === editingCaseManager.id
              ? {
                  ...cm,
                  name: editingCaseManager.name.trim(),
                }
              : cm
          )
          .sort((a, b) => a.name.localeCompare(b.name))
      );

      setEditingCaseManager(null);
      showSuccess("Case manager updated.");
    } catch (err: any) {
      console.error(err);
      showError(err?.message || "Unable to update case manager.");
    }
  };

  const deleteCaseManager = async (caseManager: CaseManager) => {
    const confirmed = window.confirm(
      `Remove ${caseManager.name} as a case manager?\n\nStudents assigned to this case manager may need to be reassigned first.`
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("case_managers")
        .delete()
        .eq("id", caseManager.id);

      if (error) throw error;

      setCaseManagers((prev) =>
        prev.filter((cm) => cm.id !== caseManager.id)
      );

      showSuccess(`${caseManager.name} removed.`);
    } catch (err: any) {
      console.error(err);
      showError(err?.message || "Unable to remove case manager.");
    }
  };

  /* =========================================================
     FILE UPLOAD
     ========================================================= */

  const handleFileUpload = async () => {
    if (!selectedFile) {
      showError("Please select a file first.");
      return;
    }

    setUploading(true);

    try {
      /*
       * This is intentionally left as the upload point.
       *
       * Once you decide whether the admin upload should import:
       * - Students
       * - Case managers
       * - Goals
       * - Teacher assignments
       *
       * we can connect this directly to the appropriate
       * Supabase tables.
       */

      console.log("Selected file:", selectedFile);

      await new Promise((resolve) => setTimeout(resolve, 500));

      showSuccess(
        `${selectedFile.name} selected successfully. Import processing will be connected next.`
      );

      setSelectedFile(null);
    } catch (err: any) {
      console.error(err);
      showError(err?.message || "Unable to upload file.");
    } finally {
      setUploading(false);
    }
  };

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        padding: "2.5rem 1.5rem",
      }}
    >
      <div style={{ maxWidth: "64rem", margin: "0 auto" }}>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "1.5rem",
            padding: "2rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          {/* HEADER */}

          <div
            style={{
              marginBottom: "2rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-block",
                  fontSize: "12px",
                  padding: "6px 12px",
                  borderRadius: "999px",
                  background: "#ede9fe",
                  color: "#6d28d9",
                  marginBottom: "10px",
                  fontWeight: 600,
                }}
              >
                Administration
              </div>

              <h1
                style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  color: "#111827",
                  margin: 0,
                }}
              >
                Admin Dashboard
              </h1>

              <p
                style={{
                  color: "#374151",
                  fontSize: "0.95rem",
                  marginTop: "6px",
                }}
              >
                Manage students, case managers, and school data.
              </p>
            </div>
          </div>

          {/* FEEDBACK */}

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

          {success && (
            <div
              style={{
                color: "#166534",
                background: "#dcfce7",
                padding: "1rem",
                borderRadius: "1rem",
                marginBottom: "1rem",
              }}
            >
              {success}
            </div>
          )}

          {/* NAVIGATION */}

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              marginBottom: "2rem",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => setActiveSection("students")}
              style={tabStyle(activeSection === "students", "#2563eb")}
            >
              👨‍🎓 Students
            </button>

            <button
              onClick={() => setActiveSection("caseManagers")}
              style={tabStyle(activeSection === "caseManagers", "#16a34a")}
            >
              👥 Case Managers
            </button>

            <button
              onClick={() => setActiveSection("files")}
              style={tabStyle(activeSection === "files", "#7c3aed")}
            >
              📁 File Upload
            </button>
          </div>

          {/* =====================================================
              STUDENTS
              ===================================================== */}

          {activeSection === "students" && (
            <section>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                  marginBottom: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "1.2rem",
                      fontWeight: 700,
                    }}
                  >
                    Students
                  </h2>

                  <p
                    style={{
                      margin: "0.25rem 0 0",
                      color: "#6b7280",
                      fontSize: "0.9rem",
                    }}
                  >
                    Edit students, advance grades, and manage enrollment.
                  </p>
                </div>

                <button
                  onClick={() => setShowArchived(!showArchived)}
                  style={{
                    padding: "0.7rem 1rem",
                    borderRadius: "0.8rem",
                    border: "1px solid #d1d5db",
                    backgroundColor: showArchived
                      ? "#fef3c7"
                      : "white",
                    color: "#374151",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {showArchived
                    ? "← Active Students"
                    : "View Archived Students"}
                </button>
              </div>

              <input
                type="text"
                placeholder="Search students..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.9rem",
                  borderRadius: "1rem",
                  border: "1px solid #d1d5db",
                  marginBottom: "1rem",
                  boxSizing: "border-box",
                }}
              />

              {loading ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "3rem",
                    color: "#6b7280",
                  }}
                >
                  Loading students...
                </div>
              ) : filteredStudents.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "3rem",
                    color: "#9ca3af",
                    border: "1px dashed #d1d5db",
                    borderRadius: "1rem",
                  }}
                >
                  {showArchived
                    ? "No archived students found."
                    : "No students found."}
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "1rem",
                        padding: "1rem",
                        backgroundColor: "white",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "1rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              color: "#111827",
                            }}
                          >
                            {student.name}
                          </div>

                          <div
                            style={{
                              color: "#6b7280",
                              fontSize: "0.9rem",
                              marginTop: "0.2rem",
                            }}
                          >
                            Grade {student.grade_level || "—"}
                            {" • "}
                            {student.case_manager || "No case manager"}
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            onClick={() =>
                              setEditingStudent({ ...student })
                            }
                            style={smallButtonStyle("#2563eb")}
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => advanceStudent(student)}
                            style={smallButtonStyle("#16a34a")}
                          >
                            Advance
                          </button>

                          {!showArchived && (
                            <>
                              <button
                                onClick={() =>
                                  deactivateStudent(student)
                                }
                                style={smallButtonStyle("#d97706")}
                              >
                                Deactivate
                              </button>

                              <button
                                onClick={() =>
                                  archiveStudent(student)
                                }
                                style={smallButtonStyle("#6b7280")}
                              >
                                Graduate / Archive
                              </button>
                            </>
                          )}

                          {showArchived && (
                            <button
                              onClick={() => restoreStudent(student)}
                              style={smallButtonStyle("#16a34a")}
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* =====================================================
              CASE MANAGERS
              ===================================================== */}

          {activeSection === "caseManagers" && (
            <section>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.2rem",
                  fontWeight: 700,
                }}
              >
                Case Managers
              </h2>

              <p
                style={{
                  margin: "0.25rem 0 1.5rem",
                  color: "#6b7280",
                  fontSize: "0.9rem",
                }}
              >
                Add, edit, or remove case managers.
              </p>

              {/* ADD CASE MANAGER */}

              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  marginBottom: "1.5rem",
                }}
              >
                <input
                  type="text"
                  value={newCaseManagerName}
                  onChange={(e) =>
                    setNewCaseManagerName(e.target.value)
                  }
                  placeholder="Case manager name"
                  style={{
                    flex: 1,
                    padding: "0.85rem",
                    borderRadius: "0.8rem",
                    border: "1px solid #d1d5db",
                  }}
                />

                <button
                  onClick={addCaseManager}
                  style={{
                    padding: "0.85rem 1.25rem",
                    borderRadius: "0.8rem",
                    border: "none",
                    backgroundColor: "#16a34a",
                    color: "white",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + Add
                </button>
              </div>

              {/* CASE MANAGER LIST */}

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {caseManagers.map((cm) => (
                  <div
                    key={cm.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "1rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "1rem",
                    }}
                  >
                    {editingCaseManager?.id === cm.id ? (
                      <>
                        <input
                          value={editingCaseManager.name}
                          onChange={(e) =>
                            setEditingCaseManager({
                              ...editingCaseManager,
                              name: e.target.value,
                            })
                          }
                          style={{
                            flex: 1,
                            padding: "0.7rem",
                            borderRadius: "0.7rem",
                            border: "1px solid #d1d5db",
                            marginRight: "1rem",
                          }}
                        />

                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                          }}
                        >
                          <button
                            onClick={saveCaseManager}
                            style={smallButtonStyle("#16a34a")}
                          >
                            Save
                          </button>

                          <button
                            onClick={() =>
                              setEditingCaseManager(null)
                            }
                            style={smallButtonStyle("#6b7280")}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#111827",
                          }}
                        >
                          {cm.name}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                          }}
                        >
                          <button
                            onClick={() =>
                              setEditingCaseManager({ ...cm })
                            }
                            style={smallButtonStyle("#2563eb")}
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => deleteCaseManager(cm)}
                            style={smallButtonStyle("#dc2626")}
                          >
                            Remove
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* =====================================================
              FILE UPLOAD
              ===================================================== */}

          {activeSection === "files" && (
            <section>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.2rem",
                  fontWeight: 700,
                }}
              >
                File Upload
              </h2>

              <p
                style={{
                  margin: "0.25rem 0 1.5rem",
                  color: "#6b7280",
                  fontSize: "0.9rem",
                }}
              >
                Upload student, case manager, or other administrative
                data files.
              </p>

              <div
                style={{
                  border: "2px dashed #d1d5db",
                  borderRadius: "1.25rem",
                  padding: "3rem 2rem",
                  textAlign: "center",
                  backgroundColor: "#f9fafb",
                }}
              >
                <div
                  style={{
                    fontSize: "3rem",
                    marginBottom: "1rem",
                  }}
                >
                  📁
                </div>

                <h3
                  style={{
                    margin: "0 0 0.5rem",
                    color: "#111827",
                  }}
                >
                  Upload Administrative File
                </h3>

                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "0.9rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  CSV files can be used for bulk student or staff
                  updates.
                </p>

                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) =>
                    setSelectedFile(e.target.files?.[0] || null)
                  }
                  style={{
                    marginBottom: "1rem",
                  }}
                />

                {selectedFile && (
                  <div
                    style={{
                      marginBottom: "1rem",
                      color: "#374151",
                      fontSize: "0.9rem",
                    }}
                  >
                    Selected: <strong>{selectedFile.name}</strong>
                  </div>
                )}

                <button
                  onClick={handleFileUpload}
                  disabled={!selectedFile || uploading}
                  style={{
                    backgroundColor: "#7c3aed",
                    color: "white",
                    padding: "0.85rem 1.5rem",
                    borderRadius: "0.8rem",
                    border: "none",
                    cursor:
                      !selectedFile || uploading
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      !selectedFile || uploading ? 0.6 : 1,
                    fontWeight: 600,
                  }}
                >
                  {uploading ? "Processing..." : "Upload File"}
                </button>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* =========================================================
          EDIT STUDENT MODAL
          ========================================================= */}

      {editingStudent && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                marginTop: 0,
              }}
            >
              Edit Student
            </h2>

            <div style={{ marginBottom: "1rem" }}>
              <label style={labelStyle}>Student Name</label>

              <input
                value={editingStudent.name}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent,
                    name: e.target.value,
                  })
                }
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={labelStyle}>Grade Level</label>

              <select
                value={editingStudent.grade_level || ""}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent,
                    grade_level: e.target.value,
                  })
                }
                style={inputStyle}
              >
                <option value="">Select grade</option>

                {Array.from({ length: 13 }, (_, i) => (
                  <option key={i} value={String(i)}>
                    Grade {i}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={labelStyle}>Case Manager</label>

              <select
                value={editingStudent.case_manager || ""}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent,
                    case_manager: e.target.value || null,
                  })
                }
                style={inputStyle}
              >
                <option value="">No case manager</option>

                {caseManagers.map((cm) => (
                  <option key={cm.id} value={cm.name}>
                    {cm.name}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                marginTop: "2rem",
              }}
            >
              <button
                onClick={() => setEditingStudent(null)}
                style={{
                  flex: 1,
                  padding: "0.9rem",
                  borderRadius: "0.8rem",
                  border: "1px solid #d1d5db",
                  backgroundColor: "white",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                onClick={saveStudent}
                style={{
                  flex: 1,
                  padding: "0.9rem",
                  borderRadius: "0.8rem",
                  border: "none",
                  backgroundColor: "#2563eb",
                  color: "white",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* =============================================================
   STYLES
   ============================================================= */

const tabStyle = (
  active: boolean,
  color: string
): React.CSSProperties => ({
  padding: "0.75rem 1.1rem",
  borderRadius: "0.8rem",
  border: active
    ? `1px solid ${color}`
    : "1px solid #d1d5db",
  backgroundColor: active ? `${color}10` : "white",
  color: active ? color : "#374151",
  fontWeight: 600,
  cursor: "pointer",
});

const smallButtonStyle = (
  color: string
): React.CSSProperties => ({
  padding: "0.55rem 0.85rem",
  borderRadius: "0.65rem",
  border: `1px solid ${color}`,
  backgroundColor: "white",
  color,
  fontSize: "0.85rem",
  fontWeight: 600,
  cursor: "pointer",
});

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 600,
  marginBottom: "0.4rem",
  color: "#111827",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.85rem",
  borderRadius: "0.8rem",
  border: "1px solid #d1d5db",
  boxSizing: "border-box",
  backgroundColor: "white",
};

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.6)",
  zIndex: 100,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1rem",
};

const modalStyle: React.CSSProperties = {
  backgroundColor: "white",
  borderRadius: "1.5rem",
  width: "100%",
  maxWidth: "520px",
  padding: "2rem",
  boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
};