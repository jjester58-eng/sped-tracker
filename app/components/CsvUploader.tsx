"use client";

export const dynamic = "force-dynamic";

import Papa from "papaparse";
import { useState } from "react";
import { useSupabase } from "@/lib/useSupabase";

type CsvRow = {
  student_name?: string;
  name?: string;
  grade?: string;
  grade_level?: string;
  case_manager?: string;
  schedule?: string;
  accommodations?: string;
  accomodations?: string;
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
        try {
          const rawRows = results.data || [];
          const cleaned = rawRows
            .map((row) => {
              const studentName = (row.student_name || row.name || "").trim();
              const gradeLevel = (row.grade || row.grade_level || "").trim();
              const caseManager = (row.case_manager || "").trim();
              const accommodations = (
                row.accommodations ||
                row.accomodations ||
                ""
              ).trim();

              return {
                name: studentName,
                grade_level: gradeLevel || null,
                case_manager: caseManager || null,
                is_active: true,
                status: "active",
                accommodations: accommodations,
              };
            })
            .filter((row) => row.name.length > 0);

          if (cleaned.length === 0) {
            setMessage(
              "No valid student rows found in CSV. Please ensure the CSV includes a 'student_name' or 'name' header."
            );
            setLoading(false);
            setIsSuccess(false);
            return;
          }

          const studentPayload = cleaned.map((s) => ({
            name: s.name,
            grade_level: s.grade_level,
            case_manager: s.case_manager,
            is_active: true,
            status: "active",
          }));

          const { error: insertError } = await supabase
            .from("students")
            .insert(studentPayload as any);

          if (insertError) throw insertError;

          setMessage(
            `✅ Successfully imported ${cleaned.length} student${
              cleaned.length > 1 ? "s" : ""
            } into Supabase!`
          );
          setIsSuccess(true);
          onUploadSuccess?.();
        } catch (err: any) {
          console.error("CSV upload error:", err);
          setMessage(`Upload failed: ${err?.message || String(err)}`);
          setIsSuccess(false);
        } finally {
          setLoading(false);
          e.target.value = "";
        }
      },
      error(err) {
        console.error("CSV parse error:", err);
        setMessage(`CSV parsing error: ${err.message}`);
        setLoading(false);
        setIsSuccess(false);
      },
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div
        style={{
          border: "2px dashed #cbd5e1",
          borderRadius: "0.75rem",
          padding: "1.25rem",
          backgroundColor: "#f8fafc",
          textAlign: "center",
        }}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleUpload}
          disabled={loading}
          id="csv-file-input"
          style={{ display: "none" }}
        />
        <label
          htmlFor="csv-file-input"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.65rem 1.25rem",
            backgroundColor: "#2563eb",
            color: "white",
            borderRadius: "0.5rem",
            fontWeight: 600,
            fontSize: "0.9rem",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          <span>📁</span> {loading ? "Importing Students..." : "Choose CSV File to Upload"}
        </label>
        <p
          style={{
            fontSize: "0.78rem",
            color: "#64748b",
            margin: "0.6rem 0 0",
          }}
        >
          Supported headers: <code>student_name</code>, <code>grade</code>,{" "}
          <code>case_manager</code>, <code>schedule</code>,{" "}
          <code>accommodations</code>
        </p>
      </div>

      {loading && (
        <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
          Uploading and processing records...
        </p>
      )}

      {message && (
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            fontSize: "0.88rem",
            fontWeight: 600,
            backgroundColor: isSuccess ? "#f0fdf4" : "#fef2f2",
            color: isSuccess ? "#166534" : "#991b1b",
            border: `1px solid ${isSuccess ? "#bbf7d0" : "#fecaca"}`,
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}