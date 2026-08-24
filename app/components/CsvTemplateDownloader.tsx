"use client";

import Papa from "papaparse";

export default function CsvTemplateDownloader() {
  const downloadTemplate = () => {
    const templateData = [
      {
        student_name: "John Doe",
        grade: "9",
        case_manager: "Coach Smith",
        schedule: "1-English, 2-Algebra, 3-Biology, 4-PE",
        accommodations: "Extended Time, Oral Reading, Frequent Breaks",
      },
      {
        student_name: "Jane Smith",
        grade: "10",
        case_manager: "Ms. Davis",
        schedule: "1-Geometry, 2-World History, 3-Art, 4-Spanish",
        accommodations: "Small Group Setting, Visual Aids, Calculator",
      },
    ];

    const csv = Papa.unparse(templateData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "student_import_template.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <button
      type="button"
      onClick={downloadTemplate}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.45rem",
        padding: "0.6rem 1rem",
        borderRadius: "0.65rem",
        backgroundColor: "#f1f5f9",
        color: "#334155",
        border: "1px solid #cbd5e1",
        fontSize: "0.85rem",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#e2e8f0";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#f1f5f9";
      }}
    >
      <span>📥</span> Download CSV Template
    </button>
  );
}