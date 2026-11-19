"use client";

export type StaffStatus = "Active" | "TBD / Reserve" | "Leave / Inactive";
export type StaffMember = {
  id: string; name: string; department: string; room: string; campus: string;
  lunchWave: string; offPeriods: 1 | 2; offPeriodTypes: string[];
  advisory: string; lockedPeriods: Record<number, string>; notes: string; status: StaffStatus;
};
export type CourseOffering = { id: string; name: string; department: string; code: string; targetBlocks: number; capacity: number };
export type TeacherPrep = { courseId: string; sections: number };
export type TeacherCourseAssignment = { teacherId: string; preps: TeacherPrep[] };
export type StudentRequest = {
  id: string; name: string; grade: number; sped: boolean; requests: string[];
  alternates: string[]; notes: string;
};
export type PlannedSection = {
  id: string; teacherId: string; period: number; courseId: string; courseName: string;
  department: string; room: string; capacity: number; enrolled: number; spedEnrolled: number;
};
export type StudentPlacement = { studentId: string; name: string; grade: number; sped: boolean; periods: Record<number,string>; advisory: string; missing: string[]; status: string };
export type PlanningData = {
  staff: StaffMember[]; courses: CourseOffering[]; assignments: TeacherCourseAssignment[];
  requests: StudentRequest[]; generatedSections: PlannedSection[]; studentSchedules: StudentPlacement[];
};
const KEY = "sped-tracker-planning-demo-v1";
const depts = ["English","Math","Science","Social Studies","LOTE","CTE / Fine Arts","Athletics / PE","NGC Shared / SPED"];
const seedStaff: StaffMember[] = [
  ["t1","Avery Johnson","English","A101","WHS","B Lunch (12:10-12:40)",2,["CONF","PLC"],"Advisory Class",{}],
  ["t2","Morgan Lee","Math","B201","WHS","C Lunch (1:00-1:30)",2,["CONF","PLC"],"Advisory Class",{}],
  ["t3","Taylor Brooks","Science","C110","WHS","A Lunch (11:25-11:55)",2,["CONF","PLC"],"Advisory Class",{}],
  ["t4","Jordan Ramirez","Social Studies","D105","WHS","B Lunch (12:10-12:40)",2,["CONF","DEPT"],"Advisory Class",{}],
  ["t5","Casey Williams","CTE / Fine Arts","E210","WHS","A Lunch (11:25-11:55)",2,["CONF","PLC"],"Advisory Class",{}],
  ["t6","Riley Thompson","CTE / Fine Arts","F120","WHS","A Lunch (11:25-11:55)",1,["CONF"],"Advisory Class",{}],
  ["t7","Cameron Davis","Athletics / PE","Gym","WHS","C Lunch (1:00-1:30)",2,["CONF","COACH"],"Hall / Campus Duty",{}],
  ["t8","Parker Martinez","LOTE","A205","WHS","C Lunch (1:00-1:30)",2,["CONF","PLC"],"Advisory Class",{}],
  ["t9","Quinn Anderson","English","A103","WHS","B Lunch (12:10-12:40)",2,["CONF","PLC"],"Advisory Class",{}],
  ["t10","Reese Clark","Math","B205","WHS","C Lunch (1:00-1:30)",1,["CONF"],"Advisory Class",{}],
  ["t11","Skyler Patel","NGC Shared / SPED","NGC 12","WHS ↔ NGC","Travel / Flex",2,["TRAVEL","TRAVEL"],"NGC Travel Buffer",{}],
  ["t12","Drew Wilson","NGC Shared / SPED","NGC 14","WHS ↔ NGC","Travel / Flex",2,["TRAVEL","TRAVEL"],"UI / Intervention",{}],
].map((r:any)=>({id:r[0],name:r[1],department:r[2],room:r[3],campus:r[4],lunchWave:r[5],offPeriods:r[6],offPeriodTypes:r[7],advisory:r[8],lockedPeriods:r[9],notes:"",status:"Active" as StaffStatus}));
const seedCourses: CourseOffering[] = [
  ["c1","English I","English","ENG101",4,30],["c2","English II","English","ENG201",4,30],["c3","English III","English","ENG301",3,30],
  ["c4","Algebra I","Math","MAT101",4,30],["c5","Geometry","Math","MAT201",3,30],["c6","Algebra II","Math","MAT301",3,30],
  ["c7","Biology","Science","SCI101",4,30],["c8","Chemistry","Science","SCI201",3,30],["c9","Physics","Science","SCI301",2,28],
  ["c10","World History","Social Studies","SOC201",3,30],["c11","US History","Social Studies","SOC301",3,30],
  ["c12","Spanish I","LOTE","LAN101",2,28],["c13","Cybersecurity","CTE / Fine Arts","CTE401",2,24],
  ["c14","Computer Science I","CTE / Fine Arts","CTE201",2,24],["c15","Art I","CTE / Fine Arts","ART101",2,24],
  ["c16","PE Foundations","Athletics / PE","PE101",3,45],["c17","Inclusion Support","NGC Shared / SPED","SPED101",2,8],
].map(r=>({id:r[0],name:r[1],department:r[2],code:r[3],targetBlocks:r[4],capacity:r[5]}));
const seedAssignments: TeacherCourseAssignment[] = [
  {teacherId:"t1",preps:[{courseId:"c1",sections:2},{courseId:"c2",sections:2}]},
  {teacherId:"t2",preps:[{courseId:"c4",sections:2},{courseId:"c5",sections:1},{courseId:"c6",sections:1}]},
  {teacherId:"t3",preps:[{courseId:"c7",sections:2},{courseId:"c8",sections:1},{courseId:"c9",sections:1}]},
  {teacherId:"t4",preps:[{courseId:"c10",sections:2},{courseId:"c11",sections:2}]},
  {teacherId:"t5",preps:[{courseId:"c13",sections:2},{courseId:"c14",sections:2}]},
  {teacherId:"t6",preps:[{courseId:"c15",sections:2}]},
  {teacherId:"t7",preps:[{courseId:"c16",sections:3}]},
  {teacherId:"t8",preps:[{courseId:"c12",sections:2}]},
  {teacherId:"t9",preps:[{courseId:"c2",sections:2},{courseId:"c3",sections:2}]},
  {teacherId:"t10",preps:[{courseId:"c5",sections:2},{courseId:"c6",sections:2}]},
  {teacherId:"t11",preps:[{courseId:"c17",sections:2}]},
];
const seedRequests: StudentRequest[] = [
  {id:"s1",name:"Sofia Alvarez",grade:10,sped:false,requests:["English II","Algebra II","Chemistry","World History","Spanish I","Cybersecurity","Art I","PE Foundations"],alternates:["Computer Science I","Physics","Geometry"],notes:"Band"},
  {id:"s2",name:"Caleb Brooks",grade:11,sped:true,requests:["English III","Algebra II","Physics","US History","Cybersecurity","PE Foundations","Spanish I","Art I"],alternates:["Biology","Computer Science I","Geometry"],notes:"Co-teach support requested"},
  {id:"s3",name:"Maya Carter",grade:12,sped:false,requests:["English III","Algebra II","Biology","US History","Spanish I","Computer Science I","Art I","PE Foundations"],alternates:["Chemistry","Physics","Cybersecurity"],notes:""},
];
export function createPlanningSeed(): PlanningData {
  return {staff:seedStaff,courses:seedCourses,assignments:seedAssignments,requests:seedRequests,generatedSections:[],studentSchedules:[]};
}
export function loadPlanningDemo(): PlanningData {
  if(typeof window==="undefined") return createPlanningSeed();
  try {
    const raw=window.localStorage.getItem(KEY);
    if(!raw){const seed=createPlanningSeed();window.localStorage.setItem(KEY,JSON.stringify(seed));return seed;}
    const parsed=JSON.parse(raw) as Partial<PlanningData>;
    const seed=createPlanningSeed();
    return {staff:Array.isArray(parsed.staff)?parsed.staff:seed.staff,courses:Array.isArray(parsed.courses)?parsed.courses:seed.courses,assignments:Array.isArray(parsed.assignments)?parsed.assignments:seed.assignments,requests:Array.isArray(parsed.requests)?parsed.requests:seed.requests,generatedSections:Array.isArray(parsed.generatedSections)?parsed.generatedSections:[],studentSchedules:Array.isArray(parsed.studentSchedules)?parsed.studentSchedules:[]};
  } catch {return createPlanningSeed();}
}
export function savePlanningDemo(data:PlanningData) {
  if(typeof window!=="undefined") window.localStorage.setItem(KEY,JSON.stringify(data));
}
export function newPlanningId(prefix:string){return prefix+"-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7);}
export const planningDepartments=depts;
export const schedulePeriods=[
  {period:1,label:"P1 · Daily",day:"Daily",time:"8:15–9:05"},
  {period:2,label:"P2 · A Day",day:"A",time:"9:10–10:40"},
  {period:3,label:"P3 · B Day",day:"B",time:"9:10–10:40"},
  {period:4,label:"P4 · A Day + Lunch",day:"A",time:"11:25–1:30"},
  {period:5,label:"P5 · B Day + Lunch",day:"B",time:"11:25–1:30"},
  {period:6,label:"P6 · A Day",day:"A",time:"1:35–3:05"},
  {period:7,label:"P7 · B Day",day:"B",time:"1:35–3:05"},
  {period:8,label:"P8 · Daily",day:"Daily",time:"3:10–4:00"},
];
