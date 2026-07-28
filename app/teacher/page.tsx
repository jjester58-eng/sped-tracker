'use client';

import { useEffect, useState } from 'react';
import MultiStudentPicker from '@/app/components/MultiStudentPicker';
import SubjectSelector from '@/app/components/SubjectSelector';
import GradeLevelMultiSelector from '@/app/components/GradeLevelMultiSelector';
import GoalSelector from '@/app/components/GoalSelector';
import { useClassesAsSubjects } from '@/app/hooks/useClassesAsSubjects';
import { useSupabase } from '@/lib/useSupabase';
import type { Student } from '@/app/components/index';

type ReportEntry = {
  id: string;
  student_id: string;
  goal_id: string;
  progress_notes: string;
  review_date: string;
  student_name: string;
  goal_description: string;
};

const NOTE_TEMPLATES = [
  {
    title: 'Progress made',
    text: 'Student demonstrated steady progress toward the goal today. Continued support and positive reinforcement were effective.',
  },
  {
    title: 'Needs prompting',
    text: 'Student required frequent prompting to stay on task today. Continued reminders and visual supports would be beneficial.',
  },
  {
    title: 'Independent work',
    text: 'Student completed the assigned task with increasing independence today and showed strong engagement.',
  },
  {
    title: 'Communication growth',
    text: 'Student showed growth in communication and participation today. Continued opportunities for practice are recommended.',
  },
];

