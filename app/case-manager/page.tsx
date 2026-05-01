"use client";

type Props = {
  mode?: "edit" | "select";
  onStudentSelected?: (student: any) => void;
};

export default function StudentSelector({ mode, onStudentSelected }: Props) {
  return (
    <div className="border p-4 rounded">
      <p>Student Selector ({mode})</p>

      <button
        onClick={() =>
          onStudentSelected?.({ id: "1", name: "Test Student" })
        }
      >
        Select Test Student
      </button>
    </div>
  );
}