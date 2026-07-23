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

export default function TeacherPage() {
  const supabase = useSupabase();
  const { subjects, loading: subjectsLoading } = useClassesAsSubjects();

  const [subject, setSubject] = useState('');
  const [selectedGradeLevels, setSelectedGradeLevels] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [reportEntries, setReportEntries] = useState<ReportEntry[]>([]);
  const [reportLoading, setReportLoading] = useState(false);

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
      const mappedEntries = entries
        .map((entry) => ({
          ...entry,
          student_name: studentMap.get(entry.student_id) ?? 'Unknown student',
          goal_description: goalMap.get(entry.goal_id) ?? 'Unknown goal',
        }))
        .filter((entry) => {
          if (!normalizedSubject) return true;
          return entry.goal_description.toLowerCase().includes(normalizedSubject);
        });

      setReportEntries(mappedEntries);
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
      alert('Please select students and write notes.');
      return;
    }

    if (!selectedGoalId) {
      alert('Please select a goal before saving.');
      return;
    }

    setSaving(true);

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
      alert('Notes saved successfully.');
    } catch (error) {
      console.error(error);
      alert('Unable to save notes right now.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2 text-gray-900">
          Teacher Input
        </h1>
        <p className="text-gray-600">
          Select subject → grade level → students → enter notes
        </p>
      </div>

      {/* FILTERS */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

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

        {/* hint state */}
        {(!subject || selectedGradeLevels.length === 0) && (
          <p className="text-sm text-gray-500 mt-4">
            Select a subject and grade level to load students.
          </p>
        )}
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* STUDENTS */}
        <div className="lg:col-span-5">

          {!canLoadStudents ? (
            <div className="h-[420px] flex items-center justify-center border border-dashed rounded-2xl bg-white">
              <p className="text-gray-500 text-center px-6">
                Choose subject and grade level to view students
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

        {/* NOTES */}
        <div className="lg:col-span-7">

          {selectedStudents.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8">

              {/* selected students */}
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedStudents.map((s) => (
                  <div
                    key={s.id}
                    className="bg-blue-50 text-blue-800 px-4 py-2 rounded-full text-sm flex items-center gap-2"
                  >
                    {s.name}
                    <button
                      onClick={() =>
                        setSelectedStudents(prev =>
                          prev.filter(x => x.id !== s.id)
                        )
                      }
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* goals */}
              {subject && (
                <GoalSelector
                  subject={subject}
                  students={selectedStudents}
                  onChange={setSelectedGoalId}
                />
              )}

              {/* notes */}
              <div className="mt-6">
                <label className="font-semibold block mb-2 text-gray-900">
                  Progress Notes
                </label>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-72 p-4 border rounded-xl"
                  placeholder="Write observations, progress, behaviors, accommodations..."
                />
              </div>

              {/* actions */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Notes'}
                </button>

                <button
                  onClick={() => {
                    setNotes('');
                    setSelectedGoalId('');
                  }}
                  className="px-6 border rounded-xl"
                >
                  Clear
                </button>
              </div>

            </div>
          ) : (
            <div className="h-[420px] flex items-center justify-center border border-dashed rounded-2xl bg-white">
              <p className="text-gray-500">
                Select students to begin data entry
              </p>
            </div>
          )}

        </div>
      </div>

      <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Teacher Entry Report</h2>
            <p className="text-sm text-gray-600">
              Review prior notes entered for the selected students.
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {reportEntries.length} entr{reportEntries.length === 1 ? 'y' : 'ies'}
          </div>
        </div>

        {!selectedStudents.length ? (
          <p className="text-gray-500">
            Select students to view their teacher input history.
          </p>
        ) : reportLoading ? (
          <p className="text-gray-500">Loading report...</p>
        ) : reportEntries.length === 0 ? (
          <p className="text-gray-500">
            No teacher entries found for the selected students yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600">
                  <th className="py-3 pr-4 font-medium">Student</th>
                  <th className="py-3 pr-4 font-medium">Goal</th>
                  <th className="py-3 pr-4 font-medium">Review date</th>
                  <th className="py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {reportEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-100 align-top">
                    <td className="py-3 pr-4 font-medium text-gray-900">{entry.student_name}</td>
                    <td className="py-3 pr-4 text-gray-700">{entry.goal_description}</td>
                    <td className="py-3 pr-4 text-gray-600">{entry.review_date}</td>
                    <td className="py-3 text-gray-700 whitespace-pre-wrap">{entry.progress_notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}