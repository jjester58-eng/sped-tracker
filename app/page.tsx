"use client";

import { useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "../lib/supabaseClient";

interface ProgressEntry {
  id: string;
  student_id: string;
  student_name: string;
  goal_id: string;
  goal_description: string;
  case_manager_id: string;
  case_manager_name: string;
  progress_notes: string;
  accommodations_used: string;
  review_date: string | null;
  created_at: string;
}

interface Student {
  id: string;
  name: string;
  grade_level: string;
}

interface CaseManager {
  id: string;
  name: string;
}

export default function HomePage() {
  const [records, setRecords] = useState<ProgressEntry[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [caseManagers, setCaseManagers] = useState<CaseManager[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    studentId: "",
    caseManagerId: "",
    progressNotes: "",
    accommodationsUsed: "",
    reviewDate: ""
  });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
      return;
    }

    async function init() {
      await loadDropdownOptions();
      await refreshRecords();
    }

    init();
  }, []);

  async function loadDropdownOptions() {
    const supabase = getSupabase();
    if (!supabase) return;

    setLoading(true);
    const [studentsRes, caseManagersRes] = await Promise.all([
      supabase.from("students").select("id, name, grade_level"),
      supabase.from("case_managers").select("id, name")
    ]);

    if (studentsRes.data) setStudents(studentsRes.data as Student[]);
    if (caseManagersRes.data) setCaseManagers(caseManagersRes.data as CaseManager[]);
    setLoading(false);
  }

  async function refreshRecords() {
    if (!isSupabaseConfigured) {
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("weekly_progress")
      .select("id, student_id, goal_id, case_manager_id, progress_notes, accommodations_used, review_date, created_at")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else if (data) {
      const studentMap = new Map(students.map((s) => [s.id, s.name]));
      const caseManagerMap = new Map(caseManagers.map((cm) => [cm.id, cm.name]));
      const transformed = data.map((row: any) => ({
        id: row.id,
        student_id: row.student_id,
        student_name: studentMap.get(row.student_id) || "Unknown",
        goal_id: row.goal_id,
        goal_description: "No goal",
        case_manager_id: row.case_manager_id,
        case_manager_name: caseManagerMap.get(row.case_manager_id) || "Unknown",
        progress_notes: row.progress_notes,
        accommodations_used: row.accommodations_used,
        review_date: row.review_date,
        created_at: row.created_at
      }));
      setRecords(transformed as ProgressEntry[]);
    }

    setLoading(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!formState.studentId || !formState.caseManagerId || !formState.progressNotes) {
      setError("Please fill in student, case manager, and progress notes.");
      setLoading(false);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setError("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
      setLoading(false);
      return;
    }

    const payload = {
      student_id: formState.studentId,
      case_manager_id: formState.caseManagerId,
      progress_notes: formState.progressNotes,
      accommodations_used: formState.accommodationsUsed,
      review_date: formState.reviewDate || null
    };

    const { error: insertError } = await supabase
      .from("weekly_progress")
      .insert(payload);

    if (insertError) {
      setError(insertError.message);
    } else {
      setFormState({
        studentId: "",
        caseManagerId: "",
        progressNotes: "",
        accommodationsUsed: "",
        reviewDate: ""
      });
      refreshRecords();
    }

    setLoading(false);
  }

  return (
    <main className="page">
      <section className="header">
        <div>
          <h1>SPED Teacher Data Tracker</h1>
          <p>
            Track student progress, accommodations, IEP goals, and review dates for special education
            teams in a public school setting.
          </p>
        </div>
      </section>

      <section className="card">
        <h2>Record weekly progress</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="studentId">Student</label>
              <select
                id="studentId"
                value={formState.studentId}
                onChange={(event) => setFormState({ ...formState, studentId: event.target.value })}
                required
              >
                <option value="">-- Select student --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Grade {s.grade_level})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="caseManagerId">Case manager</label>
              <select
                id="caseManagerId"
                value={formState.caseManagerId}
                onChange={(event) => setFormState({ ...formState, caseManagerId: event.target.value })}
                required
              >
                <option value="">-- Select case manager --</option>
                {caseManagers.map((cm) => (
                  <option key={cm.id} value={cm.id}>
                    {cm.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field full">
              <label htmlFor="progressNotes">Progress notes</label>
              <textarea
                id="progressNotes"
                value={formState.progressNotes}
                onChange={(event) => setFormState({ ...formState, progressNotes: event.target.value })}
                required
              />
            </div>
            <div className="field full">
              <label htmlFor="accommodationsUsed">Accommodations used</label>
              <textarea
                id="accommodationsUsed"
                value={formState.accommodationsUsed}
                onChange={(event) => setFormState({ ...formState, accommodationsUsed: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="reviewDate">Next review date</label>
              <input
                id="reviewDate"
                type="date"
                value={formState.reviewDate}
                onChange={(event) => setFormState({ ...formState, reviewDate: event.target.value })}
              />
            </div>
          </div>

          <div style={{ marginTop: "24px" }}>
            <button className="button" type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save progress entry"}
            </button>
          </div>

          {error ? <p style={{ color: "#b91c1c", marginTop: "16px" }}>{error}</p> : null}
        </form>
      </section>

      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Recent progress entries</h2>
          <button className="button" type="button" onClick={refreshRecords} disabled={loading}>
            Refresh
          </button>
        </div>

        {loading && !records.length ? (
          <p className="empty-state">Loading records...</p>
        ) : records.length === 0 ? (
          <p className="empty-state">No progress entries found yet.</p>
        ) : (
          records.map((record) => (
            <article className="entry" key={record.id}>
              <h3>{record.student_name}</h3>
              <div className="entry-meta">
                <span>
                  <strong>Case manager:</strong> {record.case_manager_name}
                </span>
                <span>
                  <strong>Next review:</strong> {record.review_date || "None"}
                </span>
                <span>
                  <strong>Logged:</strong> {new Date(record.created_at).toLocaleString()}
                </span>
              </div>
              <p className="note">
                <strong>Goal:</strong> {record.goal_description}
                <br />
                <strong>Progress:</strong> {record.progress_notes}
                <br />
                <strong>Accommodations:</strong> {record.accommodations_used || "None recorded."}
              </p>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
