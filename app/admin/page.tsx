"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/useSupabase";
import CsvUploader from "@/app/components/CsvUploader";
import CsvDownloader from "@/app/components/CsvDownloader";
import CsvTemplateDownloader from "@/app/components/CsvTemplateDownloader";

type CaseManager = {
  id: string;
  name: string;
  email?: string | null;
};

type Teacher = {
  id: string;
  name: string;
  email?: string | null;
};

type Student = {
  id: string;
  name: string;
  grade_level: string | null;
  case_manager: string | null;
  status?: string | null;
  is_active?: boolean;
};

export default function AdminPage() {
  const supabase = useSupabase();
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/admin/login");
          return;
        }

        setAuthorized(true);
        setAuthChecked(true);
      } catch {
        router.push("/admin/login");
      }
    };

    checkAuth();
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const [activeSection, setActiveSection] = useState<
    "students" | "caseManagers" | "teachers" | "csvTools"
  >("students");

  const [students, setStudents] = useState<Student[]>([]);
  const [caseManagers, setCaseManagers] = useState<CaseManager[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [studentSearch, setStudentSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState("");
  const [newStudentCaseManager, setNewStudentCaseManager] = useState("");

  const [editingCaseManager, setEditingCaseManager] = useState<CaseManager | null>(null);
  const [newCaseManagerName, setNewCaseManagerName] = useState("");
  const [newCaseManagerEmail, setNewCaseManagerEmail] = useState("");

  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherEmail, setNewTeacherEmail] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [studentsResult, caseManagersResult, teachersResult] = await Promise.all([
        supabase
          .from("students")
          .select("id, name, grade_level, case_manager, status, is_active")
          .order("name"),

        supabase
          .from("case_managers")
          .select("id, name, email")
          .order("name"),

        supabase
          .from("teachers")
          .select("id, name, email")
          .order("name"),
      ]);

      if (studentsResult.error) throw studentsResult.error;
      if (caseManagersResult.error) throw caseManagersResult.error;

      setStudents((studentsResult.data ?? []) as Student[]);
      setCaseManagers((caseManagersResult.data ?? []) as CaseManager[]);
      if (teachersResult.data) {
        setTeachers(
          (teachersResult.data as any[]).map((t) => ({
            id: t.id || t.name || "",
            name: t.name || "Unnamed Teacher",
            email: t.email || "",
          }))
        );
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to load administration data.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (authorized) {
      loadData();
    }
  }, [authorized, loadData]);

  const showSuccess = (message: string) => {
    setSuccess(message);
    setError(null);
    setTimeout(() => setSuccess(null), 4000);
  };

  const showError = (message: string) => {
    setError(message);
    setSuccess(null);
  };

  const filteredStudents = useMemo(() => {
    const term = studentSearch.toLowerCase().trim();
    return students.filter((student) => {
      const matchesSearch =
        !term ||
        student.name.toLowerCase().includes(term) ||
        (student.case_manager && student.case_manager.toLowerCase().includes(term)) ||
        (student.grade_level && student.grade_level.toLowerCase().includes(term));

      const isArchived = student.is_active === false || student.status === "archived";

      if (showArchived) return matchesSearch && isArchived;
      return matchesSearch && !isArchived;
    });
  }, [students, studentSearch, showArchived]);

  const addStudent = async () => {
    if (!newStudentName.trim()) {
      showError("Please enter a student name.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("students")
        .insert({
          name: newStudentName.trim(),
          grade_level: newStudentGrade.trim() || null,
          case_manager: newStudentCaseManager.trim() || null,
          is_active: true,
          status: "active",
        } as any)
        .select("id, name, grade_level, case_manager, status, is_active")
        .single();

      if (error) throw error;

      setStudents((prev) => [...prev, data as Student].sort((a, b) => a.name.localeCompare(b.name)));
      setNewStudentName("");
      setNewStudentGrade("");
      setNewStudentCaseManager("");
      showSuccess(`Added student ${data.name}.`);
    } catch (err: any) {
      showError(err?.message || "Failed to add student.");
    }
  };

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
          grade_level: editingStudent.grade_level || null,
          case_manager: editingStudent.case_manager || null,
        } as any)
        .eq("id", editingStudent.id);

      if (error) throw error;

      setStudents((prev) =>
        prev.map((s) => (s.id === editingStudent.id ? editingStudent : s))
      );
      setEditingStudent(null);
      showSuccess("Student updated successfully.");
    } catch (err: any) {
      showError(err?.message || "Unable to update student.");
    }
  };

  const toggleStudentArchive = async (student: Student) => {
    const willBeArchived = student.is_active !== false && student.status !== "archived";
    const actionLabel = willBeArchived ? "archive" : "restore";

    try {
      const { error } = await supabase
        .from("students")
        .update({
          is_active: !willBeArchived,
          status: willBeArchived ? "archived" : "active",
          archived_at: willBeArchived ? new Date().toISOString() : null,
        } as any)
        .eq("id", student.id);

      if (error) throw error;

      setStudents((prev) =>
        prev.map((s) =>
          s.id === student.id
            ? {
                ...s,
                is_active: !willBeArchived,
                status: willBeArchived ? "archived" : "active",
              }
            : s
        )
      );

      showSuccess(`Student ${student.name} ${actionLabel}d successfully.`);
    } catch (err: any) {
      showError(err?.message || `Failed to ${actionLabel} student.`);
    }
  };

  const advanceStudentGrade = async (student: Student) => {
    const currentGrade = parseInt(student.grade_level || "", 10);
    if (Number.isNaN(currentGrade)) {
      showError(`Could not parse current grade for ${student.name}.`);
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
        .update({ grade_level: newGrade } as any)
        .eq("id", student.id);

      if (error) throw error;

      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, grade_level: newGrade } : s))
      );
      showSuccess(`Advanced ${student.name} to Grade ${newGrade}.`);
    } catch (err: any) {
      showError(err?.message || "Failed to advance grade.");
    }
  };

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
          email: newCaseManagerEmail.trim() || `${name.toLowerCase().replace(/\s+/g, ".")}@school.org`,
        } as any)
        .select("id, name, email")
        .single();

      if (error) throw error;

      setCaseManagers((prev) =>
        [...prev, data as CaseManager].sort((a, b) => a.name.localeCompare(b.name))
      );
      setNewCaseManagerName("");
      setNewCaseManagerEmail("");
      showSuccess(`Added Case Manager ${data.name}.`);
    } catch (err: any) {
      showError(err?.message || "Unable to add case manager.");
    }
  };

  const saveCaseManager = async () => {
    if (!editingCaseManager || !editingCaseManager.name.trim()) return;

    try {
      const { error } = await supabase
        .from("case_managers")
        .update({
          name: editingCaseManager.name.trim(),
          email: editingCaseManager.email?.trim() || null,
        } as any)
        .eq("id", editingCaseManager.id);

      if (error) throw error;

      setCaseManagers((prev) =>
        prev.map((cm) => (cm.id === editingCaseManager.id ? editingCaseManager : cm))
      );
      setEditingCaseManager(null);
      showSuccess("Case manager updated.");
    } catch (err: any) {
      showError(err?.message || "Unable to update case manager.");
    }
  };

  const deleteCaseManager = async (cm: CaseManager) => {
    if (!window.confirm(`Delete case manager "${cm.name}"?`)) return;

    try {
      const { error } = await supabase.from("case_managers").delete().eq("id", cm.id);
      if (error) throw error;

      setCaseManagers((prev) => prev.filter((c) => c.id !== cm.id));
      showSuccess(`Removed ${cm.name}.`);
    } catch (err: any) {
      showError(err?.message || "Unable to delete case manager.");
    }
  };

  const addTeacher = async () => {
    const name = newTeacherName.trim();
    if (!name) {
      showError("Enter a teacher name.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("teachers")
        .insert({
          name,
          email: newTeacherEmail.trim() || `${name.toLowerCase().replace(/\s+/g, ".")}@school.org`,
        } as any)
        .select("id, name, email")
        .single();

      if (error) throw error;

      setTeachers((prev) =>
        [...prev, data as Teacher].sort((a, b) => a.name.localeCompare(b.name))
      );
      setNewTeacherName("");
      setNewTeacherEmail("");
      showSuccess(`Added Teacher ${data.name}.`);
    } catch (err: any) {
      showError(err?.message || "Unable to add teacher.");
    }
  };

  const saveTeacher = async () => {
    if (!editingTeacher || !editingTeacher.name.trim()) return;

    try {
      const { error } = await supabase
        .from("teachers")
        .update({
          name: editingTeacher.name.trim(),
          email: editingTeacher.email?.trim() || null,
        } as any)
        .eq("id", editingTeacher.id);

      if (error) throw error;

      setTeachers((prev) =>
        prev.map((t) => (t.id === editingTeacher.id ? editingTeacher : t))
      );
      setEditingTeacher(null);
      showSuccess("Teacher updated.");
    } catch (err: any) {
      showError(err?.message || "Unable to update teacher.");
    }
  };

  const deleteTeacher = async (teacher: Teacher) => {
    if (!window.confirm(`Delete teacher "${teacher.name}"?`)) return;

    try {
      const { error } = await supabase.from("teachers").delete().eq("id", teacher.id);
      if (error) throw error;

      setTeachers((prev) => prev.filter((t) => t.id !== teacher.id));
      showSuccess(`Removed ${teacher.name}.`);
    } catch (err: any) {
      showError(err?.message || "Unable to delete teacher.");
    }
  };

  if (!authChecked) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#64748b" }}>Checking authentication...</p>
      </main>
    );
  }

  if (!authorized) return null;

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
                gap: "0.35rem",
                backgroundColor: "#ede9fe",
                color: "#6d28d9",
                padding: "0.35rem 0.75rem",
                borderRadius: "999px",
                fontSize: "0.8rem",
                fontWeight: 700,
                marginBottom: "0.4rem",
              }}
            >
              <span>🔒</span>
              <span>Administrator Portal</span>
            </div>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              SPED System Administration
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.95rem", margin: "0.25rem 0 0" }}>
              Manage students, staff roles, and batch CSV imports.
            </p>
          </div>

          <button
            onClick={handleSignOut}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "0.65rem",
              border: "1px solid #cbd5e1",
              backgroundColor: "#f8fafc",
              color: "#334155",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
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

        {success && (
          <div
            style={{
              padding: "1rem 1.25rem",
              borderRadius: "0.75rem",
              backgroundColor: "#f0fdf4",
              color: "#166534",
              border: "1px solid #bbf7d0",
              marginBottom: "1.5rem",
            }}
          >
            {success}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          {[
            { id: "students", label: "👨‍🎓 Students Roster", count: students.length },
            { id: "caseManagers", label: "📋 Case Managers", count: caseManagers.length },
            { id: "teachers", label: "👨‍🏫 Teachers & Staff", count: teachers.length },
            { id: "csvTools", label: "📥 CSV Import & Templates" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              style={{
                padding: "0.7rem 1.25rem",
                borderRadius: "0.75rem",
                border: "none",
                fontSize: "0.9rem",
                fontWeight: 700,
                cursor: "pointer",
                backgroundColor: activeSection === tab.id ? "#2563eb" : "white",
                color: activeSection === tab.id ? "white" : "#475569",
                borderBottom: activeSection === tab.id ? "none" : "1px solid #e2e8f0",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  style={{
                    backgroundColor: activeSection === tab.id ? "#1d4ed8" : "#f1f5f9",
                    color: activeSection === tab.id ? "white" : "#64748b",
                    padding: "0.15rem 0.5rem",
                    borderRadius: "999px",
                    fontSize: "0.75rem",
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeSection === "students" && (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1.25rem",
              padding: "1.75rem",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                backgroundColor: "#f8fafc",
                padding: "1.25rem",
                borderRadius: "0.85rem",
                border: "1px solid #e2e8f0",
                marginBottom: "1.5rem",
              }}
            >
              <h3 style={{ margin: "0 0 0.85rem", fontSize: "1rem", color: "#0f172a" }}>
                + Add Single Student
              </h3>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="Student full name *"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  style={{
                    flex: "2",
                    minWidth: "180px",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #cbd5e1",
                  }}
                />
                <input
                  type="text"
                  placeholder="Grade (e.g. 9)"
                  value={newStudentGrade}
                  onChange={(e) => setNewStudentGrade(e.target.value)}
                  style={{
                    flex: "1",
                    minWidth: "100px",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #cbd5e1",
                  }}
                />
                <select
                  value={newStudentCaseManager}
                  onChange={(e) => setNewStudentCaseManager(e.target.value)}
                  style={{
                    flex: "1.5",
                    minWidth: "160px",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "white",
                  }}
                >
                  <option value="">Assign Case Manager...</option>
                  {caseManagers.map((cm) => (
                    <option key={cm.id} value={cm.name}>
                      {cm.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={addStudent}
                  style={{
                    padding: "0.65rem 1.25rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "#2563eb",
                    color: "white",
                    border: "none",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Add Student
                </button>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
                flexWrap: "wrap",
                marginBottom: "1rem",
              }}
            >
              <input
                type="text"
                placeholder="Search students or case managers..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                style={{
                  padding: "0.65rem 0.85rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #cbd5e1",
                  width: "300px",
                }}
              />

              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <label style={{ fontSize: "0.88rem", color: "#475569", display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                  />
                  Show Archived Students ({students.filter((s) => s.is_active === false).length})
                </label>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0", backgroundColor: "#f8fafc", color: "#475569" }}>
                    <th style={{ padding: "0.75rem 1rem" }}>Student Name</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Grade</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Case Manager</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "2.5rem", color: "#94a3b8" }}>
                        No students found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => (
                      <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>
                          {editingStudent?.id === s.id ? (
                            <input
                              type="text"
                              value={editingStudent.name}
                              onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                              style={{ padding: "0.35rem 0.5rem", borderRadius: "0.35rem", border: "1px solid #cbd5e1" }}
                            />
                          ) : (
                            s.name
                          )}
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          {editingStudent?.id === s.id ? (
                            <input
                              type="text"
                              value={editingStudent.grade_level || ""}
                              onChange={(e) => setEditingStudent({ ...editingStudent, grade_level: e.target.value })}
                              style={{ width: "60px", padding: "0.35rem 0.5rem", borderRadius: "0.35rem", border: "1px solid #cbd5e1" }}
                            />
                          ) : (
                            `Grade ${s.grade_level || "N/A"}`
                          )}
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          {editingStudent?.id === s.id ? (
                            <select
                              value={editingStudent.case_manager || ""}
                              onChange={(e) => setEditingStudent({ ...editingStudent, case_manager: e.target.value })}
                              style={{ padding: "0.35rem 0.5rem", borderRadius: "0.35rem", border: "1px solid #cbd5e1" }}
                            >
                              <option value="">Unassigned</option>
                              {caseManagers.map((cm) => (
                                <option key={cm.id} value={cm.name}>{cm.name}</option>
                              ))}
                            </select>
                          ) : (
                            s.case_manager || "Unassigned"
                          )}
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <span
                            style={{
                              backgroundColor: s.is_active === false ? "#fee2e2" : "#dcfce7",
                              color: s.is_active === false ? "#991b1b" : "#166534",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "999px",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                            }}
                          >
                            {s.is_active === false ? "Archived" : "Active"}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                          {editingStudent?.id === s.id ? (
                            <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                              <button
                                onClick={saveStudent}
                                style={{ padding: "0.3rem 0.6rem", borderRadius: "0.35rem", backgroundColor: "#16a34a", color: "white", border: "none", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingStudent(null)}
                                style={{ padding: "0.3rem 0.6rem", borderRadius: "0.35rem", backgroundColor: "#94a3b8", color: "white", border: "none", fontSize: "0.78rem", cursor: "pointer" }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                              <button
                                onClick={() => advanceStudentGrade(s)}
                                title="Advance Grade (+1)"
                                style={{ padding: "0.3rem 0.55rem", borderRadius: "0.35rem", backgroundColor: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", fontSize: "0.75rem", cursor: "pointer" }}
                              >
                                +1 Grade
                              </button>
                              <button
                                onClick={() => setEditingStudent(s)}
                                style={{ padding: "0.3rem 0.55rem", borderRadius: "0.35rem", backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => toggleStudentArchive(s)}
                                style={{ padding: "0.3rem 0.55rem", borderRadius: "0.35rem", backgroundColor: s.is_active === false ? "#f0fdf4" : "#fef2f2", color: s.is_active === false ? "#166534" : "#b91c1c", border: "1px solid #cbd5e1", fontSize: "0.75rem", cursor: "pointer" }}
                              >
                                {s.is_active === false ? "Restore" : "Archive"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === "caseManagers" && (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1.25rem",
              padding: "1.75rem",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                backgroundColor: "#f8fafc",
                padding: "1.25rem",
                borderRadius: "0.85rem",
                border: "1px solid #e2e8f0",
                marginBottom: "1.5rem",
              }}
            >
              <h3 style={{ margin: "0 0 0.85rem", fontSize: "1rem", color: "#0f172a" }}>
                + Add New Case Manager
              </h3>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="Case Manager Name *"
                  value={newCaseManagerName}
                  onChange={(e) => setNewCaseManagerName(e.target.value)}
                  style={{
                    flex: "2",
                    minWidth: "200px",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #cbd5e1",
                  }}
                />
                <input
                  type="email"
                  placeholder="Email (e.g. coach.smith@school.org)"
                  value={newCaseManagerEmail}
                  onChange={(e) => setNewCaseManagerEmail(e.target.value)}
                  style={{
                    flex: "2",
                    minWidth: "200px",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #cbd5e1",
                  }}
                />
                <button
                  onClick={addCaseManager}
                  style={{
                    padding: "0.65rem 1.25rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "#2563eb",
                    color: "white",
                    border: "none",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Add Case Manager
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
              {caseManagers.map((cm) => (
                <div
                  key={cm.id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.75rem",
                    padding: "1.25rem",
                    backgroundColor: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  {editingCaseManager?.id === cm.id ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <input
                        type="text"
                        value={editingCaseManager.name}
                        onChange={(e) => setEditingCaseManager({ ...editingCaseManager, name: e.target.value })}
                        style={{ padding: "0.5rem", borderRadius: "0.4rem", border: "1px solid #cbd5e1" }}
                      />
                      <input
                        type="email"
                        value={editingCaseManager.email || ""}
                        onChange={(e) => setEditingCaseManager({ ...editingCaseManager, email: e.target.value })}
                        style={{ padding: "0.5rem", borderRadius: "0.4rem", border: "1px solid #cbd5e1" }}
                      />
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                        <button
                          onClick={saveCaseManager}
                          style={{ flex: 1, padding: "0.4rem", backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "0.4rem", fontWeight: 700, cursor: "pointer" }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingCaseManager(null)}
                          style={{ flex: 1, padding: "0.4rem", backgroundColor: "#94a3b8", color: "white", border: "none", borderRadius: "0.4rem", cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 style={{ margin: "0 0 0.25rem", color: "#0f172a", fontSize: "1.05rem" }}>{cm.name}</h4>
                      <p style={{ margin: "0 0 0.75rem", color: "#64748b", fontSize: "0.85rem" }}>{cm.email || "No email listed"}</p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "0.75rem" }}>
                        <span style={{ fontSize: "0.78rem", color: "#7e22ce", fontWeight: 600 }}>
                          {students.filter((s) => s.case_manager === cm.name).length} students assigned
                        </span>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <button
                            onClick={() => setEditingCaseManager(cm)}
                            style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteCaseManager(cm)}
                            style={{ background: "none", border: "none", color: "#ef4444", fontSize: "0.8rem", cursor: "pointer" }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "teachers" && (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1.25rem",
              padding: "1.75rem",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                backgroundColor: "#f8fafc",
                padding: "1.25rem",
                borderRadius: "0.85rem",
                border: "1px solid #e2e8f0",
                marginBottom: "1.5rem",
              }}
            >
              <h3 style={{ margin: "0 0 0.85rem", fontSize: "1rem", color: "#0f172a" }}>
                + Add New Teacher / Paraprofessional
              </h3>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="Teacher Name *"
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  style={{
                    flex: "2",
                    minWidth: "200px",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #cbd5e1",
                  }}
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={newTeacherEmail}
                  onChange={(e) => setNewTeacherEmail(e.target.value)}
                  style={{
                    flex: "2",
                    minWidth: "200px",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #cbd5e1",
                  }}
                />
                <button
                  onClick={addTeacher}
                  style={{
                    padding: "0.65rem 1.25rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "#2563eb",
                    color: "white",
                    border: "none",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Add Teacher
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
              {teachers.map((teacher) => (
                <div
                  key={teacher.id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.75rem",
                    padding: "1.25rem",
                    backgroundColor: "#ffffff",
                  }}
                >
                  {editingTeacher?.id === teacher.id ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <input
                        type="text"
                        value={editingTeacher.name}
                        onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                        style={{ padding: "0.5rem", borderRadius: "0.4rem", border: "1px solid #cbd5e1" }}
                      />
                      <input
                        type="email"
                        value={editingTeacher.email || ""}
                        onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value })}
                        style={{ padding: "0.5rem", borderRadius: "0.4rem", border: "1px solid #cbd5e1" }}
                      />
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                        <button
                          onClick={saveTeacher}
                          style={{ flex: 1, padding: "0.4rem", backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "0.4rem", fontWeight: 700, cursor: "pointer" }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingTeacher(null)}
                          style={{ flex: 1, padding: "0.4rem", backgroundColor: "#94a3b8", color: "white", border: "none", borderRadius: "0.4rem", cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 style={{ margin: "0 0 0.25rem", color: "#0f172a", fontSize: "1.05rem" }}>{teacher.name}</h4>
                      <p style={{ margin: "0 0 0.75rem", color: "#64748b", fontSize: "0.85rem" }}>{teacher.email || "No email listed"}</p>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", borderTop: "1px solid #f1f5f9", paddingTop: "0.75rem" }}>
                        <button
                          onClick={() => setEditingTeacher(teacher)}
                          style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteTeacher(teacher)}
                          style={{ background: "none", border: "none", color: "#ef4444", fontSize: "0.8rem", cursor: "pointer" }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "csvTools" && (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1.25rem",
              padding: "2rem",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ maxWidth: "600px" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.5rem" }}>
                Student Batch Import & Export
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.9rem", margin: "0 0 1.5rem" }}>
                Quickly import student caseloads, grades, case managers, schedules, and accommodations using CSV spreadsheets.
              </p>

              <div
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: "0.85rem",
                  padding: "1.25rem",
                  border: "1px solid #e2e8f0",
                  marginBottom: "1.5rem",
                }}
              >
                <h4 style={{ margin: "0 0 0.4rem", color: "#0f172a" }}>Step 1: Download Import Template</h4>
                <p style={{ margin: "0 0 0.85rem", fontSize: "0.85rem", color: "#64748b" }}>
                  Download the official CSV template pre-formatted with columns: <code>student_name</code>, <code>grade</code>, <code>case_manager</code>, <code>schedule</code>, <code>accommodations</code>.
                </p>
                <CsvTemplateDownloader />
              </div>

              <div
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: "0.85rem",
                  padding: "1.25rem",
                  border: "1px solid #e2e8f0",
                  marginBottom: "1.5rem",
                }}
              >
                <h4 style={{ margin: "0 0 0.4rem", color: "#0f172a" }}>Step 2: Upload Completed CSV</h4>
                <p style={{ margin: "0 0 0.85rem", fontSize: "0.85rem", color: "#64748b" }}>
                  Select your filled spreadsheet to import student records directly into your Supabase database.
                </p>
                <CsvUploader onUploadSuccess={loadData} />
              </div>

              <div
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: "0.85rem",
                  padding: "1.25rem",
                  border: "1px solid #e2e8f0",
                }}
              >
                <h4 style={{ margin: "0 0 0.4rem", color: "#0f172a" }}>Step 3: Export Current Roster</h4>
                <p style={{ margin: "0 0 0.85rem", fontSize: "0.85rem", color: "#64748b" }}>
                  Download the active student roster ({students.length} students) as a CSV file.
                </p>
                <CsvDownloader students={students} filename="sped_students_roster.csv" />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}