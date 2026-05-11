'use client';

import { useState } from 'react';
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
        <h1 className="text-3xl font-semibold mb-2">Teacher Input</h1>
        <p className="text-gray-600">
          Log progress notes by subject and grade level
        </p>
      </div>

      {/* TOP FILTER BAR */}
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
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* STUDENTS */}
        <div className="lg:col-span-5">
          <MultiStudentPicker
            value={selectedStudents}
            onChange={setSelectedStudents}
            subject={subject}
            gradeLevels={selectedGradeLevels}
            searchPlaceholder="Search filtered students..."
          />
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
                    className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm flex items-center gap-2"
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
                <label className="font-semibold block mb-2">
                  Progress Notes
                </label>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-72 p-4 border rounded-xl"
                  placeholder="Write observations..."
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
            <div className="h-[500px] flex items-center justify-center border border-dashed rounded-2xl">
              Select subject, grade, and students
            </div>
          )}

        </div>
      </div>
    </div>
  );
}