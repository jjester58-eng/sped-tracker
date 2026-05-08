'use client';

import { useState } from 'react';
import MultiStudentPicker from '@/app/components/MultiStudentPicker';
import SubjectSelector from '@/app/components/SubjectSelector';
import GoalSelector from '@/app/components/GoalSelector';
import type { Student } from '@/app/components/index';

export default function TeacherPage() {
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [subject, setSubject] = useState<string>("");
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const handleSave = () => {
    if (selectedStudents.length === 0 || !notes.trim()) {
      alert("Please select at least one student and write notes.");
      return;
    }

    console.log("Saving notes:", {
      students: selectedStudents.map(s => s.name),
      subject,
      goal_id: selectedGoalId,
      notes,
      created_at: new Date().toISOString(),
    });

    alert("✅ Notes saved successfully!");

    // Optional: Reset after save
    // setNotes("");
    // setSelectedGoalId("");
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold mb-2">Teacher Input</h1>
        <p className="text-gray-600">
          Log weekly progress notes for one or multiple students
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Student Selection */}
        <div className="lg:col-span-5">
          <MultiStudentPicker
            value={selectedStudents}
            onChange={setSelectedStudents}
          />
        </div>

        {/* Input Form */}
        <div className="lg:col-span-7">
          {selectedStudents.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              
              {/* Selected Students Chips */}
              <div className="flex flex-wrap gap-2 mb-8">
                {selectedStudents.map((student) => (
                  <div
                    key={student.id}
                    className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium"
                  >
                    {student.name}
                    <button
                      onClick={() => 
                        setSelectedStudents(prev => prev.filter(s => s.id !== student.id))
                      }
                      className="text-blue-500 hover:text-red-600 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-8">
                <SubjectSelector 
                  value={subject} 
                  onChange={setSubject} 
                />

                {subject && selectedStudents.length > 0 && (
                  <GoalSelector
                    subject={subject}
                    students={selectedStudents}
                    onChange={setSelectedGoalId}
                  />
                )}

                <div>
                  <label className="font-semibold block mb-3">
                    Progress Notes
                    {selectedStudents.length > 1 && ` (${selectedStudents.length} students)`}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Write detailed observations, progress toward IEP goals, concerns, and recommendations..."
                    className="w-full h-64 p-5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 rounded-2xl transition"
                >
                  Save Notes
                </button>

                <button
                  onClick={() => {
                    setSelectedStudents([]);
                    setSubject("");
                    setSelectedGoalId("");
                    setNotes("");
                  }}
                  className="px-8 border border-gray-300 hover:bg-gray-50 rounded-2xl transition"
                >
                  Clear All
                </button>
              </div>
            </div>
          ) : (
            <div className="h-[500px] flex items-center justify-center border border-dashed border-gray-300 rounded-3xl bg-white">
              <div className="text-center">
                <div className="text-6xl mb-6">👥</div>
                <h3 className="text-xl font-medium text-gray-400">No students selected</h3>
                <p className="text-gray-500">Select students from the left panel to begin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}