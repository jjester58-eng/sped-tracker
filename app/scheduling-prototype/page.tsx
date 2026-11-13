"use client";

import { useMemo, useState } from "react";
import styles from "./prototype.module.css";

type Student = { id: string; name: string; grade: number; requests: string[] };
type Section = { id: string; course: string; period: number; teacher: string; room: string; capacity: number };
type Assignment = { studentId: string; sectionId: string; course: string; period: number };
type Tab = "overview" | "students" | "master" | "builder";

const courses = [
  { name: "English I", department: "English", grades: "9" },
  { name: "English II", department: "English", grades: "10" },
  { name: "Algebra I", department: "Math", grades: "9–10" },
  { name: "Biology", department: "Science", grades: "9–10" },
  { name: "Chemistry", department: "Science", grades: "10–11" },
  { name: "World Geography", department: "Social Studies", grades: "9" },
  { name: "U.S. History", department: "Social Studies", grades: "10–11" },
  { name: "Physical Education", department: "Elective", grades: "9–12" },
  { name: "Art I", department: "Fine Arts", grades: "9–12" },
  { name: "Computer Science", department: "CTE", grades: "9–12" },
  { name: "Spanish I", department: "World Languages", grades: "9–12" },
];

const initialSections: Section[] = [
  { id: "ENG1-01", course: "English I", period: 1, teacher: "M. Carter", room: "A101", capacity: 18 },
  { id: "ENG1-02", course: "English I", period: 4, teacher: "J. Lewis", room: "A104", capacity: 18 },
  { id: "ENG2-01", course: "English II", period: 2, teacher: "S. Patel", room: "A102", capacity: 18 },
  { id: "ENG2-02", course: "English II", period: 5, teacher: "D. Moore", room: "A105", capacity: 18 },
  { id: "ALG1-01", course: "Algebra I", period: 2, teacher: "R. Brooks", room: "B201", capacity: 18 },
  { id: "ALG1-02", course: "Algebra I", period: 5, teacher: "R. Brooks", room: "B201", capacity: 18 },
  { id: "BIO-01", course: "Biology", period: 3, teacher: "A. Nguyen", room: "C301", capacity: 18 },
  { id: "BIO-02", course: "Biology", period: 6, teacher: "A. Nguyen", room: "C301", capacity: 18 },
  { id: "CHEM-01", course: "Chemistry", period: 2, teacher: "T. Evans", room: "C302", capacity: 18 },
  { id: "CHEM-02", course: "Chemistry", period: 7, teacher: "T. Evans", room: "C302", capacity: 18 },
  { id: "WGEO-01", course: "World Geography", period: 1, teacher: "L. Davis", room: "A201", capacity: 18 },
  { id: "WGEO-02", course: "World Geography", period: 5, teacher: "L. Davis", room: "A201", capacity: 18 },
  { id: "USH-01", course: "U.S. History", period: 4, teacher: "P. Wilson", room: "A202", capacity: 18 },
  { id: "USH-02", course: "U.S. History", period: 6, teacher: "P. Wilson", room: "A202", capacity: 18 },
  { id: "PE-01", course: "Physical Education", period: 2, teacher: "K. Reed", room: "GYM", capacity: 22 },
  { id: "PE-02", course: "Physical Education", period: 6, teacher: "K. Reed", room: "GYM", capacity: 22 },
  { id: "ART-01", course: "Art I", period: 3, teacher: "C. Hall", room: "D101", capacity: 16 },
  { id: "ART-02", course: "Art I", period: 7, teacher: "C. Hall", room: "D101", capacity: 16 },
  { id: "CS-01", course: "Computer Science", period: 4, teacher: "J. Jester", room: "LAB1", capacity: 16 },
  { id: "CS-02", course: "Computer Science", period: 7, teacher: "J. Jester", room: "LAB1", capacity: 16 },
  { id: "SPAN-01", course: "Spanish I", period: 1, teacher: "M. Garcia", room: "A301", capacity: 18 },
  { id: "SPAN-02", course: "Spanish I", period: 6, teacher: "M. Garcia", room: "A301", capacity: 18 },
];

