'use client';

import { useMemo, useState } from 'react';
import MultiStudentPicker from '@/app/components/MultiStudentPicker';
import SubjectSelector from '@/app/components/SubjectSelector';
import GradeLevelMultiSelector from '@/app/components/GradeLevelMultiSelector';
import GoalSelector from '@/app/components/GoalSelector';
import { useClassesAsSubjects } from '@/app/hooks/useClassesAsSubjects';
import type { Student } from '@/app/components/index';

export default function TeacherPage() {
  const { subjects, loading: subjectsLoading } = useClassesAsSubjects();

  const [subject, setSubject] = useState('');
  const [selectedGradeLevels, setSelectedGradeLevels] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [notes, setNotes] = useState('');

  /**
   * IMPORTANT:
   * This assumes MultiStudentPicker either:
   *  - fetches students internally, OR
   *  - accepts filters and returns filtered results
   *
   * We are enforcing UI gating here (not showing until ready)
   */
  const canLoadStudents = subject.length > 0 && selectedGradeLevels.length > 0;

  const handleSave = () => {
    if (selectedStudents.length === 0 || !notes.trim()) {
      alert('Please select students and write notes.');
      return;
    }

    console.log({
      subject,
      gradeLevels: selectedGradeLevels,
      students: selectedStudents.map(s => s.name),
      goal_id: selectedGoalId,
      notes
    });

    alert('Saved!');
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
              onChange={setSelectedStudents}
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
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl"
                >
                  Save Notes
                </button>

                <button
                  onClick={() => {
                    setSelectedStudents([]);
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
    </div>
  );
}