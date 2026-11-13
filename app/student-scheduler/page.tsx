"use client";
import { useState } from "react";
import styles from "./student.module.css";

const students = [
  { id: "S-1001", name: "Avery Anderson", grade: 9, counselor: "Ms. Carter" },
  { id: "S-1002", name: "Jordan Bennett", grade: 10, counselor: "Mr. Lewis" },
  { id: "S-1003", name: "Morgan Campbell", grade: 11, counselor: "Ms. Patel" },
];
const courses = [
  { name: "English I", area: "English", grades: "9", credit: "1.0" },
  { name: "English II", area: "English", grades: "10–12", credit: "1.0" },
  { name: "Algebra I", area: "Math", grades: "9–10", credit: "1.0" },
  { name: "Biology", area: "Science", grades: "9–10", credit: "1.0" },
  { name: "Chemistry", area: "Science", grades: "10–12", credit: "1.0" },
  { name: "World Geography", area: "Social Studies", grades: "9", credit: "1.0" },
  { name: "U.S. History", area: "Social Studies", grades: "10–12", credit: "1.0" },
  { name: "Physical Education", area: "Elective", grades: "9–12", credit: "1.0" },
  { name: "Art I", area: "Fine Arts", grades: "9–12", credit: "1.0" },
  { name: "Computer Science", area: "CTE", grades: "9–12", credit: "1.0" },
  { name: "Spanish I", area: "World Languages", grades: "9–12", credit: "1.0" },
];
const schedules: Record<string, { course: string; teacher: string; room: string; time: string }[]> = {
  "S-1001": [
    ["English I","M. Carter","A101","8:10–9:00"],["Algebra I","R. Brooks","B201","9:05–9:55"],["Biology","A. Nguyen","C301","10:00–10:50"],["Computer Science","J. Jester","LAB1","10:55–11:45"],["World Geography","L. Davis","A201","12:20–1:10"],["Physical Education","K. Reed","GYM","1:15–2:05"],["Art I","C. Hall","D101","2:10–3:00"]
  ].map(([course,teacher,room,time])=>({course,teacher,room,time})),
  "S-1002": [
    ["English II","S. Patel","A102","8:10–9:00"],["Chemistry","T. Evans","C302","9:05–9:55"],["Biology","A. Nguyen","C301","10:00–10:50"],["U.S. History","P. Wilson","A202","10:55–11:45"],["Algebra I","R. Brooks","B201","12:20–1:10"],["Physical Education","K. Reed","GYM","1:15–2:05"],["Computer Science","J. Jester","LAB1","2:10–3:00"]
  ].map(([course,teacher,room,time])=>({course,teacher,room,time})),
  "S-1003": [
    ["English II","D. Moore","A105","8:10–9:00"],["Chemistry","T. Evans","C302","9:05–9:55"],["Art I","C. Hall","D101","10:00–10:50"],["U.S. History","P. Wilson","A202","10:55–11:45"],["Spanish I","M. Garcia","A301","12:20–1:10"],["Biology","A. Nguyen","C301","1:15–2:05"],["Computer Science","J. Jester","LAB1","2:10–3:00"]
  ].map(([course,teacher,room,time])=>({course,teacher,room,time})),
};
type Tab = "schedule" | "requests" | "catalog";
export default function StudentSchedulerPage() {
  const [studentId,setStudentId]=useState("S-1001");
  const [tab,setTab]=useState<Tab>("schedule");
  const [requests,setRequests]=useState<string[]>(["Computer Science","Spanish I"]);
  const [submitted,setSubmitted]=useState(false);
  const student=students.find(s=>s.id===studentId)!;
  const toggle=(name:string)=>{setSubmitted(false);setRequests(old=>old.includes(name)?old.filter(x=>x!==name):[...old,name]);};
  return <main className={styles.page}>
    <header className={styles.top}><div className={styles.brand}><span className={styles.logo}>✦</span><div><b>Student Scheduler</b><small>COURSE PLANNING & DAILY SCHEDULE</small></div></div><span className={styles.demo}>PREVIEW · NO LOGIN</span></header>
    <div className={styles.wrap}>
      <section className={styles.hero}><div><small>2027–28 SCHOOL YEAR</small><h1>Welcome, {student.name.split(" ")[0]}.</h1><p>Your schedule and course planning workspace.</p></div><label>Preview student<select value={studentId} onChange={e=>setStudentId(e.target.value)}>{students.map(s=><option key={s.id} value={s.id}>{s.name} · Grade {s.grade}</option>)}</select></label></section>
      <div className={styles.notice}>ⓘ This is a visual prototype using fictional student information. Changes stay in this browser and are not sent to the school.</div>
      <section className={styles.profile}>{[["STUDENT",student.name],["GRADE",String(student.grade)],["COUNSELOR",student.counselor],["STATUS","Draft schedule"]].map(([k,v])=><div key={k}><small>{k}</small><b>{v}</b></div>)}</section>
      <nav className={styles.tabs}>{(["schedule","requests","catalog"] as Tab[]).map(t=><button key={t} className={tab===t?styles.selected:""} onClick={()=>setTab(t)}>{t==="schedule"?"My Schedule":t==="requests"?`Course Requests · ${requests.length}`:"Course Catalog"}</button>)}</nav>
      {tab==="schedule"&&<><div className={styles.heading}><div><h2>My daily schedule</h2><p>Your current sample schedule for the school year.</p></div><span className={styles.muted}>7 PERIODS</span></div><div className={styles.schedule}>{(schedules[studentId]||[]).map((c,i)=><article className={styles.classRow} key={i}><div className={styles.period}><small>PERIOD</small><b>{String(i+1).padStart(2,"0")}</b></div><div className={styles.course}><b>{c.course}</b><small>{c.teacher} · Room {c.room}</small></div><time>{c.time}</time></article>)}</div></>}
      {tab==="requests"&&<><div className={styles.heading}><div><h2>Choose next year’s courses</h2><p>Select courses you are interested in. Your counselor reviews requests before schedules are finalized.</p></div><span className={styles.muted}>{requests.length} SELECTED</span></div><div className={styles.requestLayout}><div className={styles.courseGroups}>{[...new Set(courses.map(c=>c.area))].map(area=><section className={styles.group} key={area}><h3>{area}</h3>{courses.filter(c=>c.area===area).map(c=><label className={styles.option} key={c.name}><input type="checkbox" checked={requests.includes(c.name)} onChange={()=>toggle(c.name)}/><span><b>{c.name}</b><small>{c.credit} credit · Grades {c.grades}</small></span></label>)}</section>)}</div><aside className={styles.summary}><small>YOUR COURSE REQUESTS</small><strong>{requests.length}</strong><p>courses selected</p><ul>{requests.map(r=><li key={r}>{r}</li>)}</ul><button onClick={()=>setSubmitted(true)}>Submit request preview</button><small>Demo only. Nothing is saved or transmitted.</small>{submitted&&<p className={styles.success}>✓ Preview submitted in this session</p>}</aside></div></>}
      {tab==="catalog"&&<><div className={styles.heading}><div><h2>Course catalog</h2><p>Explore courses available in this sample campus catalog.</p></div><span className={styles.muted}>{courses.length} COURSES</span></div><div className={styles.catalog}>{courses.map(c=><article className={styles.catalogCard} key={c.name}><small>{c.area}</small><b>{c.name}</b><p>{c.credit} credit · Grades {c.grades}</p><button onClick={()=>{toggle(c.name);setTab("requests");}}>＋ Add to requests</button></article>)}</div></>}
      <footer className={styles.footer}>STUDENT SCHEDULER PREVIEW · FICTIONAL DATA ONLY · NOT CONNECTED TO SCHOOL SYSTEMS</footer>
    </div>
  </main>;
}