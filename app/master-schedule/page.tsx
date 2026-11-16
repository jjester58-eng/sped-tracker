"use client";
import { useState } from "react";
import styles from "../student-scheduler/student.module.css";

const courses = [
  "English I","English II","Algebra I","Biology","Chemistry","World Geography",
  "U.S. History","Physical Education","Art I","Computer Science","Spanish I",
];
type MasterSection = { id: number; course: string; teacher: string; room: string; period: string; capacity: number; enrolled: number };

export default function MasterSchedulePage() {
  const [sections,setSections]=useState<MasterSection[]>([
    {id:1,course:"English I",teacher:"M. Carter",room:"A101",period:"1",capacity:28,enrolled:24},
    {id:2,course:"Algebra I",teacher:"R. Brooks",room:"B201",period:"2",capacity:28,enrolled:27},
    {id:3,course:"Biology",teacher:"A. Nguyen",room:"C301",period:"3",capacity:26,enrolled:22},
  ]);
  const [newCourse,setNewCourse]=useState("English I");
  const [newTeacher,setNewTeacher]=useState("");
  const [newRoom,setNewRoom]=useState("");
  const [newPeriod,setNewPeriod]=useState("1");
  const [newCapacity,setNewCapacity]=useState("28");
  return <main className={styles.page}>
    <header className={styles.top}><div className={styles.brand}><span className={styles.logo}>✦</span><div><b>Master Schedule</b><small>ADMINISTRATION & CAMPUS SCHEDULING</small></div></div><span className={styles.demo}>PREVIEW · NO LOGIN</span></header>
    <div className={styles.wrap}>
      <section className={styles.hero}><div><small>2027–28 SCHOOL YEAR</small><h1>Master Schedule</h1><p>Build and review course sections, teachers, rooms, periods, and capacity.</p></div></section>
      <div className={styles.adminNotice}>ADMIN PREVIEW · Changes are temporary and stay in this browser. This prototype is not connected to school data.</div>
      <div className={styles.heading}><div><h2>Master Schedule Builder</h2><p>Admin workspace for organizing course sections, teachers, rooms, periods, and class capacity.</p></div><span className={styles.muted}>{sections.length} SECTIONS</span></div><div className={styles.adminNotice}>ADMIN PREVIEW · Changes are temporary and stay in this browser. This prototype is not connected to school data.</div><form className={styles.masterForm} onSubmit={e=>{e.preventDefault();if(!newTeacher.trim()||!newRoom.trim())return;setSections(old=>[...old,{id:Math.max(0,...old.map(s=>s.id))+1,course:newCourse,teacher:newTeacher.trim(),room:newRoom.trim(),period:newPeriod,capacity:Math.max(1,Number(newCapacity)||28),enrolled:0}]);setNewTeacher("");setNewRoom("");}}><label>Course<select value={newCourse} onChange={e=>setNewCourse(e.target.value)}>{courses.map(c=><option key={c.name}>{c.name}</option>)}</select></label><label>Teacher<input value={newTeacher} onChange={e=>setNewTeacher(e.target.value)} placeholder="Teacher name" required /></label><label>Room<input value={newRoom} onChange={e=>setNewRoom(e.target.value)} placeholder="Room" required /></label><label>Period<select value={newPeriod} onChange={e=>setNewPeriod(e.target.value)}>{["1","2","3","4","5","6","7","8"].map(n=><option key={n} value={n}>{n}</option>)}</select></label><label>Capacity<input type="number" min="1" max="60" value={newCapacity} onChange={e=>setNewCapacity(e.target.value)} /></label><button type="submit">＋ Add section</button></form><div className={styles.masterTableWrap}><table className={styles.masterTable}><thead><tr><th>Period</th><th>Course</th><th>Teacher</th><th>Room</th><th>Enrollment</th><th>Capacity</th><th></th></tr></thead><tbody>{sections.slice().sort((a,b)=>Number(a.period)-Number(b.period)||a.course.localeCompare(b.course)).map(s=><tr key={s.id}><td>{s.period}</td><td><b>{s.course}</b></td><td>{s.teacher}</td><td>{s.room}</td><td>{s.enrolled}</td><td>{s.capacity}</td><td><button type="button" className={styles.removeSection} onClick={()=>setSections(old=>old.filter(x=>x.id!==s.id))}>Remove</button></td></tr>)}</tbody></table></div><p className={styles.masterFootnote}>Next step for the connected version: save sections to the database, assign teachers and rooms from managed lists, and validate teacher/room/period conflicts and class-size limits.</p>
      <footer className={styles.footer}>MASTER SCHEDULE PREVIEW · FICTIONAL DATA ONLY · NOT CONNECTED TO SCHOOL SYSTEMS</footer>
    </div>
  </main>;
}
