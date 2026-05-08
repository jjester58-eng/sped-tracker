"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSupabase } from "@/lib/useSupabase";

type Student = {
  id: string;
  name: string;
  grade_level: string | null;
  case_manager?: string | null;
};

type Class = { id: string; class_name: string };

type Goal = {
  id: string;
  student_id: string;
  class_id?: string | null;
  goal_number: number;
  goal_description: string;
  subject?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type Props = {
  student: Student;
  onSaved?: () => void;
};

export default function StudentEditor({ student, onSaved }: Props) {
  const supabase = useSupabase();

  /* ============ STUDENT EDITING STATE ============ */
  const [name, setName] = useState(student.name);
  const [grade, setGrade] = useState(student.grade_level || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  /* ============ GOALS STATE ============ */
  const [goals, setGoals] = useState<Goal[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goalsError, setGoalsError] = useState<string | null>(null);
  const [goalsSuccess, setGoalsSuccess] = useState<string | null>(null);

  // Filter state
  const [selectedClassFilter, setSelectedClassFilter] = useState<string | null>(null);

  // Edit state
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editClassId, setEditClassId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState("");

  // Add new goal state
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalDescription, setNewGoalDescription] = useState("");
  const [newGoalClassId, setNewGoalClassId] = useState<string | null>(null);
  const [newGoalSubject, setNewGoalSubject] = useState("English");

  const subjects = ["English", "Math", "Reading", "Writing", "Behavior", "Science", "History", "Social Studies"];

  /* ============ SYNC STUDENT STATE ============ */
  useEffect(() => {
    setName(student.name);
    setGrade(student.grade_level || "");
    loadGoalsAndClasses();
  }, [student.id]);

  /* ============ LOAD GOALS AND CLASSES ============ */
  const loadGoalsAndClasses = async () => {
    setGoalsLoading(true);
    try {
      const [goalsRes, classesRes] = await Promise.all([
        supabase
          .from("goals")
          .select("*")
          .eq("student_id", student.id)
          .order("goal_number"),
        supabase.from("classes").select("*").order("class_name"),
      ]);

      setGoals(
        goalsRes.error
          ? []
          : (goalsRes.data ?? []).map((goal: any) => ({
              ...goal,
              subject: goal.subject || null,
            }))
      );
      setClasses(classesRes.error ? [] : (classesRes.data ?? []));
      setGoalsError(null);
    } catch (err: any) {
      setGoalsError(err.message);
    } finally {
      setGoalsLoading(false);
    }
  };

  /* ============ FILTER GOALS ============ */
  const filteredGoals = selectedClassFilter
    ? goals.filter((g) => g.class_id === selectedClassFilter)
    : goals;

  /* ============ SAVE STUDENT INFO ============ */
  async function save() {
    if (!name.trim()) {
      setMessage("Name is required");
      return;
    }
    setLoading(true);
    setMessage(null);
    const { error } = await supabase
      .from("students")
      .update({
        name: name.trim(),
        grade_level: grade || null,
      })
      .eq("id", student.id);
    if (error) {
      console.error(error);
      setMessage("Error saving student");
    } else {
      setMessage("Student updated");
      onSaved?.();
    }
    setLoading(false);
  }

  /* ============ DELETE STUDENT ============ */
  const deleteStudent = async () => {
    if (!confirm(`Delete student "${student.name}" and ALL their goals? This cannot be undone.`)) {
      return;
    }

    try {
      await supabase.from("goals").delete().eq("student_id", student.id);
      const { error } = await supabase.from("students").delete().eq("id", student.id);

      if (error) throw error;

      onSaved?.(); // Refresh parent list
      alert("Student deleted successfully.");
    } catch (err: any) {
      setMessage(`Error deleting student: ${err.message}`);
    }
  };

  /* ============ ADD GOAL ============ */
  const addGoal = async () => {
    if (!newGoalDescription.trim()) {
      setGoalsError("Goal description is required");
      return;
    }

    try {
      const nextGoalNumber = Math.max(...goals.map((g) => g.goal_number), 0) + 1;

      const { error: insertError } = await supabase.from("goals").insert({
        student_id: student.id,
        class_id: newGoalClassId,
        goal_number: nextGoalNumber,
        goal_description: newGoalDescription.trim(),
        subject: newGoalSubject as string,
      });

      if (insertError) throw insertError;

      setGoalsSuccess("Goal added successfully!");
      setNewGoalDescription("");
      setNewGoalClassId(null);
      setNewGoalSubject("English");
      setShowAddGoal(false);
      await loadGoalsAndClasses();
      setTimeout(() => setGoalsSuccess(null), 3000);
    } catch (err: any) {
      setGoalsError(err.message);
    }
  };

  /* ============ UPDATE GOAL ============ */
  const updateGoal = async (goalId: string) => {
    if (!editDescription.trim()) {
      setGoalsError("Goal description cannot be empty");
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from("goals")
        .update({
          goal_description: editDescription.trim(),
          class_id: editClassId,
          subject: editSubject as string,
        })
        .eq("id", goalId);

      if (updateError) throw updateError;

      setGoalsSuccess("Goal updated successfully!");
      setEditingGoalId(null);
      await loadGoalsAndClasses();
      setTimeout(() => setGoalsSuccess(null), 3000);
    } catch (err: any) {
      setGoalsError(err.message);
    }
  };

  /* ============ DELETE GOAL ============ */
  const deleteGoal = async (goalId: string) => {
    if (!window.confirm("Are you sure you want to delete this goal?")) return;

    try {
      const { error: deleteError } = await supabase
        .from("goals")
        .delete()
        .eq("id", goalId);

      if (deleteError) throw deleteError;

      setGoalsSuccess("Goal deleted successfully!");
      await loadGoalsAndClasses();
      setTimeout(() => setGoalsSuccess(null), 3000);
    } catch (err: any) {
      setGoalsError(err.message);
    }
  };

  /* ============ START EDITING ============ */
  const startEdit = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setEditDescription(goal.goal_description);
    setEditClassId(goal.class_id ?? null);
    setEditSubject(goal.subject || "English");
  };

  const cancelEdit = () => {
    setEditingGoalId(null);
    setEditDescription("");
    setEditClassId(null);
    setEditSubject("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* ============ STUDENT INFO SECTION ============ */}
      <div
        style={{
          border: "1px solid #d1d5db",
          padding: "1.5rem",
          borderRadius: "1rem",
          backgroundColor: "#f9fafb",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", margin: "0" }}>
            Edit Student Info
          </h2>
          <button
            onClick={deleteStudent}
            style={{
              color: "#dc2626",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              fontWeight: "500",
              fontSize: "0.875rem",
              padding: "0.5rem 1rem",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#991b1b")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#dc2626")}
          >
            🗑 Delete Student
          </button>
        </div>

        {message && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              marginBottom: "1rem",
              backgroundColor: message.includes("Error") ? "#fee2e2" : "#dcfce7",
              color: message.includes("Error") ? "#991b1b" : "#166534",
              fontSize: "0.875rem",
            }}
          >
            {message}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
              Name
            </label>
            <input
              style={{
                border: "1px solid #d1d5db",
                padding: "0.75rem 1rem",
                width: "100%",
                borderRadius: "0.5rem",
                boxSizing: "border-box",
              }}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
              Grade Level
            </label>
            <input
              style={{
                border: "1px solid #d1d5db",
                padding: "0.75rem 1rem",
                width: "100%",
                borderRadius: "0.5rem",
                boxSizing: "border-box",
              }}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            />
          </div>
          <button
            onClick={save}
            disabled={loading}
            style={{
              backgroundColor: "#2563eb",
              color: "white",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "500",
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = "#1d4ed8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#2563eb";
            }}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* ============ GOALS SECTION ============ */}
      <div
        style={{
          border: "1px solid #d1d5db",
          padding: "1.5rem",
          borderRadius: "1rem",
          backgroundColor: "#f9fafb",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", margin: "0" }}>
            Goals ({filteredGoals.length})
          </h2>
          <button
            onClick={() => setShowAddGoal(true)}
            style={{
              backgroundColor: "#16a34a",
              color: "white",
              padding: "0.625rem 1.25rem",
              borderRadius: "0.5rem",
              border: "none",
              cursor: "pointer",
              fontWeight: "500",
              fontSize: "0.875rem",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#15803d")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#16a34a")}
          >
            + Add Goal
          </button>
        </div>

        {goalsError && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              marginBottom: "1rem",
              backgroundColor: "#fee2e2",
              color: "#991b1b",
              fontSize: "0.875rem",
            }}
          >
            {goalsError}
          </div>
        )}

        {goalsSuccess && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              marginBottom: "1rem",
              backgroundColor: "#dcfce7",
              color: "#166534",
              fontSize: "0.875rem",
            }}
          >
            {goalsSuccess}
          </div>
        )}

        {/* Class Filter */}
        {classes.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.5rem" }}>
              Filter by Class
            </label>
            <select
              value={selectedClassFilter || ""}
              onChange={(e) => setSelectedClassFilter(e.target.value || null)}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid #d1d5db",
                fontSize: "0.875rem",
                backgroundColor: "white",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.class_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Goals List */}
        {goalsLoading ? (
          <p style={{ textAlign: "center", color: "#6b7280" }}>Loading goals...</p>
        ) : filteredGoals.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
            <p style={{ margin: "0", fontSize: "0.875rem" }}>No goals yet</p>
            <button
              onClick={() => setShowAddGoal(true)}
              style={{
                color: "#2563eb",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
                fontSize: "0.875rem",
                padding: "0.5rem 0",
                marginTop: "0.5rem",
              }}
            >
              Add your first goal
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {filteredGoals.map((goal) => (
              <div
                key={goal.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.5rem",
                  padding: "1rem",
                  backgroundColor: editingGoalId === goal.id ? "#eff6ff" : "white",
                }}
              >
                {editingGoalId === goal.id ? (
                  /* Edit Mode */
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          marginBottom: "0.5rem",
                        }}
                      >
                        Subject
                      </label>
                      <select
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.75rem 1rem",
                          borderRadius: "0.5rem",
                          border: "1px solid #d1d5db",
                          fontSize: "0.875rem",
                          backgroundColor: "white",
                          cursor: "pointer",
                          boxSizing: "border-box",
                        }}
                      >
                        {subjects.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          marginBottom: "0.5rem",
                        }}
                      >
                        Goal Description
                      </label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.75rem 1rem",
                          borderRadius: "0.5rem",
                          border: "1px solid #d1d5db",
                          fontSize: "0.875rem",
                          fontFamily: "inherit",
                          boxSizing: "border-box",
                          minHeight: "80px",
                          resize: "vertical",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          marginBottom: "0.5rem",
                        }}
                      >
                        Class (Optional)
                      </label>
                      <select
                        value={editClassId || ""}
                        onChange={(e) => setEditClassId(e.target.value || null)}
                        style={{
                          width: "100%",
                          padding: "0.75rem 1rem",
                          borderRadius: "0.5rem",
                          border: "1px solid #d1d5db",
                          fontSize: "0.875rem",
                          backgroundColor: "white",
                          cursor: "pointer",
                          boxSizing: "border-box",
                        }}
                      >
                        <option value="">No Class</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.class_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => updateGoal(goal.id)}
                        style={{
                          flex: "1",
                          padding: "0.75rem 1rem",
                          backgroundColor: "#16a34a",
                          color: "white",
                          border: "none",
                          borderRadius: "0.5rem",
                          cursor: "pointer",
                          fontWeight: "500",
                          fontSize: "0.875rem",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#15803d")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#16a34a")}
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        style={{
                          flex: "1",
                          padding: "0.75rem 1rem",
                          backgroundColor: "#e5e7eb",
                          color: "#111827",
                          border: "none",
                          borderRadius: "0.5rem",
                          cursor: "pointer",
                          fontWeight: "500",
                          fontSize: "0.875rem",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#d1d5db")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#e5e7eb")}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "1rem",
                    }}
                  >
                    <div style={{ flex: "1" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#2563eb",
                            color: "white",
                            width: "1.75rem",
                            height: "1.75rem",
                            borderRadius: "50%",
                            fontWeight: "bold",
                            fontSize: "0.75rem",
                          }}
                        >
                          {goal.goal_number}
                        </span>
                        <span
                          style={{
                            backgroundColor: "#fef3c7",
                            color: "#92400e",
                            padding: "0.25rem 0.75rem",
                            borderRadius: "0.25rem",
                            fontSize: "0.75rem",
                            fontWeight: "500",
                          }}
                        >
                          {goal.subject || "No Subject"}
                        </span>
                        {goal.class_id && (
                          <span
                            style={{
                              backgroundColor: "#e0e7ff",
                              color: "#3730a3",
                              padding: "0.25rem 0.75rem",
                              borderRadius: "0.25rem",
                              fontSize: "0.75rem",
                              fontWeight: "500",
                            }}
                          >
                            {classes.find((c) => c.id === goal.class_id)?.class_name || "Unknown"}
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          margin: "0",
                          color: "#111827",
                          lineHeight: "1.6",
                          wordWrap: "break-word",
                          fontSize: "0.875rem",
                        }}
                      >
                        {goal.goal_description}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                      <button
                        onClick={() => startEdit(goal)}
                        style={{
                          padding: "0.5rem 0.75rem",
                          backgroundColor: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "0.25rem",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          fontWeight: "500",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        style={{
                          padding: "0.5rem 0.75rem",
                          backgroundColor: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: "0.25rem",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          fontWeight: "500",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#dc2626")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ef4444")}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============ ADD GOAL MODAL ============ */}
      {showAddGoal && (
        <div
          style={{
            position: "fixed",
            inset: "0",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: "50",
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              maxWidth: "32rem",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2rem",
            }}
          >
            <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: "0 0 1.5rem", color: "#111827" }}>
              Add New Goal for {student.name}
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    marginBottom: "0.5rem",
                  }}
                >
                  Subject
                </label>
                <select
                  value={newGoalSubject}
                  onChange={(e) => setNewGoalSubject(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #d1d5db",
                    fontSize: "0.875rem",
                    backgroundColor: "white",
                    cursor: "pointer",
                    boxSizing: "border-box",
                  }}
                >
                  {subjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    marginBottom: "0.5rem",
                  }}
                >
                  Goal Description
                </label>
                <textarea
                  value={newGoalDescription}
                  onChange={(e) => setNewGoalDescription(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #d1d5db",
                    fontSize: "0.875rem",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    minHeight: "120px",
                    resize: "vertical",
                  }}
                  placeholder="Enter goal description..."
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    marginBottom: "0.5rem",
                  }}
                >
                  Class (Optional)
                </label>
                <select
                  value={newGoalClassId || ""}
                  onChange={(e) => setNewGoalClassId(e.target.value || null)}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #d1d5db",
                    fontSize: "0.875rem",
                    backgroundColor: "white",
                    cursor: "pointer",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">No Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.class_name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={() => setShowAddGoal(false)}
                  style={{
                    flex: "1",
                    padding: "0.75rem 1rem",
                    backgroundColor: "#e5e7eb",
                    color: "#111827",
                    border: "none",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#d1d5db")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#e5e7eb")}
                >
                  Cancel
                </button>
                <button
                  onClick={addGoal}
                  disabled={!newGoalDescription.trim()}
                  style={{
                    flex: "1",
                    padding: "0.75rem 1rem",
                    backgroundColor: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "0.5rem",
                    cursor: !newGoalDescription.trim() ? "not-allowed" : "pointer",
                    fontWeight: "500",
                    opacity: !newGoalDescription.trim() ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (newGoalDescription.trim()) e.currentTarget.style.backgroundColor = "#1d4ed8";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#2563eb";
                  }}
                >
                  Add Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}