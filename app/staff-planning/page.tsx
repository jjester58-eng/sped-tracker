"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./planning.module.css";
import {
  loadPlanningDemo, savePlanningDemo, newPlanningId, planningDepartments, schedulePeriods,
  type PlanningData, type StaffMember, type CourseOffering, type StudentRequest, type PlannedSection,
} from "@/lib/planningDemo";

type Tab = "roster" | "courses" | "grid" | "students" | "results";
const offChoices=["CONF","PLC","DEPT","COACH","TRAVEL"];
const lunchChoices=["A Lunch (11:25-11:55)","B Lunch (12:10-12:40)","C Lunch (1:00-1:30)","Travel / Flex"];
const advisoryChoices=["Advisory Class","UI / Intervention","Hall / Campus Duty","Lunch Prep / Cafeteria Duty","NGC Travel Buffer"];
const blankStaff=():StaffMember=>({id:"",name:"",department:"English",room:"",campus:"WHS",lunchWave:lunchChoices[0],offPeriods:2,offPeriodTypes:["CONF","PLC"],advisory:"Advisory Class",lockedPeriods:{},notes:"",status:"Active"});

function buildTeacherGrid(data:PlanningData) {
  const sections:PlannedSection[]=[];
  const staffRows=data.staff.filter(s=>s.status==="Active");
  staffRows.forEach((staff,index)=>{
    const slots:Record<number,string>={};
    Object.entries(staff.lockedPeriods||{}).forEach(([p,c])=>{const n=Number(p);if(n>=1&&n<=8&&c)slots[n]=c;});
    const off=staff.offPeriodTypes.slice(0,staff.offPeriods);
    if(off.every(x=>x==="TRAVEL")&&off.length===2){if(!slots[4])slots[4]="TRAVEL";if(!slots[5])slots[5]="TRAVEL";}
    else {
      const patterns=[[2,3],[4,5],[6,7]];
      if(off.length===2){const pair=patterns[index%3];if(!slots[pair[0]])slots[pair[0]]=off[0]||"CONF";if(!slots[pair[1]])slots[pair[1]]=off[1]||"PLC";}
      else if(off.length===1){const p=2+(index%6);if(!slots[p])slots[p]=off[0]||"CONF";}
    }
    const assignment=data.assignments.find(a=>a.teacherId===staff.id);
    const courseList=(assignment?.preps||[]).flatMap(prep=>{
      const course=data.courses.find(c=>c.id===prep.courseId);
      return course?Array.from({length:Math.max(0,Math.min(8,prep.sections||0))},()=>course):[];
    });
    const preferred=[2,3,4,5,6,7,1,8];
    const rotated=preferred.slice(index%6).concat(preferred.slice(0,index%6));
    let cursor=0;
    rotated.forEach(period=>{if(!slots[period]&&courseList[cursor])slots[period]=courseList[cursor++].name;});
    Object.entries(slots).forEach(([period,value])=>{
      const course=data.courses.find(c=>c.name.toLowerCase()===value.toLowerCase());
      if(course) sections.push({id:newPlanningId("section"),teacherId:staff.id,period:Number(period),courseId:course.id,courseName:course.name,department:course.department,room:staff.room,capacity:course.capacity,enrolled:0,spedEnrolled:0});
    });
  });
  return sections;
}

