"use client";

import { useMemo, useState } from "react";
import styles from "./student.module.css";

const demoStudents = [
  { id: "STU-001", name: "Avery Anderson", grade: 9, counselor: "Ms. Carter" },
  { id: "STU-002", name: "Jordan Bennett", grade: 10, counselor: "Mr. Lewis" },
  { id: "STU-003", name: "Morgan Campbell", grade: 11, counselor: "Ms. Patel" },
];

const catalog = [
  { name: "English I", area: "English", grades: "9", credits: "1.0", note: "Required" },
  { name: "English II", area: "English", grades: "10–12", credits: "1.0", note: "Required" },
  { name: "Algebra I", area: "Math", grades: "9–10", credits: "1.0", note: "Required" },
  { name: "Biology", area: "Science", grades: "9–10", credits: "1.0", note: "Required" },
  { name: "Chemistry", area: "Science", grades: "10–12", credits: "1.0", note: "Prerequisite may apply" },
  { name: "World Geography", area: "Social Studies", grades: "9", credits: "1.0", note: "Required" },
  { name: "U.S. History", area: "Social Studies", grades: "10–12", credits: "1.0", note: "Required" },
  { name: "Physical Education", area: "Elective", grades: "9–12", credits: "1.0", note: "Elective" },
  { name: "Art I", area: "Fine Arts", grades: "9–12", credits: "1.0", note: "Elective" },
  { name: "Computer Science", area: "CTE", grades: "9–12", credits: "1.0", note: "Elective" },
  { name: "Spanish I", area: "World Languages", grades: "9–12", credits: "1.0", note: "Elective" },
];

const sampleSchedules: Record<string, { period: number; time: string; course: string; teacher: string; room: string }[]> = {
  "STU-001": [
    { period: 1, time: "8:10–9:00", course: "English I", teacher: "M. Carter", room: "A101" },
    { period: 2, time: "9:05–9:55", course: "Algebra I", teacher: "R. Brooks", room: "B201" },
    { period: 3, time: "10:00–10:50", course: "Biology", teacher: "A. Nguyen", room: "C301" },
    { period: 4, time: "10:55–11:45", course: "Computer Science", teacher: "J. Jester", room: "LAB1" },
    { period: 5, time: "12:20–1:10", course: "World Geography", teacher: "L. Davis", room: "A201" },
    { period: 6, time: "1:15–2:05", course: "Physical Education", teacher: "K. Reed", room: "GYM" },
    { period: 7, time: "2:10–3:00", course: "Art I", teacher: "C. Hall", room: "D101" },
  ],
  "STU-002": [
    { period: 1, time: "8:10–9:00", course: "English II", teacher: "S. Patel", room: "A102" },
    { period: 2, time: "9:05–9:55", course: "Chemistry", teacher: "T. Evans", room: "C302" },
    { period: 3, time: "10:00–10:50", course: "Biology", teacher: "A. Nguyen", room: "C301" },
    { period: 4, time: "10:55–11:45", course: "U.S. History", teacher: "P. Wilson", room: "A202" },
    { period: 5, time: "12:20–1:10", course: "Algebra I", teacher: "R. Brooks", room: "B201" },
    { period: 6, time: "1:15–2:05", course: "Physical Education", teacher: "K. Reed", room: "GYM" },
    { period: 7, time: "2:10–3:00", course: "Computer Science", teacher: "J. Jester", room: "LAB1" },
  ],
  "STU-003": [
    { period: 1, time: "8:10–9:00", course: "English II", teacher: "D. Moore", room: "A105" },
    { period: 2, time: "9:05–9:55", course: "Chemistry", teacher: "T. Evans", room: "C302" },
    { period: 3, time: "10:00–10:50", course: "Art I", teacher: "C. Hall", room: "D101" },
    { period: 4, time: "10:55–11:45", course: "U.S. History", teacher: "P. Wilson", room: "A202" },
    { period: 5, time: "12:20–1:10", course: "Spanish I", teacher: "M. Garcia", room: "A301" },
    { period: 6, time: "1:15–2:05", course: "Biology", teacher: "A. Nguyen", room: "C301" },
    { period: 7, time: "2:10–3:00", course: "Computer Science", teacher: "J. Jester", room: "LAB1" },
  ],
};

type View = "schedule" | "requests" | "catalog";

