"use client";

import Papa from "papaparse";
import { getSupabase } from "@/lib/supabaseClient";

export default function CsvUploader() {
  const supabase = getSupabase();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        for (const row of results.data) {
          await supabase.from("students").upsert({
            name: row.name,
            grade_level: row.grade_level,
          });
        }
      },
    });
  }

  return (
    <div>
      <label className="font-semibold">Upload Students CSV</label>
      <input type="file" accept=".csv" onChange={handleUpload} />
    </div>
  );
}
