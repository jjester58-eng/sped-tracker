"use client";

import { useState } from "react";
import TeacherPage from "./teacher/page";
import CaseManagerPage from "./case-manager/page";

export default function Home() {
  const [tab, setTab] = useState<"teacher" | "case">("teacher");

  return (
    <main className="p-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <h1 className="text-3xl font-bold mb-6">SPED Tracker</h1>

      {/* TABS */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setTab("teacher")}
          className={`px-4 py-2 rounded ${
            tab === "teacher"
              ? "bg-blue-600 text-white"
              : "bg-gray-200"
          }`}
        >
          Teacher Input
        </button>

        <button
          onClick={() => setTab("case")}
          className={`px-4 py-2 rounded ${
            tab === "case"
              ? "bg-blue-600 text-white"
              : "bg-gray-200"
          }`}
        >
          Case Manager
        </button>
      </div>

      {/* CONTENT */}
      <div className="border rounded p-4 bg-white">
        {tab === "teacher" ? <TeacherPage /> : <CaseManagerPage />}
      </div>
    </main>
  );
}