"use client";

import { useState } from "react";
import CsvUploader from "../components/CsvUploader";
import StudentSelector from "../components/StudentSelector";
import StudentEditor from "../components/StudentEditor";

type Student = {
  id: string;
  name: string;
  grade_level: string | null;
};

export default function CaseManagerPage() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Case Manager Dashboard</h1>

      <CsvUploader />

      <StudentSelector
        mode="edit"
        onStudentSelected={(student) => setSelectedStudent(student)}
      />

      {selectedStudent && (
        <StudentEditor student={selectedStudent} />
      )}

      <button
        onClick={() => alert("Archive logic goes here")}
        className="bg-gray-600 text-white px-4 py-2 rounded"
      >
        Archive
      </button>
    </div>
  );
}
