"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./student.module.css";
import { loadPlanningDemo, type PlanningData, schedulePeriods } from "@/lib/planningDemo";

export default function StudentScheduleLookupPage() {
  const [data,setData]=useState<PlanningData|null>(null);
  const [studentId,setStudentId]=useState("");
  useEffect(()=>{const loaded=loadPlanningDemo();setData(loaded);setStudentId(loaded.requests[0]?.id||"");},[]);
  const student=data?.requests.find(s=>s.id===studentId);
  const schedule=data?.studentSchedules.find(s=>s.studentId===studentId);
  const rows=useMemo(()=>schedulePeriods.map(p=>({period:p.period,label:p.label,time:p.time,detail:schedule?.periods[p.period]||"Not scheduled"})),[schedule]);
  if(!data)return <main className={styles.page}><div className={styles.wrap}>Loading student schedule…</div></main>;
  return <main className={styles.page}>
    <header className={styles.top}><div className={styles.brand}><span className={styles.logo}>✦</span><div><b>Student Schedule Lookup</b><small>READ-ONLY SCHEDULE VIEW</small></div></div><span className={styles.demo}>DEMO · NO LOGIN</span></header>
    <div className={styles.wrap}>
      <section className={styles.hero}><div><small>2026–27 SCHOOL YEAR</small><h1>Explore Student Schedules</h1><p>Look up a student and view the schedule generated from course requests and the teacher master grid.</p></div><label>Find a student<select value={studentId} onChange={e=>setStudentId(e.target.value)}><option value="">Choose student</option>{data.requests.map(s=><option key={s.id} value={s.id}>{s.name} · Grade {s.grade}</option>)}</select></label></section>
      <div className={styles.notice}>Read-only student view. Schedules are generated in Staff & Course Planning. This demo uses fictional student information and stores changes in this browser only.</div>
      {student?<><section className={styles.profile}>{[["STUDENT",student.name],["GRADE",String(student.grade)],["SPED / CO-TEACH",student.sped?"Yes":"No"],["SCHEDULE",schedule?.status||"Not generated"]].map(([k,v])=><div key={k}><small>{k}</small><b>{v}</b></div>)}</section>
        <div className={styles.heading}><div><h2>{student.name}’s daily schedule</h2><p>Eight course periods with A/B day blocks and daily advisory.</p></div><span className={styles.muted}>{schedule?Object.keys(schedule.periods).length:0} / 8 PERIODS</span></div>
        <div className={styles.schedule}><article className={styles.classRow}><div className={styles.period}><small>DAILY</small><b>ADV</b></div><div className={styles.course}><b>Advisory / Daily Assignment</b><small>{schedule?.advisory||"Not assigned"}</small></div><time>10:45–11:20</time></article>
          {rows.map(row=><article className={styles.classRow} key={row.period}><div className={styles.period}><small>PERIOD</small><b>{String(row.period).padStart(2,"0")}</b></div><div className={styles.course}><b>{row.detail}</b><small>{row.label}</small></div><time>{row.time}</time></article>)}
        </div>
        {schedule?.missing.length?<div className={styles.notice}>Needs counselor review: {schedule.missing.join(", ")}</div>:null}
        <div className={styles.calendar}><b>Schedule management</b><p>Course requests, alternates, and schedule generation are managed in the staff planning workspace.</p><Link href="/staff-planning">Open Staff & Course Planning →</Link></div>
      </>:<div className={styles.calendar}><b>No student selected</b><p>Add student requests and run the scheduler to create a student schedule.</p><Link href="/staff-planning">Open Staff & Course Planning →</Link></div>}
      {!data.studentSchedules.length&&<div className={styles.notice}>No schedules have been generated yet. Open Staff & Course Planning, review the course assignments, and run the 8-period scheduler.</div>}
      <footer className={styles.footer}>STUDENT SCHEDULE LOOKUP · FICTIONAL DATA ONLY · DEMO DATA STORED LOCALLY</footer>
    </div>
  </main>;
}
