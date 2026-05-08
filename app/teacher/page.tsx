'use client';

import { useState, useMemo } from 'react';
import MultiStudentPicker from '@/app/components/MultiStudentPicker';
import SubjectSelector from '@/app/components/SubjectSelector';
import GradeLevelMultiSelector from '@/app/components/GradeLevelMultiSelector';
import GoalSelector from '@/app/components/GoalSelector';
import type { Student } from '@/app/components/index';

export default function TeacherPage() {
  const [subject, setSubject] = useState<string>("");
  const [selectedGradeLevels, setSelectedGradeLevels] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Filter students based on selected subject + grade levels
  const filteredStudents = useMemo(() => {
    // For now we'll pass all students and let MultiStudentPicker handle it
    // We can enhance the picker later to accept filters
    return [];
  }, [subject, selectedGradeLevels]);

  const handleSave = () => {
    if (selectedStudents.length === 0 || !notes.trim()) {
      alert("Please select students and write notes.");
      return;
    }

    console.log("Saving:", { subject, gradeLevels: selectedGradeLevels, students: selectedStudents.map(s => s.name), goal_id: selectedGoalId, notes });
    alert("✅ Notes saved successfully!");
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold mb-2">Teacher Input</h1>
        <p className="text-gray-600">Log progress notes by subject and grade level</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Filters Panel */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-semibold text-lg mb-5">Filter Students</h2>

            <div className="space-y-6">
              <SubjectSelector 
                value={subject} 
                onChange={(val) => {
                  setSubject(val);
                  setSelectedStudents([]); // reset students when subject changes
                }} 
              />

              <div>
                <label className="font-semibold block mb-2">Grade Level(s)</label>
                <GradeLevelMultiSelector 
                  value={selectedGradeLevels}
                  onChange={setSelectedGradeLevels}
                />
              </div>
            </div>
          </div>

          {/* Student List - Filtered */}
          <MultiStudentPicker
            value={selectedStudents}
            onChange={setSelectedStudents}
            subject={subject}                    // New prop
            gradeLevels={selectedGradeLevels}    // New prop
            searchPlaceholder="Search filtered students..."
          />
        </div>

        {/* Notes Input */}
        <div className="lg:col-span-7">
          {selectedStudents.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <div className="flex flex-wrap gap-2 mb-8">
                {selectedStudents.map((s) => (
                  <div key={s.id} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm inline-flex items-center gap-2">
                    {s.name}
                    <button onClick={() => setSelectedStudents(prev => prev.filter(x => x.id !== s.id))} className="font-bold">✕</button>
                  </div>
                ))}
              </div>

              {subject && (
                <GoalSelector
                  subject={subject}
                  students={selectedStudents}
                  onChange={setSelectedGoalId}
                />
              )}

              <div className="mt-8">
                <label className="font-semibold block mb-3">Progress Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Write your observations, progress toward goals, strengths, areas for improvement..."
                  className="w-full h-72 p-5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-4 mt-10">
                <button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 rounded-2xl transition">
                  Save Notes for {selectedStudents.length} Student{selectedStudents.length > 1 ? 's' : ''}
                </button>
                <button onClick={() => { setSelectedStudents([]); setNotes(""); setSelectedGoalId(""); }} className="px-8 border border-gray-300 hover:bg-gray-50 rounded-2xl transition">
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <div className="h-[500px] flex items-center justify-center border border-dashed border-gray-300 rounded-3xl bg-white">
              <div className="text-center">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-500">Select subject, grade level, and students to begin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}