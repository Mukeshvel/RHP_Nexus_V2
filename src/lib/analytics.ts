import { activities, sessions, students } from "@/lib/demo-data";
export const cohort = {
 total: students.length, active: students.filter(s=>s.status!=="Completed").length,
 attendance: Math.round(students.reduce((a,s)=>a+s.attendance,0)/students.length),
 problems: students.reduce((a,s)=>a+s.solved,0), interviews: students.reduce((a,s)=>a+s.interviews,0),
 followUp: students.filter(s=>s.status==="Needs follow-up").length,
 topics: students.reduce((a,s)=>a+s.topics,0)
};
export const yearDistribution = Array.from({length:7},(_,i)=>({year:`Year ${i+2}`,students:students.filter(s=>s.year===i+2).length}));
export const problemTrend = ["2026-09-14","2026-09-21","2026-09-28","2026-10-05","2026-10-12"].map(date=>({week:new Date(`${date}T12:00:00`).toLocaleDateString("en-US",{month:"short",day:"numeric"}),solved:activities.filter(a=>a.type==="Coding"&&a.date===date).reduce((sum,a)=>sum+(a.count??0),0)}));
export const attendanceTrend = sessions.map(session=>({week:new Date(`${session.date}T12:00:00`).toLocaleDateString("en-US",{month:"short",day:"numeric"}),rate:Math.round(session.present/students.length*100)}));
export const studentActivities = (id:string)=>activities.filter(a=>a.studentId===id).sort((a,b)=>b.date.localeCompare(a.date));
export const studentProblemTrend = (id:string)=>problemTrend.map((point,index)=>({...point,solved:activities.filter(a=>a.studentId===id&&a.type==="Coding"&&a.date===["2026-09-14","2026-09-21","2026-09-28","2026-10-05","2026-10-12"][index]).reduce((sum,a)=>sum+(a.count??0),0)}));