function autoSchedule(data:PlanningData, sections:PlannedSection[]) {
  const working=sections.map(s=>({...s}));
  const schedules=data.requests.map(student=>{
    const placed:Record<number,string>={};
    const missing:string[]=[];
    const requests=[...student.requests].filter(Boolean).sort((a,b)=>working.filter(s=>s.courseName.toLowerCase()===a.toLowerCase()).length-working.filter(s=>s.courseName.toLowerCase()===b.toLowerCase()).length);
    requests.forEach(courseName=>{
      const options=working.filter(s=>s.courseName.toLowerCase()===courseName.toLowerCase()&&!placed[s.period]&&s.enrolled<s.capacity&&(!student.sped||s.spedEnrolled<8)).sort((a,b)=>a.enrolled-b.enrolled);
      const chosen=options[0];
      if(!chosen){missing.push(courseName);return;}
      chosen.enrolled++;if(student.sped)chosen.spedEnrolled++;
      placed[chosen.period]=chosen.courseName+" · "+(data.staff.find(t=>t.id===chosen.teacherId)?.name||"Teacher")+" · "+chosen.room;
    });
    const remaining=[...student.alternates];
    missing.slice().forEach(request=>{
      const altIndex=remaining.findIndex(alt=>working.some(s=>s.courseName.toLowerCase()===alt.toLowerCase()&&!placed[s.period]&&s.enrolled<s.capacity&&(!student.sped||s.spedEnrolled<8)));
      if(altIndex>=0){const alt=remaining.splice(altIndex,1)[0];const chosen=working.filter(s=>s.courseName.toLowerCase()===alt.toLowerCase()&&!placed[s.period]&&s.enrolled<s.capacity&&(!student.sped||s.spedEnrolled<8)).sort((a,b)=>a.enrolled-b.enrolled)[0];chosen.enrolled++;if(student.sped)chosen.spedEnrolled++;placed[chosen.period]=chosen.courseName+" · "+(data.staff.find(t=>t.id===chosen.teacherId)?.name||"Teacher")+" · "+chosen.room;missing.splice(missing.indexOf(request),1);}
    });
    return {studentId:student.id,name:student.name,grade:student.grade,sped:student.sped,periods:placed,advisory:"Advisory / daily assignment pending",missing,status:missing.length?"Needs counselor review":"All requests placed"};
  });
  return {working,schedules};
}

