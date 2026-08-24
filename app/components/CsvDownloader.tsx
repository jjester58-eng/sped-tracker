"use client";
export const dynamic = "force-dynamic";
import Papa from "papaparse";

type Student = {
  id: string;
  name: string;
  grade_level?: string | null;
};

type CsvDownloaderProps = {
  students: Student[];
  filename?: string;
};

export default function CsvDownloader({
  students,
  filename = "students.csv",
}: CsvDownloaderProps) {
  function download() {
    if (!students?.length) {
      alert("No student data available to download.");
      return;
    }

    // ONLY export what you want
    const cleanData = students.map((s) => ({
      id: s.id,
      name: s.name,
      grade_level: s.grade_level ?? "",
    }));

    const csv = Papa.unparse(cleanData);

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <button
      onClick={download}
      className="bg-purple-600 text-white px-4 py-2 rounded"
    >
      Download CSV
    </button>
  );
}