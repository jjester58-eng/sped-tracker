"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSupabase } from "@/lib/useSupabase";
import styles from "./schedule.module.css";

type Teacher = { id: string; name: string | null; email: string | null };
type Period = { id: string; name: string; sort_order: number | null; start_time: string | null; end_time: string | null };
type Entry = {
  id: string; teacher_id: string; class_period_id: string; entry_type: "teaching" | "conference" | "plc" | "off";
  course_name: string | null; subject: string | null; department: string | null; room: string | null;
  capacity: number | null; school_year: string; is_active: boolean;
};
type Inclusion = { id: string; schedule_entry_id: string; inclusion_teacher_id: string; school_year: string };

const yearOptions = ["2026-27", "2027-28", "2028-29"];
const families = ["Math", "English Language Arts", "Science", "Social Studies", "CTE", "Fine Arts", "Physical Education", "World Languages", "Other"];
const typeLabels: Record<Entry["entry_type"], string> = { teaching: "Teaching", conference: "Conference", plc: "PLC", off: "Off period" };

function subjectFamily(subject: string | null, department: string | null) {
  const value = `${subject || ""} ${department || ""}`.toLowerCase();
  if (/math|algebra|geometry|calculus|statistics|financial/.test(value)) return "math";
  if (/english|ela|reading|writing|language arts/.test(value)) return "english";
  if (/science|biology|chemistry|physics|environment/.test(value)) return "science";
  if (/history|social studies|geography|government|economics/.test(value)) return "social";
  if (/career|technical|cyber|computer|engineering|business|agriculture|health science/.test(value)) return "cte";
  if (/art|music|theatre|band|choir|dance/.test(value)) return "arts";
  if (/pe|physical education|athletics/.test(value)) return "pe";
  if (/spanish|french|language/.test(value)) return "language";
  return "other";
}

