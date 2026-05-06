"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useSupabase } from "@/lib/useSupabase";

// Inside component:
const supabase = useSupabase();
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!students.length) {
      setGoals([]);
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);

      const studentIds = students.map((s) => s.id);

      let query = supabase
        .from("goals")
        .select("id, goal_description, student_id")
        .in("student_id", studentIds);

      if (subject?.trim()) {
        query = query.ilike("goal_description", `%${subject}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error(error);
        setError("Failed to load goals");
        setGoals([]);
      } else {
        setGoals((data ?? []) as Goal[]);
      }

      setLoading(false);
    }

    load();
  }, [subject, students]);

  return (
    <div className="space-y-2">
      <label className="font-semibold">Goal</label>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <select
        className="border p-2 w-full"
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
      >
        <option value="">
          {loading ? "Loading..." : "Select goal"}
        </option>

        {goals.map((g) => (
          <option key={g.id} value={g.id}>
            {g.goal_description}
          </option>
        ))}
      </select>
    </div>
  );
}