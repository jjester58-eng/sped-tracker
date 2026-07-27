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

  const handleSave = async () => {
    if (selectedStudents.length === 0 || !notes.trim()) {
      setSaveFeedback({ type: 'error', message: 'Select students and add a note before saving.' });
      return;
    }

    if (!selectedGoalId) {
      setSaveFeedback({ type: 'error', message: 'Choose a goal before saving your notes.' });
      return;
    }

    setSaving(true);
    setSaveFeedback(null);

    try {
      const payload = selectedStudents.map((student) => ({
        student_id: student.id,
        goal_id: selectedGoalId,
        progress_notes: notes.trim(),
        review_date: new Date().toISOString().split('T')[0],
      }));

      const { error } = await supabase.from('weekly_progress').insert(payload as any);

      if (error) throw error;

      setNotes('');
      setSelectedGoalId('');
      await loadReportEntries();
      setSaveFeedback({ type: 'success', message: 'Notes saved successfully.' });
    } catch (error) {
      console.error(error);
      setSaveFeedback({ type: 'error', message: 'Unable to save notes right now. Please try again.' });
    } finally {
      setSaving(false);
      window.setTimeout(() => setSaveFeedback(null), 3200);
    }
  };

  const draftWordCount = notes.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 p-8 text-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.55)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-sm font-medium backdrop-blur">
                Teacher workspace
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Capture student progress with clarity
              </h1>
              <p className="mt-3 text-sm text-blue-50 sm:text-base">
                Choose a subject, narrow by grade level, select students, and log meaningful notes in one streamlined flow.
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
              <div className="text-sm text-blue-100">Current selection</div>
              <div className="mt-1 text-lg font-semibold">
                {selectedStudents.length} student{selectedStudents.length === 1 ? '' : 's'} selected
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
                  <p className="text-sm text-slate-500">Start by narrowing the student list.</p>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                  {subject ? subject : 'No subject'}
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
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
                <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Select a subject and at least one grade level to load students.
                </div>
              )}
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              {!canLoadStudents ? (
                <div className="flex h-[360px] flex-col items-center justify-center rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
                  <div className="mb-3 text-4xl">👩‍🏫</div>
                  <h3 className="text-lg font-semibold text-slate-900">Choose your filters</h3>
                  <p className="mt-2 text-sm text-slate-500">
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

          <div className="space-y-6">
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              {selectedStudents.length > 0 ? (
                <>
                  <div className="mb-6 flex flex-wrap items-center gap-2">
                    {selectedStudents.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
                      >
                        <span>{s.name}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedStudents((prev) => prev.filter((x) => x.id !== s.id))}
                          className="rounded-full p-1 text-blue-600 transition hover:bg-blue-100 hover:text-blue-800"
                          aria-label={`Remove ${s.name}`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    {subject && (
                      <GoalSelector
                        subject={subject}
                        students={selectedStudents}
                        onChange={setSelectedGoalId}
                      />
                    )}
                  </div>

                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Quick note templates</div>
                        <div className="text-xs text-slate-500">Pick a starter and tweak it for the student.</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {NOTE_TEMPLATES.map((template) => (
                        <button
                          key={template.title}
                          type="button"
                          onClick={() => setNotes((prev) => prev ? `${prev}\n\n${template.text}` : template.text)}
                          className="rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                        >
                          {template.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block text-sm font-semibold text-slate-900">
                        Progress notes
                      </label>
                      <div className="text-xs font-medium text-slate-500">
                        {draftWordCount} word{draftWordCount === 1 ? '' : 's'}
                      </div>
                    </div>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[240px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      placeholder="Write observations, progress, behaviors, accommodations, and next steps..."
                    />
                  </div>

                  {saveFeedback && (
                    <div
                      className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${saveFeedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}
                    >
                      {saveFeedback.message}
                    </div>
                  )}

                  <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-slate-500">
                      {notes.trim() ? 'Draft is ready to save.' : 'Start typing to build your note.'}
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? 'Saving...' : 'Save notes'}
                      </button>

                      <button
                        onClick={() => {
                          setNotes('');
                          setSelectedGoalId('');
                          setSaveFeedback(null);
                        }}
                        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Clear draft
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-[420px] flex-col items-center justify-center rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
                  <div className="mb-3 text-4xl">📝</div>
                  <h3 className="text-lg font-semibold text-slate-900">Start your entry</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Select one or more students to begin writing progress notes.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Today&apos;s notes</h2>
                  <p className="text-sm text-slate-500">A compact summary of the latest teacher input for today.</p>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                  {reportEntries.length} entr{reportEntries.length === 1 ? 'y' : 'ies'}
                </div>
              </div>

              {todaySummary ? (
                <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  {todaySummary}
                </div>
              ) : (
                <div className="mb-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  No notes saved for today yet.
                </div>
              )}

              {!selectedStudents.length ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Select students to view their teacher input history.
                </div>
              ) : reportLoading ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Loading report...
                </div>
              ) : reportEntries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  No teacher entries found for the selected students yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {reportEntries.map((entry) => (
                    <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="font-semibold text-slate-900">{entry.student_name}</div>
                        <div className="text-sm text-slate-500">{entry.review_date}</div>
                      </div>
                      <div className="mb-2 text-sm font-medium text-blue-700">{entry.goal_description}</div>
                      <div className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{entry.progress_notes}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}