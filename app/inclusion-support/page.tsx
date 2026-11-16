"use client";

import { useMemo, useState } from "react";
import styles from "./inclusion.module.css";

type Section = {
  id: number;
  course: string;
  classroomTeacher: string;
  room: string;
  period: number;
  capacity: number;
  studentsNeedingSupport: string[];
  manuallyFlagged: boolean;
};
type InclusionTeacher = { id: number; name: string };
type Assignment = { id: number; sectionId: number; teacherId: number };

const initialSections: Section[] = [
  { id: 1, course: "English I", classroomTeacher: "M. Carter", room: "A101", period: 1, capacity: 28, studentsNeedingSupport: ["Avery A."], manuallyFlagged: false },
  { id: 2, course: "Algebra I", classroomTeacher: "R. Brooks", room: "B201", period: 2, capacity: 28, studentsNeedingSupport: ["Jordan B.", "Morgan C."], manuallyFlagged: false },
  { id: 3, course: "Biology", classroomTeacher: "A. Nguyen", room: "C301", period: 3, capacity: 26, studentsNeedingSupport: [], manuallyFlagged: true },
  { id: 4, course: "World Geography", classroomTeacher: "L. Davis", room: "A201", period: 4, capacity: 28, studentsNeedingSupport: ["Avery A."], manuallyFlagged: false },
  { id: 5, course: "English II", classroomTeacher: "S. Patel", room: "A102", period: 5, capacity: 28, studentsNeedingSupport: [], manuallyFlagged: false },
];
const initialTeachers: InclusionTeacher[] = [
  { id: 1, name: "T. Jones" },
  { id: 2, name: "K. Clark" },
  { id: 3, name: "D. Ramirez" },
];
const initialAssignments: Assignment[] = [
  { id: 1, sectionId: 1, teacherId: 1 },
  { id: 2, sectionId: 2, teacherId: 2 },
];

