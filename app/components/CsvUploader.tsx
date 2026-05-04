"use client";

import Papa from "papaparse";
import { supabase } from "@/lib/supabaseClient";

type CsvRow = {
  name: string;
  grade_level: string;
};

export default function CsvUploader() {
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,

      async complete(results) {
        const rows = results.data;

        for (const row of rows) {
          if (!row?.name) continue;

          const { error } = await supabase.from("students").insert({
            name: row.name,
            grade_level: row.grade_level || null,
          });

          if (error) {
            console.error(error);
          }
        }
      },
    });
  }

  return (
    <div>
      <input type="file" accept=".csv" onChange={handleUpload} />
    </div>
  );
}