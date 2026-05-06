"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import MultiStudentPicker from "../components/MultiStudentPicker";
import SubjectSelector from "../components/SubjectSelector";
import GoalSelector from "../components/GoalSelector";
import GradeLevelSelector from "../components/GradeLevelSelector";
import { useSupabase } from "@/lib/useSupabase";

type Student = {
  id: string;
  name: string;
};

export default function TeacherPage() {
  const supabase = useSupabase();
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [subject, setSubject] = useState("");
  const [goal, setGoal] = useState("");
  const [notes, setNotes] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");

  async function saveProgress() {
    if (!goal || selectedStudents.length === 0) return;
    for (const student of selectedStudents) {
      const { error } = await supabase
        .from("weekly_progress")
        .insert({
          student_id: student.id,
          goal_id: goal,
          progress_notes: notes,
          review_date: new Date().toISOString(),
        });
      if (error) {
        console.error(error);
        alert("Error saving progress");
        return;
      }
    }
    alert("Saved successfully");
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Teacher Weekly Input</h1>
      <SubjectSelector onChange={setSubject} />
      <MultiStudentPicker
        subject={subject}
        value={selectedStudents}
        onChange={setSelectedStudents}
      />
      <GoalSelector
        subject={subject}
        students={selectedStudents}
        onChange={setGoal}
      />
      <GradeLevelSelector onChange={setGradeLevel} />
      <textarea
        className="border p-2 w-full"
        placeholder="Weekly notes..."
        onChange={(e) => setNotes(e.target.value)}
      />
      <button
        onClick={saveProgress}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Save Progress
      </button>
    </div>
  );
}