export default function TeacherPage() {
  const supabase = useSupabase();
  const { subjects, loading: subjectsLoading } = useClassesAsSubjects();

  const [subject, setSubject] = useState('');
  const [selectedGradeLevels, setSelectedGradeLevels] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [providerName, setProviderName] = useState('');
  const [providerUserId, setProviderUserId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [reportEntries, setReportEntries] = useState<ReportEntry[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [todaySummary, setTodaySummary] = useState<string>('');

  /**
   * IMPORTANT:
   * This assumes MultiStudentPicker either:
   *  - fetches students internally, OR
   *  - accepts filters and returns filtered results
   *
   * We are enforcing UI gating here (not showing until ready)
   */
  const canLoadStudents = subject.length > 0 && selectedGradeLevels.length > 0;

  const loadReportEntries = async () => {
    if (selectedStudents.length === 0) {
      setReportEntries([]);
      return;
    }

    setReportLoading(true);

    try {
      const studentIds = selectedStudents.map((student) => student.id);
      const { data, error } = await supabase
        .from('weekly_progress')
        .select('id, student_id, goal_id, progress_notes, review_date')
        .in('student_id', studentIds)
        .order('review_date', { ascending: false });

      if (error) throw error;

      const entries = (data ?? []) as Array<{
        id: string;
        student_id: string;
        goal_id: string;
        progress_notes: string;
        review_date: string;
      }>;

      const goalIds = Array.from(new Set(entries.map((entry) => entry.goal_id).filter(Boolean)));
      const [goalsResult, studentsResult] = await Promise.all([
        goalIds.length > 0
          ? supabase.from('goals').select('id, goal_description').in('id', goalIds)
          : Promise.resolve({ data: [], error: null }),
        studentIds.length > 0
          ? supabase.from('students').select('id, name').in('id', studentIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (goalsResult.error) throw goalsResult.error;
      if (studentsResult.error) throw studentsResult.error;

      const goalMap = new Map((goalsResult.data ?? []).map((goal: { id: string; goal_description: string }) => [goal.id, goal.goal_description]));
      const studentMap = new Map((studentsResult.data ?? []).map((student: { id: string; name: string }) => [student.id, student.name]));

      const normalizedSubject = subject.trim().toLowerCase();
      const mappedEntries: ReportEntry[] = entries
        .map((entry) => ({
          id: entry.id,
          student_id: entry.student_id,
          goal_id: entry.goal_id,
          progress_notes: entry.progress_notes,
          review_date: entry.review_date,
          student_name: String(studentMap.get(entry.student_id) ?? 'Unknown student'),
          goal_description: String(goalMap.get(entry.goal_id) ?? 'Unknown goal'),
        }))
        .filter((entry) => {
          if (!normalizedSubject) return true;
          return entry.goal_description.toLowerCase().includes(normalizedSubject);
        });

      setReportEntries(mappedEntries);
      const todayEntries = mappedEntries.filter((entry) => entry.review_date === new Date().toISOString().split('T')[0]);
      if (todayEntries.length > 0) {
        const summary = todayEntries
          .slice(0, 3)
          .map((entry) => `${entry.student_name}: ${entry.progress_notes}`)
          .join(' • ');
        setTodaySummary(summary);
      } else {
        setTodaySummary('');
      }
    } catch (error) {
      console.error(error);
      setReportEntries([]);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    void loadReportEntries();
  }, [selectedStudents, subject, supabase]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProviderName = window.localStorage.getItem('teacherProviderName') ?? '';
      const savedProviderUserId = window.localStorage.getItem('teacherProviderUserId') ?? '';

      if (savedProviderName.trim()) {
        setProviderName(savedProviderName);
      }
      if (savedProviderUserId.trim()) {
        setProviderUserId(savedProviderUserId);
      }
    }
  }, []);

  const handleSave = async () => {
    if (selectedStudents.length === 0 || !notes.trim()) {
      alert('Please select students and write notes.');
      return;
    }

    try {
      const enteredById = '72d1fa4c-0a5b-4cb3-83b1-292a212921e1';
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);

      if (!user) {
        alert('Must be logged in to save notes.');
        return;
      }

      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const weekOf = new Date(today.setDate(diff)).toISOString().split('T')[0];

      const records = selectedStudents.map((student) => ({
        student_id: student.id,
        week_of: weekOf,
        notes: notes.trim(),
        progress_notes: notes.trim(),
        entered_by_id: enteredById,
        case_manager_id: null,
      }));

      console.log('Records to insert:', records);

      const { data: insertData, error: insertError } = await supabase
        .from('weekly_progress')
        .insert(records);

      console.log('Insert result - Data:', insertData, 'Error:', insertError);

      if (insertError) {
        console.error('Insert error details:', insertError);
        throw insertError;
      }

      alert('✅ Notes saved successfully!');
      setNotes('');
      setSelectedStudents([]);
      setSelectedGoalId('');
      setSubject('');
    } catch (err: any) {
      console.error('Full error:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const draftWordCount = notes.trim().split(/\s+/).filter(Boolean).length;
  const selectedSummaryLabel = selectedStudents.length === 0
    ? 'No students selected'
    : selectedStudents.length === 1
      ? '1 student selected'
      : `${selectedStudents.length} students selected`;

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f9fafb", padding: "2.5rem 1.5rem" }}>
      <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
        <div style={{ backgroundColor: "white", borderRadius: "1.5rem", padding: "2rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", backgroundColor: "#eff6ff", color: "#2563eb", padding: "0.35rem 0.7rem", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.6rem" }}>
                <span>📘</span>
                <span>Teacher workflow</span>
              </div>
              <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#111827" }}>
                Teacher Input
              </h1>
              <p style={{ color: "#374151", fontSize: "0.95rem", marginTop: "4px", maxWidth: "36rem" }}>
                Capture progress updates, choose goals, and review recent teacher notes in one streamlined view.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <div style={{ backgroundColor: "#f3f4f6", color: "#374151", padding: "0.7rem 1rem", borderRadius: "999px", fontWeight: 600, fontSize: "0.95rem" }}>
                {selectedSummaryLabel}
              </div>
              <div style={{ backgroundColor: "#eff6ff", color: "#2563eb", padding: "0.7rem 1rem", borderRadius: "999px", fontWeight: 600, fontSize: "0.95rem" }}>
                {draftWordCount} word{draftWordCount === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: "2rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "1.25rem", padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", gap: "0.75rem", flexWrap: "wrap" }}>
                  <div>
                    <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#111827" }}>Student selection</h2>
                    <p style={{ fontSize: "0.9rem", color: "#6b7280", marginTop: "2px" }}>Start by narrowing the roster and choosing the students you are documenting.</p>
                  </div>
                  <div style={{ backgroundColor: "#e5e7eb", color: "#374151", padding: "0.45rem 0.75rem", borderRadius: "999px", fontSize: "0.85rem", fontWeight: 600 }}>
                    {subject ? subject : "No subject"}
                  </div>
                </div>
                <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                  <SubjectSelector
                    value={subject}
                    onChange={(val) => {
                      setSubject(val);
                      setSelectedStudents([]);
                      setSelectedGoalId('');
                    }}
                    subjects={subjects}
                    loading={subjectsLoading}
                  />

                  <GradeLevelMultiSelector
                    value={selectedGradeLevels}
                    onChange={(val) => {
                      setSelectedGradeLevels(val);
                      setSelectedStudents([]);
                      setSelectedGoalId('');
                    }}
                  />
                </div>

                {(!subject || selectedGradeLevels.length === 0) && (
                  <div style={{ marginTop: "1rem", border: "1px dashed #d1d5db", borderRadius: "1rem", padding: "0.85rem 1rem", color: "#6b7280", fontSize: "0.9rem", backgroundColor: "white" }}>
                    Select a subject and at least one grade level to load students.
                  </div>
                )}
              </div>

              <div style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "1.25rem", padding: "1rem" }}>
                <div style={{ marginBottom: "0.85rem" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", margin: 0 }}>Student roster</h3>
                  <p style={{ fontSize: "0.9rem", color: "#6b7280", marginTop: "2px" }}>Choose the students you want to document today.</p>
                </div>
                {!canLoadStudents ? (
                  <div style={{ minHeight: "360px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px dashed #d1d5db", borderRadius: "1rem", backgroundColor: "white", padding: "2rem", textAlign: "center" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>👩‍🏫</div>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#111827" }}>Choose your filters</h3>
                    <p style={{ marginTop: "0.35rem", color: "#6b7280", fontSize: "0.92rem" }}>
                      Once a subject and grade level are selected, the student roster will appear here.
                    </p>
                  </div>
                ) : (
                  <MultiStudentPicker
                    value={selectedStudents}
                    onChange={(nextStudents) => {
                      setSelectedStudents(nextStudents);
                      setSelectedGoalId('');
                    }}
                    subject={subject}
                    gradeLevels={selectedGradeLevels}
                    searchPlaceholder="Search students..."
                  />
                )}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "1.25rem", padding: "1.25rem" }}>
                {selectedStudents.length > 0 ? (
                  <>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginBottom: "1rem" }}>
                      {selectedStudents.map((s) => (
                        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "0.45rem", backgroundColor: "#eff6ff", color: "#2563eb", padding: "0.55rem 0.8rem", borderRadius: "999px", fontSize: "0.9rem", fontWeight: 600 }}>
                          <span>{s.name}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedStudents((prev) => prev.filter((x) => x.id !== s.id))}
                            style={{ background: "transparent", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "0.85rem" }}
                            aria-label={`Remove ${s.name}`}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    <div style={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "1rem", padding: "1rem" }}>
                      {subject && (
                        <GoalSelector
                          subject={subject}
                          students={selectedStudents}
                          onChange={setSelectedGoalId}
                        />
                      )}
                    </div>

                    <div style={{ marginTop: "1rem", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "1rem", padding: "1rem" }}>
                      <div style={{ marginBottom: "0.75rem", fontWeight: 700, color: "#111827" }}>Entered by</div>
                      <input
                        type="text"
                        value={providerName}
                        onChange={(e) => setProviderName(e.target.value)}
                        placeholder="Enter your name"
                        style={{ width: "100%", padding: "0.9rem 1rem", borderRadius: "1rem", border: "1px solid #d1d5db", backgroundColor: "#f9fafb", color: "#111827", boxSizing: "border-box" }}
                      />
                      <p style={{ marginTop: "0.65rem", color: "#6b7280", fontSize: "0.9rem" }}>
                        Your name is remembered locally for the next save.
                      </p>
                    </div>

                    <div style={{ marginTop: "1rem", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "1rem", padding: "1rem" }}>
                      <div style={{ marginBottom: "0.8rem" }}>
                        <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#111827" }}>Quick note templates</div>
                        <div style={{ fontSize: "0.82rem", color: "#6b7280", marginTop: "2px" }}>Pick a starter and tailor it for the student or goal.</div>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        {NOTE_TEMPLATES.map((template) => (
                          <button
                            key={template.title}
                            type="button"
                            onClick={() => setNotes((prev) => prev ? `${prev}\n\n${template.text}` : template.text)}
                            style={{ border: "1px solid #d1d5db", backgroundColor: "#fff", borderRadius: "999px", padding: "0.5rem 0.8rem", fontSize: "0.85rem", fontWeight: 600, color: "#374151", cursor: "pointer" }}
                          >
                            {template.title}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginTop: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <label style={{ display: "block", fontWeight: 700, color: "#111827", fontSize: "0.95rem" }}>Progress notes</label>
                        <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{draftWordCount} word{draftWordCount === 1 ? "" : "s"}</div>
                      </div>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        style={{ width: "100%", minHeight: "240px", padding: "0.9rem 1rem", borderRadius: "1rem", border: "1px solid #d1d5db", resize: "vertical", backgroundColor: "white", color: "#374151", boxSizing: "border-box" }}
                        placeholder="Write observations, progress, behaviors, accommodations, and next steps..."
                      />
                    </div>

                    {saveFeedback && (
                      <div style={{ marginTop: "1rem", borderRadius: "1rem", padding: "0.8rem 1rem", fontSize: "0.9rem", border: saveFeedback.type === "success" ? "1px solid #a7f3d0" : "1px solid #fecaca", backgroundColor: saveFeedback.type === "success" ? "#f0fdf4" : "#fef2f2", color: saveFeedback.type === "success" ? "#166534" : "#b91c1c" }}>
                        {saveFeedback.message}
                      </div>
                    )}

                    <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "1rem", padding: "0.9rem 1rem" }}>
                      <div style={{ fontSize: "0.9rem", color: "#6b7280" }}>
                        {notes.trim() ? "Draft is ready to save." : "Start typing to build your note."}
                      </div>
                      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          style={{ backgroundColor: "#2563eb", color: "white", padding: "0.75rem 1.25rem", borderRadius: "0.9rem", border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
                        >
                          {saving ? "Saving..." : "Save notes"}
                        </button>
                        <button
                          onClick={() => {
                            setNotes('');
                            setSelectedGoalId('');
                            setSaveFeedback(null);
                          }}
                          style={{ backgroundColor: "white", color: "#374151", padding: "0.75rem 1.25rem", borderRadius: "0.9rem", border: "1px solid #d1d5db", cursor: "pointer" }}
                        >
                          Clear draft
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ minHeight: "420px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px dashed #d1d5db", borderRadius: "1rem", backgroundColor: "white", padding: "2rem", textAlign: "center" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📝</div>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#111827" }}>Start your entry</h3>
                    <p style={{ marginTop: "0.35rem", color: "#6b7280", fontSize: "0.92rem" }}>
                      Select one or more students to begin writing progress notes.
                    </p>
                  </div>
                )}
              </div>

              <div style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "1.25rem", padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.9rem" }}>
                  <div>
                    <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#111827" }}>Today&apos;s notes</h2>
                    <p style={{ fontSize: "0.9rem", color: "#6b7280", marginTop: "2px" }}>A compact summary of the latest teacher input for today.</p>
                  </div>
                  <div style={{ backgroundColor: "#e5e7eb", color: "#374151", padding: "0.45rem 0.75rem", borderRadius: "999px", fontSize: "0.85rem", fontWeight: 600 }}>
                    {reportEntries.length} entr{reportEntries.length === 1 ? "y" : "ies"}
                  </div>
                </div>

                {todaySummary ? (
                  <div style={{ marginBottom: "0.9rem", borderRadius: "1rem", backgroundColor: "#eff6ff", color: "#1d4ed8", padding: "0.9rem 1rem", fontSize: "0.9rem" }}>
                    {todaySummary}
                  </div>
                ) : (
                  <div style={{ marginBottom: "0.9rem", borderRadius: "1rem", border: "1px dashed #d1d5db", backgroundColor: "white", padding: "0.9rem 1rem", color: "#6b7280", fontSize: "0.9rem" }}>
                    No notes saved for today yet.
                  </div>
                )}

                {!selectedStudents.length ? (
                  <div style={{ borderRadius: "1rem", border: "1px dashed #d1d5db", backgroundColor: "white", padding: "0.9rem 1rem", color: "#6b7280", fontSize: "0.9rem" }}>
                    Select students to view their teacher input history.
                  </div>
                ) : reportLoading ? (
                  <div style={{ borderRadius: "1rem", border: "1px dashed #d1d5db", backgroundColor: "white", padding: "0.9rem 1rem", color: "#6b7280", fontSize: "0.9rem" }}>
                    Loading report...
                  </div>
                ) : reportEntries.length === 0 ? (
                  <div style={{ borderRadius: "1rem", border: "1px dashed #d1d5db", backgroundColor: "white", padding: "0.9rem 1rem", color: "#6b7280", fontSize: "0.9rem" }}>
                    No teacher entries found for the selected students yet.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {reportEntries.map((entry) => (
                      <div key={entry.id} style={{ borderRadius: "1rem", backgroundColor: "white", border: "1px solid #e5e7eb", padding: "0.9rem 1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                          <div style={{ fontWeight: 700, color: "#111827" }}>{entry.student_name}</div>
                          <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>{entry.review_date}</div>
                        </div>
                        <div style={{ color: "#2563eb", fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.35rem" }}>{entry.goal_description}</div>
                        <div style={{ whiteSpace: "pre-wrap", color: "#374151", lineHeight: 1.5, fontSize: "0.92rem" }}>{entry.progress_notes}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}