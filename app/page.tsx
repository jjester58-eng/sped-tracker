"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "../../lib/supabaseClient";

interface Student {
  id: string;
  name: string;
  grade_level: string;
  created_at: string;
}

interface Goal {
  id: string;
  student_id: string;
  goal_description: string;
}

type Tab = "students" | "goals" | "upload";

export default function CaseManagerPage() {
  const [tab, setTab] = useState<Tab>("students");
  const [students, setStudents] = useState<Student[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Student form
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState({ name: "", grade_level: "" });

  // Goal form
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalForm, setGoalForm] = useState({ student_id: "", goal_description: "" });

  // CSV
  const [csvPreview, setCsvPreview] = useState<{ name: string; grade_level: string }[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError("Supabase is not configured.");
      return;
    }
    loadData();
  }, []);

  async function loadData() {
    const supabase = getSupabase();
    if (!supabase) return;
    setLoading(true);
    const [studentsRes, goalsRes] = await Promise.all([
      supabase.from("students").select("id, name, grade_level, created_at").order("name"),
      supabase.from("goals").select("id, student_id, goal_description").order("goal_description"),
    ]);
    if (studentsRes.data) setStudents(studentsRes.data as Student[]);
    if (goalsRes.data) setGoals(goalsRes.data as Goal[]);
    setLoading(false);
  }

  function flash(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  // ---- STUDENTS ----

  async function saveStudent() {
    if (!studentForm.name.trim()) {
      setError("Student name is required.");
      return;
    }
    const supabase = getSupabase();
    if (!supabase) return;
    setLoading(true);
    setError(null);

    if (editingStudent) {
      const { error: e } = await supabase
        .from("students")
        .update({ name: studentForm.name, grade_level: studentForm.grade_level })
        .eq("id", editingStudent.id);
      if (e) { setError(e.message); } else { flash("Student updated."); }
    } else {
      const { error: e } = await supabase
        .from("students")
        .insert({ name: studentForm.name, grade_level: studentForm.grade_level });
      if (e) { setError(e.message); } else { flash("Student added."); }
    }
    setStudentForm({ name: "", grade_level: "" });
    setEditingStudent(null);
    await loadData();
    setLoading(false);
  }

  async function deleteStudent(id: string) {
    if (!confirm("Delete this student? This will also remove their goals and progress records.")) return;
    const supabase = getSupabase();
    if (!supabase) return;
    setLoading(true);
    const { error: e } = await supabase.from("students").delete().eq("id", id);
    if (e) setError(e.message); else flash("Student deleted.");
    await loadData();
    setLoading(false);
  }

  function startEditStudent(s: Student) {
    setEditingStudent(s);
    setStudentForm({ name: s.name, grade_level: s.grade_level });
  }

  function cancelStudentEdit() {
    setEditingStudent(null);
    setStudentForm({ name: "", grade_level: "" });
  }

  // ---- GOALS ----

  async function saveGoal() {
    if (!goalForm.student_id || !goalForm.goal_description.trim()) {
      setError("Student and goal description are required.");
      return;
    }
    const supabase = getSupabase();
    if (!supabase) return;
    setLoading(true);
    setError(null);

    if (editingGoal) {
      const { error: e } = await supabase
        .from("goals")
        .update({ student_id: goalForm.student_id, goal_description: goalForm.goal_description })
        .eq("id", editingGoal.id);
      if (e) { setError(e.message); } else { flash("Goal updated."); }
    } else {
      const { error: e } = await supabase
        .from("goals")
        .insert({ student_id: goalForm.student_id, goal_description: goalForm.goal_description });
      if (e) { setError(e.message); } else { flash("Goal added."); }
    }
    setGoalForm({ student_id: "", goal_description: "" });
    setEditingGoal(null);
    await loadData();
    setLoading(false);
  }

  async function deleteGoal(id: string) {
    if (!confirm("Delete this goal?")) return;
    const supabase = getSupabase();
    if (!supabase) return;
    setLoading(true);
    const { error: e } = await supabase.from("goals").delete().eq("id", id);
    if (e) setError(e.message); else flash("Goal deleted.");
    await loadData();
    setLoading(false);
  }

  function startEditGoal(g: Goal) {
    setEditingGoal(g);
    setGoalForm({ student_id: g.student_id, goal_description: g.goal_description });
  }

  function cancelGoalEdit() {
    setEditingGoal(null);
    setGoalForm({ student_id: "", goal_description: "" });
  }

  // ---- CSV UPLOAD ----

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError(null);
    setCsvPreview([]);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  }

  function parseCSV(text: string) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) {
      setCsvError("CSV must have a header row and at least one data row.");
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const nameIdx = headers.indexOf("name");
    const gradeIdx = headers.indexOf("grade_level");

    if (nameIdx === -1) {
      setCsvError("CSV must have a 'name' column. Optional: 'grade_level'.");
      return;
    }

    const rows: { name: string; grade_level: string }[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim());
      const name = cols[nameIdx];
      if (!name) continue;
      rows.push({ name, grade_level: gradeIdx !== -1 ? cols[gradeIdx] || "" : "" });
    }

    if (rows.length === 0) {
      setCsvError("No valid rows found in CSV.");
      return;
    }

    setCsvPreview(rows);
  }

  async function importCSV() {
    if (csvPreview.length === 0) return;
    const supabase = getSupabase();
    if (!supabase) return;
    setLoading(true);
    setCsvError(null);

    const { error: e } = await supabase.from("students").insert(csvPreview);
    if (e) {
      setCsvError(e.message);
    } else {
      flash(`Imported ${csvPreview.length} students.`);
      setCsvPreview([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadData();
    }
    setLoading(false);
  }

  const studentMap = new Map(students.map((s) => [s.id, s.name]));

  return (
    <main className="page">
      <section className="header">
        <div>
          <h1>Case Manager</h1>
          <p>Manage students, IEP goals, and upload rosters via CSV.</p>
        </div>
      </section>

      {/* Tabs */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${tab === "students" ? "tab-btn--active" : ""}`}
          onClick={() => setTab("students")}
        >
          Students
        </button>
        <button
          className={`tab-btn ${tab === "goals" ? "tab-btn--active" : ""}`}
          onClick={() => setTab("goals")}
        >
          IEP Goals
        </button>
        <button
          className={`tab-btn ${tab === "upload" ? "tab-btn--active" : ""}`}
          onClick={() => setTab("upload")}
        >
          CSV Upload
        </button>
      </div>

      {error && <p className="form-error" style={{ marginBottom: "16px" }}>{error}</p>}
      {successMsg && <p className="form-success" style={{ marginBottom: "16px" }}>{successMsg}</p>}

      {/* STUDENTS TAB */}
      {tab === "students" && (
        <>
          <section className="card">
            <h2>{editingStudent ? "Edit student" : "Add student"}</h2>
            <div className="form-grid">
              <div className="field">
                <label>Name *</label>
                <input
                  type="text"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  placeholder="Student full name"
                />
              </div>
              <div className="field">
                <label>Grade level</label>
                <input
                  type="text"
                  value={studentForm.grade_level}
                  onChange={(e) => setStudentForm({ ...studentForm, grade_level: e.target.value })}
                  placeholder="e.g. 3, 9, K"
                />
              </div>
            </div>
            <div className="btn-row" style={{ marginTop: "18px" }}>
              <button className="button" type="button" onClick={saveStudent} disabled={loading}>
                {editingStudent ? "Update student" : "Add student"}
              </button>
              {editingStudent && (
                <button className="button button-outline" type="button" onClick={cancelStudentEdit}>
                  Cancel
                </button>
              )}
            </div>
          </section>

          <section className="card">
            <h2>All students ({students.length})</h2>
            {students.length === 0 ? (
              <p className="empty-state">No students yet. Add one above or upload a CSV.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Grade</th>
                    <th>Goals</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const goalCount = goals.filter((g) => g.student_id === s.id).length;
                    return (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td>{s.grade_level || "—"}</td>
                        <td>
                          <span className="badge">{goalCount} goal{goalCount !== 1 ? "s" : ""}</span>
                        </td>
                        <td>
                          <div className="btn-row">
                            <button
                              className="button button-sm button-outline"
                              onClick={() => startEditStudent(s)}
                            >
                              Edit
                            </button>
                            <button
                              className="button button-sm button-danger"
                              onClick={() => deleteStudent(s.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}

      {/* GOALS TAB */}
      {tab === "goals" && (
        <>
          <section className="card">
            <h2>{editingGoal ? "Edit goal" : "Add IEP goal"}</h2>
            <div className="form-grid">
              <div className="field">
                <label>Student *</label>
                <select
                  value={goalForm.student_id}
                  onChange={(e) => setGoalForm({ ...goalForm, student_id: e.target.value })}
                >
                  <option value="">-- Select student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Gr {s.grade_level})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field full">
                <label>Goal description *</label>
                <textarea
                  value={goalForm.goal_description}
                  onChange={(e) => setGoalForm({ ...goalForm, goal_description: e.target.value })}
                  placeholder="Describe the IEP goal..."
                />
              </div>
            </div>
            <div className="btn-row" style={{ marginTop: "18px" }}>
              <button className="button" type="button" onClick={saveGoal} disabled={loading}>
                {editingGoal ? "Update goal" : "Add goal"}
              </button>
              {editingGoal && (
                <button className="button button-outline" type="button" onClick={cancelGoalEdit}>
                  Cancel
                </button>
              )}
            </div>
          </section>

          <section className="card">
            <h2>All IEP goals ({goals.length})</h2>
            {goals.length === 0 ? (
              <p className="empty-state">No goals yet. Add one above.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Goal</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {goals.map((g) => (
                    <tr key={g.id}>
                      <td>{studentMap.get(g.student_id) || "Unknown"}</td>
                      <td>{g.goal_description}</td>
                      <td>
                        <div className="btn-row">
                          <button
                            className="button button-sm button-outline"
                            onClick={() => startEditGoal(g)}
                          >
                            Edit
                          </button>
                          <button
                            className="button button-sm button-danger"
                            onClick={() => deleteGoal(g.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}

      {/* CSV UPLOAD TAB */}
      {tab === "upload" && (
        <section className="card">
          <h2>Upload student roster via CSV</h2>
          <div className="info-banner" style={{ marginBottom: "20px" }}>
            <strong>Required columns:</strong> <code>name</code> &nbsp;|&nbsp;
            <strong>Optional:</strong> <code>grade_level</code>
            <br />
            <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
              First row must be the header. Example: <code>name,grade_level</code>
            </span>
          </div>

          <div className="field" style={{ marginBottom: "20px" }}>
            <label>Choose CSV file</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              style={{ padding: "8px 0" }}
            />
          </div>

          {csvError && <p className="form-error">{csvError}</p>}

          {csvPreview.length > 0 && (
            <>
              <h3>Preview — {csvPreview.length} students to import</h3>
              <table className="data-table" style={{ marginBottom: "20px" }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Grade level</th>
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.map((row, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{row.name}</td>
                      <td>{row.grade_level || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button className="button" type="button" onClick={importCSV} disabled={loading}>
                {loading ? "Importing..." : `Import ${csvPreview.length} students`}
              </button>
            </>
          )}
        </section>
      )}
    </main>
  );
}