const firstNames = ["Avery", "Jordan", "Morgan", "Riley", "Cameron", "Taylor", "Parker", "Quinn", "Reese", "Drew", "Logan", "Casey", "Hayden", "Rowan", "Skyler", "Emerson", "Blake", "Finley", "Payton", "Sage", "Dakota", "Elliot", "Harper", "Kendall"];
const lastNames = ["Anderson", "Bennett", "Campbell", "Diaz", "Ellis", "Foster", "Garcia", "Hughes", "Irwin", "Jackson", "Kim", "Lopez", "Mitchell", "Nelson", "Owens", "Price", "Reed", "Sullivan", "Turner", "Walker", "Young", "Brooks", "Cruz", "Perry"];
const requestSets: Record<number, string[][]> = {
  9: [
    ["English I", "Algebra I", "Biology", "World Geography", "Physical Education", "Computer Science"],
    ["English I", "Algebra I", "Biology", "World Geography", "Art I", "Spanish I"],
    ["English I", "Algebra I", "Biology", "World Geography", "Physical Education", "Art I"],
  ],
  10: [
    ["English II", "Chemistry", "U.S. History", "Algebra I", "Computer Science", "Physical Education"],
    ["English II", "Chemistry", "U.S. History", "Biology", "Art I", "Spanish I"],
    ["English II", "Chemistry", "U.S. History", "Algebra I", "Physical Education", "Art I"],
  ],
  11: [
    ["English II", "Chemistry", "U.S. History", "Biology", "Computer Science", "Spanish I"],
    ["English II", "Chemistry", "U.S. History", "Algebra I", "Art I", "Physical Education"],
  ],
  12: [
    ["English II", "Chemistry", "U.S. History", "Biology", "Computer Science", "Physical Education"],
    ["English II", "Chemistry", "U.S. History", "Algebra I", "Art I", "Spanish I"],
  ],
};

function makeStudents(): Student[] {
  return firstNames.map((first, index) => {
    const grade = 9 + (index % 4);
    const options = requestSets[grade];
    return {
      id: "STU-" + String(index + 1).padStart(3, "0"),
      name: first + " " + lastNames[index],
      grade,
      requests: options[index % options.length],
    };
  });
}

function buildSchedules(students: Student[], sections: Section[]) {
  const assignments: Assignment[] = [];
  const unfilled: { studentId: string; course: string; reason: string }[] = [];
  const loads: Record<string, number> = {};
  sections.forEach((section) => { loads[section.id] = 0; });

  const ordered = [...students].sort((a, b) => a.requests.length - b.requests.length || a.name.localeCompare(b.name));
  for (const student of ordered) {
    const occupiedPeriods = new Set<number>();
    for (const course of student.requests) {
      const options = sections
        .filter((section) => section.course === course && loads[section.id] < section.capacity && !occupiedPeriods.has(section.period))
        .sort((a, b) => {
          const loadA = loads[a.id] / a.capacity;
          const loadB = loads[b.id] / b.capacity;
          return loadA - loadB || a.period - b.period;
        });
      if (!options.length) {
        const sameCourse = sections.some((section) => section.course === course);
        unfilled.push({
          studentId: student.id,
          course,
          reason: sameCourse ? "All available sections are full or conflict with another class." : "No section is currently offered.",
        });
        continue;
      }
      const chosen = options[0];
      loads[chosen.id] += 1;
      occupiedPeriods.add(chosen.period);
      assignments.push({ studentId: student.id, sectionId: chosen.id, course, period: chosen.period });
    }
  }
  return { assignments, unfilled, loads };
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"' && quoted) { value += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { values.push(value.trim()); value = ""; }
    else value += char;
  }
  values.push(value.trim());
  return values;
}