export default function MasterSchedulePage() {
  const supabase = useSupabase();
  const [authorized, setAuthorized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [inclusions, setInclusions] = useState<Inclusion[]>([]);
  const [year, setYear] = useState("2026-27");
  const [view, setView] = useState<"schedule" | "availability">("schedule");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" }>({ key: "period", direction: "asc" });
  const [course, setCourse] = useState("");
  const [subject, setSubject] = useState("Math");
  const [department, setDepartment] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [room, setRoom] = useState("");
  const [periodId, setPeriodId] = useState("");
  const [capacity, setCapacity] = useState("28");
  const [entryType, setEntryType] = useState<Entry["entry_type"]>("teaching");

  const db = supabase as any;

  // Master schedule is intentionally open; authentication is not required to view or use this workspace.
  useEffect(() => { setAuthorized(true); setAuthChecked(true); }, []);

  const load = useCallback(async () => {
    if (!authorized) return;
    setLoading(true); setError("");
    const [teacherResult, periodResult, entryResult, inclusionResult] = await Promise.all([
      db.from("teachers").select("id,name,email").order("name"),
      db.from("class_periods").select("id,name,sort_order,start_time,end_time").eq("is_active", true).order("sort_order"),
      db.from("master_schedule_entries").select("id,teacher_id,class_period_id,entry_type,course_name,subject,department,room,capacity,school_year,is_active").eq("school_year", year).eq("is_active", true),
      db.from("inclusion_assignments").select("id,schedule_entry_id,inclusion_teacher_id,school_year").eq("school_year", year),
    ]);
    const firstError = teacherResult.error || periodResult.error || entryResult.error || inclusionResult.error;
    if (firstError) setError(firstError.message || "Unable to load schedule data. Apply the master schedule database setup script first if these tables are not yet available.");
    setTeachers(teacherResult.data || []);
    setPeriods(periodResult.data || []);
    setEntries(entryResult.data || []);
    setInclusions(inclusionResult.data || []);
    setLoading(false);
  }, [authorized, year]);

  useEffect(() => { load(); }, [load]);

  const teacherName = (id: string) => teachers.find(t => t.id === id)?.name || "Unassigned";
  const periodName = (id: string) => periods.find(p => p.id === id)?.name || "Unknown period";
  const departments = useMemo(() => Array.from(new Set(entries.map(e => e.department).filter(Boolean) as string[])).sort(), [entries]);
  const subjects = useMemo(() => Array.from(new Set(entries.map(e => e.subject).filter(Boolean) as string[])).sort(), [entries]);

  const filteredEntries = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = entries.filter(e => {
      const haystack = [e.course_name, e.subject, e.department, e.room, teacherName(e.teacher_id), periodName(e.class_period_id)].join(" ").toLowerCase();
      return (!term || haystack.includes(term)) &&
        (departmentFilter === "all" || e.department === departmentFilter) &&
        (subjectFilter === "all" || e.subject === subjectFilter) &&
        (periodFilter === "all" || e.class_period_id === periodFilter);
    });
    const field = (e: Entry): string | number => {
      if (sort.key === "period") return periods.find(p => p.id === e.class_period_id)?.sort_order ?? 999;
      if (sort.key === "teacher") return teacherName(e.teacher_id).toLowerCase();
      if (sort.key === "course") return (e.course_name || typeLabels[e.entry_type]).toLowerCase();
      if (sort.key === "room") return (e.room || "").toLowerCase();
      if (sort.key === "department") return (e.department || "").toLowerCase();
      if (sort.key === "subject") return (e.subject || "").toLowerCase();
      return e.entry_type;
    };
    return rows.sort((a,b) => {
      const av = field(a), bv = field(b);
      const cmp = typeof av === "number" && typeof bv === "number" ? av-bv : String(av).localeCompare(String(bv));
      return sort.direction === "asc" ? cmp : -cmp;
    });
  }, [entries, search, departmentFilter, subjectFilter, periodFilter, sort, teachers, periods]);

  const availability = useMemo(() => teachers.flatMap(teacher => periods.map(period => {
    const own = entries.find(e => e.teacher_id === teacher.id && e.class_period_id === period.id);
    const inclusion = inclusions.find(a => a.inclusion_teacher_id === teacher.id && entries.some(e => e.id === a.schedule_entry_id && e.class_period_id === period.id));
    const inclusionEntry = inclusion ? entries.find(e => e.id === inclusion.schedule_entry_id) : undefined;
    if (own) return { teacher, period, status: own.entry_type === "teaching" ? "Teaching" : own.entry_type === "conference" ? "Conference" : own.entry_type === "plc" ? "PLC" : "Off period", detail: own.course_name || typeLabels[own.entry_type], room: own.room || "—", isOff: own.entry_type !== "teaching" };
    if (inclusionEntry) return { teacher, period, status: "Teaching · Inclusion", detail: inclusionEntry.course_name || "Class support", room: inclusionEntry.room || "—", isOff: false };
    return { teacher, period, status: "Unrecorded", detail: "No schedule entry recorded", room: "—", isOff: false };
  })), [teachers, periods, entries, inclusions]);

  const filteredAvailability = availability.filter(row =>
    (periodFilter === "all" || row.period.id === periodFilter) &&
    (availabilityFilter === "all" || (availabilityFilter === "off" ? row.isOff : availabilityFilter === "teaching" ? row.status.startsWith("Teaching") : row.status === "Unrecorded")) &&
    (!search.trim() || `${row.teacher.name} ${row.status} ${row.detail} ${row.room}`.toLowerCase().includes(search.trim().toLowerCase()))
  );

  async function addEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!teacherId || !periodId) { setError("Choose a teacher and period."); return; }
    if (entryType === "teaching" && (!course.trim() || !room.trim())) { setError("Teaching entries need a course and classroom."); return; }
    if (entries.some(e => e.teacher_id === teacherId && e.class_period_id === periodId)) { setError("That teacher already has a schedule entry during this period."); return; }
    if (inclusions.some(a => a.inclusion_teacher_id === teacherId && entries.some(e => e.id === a.schedule_entry_id && e.class_period_id === periodId))) { setError("That teacher is already assigned as inclusion support during this period."); return; }
    setSaving(true); setError(""); setSuccess("");
    const { data, error: insertError } = await db.from("master_schedule_entries").insert({
      teacher_id: teacherId, class_period_id: periodId, entry_type: entryType,
      course_name: entryType === "teaching" ? course.trim() : null,
      subject: entryType === "teaching" ? subject : null,
      department: entryType === "teaching" ? department.trim() || null : null,
      room: entryType === "teaching" ? room.trim() : null,
      capacity: entryType === "teaching" ? Number(capacity) || 28 : null,
      school_year: year, is_active: true,
    }).select("id,teacher_id,class_period_id,entry_type,course_name,subject,department,room,capacity,school_year,is_active").single();
    if (insertError) setError(insertError.message);
    else { setEntries(old => [...old, data]); setCourse(""); setDepartment(""); setRoom(""); setSuccess("Schedule entry saved."); }
    setSaving(false);
  }

  async function removeEntry(entry: Entry) {
    if (!window.confirm("Remove this schedule entry? Any inclusion assignment linked to it will also be removed.")) return;
    const { error: deleteError } = await db.from("master_schedule_entries").delete().eq("id", entry.id);
    if (deleteError) setError(deleteError.message);
    else { setEntries(old => old.filter(e => e.id !== entry.id)); setInclusions(old => old.filter(a => a.schedule_entry_id !== entry.id)); setSuccess("Schedule entry removed."); }
  }

  function sortBy(key: string) { setSort(old => ({ key, direction: old.key === key && old.direction === "asc" ? "desc" : "asc" })); }

  if (!authChecked) return <main className={styles.page}><div className={styles.shell}>Checking administrator access…</div></main>;
  if (!authorized) return <main className={styles.page}><div className={styles.shell}><h1>Administrator access required</h1><p>{error || "Please sign in with an administrator account."}</p></div></main>;

  return <main className={styles.page}><div className={styles.shell}>
    <header className={styles.header}><div><span className={styles.kicker}>CAMPUS SCHEDULING</span><h1>Master Schedule</h1><p>One shared schedule for classroom teachers, availability, and inclusion coverage.</p></div><label className={styles.yearPicker}>School year<select value={year} onChange={e=>setYear(e.target.value)}>{yearOptions.map(y=><option key={y}>{y}</option>)}</select></label></header>
    <div className={styles.tabs}><button className={view==="schedule"?styles.active:""} onClick={()=>setView("schedule")}>Master schedule</button><button className={view==="availability"?styles.active:""} onClick={()=>setView("availability")}>Teacher availability</button><a href="/inclusion-support">Inclusion support →</a></div>
    <div className={styles.metrics}><div><strong>{entries.filter(e=>e.entry_type==="teaching").length}</strong><span>Teaching assignments</span></div><div><strong>{teachers.length}</strong><span>Teachers</span></div><div><strong>{entries.filter(e=>e.entry_type!=="teaching").length}</strong><span>Non-teaching blocks</span></div><div><strong>{inclusions.length}</strong><span>Inclusion assignments</span></div></div>
    {error && <div className={styles.error} role="alert">{error}</div>}{success && <div className={styles.success} role="status">{success}</div>}
    <div className={styles.filters}><input aria-label="Search schedule" placeholder="Search teacher, course, room, department…" value={search} onChange={e=>setSearch(e.target.value)}/><select aria-label="Filter department" value={departmentFilter} onChange={e=>setDepartmentFilter(e.target.value)}><option value="all">All departments</option>{departments.map(d=><option key={d}>{d}</option>)}</select><select aria-label="Filter subject" value={subjectFilter} onChange={e=>setSubjectFilter(e.target.value)}><option value="all">All subjects</option>{subjects.map(s=><option key={s}>{s}</option>)}</select><select aria-label="Filter period" value={periodFilter} onChange={e=>setPeriodFilter(e.target.value)}><option value="all">All periods</option>{periods.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>{view==="availability" && <select aria-label="Filter availability" value={availabilityFilter} onChange={e=>setAvailabilityFilter(e.target.value)}><option value="all">All statuses</option><option value="off">Off / Conference / PLC</option><option value="teaching">Teaching</option><option value="unknown">Unrecorded</option></select>}</div>
    {view==="schedule" ? <>
      <section className={styles.panel}><div className={styles.panelHeading}><div><h2>Add schedule entry</h2><p>Teaching, conference, PLC, and off-period records all live in the same schedule.</p></div></div>
        <form className={styles.entryForm} onSubmit={addEntry}>
          <label>Entry type<select value={entryType} onChange={e=>setEntryType(e.target.value as Entry["entry_type"])}><option value="teaching">Teaching</option><option value="conference">Conference</option><option value="plc">PLC</option><option value="off">Off period</option></select></label>
          <label>Teacher<select value={teacherId} onChange={e=>setTeacherId(e.target.value)} required><option value="">Choose teacher</option>{teachers.map(t=><option key={t.id} value={t.id}>{t.name || "Unnamed teacher"}</option>)}</select></label>
          <label>Period<select value={periodId} onChange={e=>setPeriodId(e.target.value)} required><option value="">Choose period</option>{periods.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          {entryType==="teaching" && <><label>Course<input value={course} onChange={e=>setCourse(e.target.value)} placeholder="Course name" required/></label><label>Subject family<select value={subject} onChange={e=>setSubject(e.target.value)}>{families.map(f=><option key={f}>{f}</option>)}</select></label><label>Department<input value={department} onChange={e=>setDepartment(e.target.value)} placeholder="Department"/></label><label>Classroom<input value={room} onChange={e=>setRoom(e.target.value)} placeholder="Room number" required/></label><label>Capacity<input type="number" min="1" max="60" value={capacity} onChange={e=>setCapacity(e.target.value)}/></label></>}
          <button disabled={saving} type="submit">{saving?"Saving…":"＋ Add to schedule"}</button>
        </form>
      </section>
      <section className={styles.panel}><div className={styles.panelHeading}><div><h2>Schedule entries</h2><p>{filteredEntries.length} matching records · Select a column heading to sort.</p></div></div>
        {loading ? <p className={styles.empty}>Loading schedule…</p> : <div className={styles.tableWrap}><table><thead><tr>{[["period","Period"],["course","Course / block"],["teacher","Teacher"],["subject","Subject"],["department","Department"],["room","Classroom"],["type","Type"]].map(([key,label])=><th key={key}><button className={styles.sortButton} onClick={()=>sortBy(key)}>{label}{sort.key===key?(sort.direction==="asc"?" ↑":" ↓"):" ↕"}</button></th>)}<th>Capacity</th><th></th></tr></thead><tbody>{filteredEntries.map(e=><tr key={e.id}><td>{periodName(e.class_period_id)}</td><td><strong>{e.course_name || typeLabels[e.entry_type]}</strong></td><td>{teacherName(e.teacher_id)}</td><td><span className={`${styles.subjectTag} ${styles[subjectFamily(e.subject,e.department)]}`}>{e.subject || "—"}</span></td><td>{e.department || "—"}</td><td>{e.room || "—"}</td><td>{typeLabels[e.entry_type]}</td><td>{e.capacity ?? "—"}</td><td><button className={styles.remove} onClick={()=>removeEntry(e)}>Remove</button></td></tr>)}{!filteredEntries.length && <tr><td colSpan={9} className={styles.empty}>No schedule entries match those filters.</td></tr>}</tbody></table></div>}
      </section>
      <div className={styles.legend}><b>Subject colors:</b><span className={styles.math}>Math</span><span className={styles.english}>English / ELA</span><span className={styles.science}>Science</span><span className={styles.social}>Social Studies</span><span className={styles.cte}>CTE</span><span className={styles.arts}>Fine Arts</span><span className={styles.pe}>PE</span></div>
    </> : <section className={styles.panel}><div className={styles.panelHeading}><div><h2>Teacher availability</h2><p>Conference and PLC count as non-teaching time. A blank period is shown as Unrecorded—not assumed available.</p></div></div>
      <div className={styles.tableWrap}><table><thead><tr><th>Teacher</th><th>Period</th><th>Status</th><th>Class / activity</th><th>Room</th></tr></thead><tbody>{filteredAvailability.map((row,i)=><tr key={row.teacher.id+"-"+row.period.id}><td><strong>{row.teacher.name}</strong></td><td>{row.period.name}</td><td><span className={row.isOff?styles.offTag:row.status==="Unrecorded"?styles.unknownTag:styles.teachingTag}>{row.status}</span></td><td>{row.detail}</td><td>{row.room}</td></tr>)}{!filteredAvailability.length&&<tr><td colSpan={5} className={styles.empty}>No availability records match those filters.</td></tr>}</tbody></table></div>
    </section>}
    <footer className={styles.footer}>SPED TRACKER · SHARED MASTER SCHEDULE · {year}</footer>
  </div></main>;
}
