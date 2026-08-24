"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/lib/useSupabase";
import type { Student } from "./index";

type Goal = {
  id: string;
  goal_description: string;
  student_id: string;
};

type Props = {
  subject: string;
  students: Student[];
  onChange: (goalId: string) => void;
};

export default function GoalSelector({ subject, students, onChange }: Props) {
  const supabase = useSupabase();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!students.length) {
      setGoals([]);
      setSelectedGoalId("");
      onChange("");
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);

      const studentIds = students.map((s) => s.id);
      const { data, error } = await supabase
        .from("goals")
        .select("id, goal_description, student_id")
        .in("student_id", studentIds)
        .order("goal_description");

      if (error) {
        console.error(error);
        setError("Failed to load goals");
        setGoals([]);
        setSelectedGoalId("");
        onChange("");
      } else {
        const allGoals = (data ?? []) as Goal[];
        const normalizedSubject = subject?.trim().toLowerCase();

        const filteredGoals = normalizedSubject
          ? allGoals.filter((goal) =>
              goal.goal_description.toLowerCase().includes(normalizedSubject)
            )
          : allGoals;

        setGoals(filteredGoals.length > 0 ? filteredGoals : allGoals);
        setSelectedGoalId("");
        onChange("");
      }

      setLoading(false);
    }

    load();
  }, [subject, students, supabase, onChange]);

  return (
    <div className="space-y-2">
      <label className="font-semibold">Goal</label>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <select
        className="border p-2 w-full rounded-xl"
        value={selectedGoalId}
        onChange={(e) => {
          const nextValue = e.target.value;
          setSelectedGoalId(nextValue);
          onChange(nextValue);
        }}
        disabled={loading}
      >
        <option value="">{loading ? "Loading..." : "Select goal"}</option>
        {goals.map((g) => (
          <option key={g.id} value={g.id}>
            {g.goal_description}
          </option>
        ))}
      </select>
      {!loading && goals.length === 0 && (
        <p className="text-sm text-gray-500">
          No goals found for the selected students yet.
        </p>
      )}
    </div>
  );
}