"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ---------------- TYPES ---------------- */

type Student = {
  id: string;
  name: string;
  grade_level: string | null;
  created_at: string;
};

type Goal = {
  id: string;
  student_id: string;
  goal_description: string;
};

type Tab = "students" | "goals" | "upload";

/* ---------------- COMPONENT ---------------- */

export default function CaseManagerPage() {
  const [tab, setTab] = useState<Tab>("students");

  const [students, setStudents] = useState<Student[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState({
    name: "",
    grade_level: "",
  });

  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalForm, setGoalForm] = useState({
    student_id: "",
    goal_description: "",
  });

  const [csvPreview, setCsvPreview] = useState<
    { name: string; grade_level: string }[]
  >([]);

  const [csvError, setCsvError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---------------- LOAD ---------------- */

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [studentsRes, goalsRes] = await Promise.all([
      supabase.from("students").select("*").order("name"),
      supabase.from("goals").select("*").order("goal_description"),
    ]);

    if (studentsRes.data) setStudents(studentsRes.data as Student[]);
    if (goalsRes.data) setGoals(goalsRes.data as Goal[]);

    setLoading(false);
  }

  function flash(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  /* ---------------- STUDENTS ---------------- */

  async function saveStudent() {
    if (!studentForm.name.trim()) {
      setError("Student name required");
      return;
    }

    setLoading(true);

    const payload = {
      name: studentForm.name.trim(),
      grade_level: studentForm.grade_level || null,
    };

    if (editingStudent) {
      const { error } = await supabase
        .from("students")
        .update(payload)
        .eq("id", editingStudent.id);

      if (error) setError(error.message);
      else flash("Updated student");
    } else {
      const { error } = await supabase
        .from("students")
        .insert(payload);

      if (error) setError(error.message);
      else flash("Added student");
    }

    setStudentForm({ name: "", grade_level: "" });
    setEditingStudent(null);

    await loadData();
    setLoading(false);
  }

  async function deleteStudent(id: string) {
    if (!confirm("Delete student?")) return;

    setLoading(true);

    const { error } = await supabase
      .from("students")
      .delete()
      .eq("id", id);

    if (error) setError(error.message);
    else flash("Deleted student");

    await loadData();
    setLoading(false);
  }

  /* ---------------- GOALS ---------------- */

  async function saveGoal() {
    if (!goalForm.student_id || !goalForm.goal_description.trim()) {
      setError("Missing fields");
      return;
    }

    setLoading(true);

    const payload = {
      student_id: goalForm.student_id,
      goal_description: goalForm.goal_description.trim(),
    };

    if (editingGoal) {
      const { error } = await supabase
        .from("goals")
        .update(payload)
        .eq("id", editingGoal.id);

      if (error) setError(error.message);
      else flash("Updated goal");
    } else {
      const { error } = await supabase
        .from("goals")
        .insert({
  student_id: goalForm.student_id,
  goal_description: goalForm.goal_description.trim(),
  goal_number: 1, // ✅ REQUIRED (pick a default for now)
});

      if (error) setError(error.message);
      else flash("Added goal");
    }

    setGoalForm({ student_id: "", goal_description: "" });
    setEditingGoal(null);

    await loadData();
    setLoading(false);
  }

  /* ---------------- CSV ---------------- */

  function parseCSV(text: string) {
    const lines = text.trim().split(/\r?\n/);

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

    const nameIdx = headers.indexOf("name");
    const gradeIdx = headers.indexOf("grade_level");

    if (nameIdx === -1) {
      setCsvError("Missing name column");
      return;
    }

    const rows: { name: string; grade_level: string }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      const name = cols[nameIdx];

      if (!name) continue;

      rows.push({
        name,
        grade_level: cols[gradeIdx] || "",
      });
    }

    setCsvPreview(rows);
  }

  async function importCSV() {
    setLoading(true);

    const { error } = await supabase.from("students").insert(
      csvPreview.map((r) => ({
        name: r.name,
        grade_level: r.grade_level || null,
      }))
    );

    if (error) setCsvError(error.message);
    else flash("Imported students");

    setCsvPreview([]);
    await loadData();
    setLoading(false);
  }

  const studentMap = new Map(
    students.map((s) => [s.id, s.name])
  );

  /* ---------------- UI ---------------- */

  return (
    <main>
      <h1>Case Manager</h1>

      {error && <p>{error}</p>}
      {successMsg && <p>{successMsg}</p>}

      {/* Students */}
      {tab === "students" && (
        <section>
          <input
            value={studentForm.name}
            onChange={(e) =>
              setStudentForm({ ...studentForm, name: e.target.value })
            }
            placeholder="Name"
          />

          <input
            value={studentForm.grade_level}
            onChange={(e) =>
              setStudentForm({
                ...studentForm,
                grade_level: e.target.value,
              })
            }
            placeholder="Grade"
          />

          <button onClick={saveStudent}>
            {editingStudent ? "Update" : "Add"}
          </button>

          {students.map((s) => (
            <div key={s.id}>
              {s.name} ({s.grade_level ?? "—"})
              <button onClick={() => deleteStudent(s.id)}>Delete</button>
            </div>
          ))}
        </section>
      )}

      {/* Goals */}
      {tab === "goals" && (
        <section>
          <select
            value={goalForm.student_id}
            onChange={(e) =>
              setGoalForm({
                ...goalForm,
                student_id: e.target.value,
              })
            }
          >
            <option value="">Select</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <textarea
            value={goalForm.goal_description}
            onChange={(e) =>
              setGoalForm({
                ...goalForm,
                goal_description: e.target.value,
              })
            }
          />

          <button onClick={saveGoal}>
            {editingGoal ? "Update" : "Add"}
          </button>
        </section>
      )}

      {/* Upload */}
      {tab === "upload" && (
        <section>
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              const reader = new FileReader();
              reader.onload = (ev) =>
                parseCSV(ev.target?.result as string);

              reader.readAsText(file);
            }}
          />

          {csvPreview.length > 0 && (
            <button onClick={importCSV}>Import</button>
          )}
        </section>
      )}
    </main>
  );
}