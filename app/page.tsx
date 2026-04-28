"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface StudentRecord {
  id: string;
  student_name: string;
  grade_level: string;
  iep_goal: string;
  progress_notes: string;
  accommodations: string;
  teacher_name: string;
  review_date: string | null;
  created_at: string;
}

export default function HomePage() {
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    studentName: "",
    gradeLevel: "",
    iepGoal: "",
    progressNotes: "",
    accommodations: "",
    teacherName: "",
    reviewDate: ""
  });

  useEffect(() => {
    refreshRecords();
  }, []);

  async function refreshRecords() {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("student_data")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else if (data) {
      setRecords(data as StudentRecord[]);
    }

    setLoading(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      student_name: formState.studentName,
      grade_level: formState.gradeLevel,
      iep_goal: formState.iepGoal,
      progress_notes: formState.progressNotes,
      accommodations: formState.accommodations,
      teacher_name: formState.teacherName,
      review_date: formState.reviewDate || null
    };

    const { error: insertError } = await supabase
      .from("student_data")
      .insert(payload);

    if (insertError) {
      setError(insertError.message);
    } else {
      setFormState({
        studentName: "",
        gradeLevel: "",
        iepGoal: "",
        progressNotes: "",
        accommodations: "",
        teacherName: "",
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
        <h2>Record student data</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="studentName">Student name</label>
              <input
                id="studentName"
                value={formState.studentName}
                onChange={(event) => setFormState({ ...formState, studentName: event.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="gradeLevel">Grade level</label>
              <input
                id="gradeLevel"
                value={formState.gradeLevel}
                onChange={(event) => setFormState({ ...formState, gradeLevel: event.target.value })}
                required
              />
            </div>
            <div className="field full">
              <label htmlFor="teacherName">Teacher / Case manager</label>
              <input
                id="teacherName"
                value={formState.teacherName}
                onChange={(event) => setFormState({ ...formState, teacherName: event.target.value })}
                required
              />
            </div>
            <div className="field full">
              <label htmlFor="iepGoal">IEP goal or target</label>
              <textarea
                id="iepGoal"
                value={formState.iepGoal}
                onChange={(event) => setFormState({ ...formState, iepGoal: event.target.value })}
                required
              />
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
              <label htmlFor="accommodations">Accommodations / supports</label>
              <textarea
                id="accommodations"
                value={formState.accommodations}
                onChange={(event) => setFormState({ ...formState, accommodations: event.target.value })}
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
              {loading ? "Saving..." : "Save record"}
            </button>
          </div>

          {error ? <p style={{ color: "#b91c1c", marginTop: "16px" }}>{error}</p> : null}
        </form>
      </section>

      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Recent student records</h2>
          <button className="button" type="button" onClick={refreshRecords} disabled={loading}>
            Refresh
          </button>
        </div>

        {loading && !records.length ? (
          <p className="empty-state">Loading records...</p>
        ) : records.length === 0 ? (
          <p className="empty-state">No student records found yet.</p>
        ) : (
          records.map((record) => (
            <article className="entry" key={record.id}>
              <h3>{record.student_name}</h3>
              <div className="entry-meta">
                <span>
                  <strong>Grade:</strong> {record.grade_level}
                </span>
                <span>
                  <strong>Teacher:</strong> {record.teacher_name}
                </span>
                <span>
                  <strong>Next review:</strong> {record.review_date || "None"}
                </span>
                <span>
                  <strong>Logged:</strong> {new Date(record.created_at).toLocaleString()}
                </span>
              </div>
              <p className="note">
                <strong>IEP goal:</strong> {record.iep_goal}
                <br />
                <strong>Progress:</strong> {record.progress_notes}
                <br />
                <strong>Accommodations:</strong> {record.accommodations || "No accommodations entered."}
              </p>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
