"use client";

import Papa from "papaparse";

type CsvDownloaderProps = {
  students: any[]; // you can replace with your Student type if needed
};

export default function CsvDownloader({ students }: CsvDownloaderProps) {
  function download() {
    if (!students || students.length === 0) {
      alert("No student data available to download.");
      return;
    }

    const csv = Papa.unparse(students);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "students.csv";
    a.click();

    URL.revokeObjectURL(url);
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
