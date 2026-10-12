export type Student = { id: string; name: string; year: number; branch: string; solved: number; target: number; attendance: number; topics: number; interviews: number; status: "On track" | "Needs follow-up" | "Completed"; last: string; email: string; thirdSheetCompletion?: "Completed" | "In progress" | null };
export type Activity = { id: string; studentId: string; date: string; type: "Coding" | "Session" | "Interview" | "Tournament" | "Attendance"; title: string; detail: string; count?: number };

// Synthetic identities and values only. The source workbooks informed the fields and activity shape.
export const students: Student[] = [
 { id:"RHP-2401",name:"Aarav Mehta",year:4,branch:"Computer Science",solved:38,target:50,attendance:100,topics:8,interviews:2,status:"On track",last:"Oct 10",email:"aarav.mehta@example.edu",thirdSheetCompletion:null },
 { id:"RHP-2402",name:"Anaya Iyer",year:4,branch:"Information Technology",solved:31,target:50,attendance:100,topics:7,interviews:1,status:"On track",last:"Oct 9",email:"anaya.iyer@example.edu" },
 { id:"RHP-2403",name:"Rohan Das",year:3,branch:"Computer Science",solved:22,target:50,attendance:75,topics:5,interviews:1,status:"Needs follow-up",last:"Oct 5",email:"rohan.das@example.edu" },
 { id:"RHP-2404",name:"Diya Nair",year:4,branch:"Electronics & Communication",solved:44,target:50,attendance:100,topics:10,interviews:3,status:"Completed",last:"Oct 11",email:"diya.nair@example.edu" },
 { id:"RHP-2405",name:"Kabir Shah",year:5,branch:"Computer Science",solved:27,target:50,attendance:75,topics:6,interviews:1,status:"On track",last:"Oct 8",email:"kabir.shah@example.edu" },
 { id:"RHP-2406",name:"Mira Joseph",year:3,branch:"Artificial Intelligence",solved:18,target:50,attendance:75,topics:4,interviews:0,status:"Needs follow-up",last:"Oct 3",email:"mira.joseph@example.edu" },
 { id:"RHP-2407",name:"Ishaan Rao",year:6,branch:"Computer Science",solved:41,target:50,attendance:100,topics:9,interviews:2,status:"On track",last:"Oct 11",email:"ishaan.rao@example.edu" },
 { id:"RHP-2408",name:"Tara Menon",year:4,branch:"Information Technology",solved:35,target:50,attendance:75,topics:8,interviews:2,status:"On track",last:"Oct 7",email:"tara.menon@example.edu" },
 { id:"RHP-2409",name:"Neil Verma",year:2,branch:"Computer Science",solved:15,target:50,attendance:75,topics:3,interviews:0,status:"Needs follow-up",last:"Oct 4",email:"neil.verma@example.edu" },
 { id:"RHP-2410",name:"Sana Khan",year:5,branch:"Data Science",solved:29,target:50,attendance:100,topics:6,interviews:2,status:"On track",last:"Oct 10",email:"sana.khan@example.edu" },
 { id:"RHP-2411",name:"Dev Patel",year:7,branch:"Computer Science",solved:47,target:50,attendance:100,topics:11,interviews:3,status:"Completed",last:"Oct 11",email:"dev.patel@example.edu" },
 { id:"RHP-2412",name:"Leah Thomas",year:8,branch:"Electronics & Communication",solved:24,target:50,attendance:75,topics:5,interviews:1,status:"On track",last:"Oct 6",email:"leah.thomas@example.edu" }
];
const sessionCatalog = [
 { id:"S-01",date:"2026-10-12",topic:"Arrays & searching techniques",faculty:"Program coordinator",start:"10:30 AM",end:"12:00 PM",phase:"Phase 2 · Core problem solving",present:10,notes:"Binary search patterns and boundary cases." },
 { id:"S-02",date:"2026-10-09",topic:"String manipulation",faculty:"DSA faculty",start:"11:00 AM",end:"12:30 PM",phase:"Phase 2 · Core problem solving",present:11,notes:"Two-pointer and frequency-map exercises." },
 { id:"S-03",date:"2026-10-07",topic:"Sorting fundamentals",faculty:"DSA faculty",start:"9:30 AM",end:"11:00 AM",phase:"Phase 2 · Core problem solving",present:10,notes:"Stable sorting and complexity review." },
 { id:"S-04",date:"2026-10-05",topic:"Bitwise problem patterns",faculty:"Program coordinator",start:"10:00 AM",end:"11:30 AM",phase:"Phase 2 · Core problem solving",present:9,notes:"Masks, shifts and parity problems." }
];
export const attendanceStatus=(studentIndex:number,sessionIndex:number)=>((sessionIndex+studentIndex)%4)<Math.round(students[studentIndex].attendance/25)?"Present":"Absent";
export const sessions = sessionCatalog.map((session,sessionIndex)=>({...session,present:students.filter((_,studentIndex)=>attendanceStatus(studentIndex,sessionIndex)==="Present").length}));
const codingWeeks = ["2026-09-14","2026-09-21","2026-09-28","2026-10-05","2026-10-12"];
export const activities: Activity[] = students.flatMap((s,i)=>[
 ...codingWeeks.map((date,week)=>{
  const count=Math.floor(s.solved/codingWeeks.length)+(week<s.solved%codingWeeks.length?1:0);
  return {id:`A-${i}-C${week}`,studentId:s.id,date,type:"Coding" as const,title:"Practice problems completed",detail:`${count} problems · ${["Arrays","Strings","Bitwise","Sorting","Searching"][week]}`,count};
 }),
 {id:`A-${i}-S`,studentId:s.id,date:sessionCatalog[i%sessionCatalog.length].date,type:"Session" as const,title:"Training session attended",detail:["Sorting fundamentals","String manipulation","Arrays & searching techniques"][i%3]},
 ...(i%3===0?[{id:`A-${i}-I`,studentId:s.id,date:`2026-10-${String(8+((i*3)%4)).padStart(2,"0")}`,type:"Interview" as const,title:"Mock interview",detail:"Problem solving and communication review"}]:[])
]);
export const interviews = students.flatMap((s,i)=>Array.from({length:s.interviews},(_,j)=>({id:`MI-${i}-${j}`,studentId:s.id,date:`2026-10-${String(8+((i*3+j*3)%4)).padStart(2,"0")}`,interviewer:"Demo interviewer",topics:["Arrays","Problem solving","Complexity"][((i+j)%3)],rating:(i+j)%4===0?null:3+((i+j)%3),feedback:"Discuss edge cases clearly and explain the approach before coding."})));
export const tournaments = [{id:"T-01",name:"October Coding Take-off",date:"2026-10-10",participants:9,problems:5},{id:"T-02",name:"September Sprint",date:"2026-09-19",participants:10,problems:4}];
export const phases = [{name:"Phase 1 · Foundations",dates:"Jun 15 – Jul 31, 2026",topics:"Complexity, arrays, strings",status:"Complete"},{name:"Phase 2 · Core problem solving",dates:"Aug 12 – Oct 30, 2026",topics:"Searching, sorting, bitwise",status:"In progress"},{name:"Phase 3 · Advanced patterns",dates:"Nov 2 – Dec 18, 2026",topics:"Trees, graphs, dynamic programming",status:"Upcoming"}];
export type ModuleMetadata = { name: string; faculty: string; designation: string; email: string; source: string; updated: string; workbookLink?: string; completionColumn?: string };
export const moduleMetadata: ModuleMetadata[] = [
 {name:"DSA",faculty:"Demo faculty placeholder",designation:"Faculty coordinator",email:"dsa.coordinator@example.edu",source:"RMKEC 2029 – Skillrack RHP – Program Solved status",updated:"Demo dataset · Oct 2026"},
 {name:"Mock Interviews",faculty:"Demo interviewer placeholder",designation:"Interview coordinator",email:"interviews@example.edu",source:"2025–2029 RHP – Mock Interview (Students)",updated:"Demo dataset · Oct 2026"},
 {name:"Third Excel workbook",faculty:"Metadata pending",designation:"Data source placeholder",email:"",source:"",workbookLink:"",completionColumn:"",updated:"Not connected"}
];