export default function StaffPlanningPage(){
  const [data,setData]=useState<PlanningData|null>(null);
  const [tab,setTab]=useState<Tab>("roster");
  const [year,setYear]=useState("2026-27");
  const [message,setMessage]=useState("");
  const [staffDraft,setStaffDraft]=useState<StaffMember>(blankStaff());
  const [editingStaff,setEditingStaff]=useState("");
  const [courseDraft,setCourseDraft]=useState({name:"",department:"English",code:"",targetBlocks:1,capacity:30});
  const [studentDraft,setStudentDraft]=useState({name:"",grade:10,sped:false,requests:Array(8).fill(""),alternates:["","",""],notes:""});
  const [editingStudent,setEditingStudent]=useState("");
  const [search,setSearch]=useState("");
  useEffect(()=>{setData(loadPlanningDemo());},[]);
  useEffect(()=>{if(data)savePlanningDemo(data);},[data]);
  const staff=data?.staff||[],courses=data?.courses||[],requests=data?.requests||[];
  const generated=data?.generatedSections||[],studentSchedules=data?.studentSchedules||[];
  const teacherName=(id:string)=>staff.find(s=>s.id===id)?.name||"Unknown";
  const courseName=(id:string)=>courses.find(c=>c.id===id)?.name||"Choose course";
  const activeStaff=staff.filter(s=>s.status==="Active");
  const filteredStaff=staff.filter(s=>(!search||[s.name,s.department,s.room,s.campus,s.status].join(" ").toLowerCase().includes(search.toLowerCase())));
  const totalAssigned=(teacherId:string)=>data?.assignments.find(a=>a.teacherId===teacherId)?.preps.reduce((sum,p)=>sum+p.sections,0)||0;

  function saveStaff(event:React.FormEvent){event.preventDefault();if(!data||!staffDraft.name.trim())return;
    const item={...staffDraft,id:editingStaff||newPlanningId("staff"),name:staffDraft.name.trim()};
    setData({...data,staff:editingStaff?data.staff.map(s=>s.id===editingStaff?item:s):[...data.staff,item]});
    setStaffDraft(blankStaff());setEditingStaff("");setMessage("Staff roster saved in this browser.");
  }
  function editStaff(item:StaffMember){setStaffDraft({...item,lockedPeriods:{...item.lockedPeriods},offPeriodTypes:[...item.offPeriodTypes]});setEditingStaff(item.id);window.scrollTo({top:0,behavior:"smooth"});}
  function deleteStaff(id:string){if(!data||!window.confirm("Remove this staff member from the demo roster?"))return;setData({...data,staff:data.staff.filter(s=>s.id!==id),assignments:data.assignments.filter(a=>a.teacherId!==id)});setMessage("Staff member removed.");}
  function toggleOffType(value:string){setStaffDraft(old=>({...old,offPeriodTypes:old.offPeriodTypes.includes(value)?old.offPeriodTypes.filter(v=>v!==value):[...old.offPeriodTypes,value]}));}
  function addCourse(event:React.FormEvent){event.preventDefault();if(!data||!courseDraft.name.trim())return;const item:CourseOffering={...courseDraft,id:newPlanningId("course"),name:courseDraft.name.trim()};setData({...data,courses:[...data.courses,item]});setCourseDraft({name:"",department:"English",code:"",targetBlocks:1,capacity:30});setMessage("Course offering added.");}
  function updatePrep(teacherId:string,index:number,key:"courseId"|"sections",value:string){if(!data)return;const old=data.assignments.find(a=>a.teacherId===teacherId)||{teacherId,preps:[]};const preps=[...old.preps];while(preps.length<=index)preps.push({courseId:"",sections:0});preps[index]={...preps[index],[key]:key==="sections"?Number(value):value};const assignments=data.assignments.filter(a=>a.teacherId!==teacherId);setData({...data,assignments:[...assignments,{teacherId,preps:preps.slice(0,4)}]});}
  function updateLocked(staffId:string,period:number,value:string){if(!data)return;setData({...data,staff:data.staff.map(s=>s.id===staffId?{...s,lockedPeriods:{...s.lockedPeriods,...(value?{[period]:value}:{})}}:s)});}
  function addStudent(event:React.FormEvent){event.preventDefault();if(!data||!studentDraft.name.trim())return;const item:StudentRequest={id:editingStudent||newPlanningId("student"),name:studentDraft.name.trim(),grade:studentDraft.grade,sped:studentDraft.sped,requests:studentDraft.requests.filter(Boolean),alternates:studentDraft.alternates.filter(Boolean),notes:studentDraft.notes};setData({...data,requests:editingStudent?data.requests.map(s=>s.id===editingStudent?item:s):[...data.requests,item]});setStudentDraft({name:"",grade:10,sped:false,requests:Array(8).fill(""),alternates:["","",""],notes:""});setEditingStudent("");setMessage("Student course requests saved.");}
  function editStudent(s:StudentRequest){setStudentDraft({name:s.name,grade:s.grade,sped:s.sped,requests:Array.from({length:8},(_,i)=>s.requests[i]||""),alternates:Array.from({length:3},(_,i)=>s.alternates[i]||""),notes:s.notes});setEditingStudent(s.id);}
  function runScheduler(){if(!data)return;const sections=buildTeacherGrid(data);const result=autoSchedule(data,sections);setData({...data,generatedSections:result.working,studentSchedules:result.schedules});setMessage(`Built ${sections.length} teacher sections and placed ${result.schedules.length} student schedules. Review any requests that remain unplaced.`);setTab("results");}
  if(!data)return <main className={styles.page}><div className={styles.shell}>Loading demo planning workspace…</div></main>;
  return <main className={styles.page}><div className={styles.shell}>
    <header className={styles.header}><div><span className={styles.kicker}>WHS · CAMPUS SCHEDULING</span><h1>Staff & Course Planning</h1><p>Build the roster, assign course sections, generate the A/B master grid, and test student schedules.</p></div><label className={styles.year}>School year<select value={year} onChange={e=>setYear(e.target.value)}><option>2026-27</option><option>2027-28</option></select></label></header>
    <div className={styles.demoNote}><b>DEMO MODE</b> Changes save in this browser only. No Supabase connection is required. This workspace uses fictional sample data.</div>
    <nav className={styles.tabs}>{[["roster","Staff roster"],["courses","Course assignments"],["grid","Master grid"],["students","Student requests"],["results","Student schedules"]].map(([key,label])=><button key={key} className={tab===key?styles.active:""} onClick={()=>setTab(key as Tab)}>{label}</button>)}</nav>
    {message&&<div className={styles.message} role="status">{message}<button onClick={()=>setMessage("")}>Dismiss</button></div>}
    {tab==="roster"&&<><section className={styles.panel}><div className={styles.panelHeading}><div><h2>{editingStaff?"Edit staff member":"Staff roster & teaching load"}</h2><p>Department, teacher, room, campus, lunch wave, off-period rules, advisory, locked periods, and status.</p></div></div>
      <form className={styles.form} onSubmit={saveStaff}>
        <label>Teacher name<input value={staffDraft.name} onChange={e=>setStaffDraft({...staffDraft,name:e.target.value})} required placeholder="Teacher name"/></label>
        <label>Department<select value={staffDraft.department} onChange={e=>setStaffDraft({...staffDraft,department:e.target.value})}>{planningDepartments.map(d=><option key={d}>{d}</option>)}</select></label>
        <label>Room #<input value={staffDraft.room} onChange={e=>setStaffDraft({...staffDraft,room:e.target.value})} placeholder="Room"/></label>
        <label>Campus<select value={staffDraft.campus} onChange={e=>setStaffDraft({...staffDraft,campus:e.target.value})}><option>WHS</option><option>NGC</option><option>WHS ↔ NGC</option></select></label>
        <label>Lunch wave<select value={staffDraft.lunchWave} onChange={e=>setStaffDraft({...staffDraft,lunchWave:e.target.value})}>{lunchChoices.map(v=><option key={v}>{v}</option>)}</select></label>
        <label>Off periods<select value={staffDraft.offPeriods} onChange={e=>setStaffDraft({...staffDraft,offPeriods:Number(e.target.value) as 1|2})}><option value={1}>1</option><option value={2}>2</option></select></label>
        <label>Advisory / daily duty<select value={staffDraft.advisory} onChange={e=>setStaffDraft({...staffDraft,advisory:e.target.value})}>{advisoryChoices.map(v=><option key={v}>{v}</option>)}</select></label>
        <label>Roster status<select value={staffDraft.status} onChange={e=>setStaffDraft({...staffDraft,status:e.target.value as StaffMember["status"]})}><option>Active</option><option>TBD / Reserve</option><option>Leave / Inactive</option></select></label>
        <div className={styles.full}><span className={styles.label}>Off-period types</span><div className={styles.checks}>{offChoices.map(v=><label key={v}><input type="checkbox" checked={staffDraft.offPeriodTypes.includes(v)} onChange={()=>toggleOffType(v)}/>{v}</label>)}</div></div>
        <label className={styles.full}>Locked period / course notes<input value={Object.entries(staffDraft.lockedPeriods).map(([p,c])=>`P${p}: ${c}`).join(", ")} onChange={e=>{const map:Record<number,string>={};e.target.value.split(",").forEach(part=>{const m=part.trim().match(/^P?([1-8])\s*:\s*(.+)$/i);if(m)map[Number(m[1])]=m[2].trim();});setStaffDraft({...staffDraft,lockedPeriods:map});}} placeholder="P1: AP Calculus AB, P8: AP Statistics"/></label>
        <label className={styles.full}>Notes<input value={staffDraft.notes} onChange={e=>setStaffDraft({...staffDraft,notes:e.target.value})} placeholder="Optional"/></label>
        <div className={styles.actions}><button type="submit">{editingStaff?"Save changes":"＋ Add staff member"}</button>{editingStaff&&<button type="button" className={styles.secondary} onClick={()=>{setStaffDraft(blankStaff());setEditingStaff("");}}>Cancel edit</button>}</div>
      </form></section>
      <section className={styles.panel}><div className={styles.panelHeading}><div><h2>Roster directory</h2><p>{activeStaff.length} active staff · {staff.filter(s=>s.status==="TBD / Reserve").length} reserve positions · teaching target is 8 minus off periods.</p></div><input className={styles.search} placeholder="Search name, department, room…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <div className={styles.tableWrap}><table><thead><tr><th>Teacher</th><th>Department</th><th>Room</th><th>Campus</th><th>Lunch</th><th>Off</th><th>Target load</th><th>Advisory</th><th>Status</th><th></th></tr></thead><tbody>{filteredStaff.map(s=><tr key={s.id}><td><b>{s.name}</b></td><td>{s.department}</td><td>{s.room||"—"}</td><td>{s.campus}</td><td>{s.lunchWave}</td><td>{s.offPeriods} · {s.offPeriodTypes.slice(0,s.offPeriods).join(" + ")}</td><td>{s.status==="Active"?8-s.offPeriods:0}</td><td>{s.advisory}</td><td><span className={styles.status}>{s.status}</span></td><td><button className={styles.small} onClick={()=>editStaff(s)}>Edit</button> <button className={styles.small} onClick={()=>deleteStaff(s.id)}>Remove</button></td></tr>)}</tbody></table></div></section></>}
    {tab==="courses"&&<><section className={styles.panel}><div className={styles.panelHeading}><div><h2>Course offering catalog</h2><p>Maintain course name, department, course code, target blocks, and section capacity.</p></div></div><form className={styles.form} onSubmit={addCourse}><label>Course name<input value={courseDraft.name} onChange={e=>setCourseDraft({...courseDraft,name:e.target.value})} required/></label><label>Department<select value={courseDraft.department} onChange={e=>setCourseDraft({...courseDraft,department:e.target.value})}>{planningDepartments.map(d=><option key={d}>{d}</option>)}</select></label><label>Course code<input value={courseDraft.code} onChange={e=>setCourseDraft({...courseDraft,code:e.target.value})}/></label><label>Target blocks<input type="number" min="0" max="99" value={courseDraft.targetBlocks} onChange={e=>setCourseDraft({...courseDraft,targetBlocks:Number(e.target.value)})}/></label><label>Section capacity<input type="number" min="1" max="60" value={courseDraft.capacity} onChange={e=>setCourseDraft({...courseDraft,capacity:Number(e.target.value)})}/></label><div className={styles.actions}><button type="submit">＋ Add course</button></div></form></section>
      <section className={styles.panel}><div className={styles.panelHeading}><div><h2>Teacher course & prep assignments</h2><p>Up to four preps per teacher. Set the number of sections for each prep; assignments feed the master grid.</p></div></div><div className={styles.tableWrap}><table><thead><tr><th>Department</th><th>Teacher</th><th>Prep 1</th><th>Sections</th><th>Prep 2</th><th>Sections</th><th>Prep 3</th><th>Sections</th><th>Prep 4</th><th>Sections</th><th>Total</th><th>Target</th><th>Remaining</th></tr></thead><tbody>{activeStaff.map(s=>{const a=data.assignments.find(x=>x.teacherId===s.id)||{teacherId:s.id,preps:[]};const total=a.preps.reduce((sum,p)=>sum+p.sections,0);return <tr key={s.id}><td>{s.department}</td><td><b>{s.name}</b></td>{Array.from({length:4},(_,i)=><><td key={`course-${i}`}><select value={a.preps[i]?.courseId||""} onChange={e=>updatePrep(s.id,i,"courseId",e.target.value)}><option value="">— Choose —</option>{courses.filter(c=>c.department===s.department||s.department==="NGC Shared / SPED").map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></td><td key={`count-${i}`}><input className={styles.count} type="number" min="0" max="8" value={a.preps[i]?.sections||0} onChange={e=>updatePrep(s.id,i,"sections",e.target.value)}/></td></>)}<td><b>{total}</b></td><td>{8-s.offPeriods}</td><td className={total===8-s.offPeriods?styles.good:total>8-s.offPeriods?styles.bad:styles.warn}>{8-s.offPeriods-total}</td></tr>})}</tbody></table></div>
      <div className={styles.courseTally}><h3>Course block tally</h3><div className={styles.tableWrap}><table><thead><tr><th>Course</th><th>Department</th><th>Target blocks</th><th>Assigned blocks</th><th>Variance</th></tr></thead><tbody>{courses.map(c=>{const assigned=data.assignments.reduce((sum,a)=>sum+a.preps.filter(p=>p.courseId===c.id).reduce((n,p)=>n+p.sections,0),0);return <tr key={c.id}><td>{c.name}</td><td>{c.department}</td><td>{c.targetBlocks}</td><td>{assigned}</td><td className={assigned===c.targetBlocks?styles.good:assigned>c.targetBlocks?styles.bad:styles.warn}>{assigned-c.targetBlocks}</td></tr>})}</tbody></table></div></div></section></>}
    {tab==="grid"&&<><section className={styles.panel}><div className={styles.panelHeading}><div><h2>Master grid · 2026–27</h2><p>Daily bookends, A/B day blocks, advisory, lunch, locked courses, and off-periods. The grid is generated from roster and course assignments.</p></div><button onClick={()=>{const sections=buildTeacherGrid(data);setData({...data,generatedSections:sections});setMessage(`Master grid generated with ${sections.length} teaching sections.`);}}>↻ Generate / refresh grid</button></div><div className={styles.gridLegend}><span>Daily P1/P8</span><span>A day</span><span>B day</span><span>Conference / PLC / Travel</span><span>Advisory</span></div>
      <div className={styles.tableWrap}><table className={styles.gridTable}><thead><tr><th>Department</th><th>Teacher</th><th>Room</th><th>Campus</th><th>Lunch</th>{schedulePeriods.map(p=><th key={p.period}>{p.label}<small>{p.time}</small></th>)}<th>Sections</th><th>Target</th><th>Diff</th></tr></thead><tbody>{activeStaff.map(s=>{const cells:Record<number,string>={};const locked=s.lockedPeriods||{};Object.entries(locked).forEach(([p,v])=>cells[Number(p)]=v);const off=s.offPeriodTypes.slice(0,s.offPeriods);if(off.every(v=>v==="TRAVEL")&&off.length===2){cells[4]=cells[4]||"TRAVEL";cells[5]=cells[5]||"TRAVEL";}else if(off.length===2){const pair=[[2,3],[4,5],[6,7]][staff.indexOf(s)%3];cells[pair[0]]=cells[pair[0]]||off[0];cells[pair[1]]=cells[pair[1]]||off[1];}else if(off.length===1){const p=2+(staff.indexOf(s)%6);cells[p]=cells[p]||off[0];}const sectionList=generated.filter(x=>x.teacherId===s.id);const assignment=data.assignments.find(a=>a.teacherId===s.id);const assigned=assignment?.preps.reduce((n,p)=>n+p.sections,0)||0;return <tr key={s.id}><td>{s.department}</td><td><b>{s.name}</b><small>{s.advisory}</small></td><td>{s.room}</td><td>{s.campus}</td><td>{s.lunchWave}</td>{schedulePeriods.map(p=>{const section=sectionList.find(x=>x.period===p.period);const value=section?.courseName||cells[p.period]||"—";return <td key={p.period} className={value==="—"?styles.blank:offChoices.includes(value)?styles.offCell:value==="TRAVEL"?styles.travel: p.day==="A"?styles.aCell:p.day==="B"?styles.bCell:styles.dailyCell}>{value}</td>})}<td>{sectionList.length||"—"}</td><td>{8-s.offPeriods}</td><td className={assigned===8-s.offPeriods?styles.good:styles.warn}>{assigned-(8-s.offPeriods)}</td></tr>})}</tbody></table></div><p className={styles.help}>P2/P4/P6 run on A days; P3/P5/P7 run on B days. P1 and P8 meet daily. Advisory is a separate daily assignment, not counted as one of the eight class periods.</p></section>
      <section className={styles.panel}><h2>Locked period editor</h2><p>Use the roster editor to enter locks such as P1: AP Calculus AB, P8: AP Statistics. They are placed before flexible course sections.</p><button onClick={()=>setTab("roster")}>Edit roster and locked periods</button></section></>}
    {tab==="students"&&<><section className={styles.panel}><div className={styles.panelHeading}><div><h2>{editingStudent?"Edit student request":"Student course requests"}</h2><p>Enter eight course requests, three alternates, grade, and SPED/co-teach status.</p></div></div><form className={styles.form} onSubmit={addStudent}><label>Student name<input value={studentDraft.name} onChange={e=>setStudentDraft({...studentDraft,name:e.target.value})} required/></label><label>Grade<select value={studentDraft.grade} onChange={e=>setStudentDraft({...studentDraft,grade:Number(e.target.value)})}>{[10,11,12].map(g=><option key={g}>{g}</option>)}</select></label><label>SPED / Co-teach<select value={studentDraft.sped?"Yes":"No"} onChange={e=>setStudentDraft({...studentDraft,sped:e.target.value==="Yes"})}><option>No</option><option>Yes</option></select></label>{studentDraft.requests.map((v,i)=><label key={i}>Request {i+1}<select value={v} onChange={e=>setStudentDraft({...studentDraft,requests:studentDraft.requests.map((x,j)=>j===i?e.target.value:x)})}><option value="">— Choose course —</option>{courses.map(c=><option key={c.id}>{c.name}</option>)}</select></label>)}{studentDraft.alternates.map((v,i)=><label key={i}>Alternate {i+1}<select value={v} onChange={e=>setStudentDraft({...studentDraft,alternates:studentDraft.alternates.map((x,j)=>j===i?e.target.value:x)})}><option value="">— Choose alternate —</option>{courses.map(c=><option key={c.id}>{c.name}</option>)}</select></label>)}<label className={styles.full}>Notes / athletics / band<input value={studentDraft.notes} onChange={e=>setStudentDraft({...studentDraft,notes:e.target.value})}/></label><div className={styles.actions}><button type="submit">{editingStudent?"Save request":"＋ Add student request"}</button>{editingStudent&&<button type="button" className={styles.secondary} onClick={()=>setEditingStudent("")}>Cancel</button>}</div></form></section>
      <section className={styles.panel}><h2>Request roster</h2><div className={styles.tableWrap}><table><thead><tr><th>Student</th><th>Grade</th><th>SPED / Co-teach</th><th>Requests</th><th>Alternates</th><th>Notes</th><th></th></tr></thead><tbody>{requests.map(s=><tr key={s.id}><td>{s.name}</td><td>{s.grade}</td><td>{s.sped?"Yes":"No"}</td><td>{s.requests.join(", ")}</td><td>{s.alternates.join(", ")}</td><td>{s.notes}</td><td><button className={styles.small} onClick={()=>editStudent(s)}>Edit</button></td></tr>)}</tbody></table></div></section></>}
    {tab==="results"&&<><section className={styles.panel}><div className={styles.panelHeading}><div><h2>Student schedule results</h2><p>Generates sections from teacher assignments, then places requests by fewest available sections first, balances enrollment, checks capacity, and limits SPED enrollment to eight per section.</p></div><button onClick={runScheduler}>▶ Run 8-period scheduler</button></div><div className={styles.metrics}><div><b>{studentSchedules.length}</b><span>Student schedules</span></div><div><b>{studentSchedules.filter(s=>!s.missing.length).length}</b><span>All requests placed</span></div><div><b>{studentSchedules.reduce((n,s)=>n+s.missing.length,0)}</b><span>Unplaced requests</span></div><div><b>{generated.length}</b><span>Generated sections</span></div></div>
      <div className={styles.tableWrap}><table><thead><tr><th>Student</th><th>Grade</th><th>SPED</th>{schedulePeriods.map(p=><th key={p.period}>{p.label}</th>)}<th>Status</th></tr></thead><tbody>{studentSchedules.map(s=><tr key={s.studentId}><td><b>{s.name}</b></td><td>{s.grade}</td><td>{s.sped?"Yes":"No"}</td>{schedulePeriods.map(p=><td key={p.period}>{s.periods[p.period]||"—"}</td>)}<td className={s.missing.length?styles.bad:styles.good}>{s.status}{s.missing.length>0&&<small>Missing: {s.missing.join(", ")}</small>}</td></tr>)}{!studentSchedules.length&&<tr><td colSpan={12} className={styles.empty}>Run the scheduler to generate student schedules.</td></tr>}</tbody></table></div></section>
      <section className={styles.panel}><h2>Section enrollment and capacity</h2><div className={styles.tableWrap}><table><thead><tr><th>Course</th><th>Period</th><th>Teacher</th><th>Room</th><th>Enrolled</th><th>Capacity</th><th>SPED</th><th>Remaining</th></tr></thead><tbody>{generated.map(s=><tr key={s.id}><td>{s.courseName}</td><td>P{s.period}</td><td>{teacherName(s.teacherId)}</td><td>{s.room}</td><td>{s.enrolled}</td><td>{s.capacity}</td><td>{s.spedEnrolled}</td><td>{s.capacity-s.enrolled}</td></tr>)}</tbody></table></div></section></>}
    <footer className={styles.footer}>SPED TRACKER · STAFF & COURSE PLANNING · DEMO DATA STORED LOCALLY · {year}</footer>
  </div></main>;
}