export default function StudentSchedulerPage() {
  const [studentId, setStudentId] = useState("STU-001");
  const [view, setView] = useState<View>("schedule");
  const [selectedCourses, setSelectedCourses] = useState<string[]>(["Computer Science", "Spanish I"]);
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState("You are viewing a sample student account. This demo does not use a login or save information to a server.");
  const student = demoStudents.find((item) => item.id === studentId) ?? demoStudents[0];
  const schedule = sampleSchedules[studentId];
  const requestCount = selectedCourses.length;
  const groupedCatalog = useMemo(() => [...new Set(catalog.map((course) => course.area))], []);

  function toggleCourse(course: string) {
    setSubmitted(false);
    setSelectedCourses((current) => current.includes(course) ? current.filter((item) => item !== course) : [...current, course]);
  }

  function submitRequests() {
    setSubmitted(true);
    setNotice("Your course request preview has been submitted in this browser session. In the real system, this would go to your counselor for review.");
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}><div className={styles.logo}>W</div><div><strong>Student Portal</strong><span>COURSE PLANNING & DAILY SCHEDULE</span></div></div>
        <div className={styles.headerRight}><span className={styles.demo}>DEMO MODE</span><span className={styles.avatar}>{student.name.split(" ").map((part) => part[0]).join("")}</span></div>
      </header>
      <div className={styles.container}>
        <div className={styles.welcome}>
          <div><div className={styles.kicker}>2027–28 SCHOOL YEAR</div><h1>Good morning, {student.name.split(" ")[0]}.</h1><p>Here’s your schedule and course planning workspace.</p></div>
          <label className={styles.studentPicker}>Preview student<select value={studentId} onChange={(event) => setStudentId(event.target.value)}>{demoStudents.map((item) => <option key={item.id} value={item.id}>{item.name} · Grade {item.grade}</option>)}</select></label>
        </div>
        <div className={styles.notice}><span>ⓘ</span>{notice}</div>
        <div className={styles.profileStrip}><div><span>STUDENT</span><strong>{student.name}</strong></div><div><span>GRADE</span><strong>{student.grade}</strong></div><div><span>COUNSELOR</span><strong>{student.counselor}</strong></div><div><span>SCHEDULE STATUS</span><strong className={styles.status}>Draft schedule</strong></div></div>
        <nav className={styles.tabs}>
          <button className={view === "schedule" ? styles.activeTab : ""} onClick={() => setView("schedule")}>My schedule</button>
          <button className={view === "requests" ? styles.activeTab : ""} onClick={() => setView("requests")}>Course requests <span>{requestCount}</span></button>
          <button className={view === "catalog" ? styles.activeTab : ""} onClick={() => setView("catalog")}>Course catalog</button>
        </nav>
        {view === "schedule" && <>
          <div className={styles.sectionHeading}><div><h2>My daily schedule</h2><p>Your current sample schedule for the school year</p></div><button className={styles.outlineButton} onClick={() => setNotice("Calendar export will be available after account and Outlook integration are implemented.")}>＋ Add to calendar <span className={styles.coming}>LATER</span></button></div>
          <div className={styles.scheduleList}>{schedule.map((item) => <article className={styles.classCard} key={item.period}><div className={styles.period}><span>PERIOD</span><strong>{String(item.period).padStart(2, "0")}</strong></div><div className={styles.classInfo}><strong>{item.course}</strong><span>{item.teacher} · Room {item.room}</span></div><div className={styles.time}>{item.time}</div></article>)}</div>
          <div className={styles.calendarHint}><div className={styles.calendarIcon}>▦</div><div><strong>Keep your schedule in sync</strong><p>Google sign-in and Outlook calendar sync are planned features. They are not connected in this preview.</p></div><span>COMING LATER</span></div>
        </>}
        {view === "requests" && <>
          <div className={styles.sectionHeading}><div><h2>Choose next year’s courses</h2><p>Select courses you are interested in. Your counselor will review requests before schedules are finalized.</p></div><span className={styles.requestCount}>{requestCount} selected</span></div>
          <div className={styles.requestLayout}><div className={styles.courseList}>{groupedCatalog.map((area) => <section className={styles.courseGroup} key={area}><h3>{area}</h3>{catalog.filter((course) => course.area === area).map((course) => <label className={styles.courseOption} key={course.name}><input type="checkbox" checked={selectedCourses.includes(course.name)} onChange={() => toggleCourse(course.name)} /><span className={styles.checkmark}></span><span className={styles.courseText}><strong>{course.name}</strong><small>{course.credits} credit · Grades {course.grades}</small></span><span className={styles.courseNote}>{course.note}</span></label>)}</section>)}</div><aside className={styles.requestSummary}><span className={styles.summaryLabel}>YOUR REQUESTS</span><strong className={styles.summaryNumber}>{requestCount}</strong><p>course requests selected</p><ul>{selectedCourses.map((course) => <li key={course}>{course}</li>)}</ul><button className={styles.primaryButton} onClick={submitRequests}>Submit course requests</button><small>This is a demo submission only. No data is sent to the school.</small>{submitted && <div className={styles.submitted}>✓ Request preview submitted</div>}</aside></div>
        </>}
        {view === "catalog" && <>
          <div className={styles.sectionHeading}><div><h2>Course catalog</h2><p>Explore courses available in the sample campus catalog.</p></div><span className={styles.requestCount}>{catalog.length} courses</span></div>
          <div className={styles.catalogGrid}>{catalog.map((course) => <article className={styles.catalogCard} key={course.name}><span>{course.area}</span><h3>{course.name}</h3><p>{course.credits} credit · Grades {course.grades}</p><small>{course.note}</small><button onClick={() => { toggleCourse(course.name); setView("requests"); }}>＋ Add to requests</button></article>)}</div>
        </>}
        <footer className={styles.footer}>STUDENT SCHEDULER PREVIEW <span>·</span> FICTIONAL DATA ONLY <span>·</span> NOT CONNECTED TO SCHOOL SYSTEMS</footer>
      </div>
    </main>
  );
}
