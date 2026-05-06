"use client";
export const dynamic = "force-dynamic";
import Papa from "papaparse";
import { useEffect, useState } from "react";
import { useSupabase } from "@/lib/useSupabase";

// Inside component:
const supabase = useSupabase();

type CsvRow = {
  name: string;
  grade_level?: string;
};

export default function CsvUploader() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage(null);

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,

      async complete(results) {
        const cleaned = (results.data || [])
          .map((row) => ({
            name: row.name?.trim(),
            grade_level: row.grade_level?.trim() || null,
          }))
          .filter((row) => row.name);

        if (cleaned.length === 0) {
          setMessage("No valid rows found.");
          setLoading(false);
          return;
        }

        // BULK INSERT (much faster)
        const { error } = await supabase.from("students").insert(cleaned);

        if (error) {
          console.error(error);
          setMessage("Upload failed. Check console for details.");
        } else {
          setMessage(`Successfully uploaded ${cleaned.length} students.`);
        }

        setLoading(false);
        e.target.value = ""; // allows re-upload of same file
      },
    });
  }

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept=".csv"
        onChange={handleUpload}
        disabled={loading}
      />

      {loading && <p>Uploading...</p>}
      {message && <p>{message}</p>}
    </div>
  );
}