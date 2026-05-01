"use client";

import CsvUploader from "../components/CsvUploader";
import StudentSelector from "../components/StudentSelector";

export default function CaseManagerPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Case Manager Dashboard</h1>

      <CsvUploader />

      <StudentSelector
        mode="edit"
        onStudentSelected={(student) => console.log("Edit student:", student)}
      />
    </div>
  );
}
