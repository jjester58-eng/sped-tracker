"use client";

import { useState } from "react";
import CsvUploader from "../components/CsvUploader";
import StudentSelector from "../components/StudentSelector";
import { getSupabase } from "@/lib/supabaseClient";

export default function CaseManagerPage() {
  const supabase = getSupabase();

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
