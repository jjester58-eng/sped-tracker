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
    loadReportEntries();
  }, [selectedStudents]);

  const handleSave = async () => {
    if (selectedStudents.length === 0 || !notes.trim()) {
      alert('Please select students and write notes.');
      return;
    }

    if (!selectedGoalId) {
      alert('Please select a goal.');
      return;
    }

    setSaving(true);
    setSaveFeedback(null);

    try {
      const enteredById = '72d1fa4c-0a5b-4cb3-83b1-292a212921e1';
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const weekOf = new Date(today.setDate(diff)).toISOString().split('T')[0];
      const reviewDate = new Date().toISOString().split('T')[0];

      const studentIds = selectedStudents.map((s) => s.id);

      const { data: existing, error: fetchError } = await supabase
        .from('weekly_progress')
        .select('id, student_id')
        .in('student_id', studentIds)
        .eq('goal_id', selectedGoalId)
        .eq('week_of', weekOf);

      if (fetchError) {
        console.error('Error checking existing records', fetchError);
        setSaveFeedback({ type: 'error', message: 'Error checking existing records: ' + fetchError.message });
        setSaving(false);
        return;
      }

      const existingIds = new Set((existing || []).map((r: any) => r.student_id));
      const studentsToInsert = selectedStudents.filter((s) => !existingIds.has(s.id));
      const studentsToUpdate = selectedStudents.filter((s) => existingIds.has(s.id));

      let insertedCount = 0;
      let updatedCount = 0;

      if (studentsToInsert.length > 0) {
        const records = studentsToInsert.map((student) => ({
          student_id: student.id,
          week_of: weekOf,
          review_date: reviewDate,
          notes: notes.trim() + (providerName ? `\n\nEntered by: ${providerName}` : ''),
          progress_notes: notes.trim(),
          entered_by_id: enteredById,
          goal_id: selectedGoalId,
          case_manager_id: null,
        }));

        const { data: insertData, error: insertError } = await supabase.from('weekly_progress').insert(records);
        if (insertError) {
          console.error('Insert error', insertError);
          setSaveFeedback({ type: 'error', message: 'Save failed: ' + insertError.message });
          setSaving(false);
          return;
        }
        insertedCount = (insertData || []).length;
      }

      if (studentsToUpdate.length > 0) {
        const updatePromises = studentsToUpdate.map(async (student) => {
          const updatedNotes = notes.trim() + (providerName ? `\n\nEntered by: ${providerName}` : '');
          const { data: updData, error: updError } = await supabase
            .from('weekly_progress')
            .update({ notes: updatedNotes, progress_notes: notes.trim(), entered_by_id: enteredById, review_date: reviewDate })
            .match({ student_id: student.id, goal_id: selectedGoalId, week_of: weekOf });
          if (updError) throw updError;
          return (updData || []).length;
        });

        const results = await Promise.allSettled(updatePromises);
        for (const r of results) {
          if (r.status === 'fulfilled') updatedCount += Number(r.value || 0);
          else {
            console.error('Update error', r);
            setSaveFeedback({ type: 'error', message: 'Update failed for one or more students: ' + String((r as any).reason?.message ?? r) });
            setSaving(false);
            return;
          }
        }
      }

      if (insertedCount === 0 && updatedCount === 0) {
        setSaveFeedback({ type: 'error', message: 'No changes - selected students already have up-to-date records for this goal and week.' });
        setSaving(false);
        return;
      }

      setSaveFeedback({ type: 'success', message: `Saved ${insertedCount} new, ${updatedCount} updated.` });
      setNotes('');
      setSelectedStudents([]);
      setSelectedGoalId('');
      setSubject('');
      await loadReportEntries();
    } catch (err) {
      console.error('Error:', err);
      setSaveFeedback({ type: 'error', message: `Error: ${err instanceof Error ? err.message : String(err)}` });
    } finally {
      setSaving(false);
    }
  };

  const draftWordCount = notes.trim().split(/\s+/).filter(Boolean).length;
  const selectedSummaryLabel =
    selectedStudents.length === 0
      ? 'No students selected'
      : selectedStudents.length === 1
        ? '1 student selected'
        : `${selectedStudents.length} students selected`;

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '1.5rem 1rem' }}>
      <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '1.25rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1.5rem',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  marginBottom: '0.5rem',
                }}
              >
                <span>📘</span>
                <span>Teacher workflow</span>
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                Teacher Input
              </h1>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '4px', maxWidth: '32rem' }}>
                Filter students → pick goals → write progress notes
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div
                style={{
                  backgroundColor: selectedStudents.length ? '#eff6ff' : '#f3f4f6',
                  color: selectedStudents.length ? '#2563eb' : '#6b7280',
                  padding: '0.55rem 0.9rem',
                  borderRadius: '999px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                {selectedSummaryLabel}
              </div>
              {draftWordCount > 0 && (
                <div
                  style={{
                    backgroundColor: '#f0fdf4',
                    color: '#166534',
                    padding: '0.55rem 0.9rem',
                    borderRadius: '999px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                  }}
                >
                  {draftWordCount} word{draftWordCount === 1 ? '' : 's'}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: '1.5rem' }}>
            {/* LEFT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* 1. Filters */}
              <div
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '1rem',
                  padding: '1.1rem 1.25rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ marginBottom: '0.85rem' }}>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                    1. Filters
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '2px' }}>
                    Choose subject and grade levels to load the roster
                  </p>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gap: '0.85rem',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: '#6b7280',
                        marginBottom: '0.35rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                      }}
                    >
                      Subject
                    </label>
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
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: '#6b7280',
                        marginBottom: '0.35rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                      }}
                    >
                      Grade levels
                    </label>
                    <GradeLevelMultiSelector
                      value={selectedGradeLevels}
                      onChange={(val) => {
                        setSelectedGradeLevels(val);
                        setSelectedStudents([]);
                        setSelectedGoalId('');
                      }}
                    />
                  </div>
                </div>

                {(!subject || selectedGradeLevels.length === 0) && (
                  <div
                    style={{
                      marginTop: '0.85rem',
                      borderRadius: '0.75rem',
                      padding: '0.7rem 0.9rem',
                      backgroundColor: '#f8fafc',
                      color: '#64748b',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span>👆</span>
                    <span>Select a subject and at least one grade to continue</span>
                  </div>
                )}
              </div>

              {/* 2. Students */}
              <div
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '1rem',
                  padding: '1.1rem 1.25rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  flex: 1,
                }}
              >
                <div style={{ marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                    2. Students
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '2px' }}>
                    Select who you’re documenting today
                  </p>
                </div>

                {!canLoadStudents ? (
                  <div
                    style={{
                      minHeight: '320px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px dashed #e5e7eb',
                      borderRadius: '0.85rem',
                      backgroundColor: '#fafafa',
                      padding: '2rem',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '1.75rem', marginBottom: '0.6rem', opacity: 0.7 }}>👩‍🏫</div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#374151', margin: 0 }}>
                      Waiting for filters
                    </h3>
                    <p style={{ marginTop: '0.3rem', color: '#9ca3af', fontSize: '0.85rem' }}>
                      Subject + grade levels unlock the roster
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

            {/* RIGHT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* 3. Notes / entry */}
              <div
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '1rem',
                  padding: '1.1rem 1.25rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}
              >
                {selectedStudents.length > 0 ? (
                  <>
                    <div style={{ marginBottom: '0.85rem' }}>
                      <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                        3. Progress notes
                      </h2>
                      <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '2px' }}>
                        Goal, templates, and notes for the selected students
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                      {selectedStudents.map((s) => (
                        <div
                          key={s.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            backgroundColor: '#eff6ff',
                            color: '#2563eb',
                            padding: '0.45rem 0.7rem',
                            borderRadius: '999px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                          }}
                        >
                          <span>{s.name}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedStudents((prev) => prev.filter((x) => x.id !== s.id))}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#2563eb',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              lineHeight: 1,
                              padding: 0,
                            }}
                            aria-label={`Remove ${s.name}`}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.85rem',
                        padding: '0.9rem',
                        marginBottom: '0.85rem',
                      }}
                    >
                      {subject && (
                        <GoalSelector
                          subject={subject}
                          students={selectedStudents}
                          onChange={setSelectedGoalId}
                        />
                      )}
                    </div>

                    <div
                      style={{
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.85rem',
                        padding: '0.9rem',
                        marginBottom: '0.85rem',
                      }}
                    >
                      <div style={{ marginBottom: '0.5rem', fontWeight: 700, color: '#111827', fontSize: '0.9rem' }}>
                        Entered by
                      </div>
                      <input
                        type="text"
                        value={providerName}
                        onChange={(e) => setProviderName(e.target.value)}
                        placeholder="Enter your name"
                        style={{
                          width: '100%',
                          padding: '0.75rem 0.9rem',
                          borderRadius: '0.75rem',
                          border: '1px solid #d1d5db',
                          backgroundColor: 'white',
                          color: '#111827',
                          boxSizing: 'border-box',
                          fontSize: '0.9rem',
                        }}
                      />
                      <p style={{ marginTop: '0.5rem', color: '#9ca3af', fontSize: '0.8rem' }}>
                        Your name is remembered locally for the next save.
                      </p>
                    </div>

                    <div
                      style={{
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.85rem',
                        padding: '0.9rem',
                        marginBottom: '0.85rem',
                      }}
                    >
                      <div style={{ marginBottom: '0.6rem' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>Quick note templates</div>
                        <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '2px' }}>
                          Pick a starter and tailor it
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {NOTE_TEMPLATES.map((template) => (
                          <button
                            key={template.title}
                            type="button"
                            onClick={() =>
                              setNotes((prev) => (prev ? `${prev}\n\n${template.text}` : template.text))
                            }
                            style={{
                              border: '1px solid #d1d5db',
                              backgroundColor: 'white',
                              borderRadius: '999px',
                              padding: '0.4rem 0.7rem',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              color: '#374151',
                              cursor: 'pointer',
                            }}
                          >
                            {template.title}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: '0.85rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.4rem',
                        }}
                      >
                        <label
                          style={{
                            display: 'block',
                            fontWeight: 700,
                            color: '#111827',
                            fontSize: '0.9rem',
                          }}
                        >
                          Progress notes
                        </label>
                        <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                          {draftWordCount} word{draftWordCount === 1 ? '' : 's'}
                        </div>
                      </div>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        style={{
                          width: '100%',
                          minHeight: '200px',
                          padding: '0.85rem 0.9rem',
                          borderRadius: '0.85rem',
                          border: '1px solid #d1d5db',
                          resize: 'vertical',
                          backgroundColor: 'white',
                          color: '#374151',
                          boxSizing: 'border-box',
                          fontSize: '0.9rem',
                          lineHeight: 1.5,
                        }}
                        placeholder="Write observations, progress, behaviors, accommodations, and next steps..."
                      />
                    </div>

                    {saveFeedback && (
                      <div
                        style={{
                          marginBottom: '0.85rem',
                          borderRadius: '0.75rem',
                          padding: '0.7rem 0.9rem',
                          fontSize: '0.85rem',
                          border:
                            saveFeedback.type === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca',
                          backgroundColor: saveFeedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
                          color: saveFeedback.type === 'success' ? '#166534' : '#b91c1c',
                        }}
                      >
                        {saveFeedback.message}
                      </div>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.75rem',
                        flexWrap: 'wrap',
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.85rem',
                        padding: '0.8rem 0.9rem',
                      }}
                    >
                      <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                        {notes.trim() ? 'Draft is ready to save.' : 'Start typing to build your note.'}
                      </div>
                      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          style={{
                            backgroundColor: '#2563eb',
                            color: 'white',
                            padding: '0.65rem 1.1rem',
                            borderRadius: '0.75rem',
                            border: 'none',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            opacity: saving ? 0.7 : 1,
                            fontWeight: 600,
                            fontSize: '0.9rem',
                          }}
                        >
                          {saving ? 'Saving...' : 'Save notes'}
                        </button>
                        <button
                          onClick={() => {
                            setNotes('');
                            setSelectedGoalId('');
                            setSaveFeedback(null);
                          }}
                          style={{
                            backgroundColor: 'white',
                            color: '#374151',
                            padding: '0.65rem 1.1rem',
                            borderRadius: '0.75rem',
                            border: '1px solid #d1d5db',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                          }}
                        >
                          Clear draft
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      minHeight: '380px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px dashed #e5e7eb',
                      borderRadius: '0.85rem',
                      backgroundColor: '#fafafa',
                      padding: '2rem',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '1.75rem', marginBottom: '0.6rem', opacity: 0.7 }}>📝</div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#374151', margin: 0 }}>
                      Start your entry
                    </h3>
                    <p style={{ marginTop: '0.3rem', color: '#9ca3af', fontSize: '0.85rem' }}>
                      Select one or more students to begin writing progress notes
                    </p>
                  </div>
                )}
              </div>

              {/* Today's notes */}
              <div
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '1rem',
                  padding: '1.1rem 1.25rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div>
                    <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                      Today’s notes
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '2px' }}>
                      Latest teacher input for today
                    </p>
                  </div>
                  <div
                    style={{
                      backgroundColor: '#f3f4f6',
                      color: '#6b7280',
                      padding: '0.35rem 0.65rem',
                      borderRadius: '999px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    {reportEntries.length} entr{reportEntries.length === 1 ? 'y' : 'ies'}
                  </div>
                </div>

                {todaySummary ? (
                  <div
                    style={{
                      marginBottom: '0.75rem',
                      borderRadius: '0.75rem',
                      backgroundColor: '#eff6ff',
                      color: '#1d4ed8',
                      padding: '0.75rem 0.9rem',
                      fontSize: '0.85rem',
                    }}
                  >
                    {todaySummary}
                  </div>
                ) : (
                  <div
                    style={{
                      marginBottom: '0.75rem',
                      borderRadius: '0.75rem',
                      border: '1px dashed #e5e7eb',
                      backgroundColor: '#fafafa',
                      padding: '0.75rem 0.9rem',
                      color: '#9ca3af',
                      fontSize: '0.85rem',
                    }}
                  >
                    No notes saved for today yet.
                  </div>
                )}

                {!selectedStudents.length ? (
                  <div
                    style={{
                      borderRadius: '0.75rem',
                      border: '1px dashed #e5e7eb',
                      backgroundColor: '#fafafa',
                      padding: '0.75rem 0.9rem',
                      color: '#9ca3af',
                      fontSize: '0.85rem',
                    }}
                  >
                    Select students to view their teacher input history.
                  </div>
                ) : reportLoading ? (
                  <div
                    style={{
                      borderRadius: '0.75rem',
                      border: '1px dashed #e5e7eb',
                      backgroundColor: '#fafafa',
                      padding: '0.75rem 0.9rem',
                      color: '#9ca3af',
                      fontSize: '0.85rem',
                    }}
                  >
                    Loading report...
                  </div>
                ) : reportEntries.length === 0 ? (
                  <div
                    style={{
                      borderRadius: '0.75rem',
                      border: '1px dashed #e5e7eb',
                      backgroundColor: '#fafafa',
                      padding: '0.75rem 0.9rem',
                      color: '#9ca3af',
                      fontSize: '0.85rem',
                    }}
                  >
                    No teacher entries found for the selected students yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {reportEntries.map((entry) => (
                      <div
                        key={entry.id}
                        style={{
                          borderRadius: '0.75rem',
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          padding: '0.8rem 0.9rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '0.75rem',
                            marginBottom: '0.3rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem' }}>
                            {entry.student_name}
                          </div>
                          <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{entry.review_date}</div>
                        </div>
                        <div
                          style={{
                            color: '#2563eb',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            marginBottom: '0.3rem',
                          }}
                        >
                          {entry.goal_description}
                        </div>
                        <div
                          style={{
                            whiteSpace: 'pre-wrap',
                            color: '#374151',
                            lineHeight: 1.5,
                            fontSize: '0.85rem',
                          }}
                        >
                          {entry.progress_notes}
                        </div>
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