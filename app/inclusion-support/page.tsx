"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/useSupabase";
import { verifyAdminAccess } from "@/lib/adminAccess";
import { isDemoMode, loadDemoSchedule, saveDemoSchedule, newDemoId } from "@/lib/scheduleDemo";
import styles from "./inclusion.module.css";

type Teacher = { id: string; name: string | null; email: string | null };
type Period = { id: string; name: string; sort_order: number | null };
type Section = { id: string; teacher_id: string; class_period_id: string; entry_type: string; course_name: string | null; subject: string | null; department: string | null; room: string | null; school_year: string; needs_inclusion: boolean };
type Assignment = { id: string; schedule_entry_id: string; inclusion_teacher_id: string; class_period_id: string; school_year: string };
type ScheduleBlock = { id: string; teacher_id: string; class_period_id: string; entry_type: string; course_name: string | null; room: string | null };

export default function InclusionSupportPage() {
  const supabase = useSupabase();
  const router = useRouter();
  const db = supabase as any;
  const [authChecked, setAuthChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [year, setYear] = useState("2026-27");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tab, setTab] = useState<"assign" | "schedules" | "coverage">("assign");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  useEffect(() => {
    if (isDemoMode()) {
      setAuthorized(true);
      setAuthChecked(true);
      return;
    }
    let alive = true;
    (async () => {
      const result = await verifyAdminAccess(supabase);
      if (!alive) return;
      if (!result.hasSession) { router.replace("/admin/login"); return; }
      if (!result.authorized) {
        setError(result.message || "Administrator access could not be confirmed.");
        setAuthChecked(true);
        return;
      }
      setAuthorized(true);
      setAuthChecked(true);
    })();
    return () => { alive = false; };
  }, [supabase, router]);

  const load = useCallback(async () => {
    if (!authorized) return;
    setLoading(true); setError("");
    if (isDemoMode()) {
      const demo = loadDemoSchedule(year);
      setTeachers(demo.teachers); setPeriods(demo.periods);
      setSections(demo.entries.filter(e => e.entry_type === "teaching"));
      setScheduleBlocks(demo.entries); setAssignments(demo.inclusions);
      if (demo.teachers.length) setSelectedTeacher(old => old || demo.teachers[0].id);
      const firstFlagged = demo.entries.find(e => e.entry_type === "teaching" && e.needs_inclusion);
      if (firstFlagged) setSelectedSection(old => old || firstFlagged.id);
      setLoading(false); return;
    }
    const [t,p,s,b,a] = await Promise.all([
      db.from("teachers").select("id,name,email").order("name"),
      db.from("class_periods").select("id,name,sort_order").eq("is_active",true).order("sort_order"),
      db.from("master_schedule_entries").select("id,teacher_id,class_period_id,entry_type,course_name,subject,department,room,school_year,needs_inclusion").eq("school_year",year).eq("is_active",true).eq("entry_type","teaching"),
      db.from("master_schedule_entries").select("id,teacher_id,class_period_id,entry_type,course_name,room").eq("school_year",year).eq("is_active",true),
      db.from("inclusion_assignments").select("id,schedule_entry_id,inclusion_teacher_id,class_period_id,school_year").eq("school_year",year),
    ]);
    const failure=t.error||p.error||s.error||b.error||a.error;
    if(failure) setError(failure.message||"Unable to load inclusion data. Apply the master schedule database setup script if these tables are missing.");
    setTeachers(t.data||[]); setPeriods(p.data||[]); setSections(s.data||[]); setScheduleBlocks(b.data||[]); setAssignments(a.data||[]);
    if (t.data?.length) setSelectedTeacher(old => old || t.data[0].id);
    if (s.data?.length) setSelectedSection(old => old || s.data[0].id);
    setLoading(false);
  }, [authorized, year]);

  useEffect(() => { load(); }, [load]);

  const teacherName=(id:string)=>teachers.find(t=>t.id===id)?.name||"Unknown teacher";
  const periodName=(id:string)=>periods.find(p=>p.id===id)?.name||"Unknown period";
  const flagged=sections.filter(s=>s.needs_inclusion);
  const unfilled=flagged.filter(s=>!assignments.some(a=>a.schedule_entry_id===s.id));
  const assigned=assignments.map(a=>({assignment:a,section:sections.find(s=>s.id===a.schedule_entry_id),teacher:teachers.find(t=>t.id===a.inclusion_teacher_id)})).filter(x=>x.section);
  const teacherSchedule=useMemo(()=>periods.map(period=>{
    const regular=scheduleBlocks.find(s=>s.teacher_id===selectedTeacher&&s.class_period_id===period.id);
    const support=assignments.find(a=>a.inclusion_teacher_id===selectedTeacher&&a.class_period_id===period.id);
    const supportSection=support?sections.find(s=>s.id===support.schedule_entry_id):undefined;
    if(regular) return {period,status:regular.entry_type==="teaching"?"Teaching":regular.entry_type==="conference"?"Conference":regular.entry_type==="plc"?"PLC":"Off period",detail:regular.course_name||regular.entry_type,room:regular.room||"—"};
    if(supportSection) return {period,status:"Teaching · Inclusion",detail:supportSection.course_name||"Class support",room:supportSection.room||"—"};
    return {period,status:"Unrecorded",detail:"No schedule entry recorded",room:"—"};
  }),[periods,sections,assignments,scheduleBlocks,selectedTeacher]);

  async function assign() {
    const section=sections.find(s=>s.id===selectedSection);
    if(!section||!selectedTeacher) return;
    if(section.teacher_id===selectedTeacher){setError("The classroom teacher cannot also be assigned as the inclusion teacher for the same class.");return;}
    const conflict=scheduleBlocks.some(s=>s.teacher_id===selectedTeacher&&s.class_period_id===section.class_period_id);
    const supportConflict=assignments.some(a=>a.inclusion_teacher_id===selectedTeacher&&a.class_period_id===section.class_period_id&&a.schedule_entry_id!==section.id);
    if(conflict||supportConflict){setError("Scheduling conflict: this inclusion teacher already has a teaching assignment during that period.");return;}
    setSaving(true);setError("");setNotice("");
    if (isDemoMode()) {
      const demo = loadDemoSchedule(year);
      const item = { id: newDemoId("inclusion"), schedule_entry_id: section.id, inclusion_teacher_id: selectedTeacher, class_period_id: section.class_period_id, school_year: year };
      const next = { ...demo, inclusions: [...demo.inclusions, item] };
      saveDemoSchedule(next); setAssignments(next.inclusions);
      setNotice(`${teacherName(selectedTeacher)} assigned to ${section.course_name}, ${periodName(section.class_period_id)} (demo).`);
      setSaving(false); return;
    }
    const {data,error:insertError}=await db.from("inclusion_assignments").insert({schedule_entry_id:section.id,inclusion_teacher_id:selectedTeacher,class_period_id:section.class_period_id,school_year:year}).select("id,schedule_entry_id,inclusion_teacher_id,class_period_id,school_year").single();
    if(insertError)setError(insertError.message);
    else{setAssignments(old=>[...old,data]);setNotice(`${teacherName(selectedTeacher)} assigned to ${section.course_name}, ${periodName(section.class_period_id)}.`);}
    setSaving(false);
  }

  async function removeAssignment(id:string){
    if (isDemoMode()) {
      const demo = loadDemoSchedule(year);
      const next = { ...demo, inclusions: demo.inclusions.filter(a => a.id !== id) };
      saveDemoSchedule(next); setAssignments(next.inclusions); setNotice("Demo inclusion assignment removed."); return;
    }
    const {error:removeError}=await db.from("inclusion_assignments").delete().eq("id",id);
    if(removeError)setError(removeError.message);else{setAssignments(old=>old.filter(a=>a.id!==id));setNotice("Inclusion assignment removed.");}
  }

  async function toggleFlag(section:Section){
    const next=!section.needs_inclusion;
    if (isDemoMode()) {
      const demo = loadDemoSchedule(year);
      const nextData = { ...demo, entries: demo.entries.map(e => e.id === section.id ? { ...e, needs_inclusion: next } : e) };
      saveDemoSchedule(nextData);
      setSections(old => old.map(s => s.id === section.id ? { ...s, needs_inclusion: next } : s));
      setScheduleBlocks(nextData.entries);
      setNotice(next ? "Class flagged for inclusion review (demo)." : "Inclusion flag removed (demo)."); return;
    }
    const {error:updateError}=await db.from("master_schedule_entries").update({needs_inclusion:next}).eq("id",section.id);
    if(updateError)setError(updateError.message);else{setSections(old=>old.map(s=>s.id===section.id?{...s,needs_inclusion:next}:s));setNotice(next?"Class flagged for inclusion review.":"Inclusion flag removed.");}
  }

  if(!authChecked)return <main className={styles.page}><div className={styles.shell}>Checking administrator access…</div></main>;
  if(!authorized)return <main className={styles.page}><div className={styles.shell}><h1>Administrator access required</h1><p>{error||"Please sign in with an administrator account."}</p></div></main>;

  return <main className={styles.page}><div className={styles.shell}>
    <header className={styles.header}><div><span className={styles.kicker}>CAMPUS SCHEDULING</span><h1>Inclusion Support</h1><p>Assign support staff to real master-schedule sections and review their complete day.</p></div><label className={styles.year}>School year<select value={year} onChange={e=>setYear(e.target.value)}>{["2026-27","2027-28","2028-29"].map(y=><option key={y}>{y}</option>)}</select></label></header>
    <div className={styles.notice}>This workspace shares the same teacher, period, and class-section records as Master Schedule. Inclusion assignments count as teaching time. A period without a schedule record is shown as <strong>Unrecorded</strong>, not assumed available.</div>
    <section className={styles.metrics}><div><strong>{teachers.length}</strong><span>Teachers in staff directory</span></div><div><strong>{flagged.length}</strong><span>Classes flagged for review</span></div><div><strong>{assignments.length}</strong><span>Inclusion assignments</span></div><div><strong>{unfilled.length}</strong><span>Flagged without coverage</span></div></section>
    <nav className={styles.tabs}><button className={tab==="assign"?styles.active:""} onClick={()=>setTab("assign")}>Assignments</button><button className={tab==="schedules"?styles.active:""} onClick={()=>setTab("schedules")}>Teacher schedules</button><button className={tab==="coverage"?styles.active:""} onClick={()=>setTab("coverage")}>Class coverage</button><a href="/master-schedule">Master Schedule →</a></nav>
    {error&&<div className={styles.error} role="alert">{error}</div>}{notice&&<div className={styles.success} role="status">{notice}</div>}
    {loading?<p className={styles.empty}>Loading schedule data…</p>:<>
      {tab==="assign"&&<section className={styles.panel}><div className={styles.sectionHeading}><div><h2>Assign inclusion support</h2><p>Choose a classroom section and an inclusion teacher. Conflicts are checked against both regular teaching and existing inclusion assignments.</p></div></div>
        <div className={styles.assignForm}><label>Inclusion teacher<select value={selectedTeacher} onChange={e=>setSelectedTeacher(e.target.value)}><option value="">Choose teacher</option>{teachers.map(t=><option key={t.id} value={t.id}>{t.name||"Unnamed teacher"}</option>)}</select></label><label>Class section<select value={selectedSection} onChange={e=>setSelectedSection(e.target.value)}><option value="">Choose class</option>{sections.map(s=><option key={s.id} value={s.id}>{periodName(s.class_period_id)} · {s.course_name} · {teacherName(s.teacher_id)}</option>)}</select></label><button disabled={saving||!selectedTeacher||!selectedSection} onClick={assign}>{saving?"Saving…":"＋ Assign teacher"}</button></div>
        <div className={styles.sectionHeading}><div><h2>Current assignments</h2><p>{assigned.length} active inclusion assignments for {year}.</p></div></div>
        <div className={styles.tableWrap}><table><thead><tr><th>Period</th><th>Class</th><th>Classroom teacher</th><th>Room</th><th>Inclusion teacher</th><th></th></tr></thead><tbody>{assigned.sort((a,b)=>(periods.find(p=>p.id===a.section!.class_period_id)?.sort_order||0)-(periods.find(p=>p.id===b.section!.class_period_id)?.sort_order||0)).map(({assignment,section,teacher})=><tr key={assignment.id}><td>{periodName(section!.class_period_id)}</td><td><strong>{section!.course_name}</strong></td><td>{teacherName(section!.teacher_id)}</td><td>{section!.room||"—"}</td><td>{teacher?.name||"Unknown teacher"}</td><td><button className={styles.remove} onClick={()=>removeAssignment(assignment.id)}>Remove</button></td></tr>)}{!assigned.length&&<tr><td colSpan={6} className={styles.empty}>No inclusion assignments recorded yet.</td></tr>}</tbody></table></div>
      </section>}
      {tab==="schedules"&&<section className={styles.panel}><div className={styles.sectionHeading}><div><h2>Teacher daily schedule</h2><p>Regular classes and inclusion assignments appear as teaching time.</p></div></div><label className={styles.teacherPicker}>Select teacher<select value={selectedTeacher} onChange={e=>setSelectedTeacher(e.target.value)}>{teachers.map(t=><option key={t.id} value={t.id}>{t.name||"Unnamed teacher"}</option>)}</select></label><div className={styles.schedule}>{teacherSchedule.map(row=><article key={row.period.id} className={styles.periodRow}><b>{row.period.name}</b><div><strong>{row.status}</strong><span>{row.detail} · Room {row.room}</span></div></article>)}</div></section>}
      {tab==="coverage"&&<section className={styles.panel}><div className={styles.sectionHeading}><div><h2>Class coverage review</h2><p>Flag a section when inclusion support should be reviewed. Flags and assignments remain tied to the shared master schedule.</p></div></div><div className={styles.coverageList}>{sections.map(section=>{const assignment=assignments.find(a=>a.schedule_entry_id===section.id);return <article className={styles.coverageCard} key={section.id}><div><span className={styles.periodTag}>{periodName(section.class_period_id)}</span><h3>{section.course_name}</h3><p>{teacherName(section.teacher_id)} · Room {section.room||"—"}</p></div><div className={styles.coverageRight}><span className={assignment?styles.covered:section.needs_inclusion?styles.uncovered:styles.neutral}>{assignment?`Assigned · ${teacherName(assignment.inclusion_teacher_id)}`:section.needs_inclusion?"Needs coverage":"Not flagged"}</span><button onClick={()=>toggleFlag(section)}>{section.needs_inclusion?"Remove flag":"＋ Flag for review"}</button></div></article>})}{!sections.length&&<p className={styles.empty}>Add teaching sections in Master Schedule before assigning inclusion support.</p>}</div></section>}
    </>}
    <footer className={styles.footer}>SPED TRACKER · SHARED INCLUSION SCHEDULE · {year}</footer>
  </div></main>;
}
