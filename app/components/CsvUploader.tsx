"use client";
export const dynamic = "force-dynamic";
import Papa from "papaparse";
import { useState } from "react";
import { useSupabase } from "@/lib/useSupabase";

type CsvRow = {
  name: string;
  grade_level?: string;
};

interface CsvUploaderProps {
  onUploadSuccess?: () => void;
}

export default function CsvUploader({ onUploadSuccess }: CsvUploaderProps) {
  const supabase = useSupabase();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    setMessage(null);
    setIsSuccess(false);
    
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
          setIsSuccess(false);
          return;
        }
        
        const { error } = await supabase.from("students").insert(cleaned);
        if (error) {
          console.error(error);
          setMessage("Upload failed. Check console for details.");
          setIsSuccess(false);
        } else {
          setMessage(`Successfully uploaded ${cleaned.length} students.`);
          setIsSuccess(true);
          onUploadSuccess?.();
        }
        
        setLoading(false);
        e.target.value = "";
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
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100
          disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {loading && <p className="text-sm text-gray-600">Uploading...</p>}
      {message && (
        <p className={`text-sm ${isSuccess ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
