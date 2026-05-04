"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Student = {
  id: string;
  name: string;
};

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

export default function GoalSelector({
  subject,
  students,
  onChange,
}: Props) {
  const [goals, setGoals] = useState<Goal[]>([]);

  // ✅ FIX: do NOT redeclare supabase
  // const supabase = supabase(); ❌ REMOVE THIS

  useEffect(() => {
    if (!subject || students.length === 0) {
      setGoals([]);
      return;
    }

    async function load() {
      const studentIds = students.map((s) => s.id);

      const { data, error } = await supabase
        .from("goals")
        .select("id, goal_description, student_id")
        .in("student_id", studentIds)
        .ilike("goal_description", `%${subject}%`);

      if (error) {
        console.error(error);
        setGoals([]);
        return;
      }

      setGoals((data as Goal[]) || []);
    }

    load();
  }, [subject, students]);

  return (
    <div className="space-y-2">
      <label className="font-semibold">Goal</label>

      <select
        className="border p-2 w-full"
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select goal</option>

        {goals.map((g) => (
          <option key={g.id} value={g.id}>
            {g.goal_description}
          </option>
        ))}
      </select>
    </div>
  );
}