'use client';

import { useState, useMemo } from 'react';

const students = [
  { id: 1, name: "Emma Thompson", grade: "3rd", iepGoal: "Reading Comprehension" },
  { id: 2, name: "Liam Rodriguez", grade: "4th", iepGoal: "Math Fluency" },
  { id: 3, name: "Sophia Chen", grade: "2nd", iepGoal: "Writing Skills" },
  { id: 4, name: "Noah Patel", grade: "5th", iepGoal: "Social Skills" },
  { id: 5, name: "Olivia Kim", grade: "3rd", iepGoal: "Reading Fluency" },
  { id: 6, name: "James Wilson", grade: "4th", iepGoal: "Behavior Goals" },
  { id: 7, name: "Ava Martinez", grade: "2nd", iepGoal: "Math Concepts" },
];

export default function TeacherPage() {
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    return students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.grade.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const toggleStudent = (id: number) => {
    setSelectedStudentIds(prev =>
      prev.includes(id)
        ? prev.filter(studentId => studentId !== id)
        : [...prev, id]
    );
  };

  const removeStudent = (id: number) => {
    setSelectedStudentIds(prev => prev.filter(studentId => studentId !== id));
  };

  const clearAll = () => setSelectedStudentIds([]);

  const selectedStudents = students.filter(s => selectedStudentIds.includes(s.id));

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">Teacher Input</h1>
        <p className="text-gray-600">Log weekly progress notes for one or multiple students</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Student Selection Panel */}
        <div className="lg:col-span-5 bg-white border border-gray-200 rounded-2xl p-6 h-fit sticky top-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Select Students</h2>
            {selectedStudentIds.length > 0 && (
              <button
                onClick={clearAll}
                className="text-sm text-red-600 hover:text-red-700 transition"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Search Input */}
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Students List */}
          <div className="max-h-[480px] overflow-y-auto pr-2 space-y-1">
            {filteredStudents.length > 0 ? (
              filteredStudents.map(student => {
                const isSelected = selectedStudentIds.includes(student.id);
                return (
                  <label
                    key={student.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition
                      ${isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleStudent(student.id)}
                      className="w-5 h-5 accent-blue-600"
                    />
                    <div>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-gray-500">
                        {student.grade} • {student.iepGoal}
                      </div>
                    </div>
                  </label>
                );
              })
            ) : (
              <p className="text-gray-500 py-8 text-center">No students found</p>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="lg:col-span-7">
          {selectedStudents.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedStudents.map(student => (
                  <div
                    key={student.id}
                    className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium"
                  >
                    {student.name}
                    <button
                      onClick={() => removeStudent(student.id)}
                      className="text-blue-400 hover:text-blue-600 ml-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-4">
                  Weekly Progress Notes
                  {selectedStudents.length > 1 && ` (for ${selectedStudents.length} students)`}
                </h3>
                
                <textarea
                  placeholder="Write your observations, progress, concerns, or next steps..."
                  className="w-full h-64 p-5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />
              </div>

              <div className="flex gap-4">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 rounded-2xl transition">
                  Save Notes for All Selected
                </button>
                <button 
                  onClick={clearAll}
                  className="px-8 border border-gray-300 hover:bg-gray-50 rounded-2xl transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center border border-dashed border-gray-300 rounded-3xl text-center">
              <div>
                <div className="text-5xl mb-4">👥</div>
                <p className="text-gray-500 text-lg">Select students on the left to begin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}