export default function SchedulingPrototypePage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [students, setStudents] = useState<Student[]>(makeStudents);
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [unfilled, setUnfilled] = useState<{ studentId: string; course: string; reason: string }[]>([]);
  const [generated, setGenerated] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("STU-001");
  const [search, setSearch] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState("9");
  const [notice, setNotice] = useState("Demo data is stored only in this browser session. No SIS or Supabase connection is active.");

  const loads = useMemo(() => {
    const result: Record<string, number> = {};
    sections.forEach((section) => { result[section.id] = assignments.filter((item) => item.sectionId === section.id).length; });
    return result;
  }, [assignments, sections]);

  const selected = students.find((student) => student.id === selectedStudent) ?? students[0];
  const selectedAssignments = assignments.filter((item) => item.studentId === selectedStudent).sort((a, b) => a.period - b.period);
  const filteredStudents = students.filter((student) => (student.name + " " + student.grade + " " + student.id).toLowerCase().includes(search.toLowerCase()));
  const totalRequests = students.reduce((sum, student) => sum + student.requests.length, 0);
  const scheduledCount = assignments.length;
  const completion = totalRequests ? Math.round((scheduledCount / totalRequests) * 100) : 0;

  function generate() {
    const result = buildSchedules(students, sections);
    setAssignments(result.assignments);
    setUnfilled(result.unfilled);
    setGenerated(true);
    setNotice("Schedule generated with the prototype placement heuristic. Review every exception before treating this as a valid schedule.");
    setTab("builder");
  }

  function resetDemo() {
    setStudents(makeStudents());
    setSections(initialSections);
    setAssignments([]);
    setUnfilled([]);
    setGenerated(false);
    setSelectedStudent("STU-001");
    setNotice("Demo data has been reset.");
  }

  function addStudent() {
    if (!newStudentName.trim()) return;
    const grade = Number(newStudentGrade);
    const id = "NEW-" + Date.now().toString().slice(-6);
    const defaults = requestSets[grade][0];
    setStudents((current) => [...current, { id, name: newStudentName.trim(), grade, requests: [...defaults] }]);
    setNewStudentName("");
    setSelectedStudent(id);
    setGenerated(false);
    setAssignments([]);
    setUnfilled([]);
    setNotice("Student added with sample course requests. Generate schedules again to include this student.");
  }

  async function importStudents(file: File) {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) { setNotice("The CSV needs a header row and at least one student row."); return; }
    const headers = parseCsvLine(lines[0]).map((value) => value.toLowerCase());
    const nameIndex = headers.indexOf("name") >= 0 ? headers.indexOf("name") : headers.indexOf("student_name");
    const gradeIndex = headers.indexOf("grade") >= 0 ? headers.indexOf("grade") : headers.indexOf("grade_level");
    const requestIndex = headers.indexOf("requests") >= 0 ? headers.indexOf("requests") : headers.indexOf("course_requests");
    if (nameIndex < 0 || gradeIndex < 0) { setNotice("CSV must include name (or student_name) and grade (or grade_level) columns."); return; }
    const imported: Student[] = [];
    for (const line of lines.slice(1)) {
      const row = parseCsvLine(line);
      const name = row[nameIndex]?.trim();
      const grade = Number(row[gradeIndex]);
      if (!name || ![9, 10, 11, 12].includes(grade)) continue;
      const rawRequests = requestIndex >= 0 ? row[requestIndex] : "";
      const requests = rawRequests ? rawRequests.split("|").map((value) => value.trim()).filter((value) => courses.some((course) => course.name === value)) : [...requestSets[grade][0]];
      imported.push({ id: "CSV-" + String(students.length + imported.length + 1).padStart(3, "0"), name, grade, requests });
    }
    if (!imported.length) { setNotice("No valid student rows were found. Check grade values and required columns."); return; }
    setStudents((current) => [...current, ...imported]);
    setGenerated(false);
    setAssignments([]);
    setUnfilled([]);
    setNotice(imported.length + " fictional/demo student record(s) imported. Existing generated schedules were cleared.");
  }

  function changeAssignment(course: string, sectionId: string) {
    const section = sections.find((item) => item.id === sectionId);
    if (!section || !selected) return;
    const conflict = selectedAssignments.some((item) => item.course !== course && item.period === section.period);
    const load = loads[sectionId] ?? 0;
    if (conflict) { setNotice("That change would create a student period conflict. No change was made."); return; }
    if (load >= section.capacity && !selectedAssignments.some((item) => item.sectionId === sectionId)) {
      setNotice("That section is at capacity. No change was made."); return;
    }
    setAssignments((current) => {
      const withoutCourse = current.filter((item) => !(item.studentId === selectedStudent && item.course === course));
      return [...withoutCourse, { studentId: selectedStudent, sectionId, course, period: section.period }];
    });
    setUnfilled((current) => current.filter((item) => !(item.studentId === selectedStudent && item.course === course)));
    setNotice("Manual adjustment saved in this browser session. Recheck the schedule before publishing.");
  }

  function exportSchedules() {
    if (!assignments.length) { setNotice("Generate schedules before exporting."); return; }
    const rows = [["student_id", "student_name", "grade", "period", "course", "section_id", "teacher", "room"]];
    assignments.forEach((assignment) => {
      const student = students.find((item) => item.id === assignment.studentId);
      const section = sections.find((item) => item.id === assignment.sectionId);
      if (student && section) rows.push([student.id, student.name, String(student.grade), String(section.period), assignment.course, section.id, section.teacher, section.room]);
    });
    const csv = rows.map((row) => row.map((value) => '"' + value.replace(/"/g, '""') + '"').join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "campus-schedule-prototype.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("Schedule CSV exported.");
  }

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>S</div>
          <div><div className={styles.brandTitle}>Campus Scheduler</div><div className={styles.brandSub}>PROTOTYPE WORKSPACE</div></div>
        </div>
        <div className={styles.topActions}>
          <span className={styles.demoPill}>FICTIONAL DATA</span>
          <button className={styles.buttonSecondary} onClick={resetDemo}>Reset demo</button>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.sideLabel}>WORKSPACE</div>
          {([
            ["overview", "Overview", "◫"],
            ["students", "Students", "♙"],
            ["master", "Master schedule", "▦"],
            ["builder", "Schedule builder", "✣"],
          ] as [Tab, string, string][]).map(([key, label, icon]) => (
            <button key={key} className={tab === key ? styles.navActive : styles.navButton} onClick={() => setTab(key)}>
              <span className={styles.navIcon}>{icon}</span>{label}
            </button>
          ))}
          <div className={styles.sidebarNote}>
            <div className={styles.sideLabel}>PROTOTYPE STATUS</div>
            <div className={styles.statusDot}>Local demo mode</div>
            <p>No Supabase connection. Changes reset when the browser session is cleared.</p>
          </div>
        </aside>

        <section className={styles.content}>
          <div className={styles.pageHeading}>
            <div><div className={styles.eyebrow}>CAMPUS OPERATIONS / 2027–28</div><h1>{tab === "overview" ? "Scheduling overview" : tab === "students" ? "Student records" : tab === "master" ? "Master schedule" : "Schedule builder"}</h1><p>Explore a working scheduling workflow using sample campus data.</p></div>
            <div className={styles.headingActions}>
              <button className={styles.buttonSecondary} onClick={exportSchedules}>Export CSV</button>
              <button className={styles.buttonPrimary} onClick={generate}>✦ Generate schedules</button>
            </div>
          </div>

          <div className={styles.notice}><span>ⓘ</span>{notice}</div>

          {tab === "overview" && (
            <>
              <div className={styles.metrics}>
                <div className={styles.metricCard}><div className={styles.metricLabel}>STUDENTS</div><div className={styles.metricValue}>{students.length}</div><div className={styles.metricFoot}>In current demo roster</div></div>
                <div className={styles.metricCard}><div className={styles.metricLabel}>COURSES</div><div className={styles.metricValue}>{courses.length}</div><div className={styles.metricFoot}>Available in sample catalog</div></div>
                <div className={styles.metricCard}><div className={styles.metricLabel}>SECTIONS</div><div className={styles.metricValue}>{sections.length}</div><div className={styles.metricFoot}>Across 7 sample periods</div></div>
                <div className={styles.metricCard}><div className={styles.metricLabel}>REQUESTS PLACED</div><div className={styles.metricValue}>{generated ? completion + "%" : "—"}</div><div className={styles.metricFoot}>{generated ? scheduledCount + " of " + totalRequests + " requests assigned" : "Generate to calculate placement"}</div></div>
              </div>
              <div className={styles.dashboardGrid}>
                <div className={styles.panel}>
                  <div className={styles.panelHeader}><div><h2>Scheduling readiness</h2><p>Current state of the sample campus dataset</p></div><span className={styles.softBadge}>DEMO</span></div>
                  <div className={styles.progressBlock}><div className={styles.progressLabels}><span>Student course requests</span><strong>{totalRequests}</strong></div><div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: "100%" }} /></div></div>
                  <div className={styles.progressBlock}><div className={styles.progressLabels}><span>Requests successfully placed</span><strong>{generated ? scheduledCount + " / " + totalRequests : "Not generated"}</strong></div><div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: (generated ? completion : 0) + "%" }} /></div></div>
                  <div className={styles.progressBlock}><div className={styles.progressLabels}><span>Unfilled requests</span><strong className={unfilled.length ? styles.warningText : ""}>{generated ? unfilled.length : "—"}</strong></div><div className={styles.progressTrack}><div className={styles.progressWarning} style={{ width: (generated && totalRequests ? (unfilled.length / totalRequests) * 100 : 0) + "%" }} /></div></div>
                  <div className={styles.callout}><strong>Next recommended action</strong><p>{generated ? "Review unfilled requests and section loads, then make manual adjustments." : "Generate a first-pass schedule to see placement rates and identify bottlenecks."}</p></div>
                </div>
                <div className={styles.panel}>
                  <div className={styles.panelHeader}><div><h2>Scheduling workflow</h2><p>Prototype milestones</p></div></div>
                  {["Load student roster", "Configure courses and sections", "Collect course requests", "Generate draft schedules", "Review exceptions and adjust", "Export for review"].map((item, index) => <div className={styles.workflowRow} key={item}><span className={styles.workflowNumber}>{index + 1}</span><span>{item}</span><span className={styles.workflowArrow}>›</span></div>)}
                </div>
              </div>
              <div className={styles.panel}>
                <div className={styles.panelHeader}><div><h2>Section capacity snapshot</h2><p>Enrollment after schedule generation</p></div><button className={styles.textButton} onClick={() => setTab("master")}>View master schedule →</button></div>
                <div className={styles.capacityGrid}>
                  {sections.slice(0, 8).map((section) => {
                    const count = loads[section.id] ?? 0;
                    const percent = Math.min(100, Math.round((count / section.capacity) * 100));
                    return <div className={styles.capacityItem} key={section.id}><div className={styles.capacityTop}><strong>{section.course}</strong><span>{count}/{section.capacity}</span></div><div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: percent + "%" }} /></div><small>Period {section.period} · {section.teacher}</small></div>;
                  })}
                </div>
              </div>
            </>
          )}

          {tab === "students" && (
            <>
              <div className={styles.panel}>
                <div className={styles.panelHeader}><div><h2>Add students</h2><p>Manual entry for the prototype roster</p></div></div>
                <div className={styles.addRow}><input value={newStudentName} onChange={(event) => setNewStudentName(event.target.value)} placeholder="Student name" /><select value={newStudentGrade} onChange={(event) => setNewStudentGrade(event.target.value)}><option value="9">Grade 9</option><option value="10">Grade 10</option><option value="11">Grade 11</option><option value="12">Grade 12</option></select><button className={styles.buttonPrimary} onClick={addStudent}>Add student</button></div>
              </div>
              <div className={styles.panel}>
                <div className={styles.panelHeader}><div><h2>Import roster</h2><p>CSV columns: name, grade, optional requests separated by |</p></div></div>
                <label className={styles.uploadButton}>Choose CSV file<input type="file" accept=".csv,text/csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importStudents(file); event.currentTarget.value = ""; }} /></label>
                <span className={styles.helpText}>Imports are processed in your browser. Use fictional data only in this prototype.</span>
              </div>
              <div className={styles.panel}>
                <div className={styles.panelHeader}><div><h2>Student roster</h2><p>{students.length} records · fictional sample data</p></div><input className={styles.searchInput} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search students..." /></div>
                <div className={styles.tableWrap}><table><thead><tr><th>Student</th><th>ID</th><th>Grade</th><th>Course requests</th><th>Placed</th><th>Review</th></tr></thead><tbody>{filteredStudents.map((student) => { const placed = assignments.filter((item) => item.studentId === student.id).length; return <tr key={student.id}><td><strong>{student.name}</strong></td><td className={styles.mono}>{student.id}</td><td><span className={styles.gradeBadge}>{student.grade}</span></td><td>{student.requests.length}</td><td>{generated ? placed + " / " + student.requests.length : "—"}</td><td><button className={styles.textButton} onClick={() => { setSelectedStudent(student.id); setTab("builder"); }}>Open schedule →</button></td></tr>; })}</tbody></table></div>
              </div>
            </>
          )}

          {tab === "master" && (
            <div className={styles.panel}>
              <div className={styles.panelHeader}><div><h2>Master schedule sections</h2><p>{sections.length} sections · 7-period sample day · editable capacity model</p></div><span className={styles.softBadge}>READ-ONLY DEMO</span></div>
              <div className={styles.sectionGrid}>{sections.map((section) => { const count = loads[section.id] ?? 0; const percent = Math.min(100, Math.round((count / section.capacity) * 100)); return <div className={styles.sectionCard} key={section.id}><div className={styles.sectionTop}><span className={styles.periodTag}>P{section.period}</span><span className={styles.sectionId}>{section.id}</span></div><h3>{section.course}</h3><p>{section.teacher} · Room {section.room}</p><div className={styles.progressTrack}><div className={percent >= 100 ? styles.progressWarning : styles.progressFill} style={{ width: percent + "%" }} /></div><div className={styles.sectionFoot}><span>{count} enrolled</span><span>Capacity {section.capacity}</span></div></div>; })}</div>
            </div>
          )}

          {tab === "builder" && (
            <>
              <div className={styles.panel}>
                <div className={styles.panelHeader}><div><h2>Draft schedule review</h2><p>{generated ? "Generated assignments with manual adjustment controls" : "Generate a first-pass schedule to populate this workspace"}</p></div><span className={generated ? styles.softBadge : styles.pendingBadge}>{generated ? "DRAFT GENERATED" : "NOT GENERATED"}</span></div>
                <div className={styles.studentSelectRow}><label htmlFor="student-picker">Select student</label><select id="student-picker" value={selectedStudent} onChange={(event) => setSelectedStudent(event.target.value)}>{students.map((student) => <option key={student.id} value={student.id}>{student.name} · Grade {student.grade}</option>)}</select><span className={styles.studentCount}>{selectedAssignments.length} classes placed</span></div>
                {!generated ? <div className={styles.emptyState}><div className={styles.emptyIcon}>✣</div><h3>No draft schedule yet</h3><p>Run the scheduler to place students into available sections while checking periods and capacity.</p><button className={styles.buttonPrimary} onClick={generate}>Generate schedules</button></div> : (
                  <div className={styles.scheduleGrid}>
                    {Array.from({ length: 7 }, (_, index) => index + 1).map((period) => {
                      const assignment = selectedAssignments.find((item) => item.period === period);
                      const section = assignment ? sections.find((item) => item.id === assignment.sectionId) : undefined;
                      return <div className={styles.periodCard} key={period}><div className={styles.periodHeader}><span>PERIOD {period}</span><span>{assignment ? "ASSIGNED" : "OPEN"}</span></div>{assignment && section ? <><h3>{assignment.course}</h3><p>{section.teacher}</p><small>{section.room} · {section.id}</small><select aria-label={"Change " + assignment.course + " section"} value={assignment.sectionId} onChange={(event) => changeAssignment(assignment.course, event.target.value)}><option value={assignment.sectionId}>{section.id} · Period {section.period}</option>{sections.filter((item) => item.course === assignment.course && item.id !== assignment.sectionId).map((item) => <option key={item.id} value={item.id}>{item.id} · Period {item.period}</option>)}</select></> : <div className={styles.openPeriod}>No class assigned</div>}</div>;
                    })}
                  </div>
                )}
              </div>
              {generated && <div className={styles.panel}><div className={styles.panelHeader}><div><h2>Unfilled course requests</h2><p>Requests that could not be placed by the prototype heuristic</p></div><span className={unfilled.length ? styles.warningBadge : styles.softBadge}>{unfilled.length} UNFILLED</span></div>{unfilled.length ? <div className={styles.tableWrap}><table><thead><tr><th>Student</th><th>Course</th><th>Reason</th></tr></thead><tbody>{unfilled.map((item, index) => <tr key={item.studentId + item.course + index}><td>{students.find((student) => student.id === item.studentId)?.name ?? item.studentId}</td><td>{item.course}</td><td className={styles.warningText}>{item.reason}</td></tr>)}</tbody></table></div> : <div className={styles.successState}>All sample course requests were placed in this draft.</div>}</div>}
            </>
          )}

          <footer className={styles.footer}>CAMPUS SCHEDULER PROTOTYPE <span>·</span> No real student data <span>·</span> No SIS / Supabase connection</footer>
        </section>
      </div>
    </main>
  );
}
