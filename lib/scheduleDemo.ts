"use client";

export type DemoTeacher = { id: string; name: string; email: string | null };
export type DemoPeriod = { id: string; name: string; sort_order: number; start_time: string | null; end_time: string | null };
export type DemoEntry = {
  id: string; teacher_id: string; class_period_id: string;
  entry_type: "teaching" | "conference" | "plc" | "off";
  course_name: string | null; subject: string | null; department: string | null;
  room: string | null; capacity: number | null; school_year: string;
  is_active: boolean; needs_inclusion?: boolean;
};
export type DemoInclusion = { id: string; schedule_entry_id: string; inclusion_teacher_id: string; class_period_id: string; school_year: string };
export type DemoScheduleData = { teachers: DemoTeacher[]; periods: DemoPeriod[]; entries: DemoEntry[]; inclusions: DemoInclusion[] };

const STORAGE_KEY = "sped-tracker-schedule-demo-v1";
const periods: DemoPeriod[] = [
  { id: "p1", name: "Period 1", sort_order: 1, start_time: "8:15 AM", end_time: "9:05 AM" },
  { id: "p2", name: "Period 2", sort_order: 2, start_time: "9:10 AM", end_time: "10:40 AM" },
  { id: "p3", name: "Period 3", sort_order: 3, start_time: "10:45 AM", end_time: "11:20 AM" },
  { id: "p4", name: "Period 4", sort_order: 4, start_time: "11:25 AM", end_time: "1:30 PM" },
  { id: "p5", name: "Period 5", sort_order: 5, start_time: "11:25 AM", end_time: "1:30 PM" },
  { id: "p6", name: "Period 6", sort_order: 6, start_time: "1:35 PM", end_time: "2:15 PM" },
  { id: "p7", name: "Period 7", sort_order: 7, start_time: "2:20 PM", end_time: "3:05 PM" },
  { id: "p8", name: "Period 8", sort_order: 8, start_time: "3:10 PM", end_time: "4:00 PM" },
];
const teachers: DemoTeacher[] = [
  ["t1","Avery Johnson","avery.johnson@weatherfordisd.com"],["t2","Morgan Lee","morgan.lee@weatherfordisd.com"],
  ["t3","Taylor Brooks","taylor.brooks@weatherfordisd.com"],["t4","Jordan Ramirez","jordan.ramirez@weatherfordisd.com"],
  ["t5","Casey Williams","casey.williams@weatherfordisd.com"],["t6","Riley Thompson","riley.thompson@weatherfordisd.com"],
  ["t7","Cameron Davis","cameron.davis@weatherfordisd.com"],["t8","Parker Martinez","parker.martinez@weatherfordisd.com"],
  ["t9","Quinn Anderson","quinn.anderson@weatherfordisd.com"],["t10","Reese Clark","reese.clark@weatherfordisd.com"],
  ["t11","Skyler Patel","skyler.patel@weatherfordisd.com"],["t12","Drew Wilson","drew.wilson@weatherfordisd.com"],
].map(([id,name,email])=>({id,name,email}));
const seedEntries: DemoEntry[] = [
  ["e1","t1","p1","teaching","English I","English Language Arts","English","A101",28,true],
  ["e2","t1","p2","teaching","English II","English Language Arts","English","A101",28,true],
  ["e3","t1","p3","conference","Conference",null,"English","A101",null,false],
  ["e4","t2","p1","teaching","Algebra I","Math","Math","B201",28,true],
  ["e5","t2","p2","teaching","Geometry","Math","Math","B201",28,true],
  ["e6","t2","p3","plc","PLC",null,"Math","B201",null,false],
  ["e7","t3","p1","teaching","Biology","Science","Science","C110",28,true],
  ["e8","t3","p2","teaching","Chemistry","Science","Science","C110",28,true],
  ["e9","t4","p1","teaching","World History","Social Studies","Social Studies","D105",28,true],
  ["e10","t4","p2","teaching","US History","Social Studies","Social Studies","D105",28,true],
  ["e11","t5","p1","teaching","Cybersecurity","CTE","CTE","E210",24,true],
  ["e12","t5","p2","teaching","Computer Science I","CTE","CTE","E210",24,true],
  ["e13","t6","p1","teaching","Art I","Fine Arts","Fine Arts","F120",24,false],
  ["e14","t7","p1","teaching","PE Foundations","Physical Education","Athletics / PE","Gym",30,false],
  ["e15","t8","p1","teaching","Spanish I","World Languages","LOTE","A205",28,false],
  ["e16","t9","p1","teaching","English III","English Language Arts","English","A103",28,true],
  ["e17","t10","p1","teaching","Algebra II","Math","Math","B205",28,true],
  ["e18","t11","p1","conference","Conference",null,"SPED","NGC 12",null,false],
  ["e19","t12","p1","teaching","Inclusion Support","SPED","NGC / SPED","NGC 14",null,false],
].map(([id,teacher_id,class_period_id,entry_type,course_name,subject,department,room,capacity,needs_inclusion])=>({
 id:String(id),teacher_id:String(teacher_id),class_period_id:String(class_period_id),entry_type:entry_type as DemoEntry["entry_type"],
 course_name:course_name as string|null,subject:subject as string|null,department:department as string|null,
 room:room as string|null,capacity:capacity as number|null,school_year:"2026-27",is_active:true,needs_inclusion:Boolean(needs_inclusion)
}));
const seed: DemoScheduleData = {
 teachers, periods, entries: seedEntries,
 inclusions: [],
};
export function isDemoMode() {
  return process.env.NEXT_PUBLIC_SPED_DEMO_MODE !== "false";
}
export function loadDemoSchedule(year = "2026-27"): DemoScheduleData {
  if (typeof window === "undefined") return { ...seed, entries: seed.entries.filter(e=>e.school_year===year), inclusions: seed.inclusions.filter(a=>a.school_year===year) };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) as DemoScheduleData : null;
    const data = stored && Array.isArray(stored.teachers) && Array.isArray(stored.entries) ? stored : seed;
    if (!stored) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return { ...data, entries: data.entries.filter(e=>e.school_year===year), inclusions: data.inclusions.filter(a=>a.school_year===year) };
  } catch { return { ...seed, entries: seed.entries.filter(e=>e.school_year===year), inclusions: seed.inclusions.filter(a=>a.school_year===year) }; }
}
export function saveDemoSchedule(data: DemoScheduleData, schoolYear?: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) as DemoScheduleData : seed;
    const yearsBeingSaved = new Set([...(schoolYear ? [schoolYear] : []), ...data.entries.map(entry => entry.school_year)]);
    const inclusionYearsBeingSaved = new Set([...(schoolYear ? [schoolYear] : []), ...data.inclusions.map(item => item.school_year)]);
    const merged: DemoScheduleData = {
      teachers: data.teachers,
      periods: data.periods,
      entries: [
        ...existing.entries.filter(entry => !yearsBeingSaved.has(entry.school_year)),
        ...data.entries,
      ],
      inclusions: [
        ...existing.inclusions.filter(item => !inclusionYearsBeingSaved.has(item.school_year)),
        ...data.inclusions,
      ],
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}
export function newDemoId(prefix: string) {
  return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,7);
}
