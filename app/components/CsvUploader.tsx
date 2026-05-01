"use client";

import Papa from "papaparse";
import { getSupabase } from "@/lib/supabaseClient";

type CsvRow = {
  name: string;
  grade_level: string;
};

export default function CsvUploader() {
  const supabase = getSupabase();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,

      async complete(results) {
        const rows = results.data;

        for (const row of rows) {
          if (!row?.name) continue;

          const { error } = await supabase.from("students").upsert({
            name: row.name,
            grade_level: row.grade_level || null,
          });

          if (error) {
            console.error("Insert error:", error);
          }
        }
      },
    });
  }

  return (
    <div className="space-y-2">
      <label className="font-semibold">Upload Students CSV</label>

      <input
        type="file"
        accept=".csv"
        onChange={handleUpload}
      />
    </div>
  );
}