export default function InclusionSupportPage() {
  const [sections, setSections] = useState(initialSections);
  const [teachers, setTeachers] = useState(initialTeachers);
  const [assignments, setAssignments] = useState(initialAssignments);
  const [tab, setTab] = useState<"assign" | "schedules" | "coverage">("assign");
  const [selectedTeacher, setSelectedTeacher] = useState("1");
  const [selectedSection, setSelectedSection] = useState("3");
  const [newTeacher, setNewTeacher] = useState("");
  const [message, setMessage] = useState("");

  const assignedSectionIds = new Set(assignments.map((a) => a.sectionId));
  const flaggedSections = sections.filter((s) => s.manuallyFlagged || s.studentsNeedingSupport.length > 0);
  const unfilledSections = flaggedSections.filter((s) => !assignedSectionIds.has(s.id));
  const selectedTeacherAssignments = useMemo(
    () => assignments.filter((a) => a.teacherId === Number(selectedTeacher)),
    [assignments, selectedTeacher]
  );

  function assignTeacher() {
    const sectionId = Number(selectedSection);
    const teacherId = Number(selectedTeacher);
    const section = sections.find((s) => s.id === sectionId);
    if (!section || !teacherId) return;
    if (assignments.some((a) => a.teacherId === teacherId && sections.find((s) => s.id === a.sectionId)?.period === section.period)) {
      setMessage("Scheduling conflict: this inclusion teacher is already assigned during that period.");
      return;
    }
    setAssignments((old) => [...old.filter((a) => a.sectionId !== sectionId), { id: Date.now(), sectionId, teacherId }]);
    setMessage(`${teachers.find((t) => t.id === teacherId)?.name} assigned to ${section.course}, Period ${section.period}.`);
  }

  function addTeacher(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newTeacher.trim();
    if (!name) return;
    const id = Math.max(0, ...teachers.map((t) => t.id)) + 1;
    setTeachers((old) => [...old, { id, name }]);
    setSelectedTeacher(String(id));
    setNewTeacher("");
    setMessage(`${name} added to the inclusion teacher list.`);
  }

  function toggleManualFlag(sectionId: number) {
    setSections((old) => old.map((s) => s.id === sectionId ? { ...s, manuallyFlagged: !s.manuallyFlagged } : s));
  }

  function removeAssignment(id: number) {
    setAssignments((old) => old.filter((a) => a.id !== id));
    setMessage("Assignment removed.");
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div><span className={styles.kicker}>CAMPUS SCHEDULING</span><h1>Inclusion Support</h1><p>Coordinate classroom support and review each inclusion teacher’s schedule.</p></div>
          <span className={styles.preview}>PREVIEW · SAMPLE DATA</span>
        </header>

        <div className={styles.notice}>
          <strong>Prototype data:</strong> This page currently uses fictional classes, teachers, and student support indicators. It is not connected to the live student roster or Master Schedule. Student-based suggestions will become meaningful once student-to-class enrollment and service data are connected.
        </div>

        <section className={styles.metrics}>
          <div><strong>{teachers.length}</strong><span>Inclusion teachers</span></div>
          <div><strong>{flaggedSections.length}</strong><span>Classes flagged for support</span></div>
          <div><strong>{assignments.length}</strong><span>Current assignments</span></div>
          <div><strong>{unfilledSections.length}</strong><span>Needs without coverage</span></div>
        </section>

        <nav className={styles.tabs} aria-label="Inclusion support sections">
          <button className={tab === "assign" ? styles.active : ""} onClick={() => setTab("assign")}>Assignments</button>
          <button className={tab === "schedules" ? styles.active : ""} onClick={() => setTab("schedules")}>Teacher schedules</button>
          <button className={tab === "coverage" ? styles.active : ""} onClick={() => setTab("coverage")}>Class coverage</button>
        </nav>

        {message && <div className={styles.message} role="status">{message}<button onClick={() => setMessage("")} aria-label="Dismiss message">×</button></div>}

        {tab === "assign" && <>
          <div className={styles.sectionHeading}><div><h2>Assign inclusion support</h2><p>Choose a class section and an inclusion teacher. A teacher cannot be assigned to two classes in the same period.</p></div></div>
          <div className={styles.assignPanel}>
            <label>Inclusion teacher<select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)}>{teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
            <label>Class section<select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>{sections.map((s) => <option key={s.id} value={s.id}>P{s.period} · {s.course} · {s.classroomTeacher}</option>)}</select></label>
            <button onClick={assignTeacher}>＋ Assign teacher</button>
          </div>
          <form className={styles.addTeacher} onSubmit={addTeacher}>
            <label htmlFor="new-inclusion-teacher">Add an inclusion teacher</label>
            <div><input id="new-inclusion-teacher" value={newTeacher} onChange={(e) => setNewTeacher(e.target.value)} placeholder="Teacher name" /><button type="submit">Add teacher</button></div>
          </form>
          <div className={styles.sectionHeading}><div><h2>Current assignments</h2><p>Assignments are grouped by class period.</p></div></div>
          <div className={styles.tableWrap}><table><thead><tr><th>Period</th><th>Class</th><th>Classroom teacher</th><th>Room</th><th>Inclusion teacher</th><th></th></tr></thead><tbody>
            {assignments.slice().sort((a,b) => (sections.find(s => s.id === a.sectionId)?.period || 0) - (sections.find(s => s.id === b.sectionId)?.period || 0)).map((a) => {
              const s = sections.find((item) => item.id === a.sectionId)!;
              const t = teachers.find((item) => item.id === a.teacherId)!;
              return <tr key={a.id}><td>{s.period}</td><td><strong>{s.course}</strong></td><td>{s.classroomTeacher}</td><td>{s.room}</td><td>{t.name}</td><td><button className={styles.remove} onClick={() => removeAssignment(a.id)}>Remove</button></td></tr>;
            })}
            {assignments.length === 0 && <tr><td colSpan={6}>No inclusion assignments yet.</td></tr>}
          </tbody></table></div>
        </>}

        {tab === "schedules" && <>
          <div className={styles.sectionHeading}><div><h2>Inclusion teacher schedule</h2><p>Select a teacher to see assigned classes and available periods.</p></div></div>
          <div className={styles.teacherPicker}><label>Choose inclusion teacher<select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)}>{teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label></div>
          <div className={styles.schedule}>
            {Array.from({ length: 8 }, (_, i) => i + 1).map((period) => {
              const assignment = selectedTeacherAssignments.find((a) => sections.find((s) => s.id === a.sectionId)?.period === period);
              const section = assignment ? sections.find((s) => s.id === assignment.sectionId) : null;
              return <div className={styles.periodRow} key={period}><span className={styles.periodNumber}>P{period}</span>{section ? <div><strong>{section.course}</strong><span>{section.classroomTeacher} · Room {section.room}</span></div> : <div className={styles.openPeriod}><strong>Available</strong><span>No class assigned</span></div>}</div>;
            })}
          </div>
        </>}

        {tab === "coverage" && <>
          <div className={styles.sectionHeading}><div><h2>Class coverage and support needs</h2><p>Review classes flagged by student indicators or manually selected by an administrator.</p></div></div>
          <div className={styles.legend}><span><i className={styles.studentDot}></i> Student indicator (sample)</span><span><i className={styles.manualDot}></i> Manually flagged</span><span><i className={styles.coveredDot}></i> Assigned</span></div>
          <div className={styles.coverageList}>
            {sections.map((s) => {
              const assignment = assignments.find((a) => a.sectionId === s.id);
              const assignedTeacher = assignment ? teachers.find((t) => t.id === assignment.teacherId)?.name : null;
              const studentFlag = s.studentsNeedingSupport.length > 0;
              return <article className={styles.coverageCard} key={s.id}>
                <div className={styles.coverageTop}><div><span className={styles.periodTag}>PERIOD {s.period}</span><h3>{s.course}</h3><p>{s.classroomTeacher} · Room {s.room}</p></div><span className={assignedTeacher ? styles.covered : styles.uncovered}>{assignedTeacher ? "Assigned" : (studentFlag || s.manuallyFlagged ? "Needs coverage" : "Not flagged")}</span></div>
                <div className={styles.flags}>
                  {studentFlag && <span className={styles.studentFlag}>Student indicator · {s.studentsNeedingSupport.length} sample student(s)</span>}
                  {s.manuallyFlagged && <span className={styles.manualFlag}>Manually flagged</span>}
                  {!studentFlag && !s.manuallyFlagged && <span className={styles.noFlag}>No support need flagged</span>}
                </div>
                {studentFlag && <p className={styles.studentNames}>Sample indicators: {s.studentsNeedingSupport.join(", ")}</p>}
                <div className={styles.coverageBottom}><span>{assignedTeacher ? `Inclusion teacher: ${assignedTeacher}` : "No inclusion teacher assigned"}</span><button onClick={() => toggleManualFlag(s.id)}>{s.manuallyFlagged ? "Remove manual flag" : "＋ Flag for support"}</button></div>
              </article>;
            })}
          </div>
        </>}
        <footer className={styles.footer}>INCLUSION SUPPORT WORKSPACE · PREVIEW ONLY · NO LIVE STUDENT DATA</footer>
      </div>
    </main>
  );
}
