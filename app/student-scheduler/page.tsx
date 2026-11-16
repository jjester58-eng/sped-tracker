"use client";
import { useState } from "react";
import styles from "./student.module.css";

const students = [
  { id: "S-1001", name: "Avery Anderson", grade: 9, counselor: "Ms. Carter" },
  { id: "S-1002", name: "Jordan Bennett", grade: 10, counselor: "Mr. Lewis" },
  { id: "S-1003", name: "Morgan Campbell", grade: 11, counselor: "Ms. Patel" },
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

export default function StudentScheduleLookupPage() {
  const [studentId,setStudentId]=useState("S-1001");
  const student=students.find(s=>s.id===studentId)!;
  const schedule=schedules[studentId]||[];
  return <main className={styles.page}>
    <header className={styles.top}><div className={styles.brand}><span className={styles.logo}>✦</span><div><b>Student Schedule Lookup</b><small>READ-ONLY SCHEDULE VIEW</small></div></div><span className={styles.demo}>PREVIEW · NO LOGIN</span></header>
    <div className={styles.wrap}>
      <section className={styles.hero}><div><small>2027–28 SCHOOL YEAR</small><h1>Explore Student Schedules</h1><p>Look up a student and view their daily class schedule.</p></div><label>Find a student<select value={studentId} onChange={e=>setStudentId(e.target.value)}>{students.map(s=><option key={s.id} value={s.id}>{s.name} · Grade {s.grade}</option>)}</select></label></section>
      <div className={styles.notice}>ⓘ Read-only view. You can look up a student and review their schedule. No course requests or schedule changes can be made here. This preview uses fictional student information.</div>
      <section className={styles.profile}>{[["STUDENT",student.name],["GRADE",String(student.grade)],["COUNSELOR",student.counselor],["SCHEDULE","Current preview"]].map(([k,v])=><div key={k}><small>{k}</small><b>{v}</b></div>)}</section>
      <div className={styles.heading}><div><h2>{student.name}’s daily schedule</h2><p>Courses, teachers, rooms, and class times.</p></div><span className={styles.muted}>{schedule.length} PERIODS</span></div>
      <div className={styles.schedule}>{schedule.map((c,i)=><article className={styles.classRow} key={i}><div className={styles.period}><small>PERIOD</small><b>{String(i+1).padStart(2,"0")}</b></div><div className={styles.course}><b>{c.course}</b><small>{c.teacher} · Room {c.room}</small></div><time>{c.time}</time></article>)}</div>
      <footer className={styles.footer}>STUDENT SCHEDULE LOOKUP · FICTIONAL DATA ONLY · NOT CONNECTED TO SCHOOL SYSTEMS</footer>
    </div>
  </main>;
}
