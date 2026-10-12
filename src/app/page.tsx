"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, ArrowDownUp, BookOpen, Check, Clock3, Download, RefreshCw, Search, Users, X } from "lucide-react";

type Student = { id: string; name: string; college: string; branch: string; solved: number | null; remaining: number | null; days: number | null };
type SheetData = { students: Student[]; refreshedAt: string; source: string; error?: string };
const blank: SheetData = { students: [], refreshedAt: "", source: "" };

export default function Home() {
  const [data, setData] = useState(blank);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("All branches");
  const [sortBy, setSortBy] = useState<keyof Student>("name");
  const [ascending, setAscending] = useState(true);
  const [selected, setSelected] = useState<Student | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/sheets", { cache: "no-store" });
      const result = await response.json() as SheetData;
      if (!response.ok) throw new Error(result.error || "The consolidated sheet could not be read.");
      setData(result); setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The consolidated sheet could not be read.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 120_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const branches = useMemo(() => [...new Set(data.students.map(student => student.branch).filter(Boolean))].sort(), [data.students]);
  const filtered = useMemo(() => data.students.filter(student => (branch === "All branches" || student.branch === branch) && (!search || `${student.name} ${student.id} ${student.branch}`.toLowerCase().includes(search.toLowerCase()))).sort((a, b) => {
    const first = a[sortBy]; const second = b[sortBy];
    const result = typeof first === "number" && typeof second === "number" ? first - second : String(first ?? "").localeCompare(String(second ?? ""), undefined, { numeric: true, sensitivity: "base" });
    return result * (ascending ? 1 : -1);
  }), [data.students, branch, search, sortBy, ascending]);
  const solvedTotal = data.students.reduce((sum, student) => sum + (student.solved ?? 0), 0);
  const solvedValues = data.students.map(student => student.solved).filter((value): value is number => value !== null);
  const dayValues = data.students.map(student => student.days).filter((value): value is number => value !== null);
  const averageSolved = solvedValues.length ? solvedValues.reduce((sum, value) => sum + value, 0) / solvedValues.length : null;
  const averageDays = dayValues.length ? dayValues.reduce((sum, value) => sum + value, 0) / dayValues.length : null;
  const branchStats = branches.map(name => {
    const group = data.students.filter(student => student.branch === name);
    return { name, count: group.length, solved: group.reduce((sum, student) => sum + (student.solved ?? 0), 0) };
  }).sort((a, b) => b.solved - a.solved);
  const branchMax = Math.max(1, ...branchStats.map(item => item.solved));
  const toggleSort = (key: keyof Student) => { if (sortBy === key) setAscending(value => !value); else { setSortBy(key); setAscending(true); } };
  const exportCsv = () => {
    if (!filtered.length) return;
    const header = ["Registration number", "Student", "College", "Branch", "Programs solved", "Yet to solve", "Days"];
    const rows = filtered.map(student => [student.id, student.name, student.college, student.branch, student.solved ?? "", student.remaining ?? "", student.days ?? ""]);
    const csv = [header, ...rows].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); link.download = "rhp-consolidated-progress.csv"; link.click(); URL.revokeObjectURL(link.href);
  };
  const updated = data.refreshedAt ? new Date(data.refreshedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Waiting for first read";

  return <main className="dash-shell">
    <header className="dash-header"><a className="dash-brand" href="#"><span className="brand-mark">R</span><span><b>RHP <i>NEXUS</i></b><small>TRAINING WORKSPACE</small></span></a><div className="header-status"><span className={`status-dot ${error ? "offline" : data.refreshedAt ? "" : "checking"}`}/>{error ? "SOURCE ISSUE" : data.refreshedAt ? "CONNECTED" : "CONNECTING"}</div></header>
    <section className={`source-banner ${error ? "has-error" : ""}`}><div className="source-mark"><Activity size={17}/></div><div className="source-copy"><b>{error ? "Could not read the consolidated sheet" : data.refreshedAt ? "Live Skillrack consolidated sheet" : "Connecting to Skillrack…"}</b><span>{error || `Read-only · Last refreshed ${updated} · Auto refresh every 2 minutes`}</span></div><button className="action-button" onClick={() => void refresh()} disabled={loading}><RefreshCw size={15} className={loading ? "spin" : ""}/>{loading ? "Refreshing" : "Refresh"}</button></section>
    <section className="page-title"><div><div className="kicker">RMK ENGINEERING COLLEGE <span>·</span> RHP 2025–29</div><h1>Student progress</h1><p>A clear view of the cohort’s Skillrack performance from the consolidated roster.</p></div><button className="action-button export-action" onClick={exportCsv} disabled={!filtered.length}><Download size={15}/> Export CSV</button></section>
    <section className="metric-grid"><article className="metric-card"><span className="metric-icon blue"><Users size={17}/></span><label>Selected students</label><strong>{loading && !data.students.length ? "—" : data.students.length}</strong><small>Rows in the consolidated roster</small></article><article className="metric-card"><span className="metric-icon green"><Check size={17}/></span><label>Programs solved</label><strong>{loading && !data.students.length ? "—" : solvedTotal.toLocaleString()}</strong><small>Sum of source-reported counts</small></article><article className="metric-card"><span className="metric-icon violet"><BookOpen size={17}/></span><label>Average solved</label><strong>{averageSolved === null ? "—" : averageSolved.toFixed(1)}</strong><small>Per student with a reported count</small></article><article className="metric-card"><span className="metric-icon amber"><Clock3 size={17}/></span><label>Average active days</label><strong>{averageDays === null ? "—" : averageDays.toFixed(1)}</strong><small>Per student with a reported count</small></article></section>
    <section className="insights-grid"><article className="panel branch-panel"><div className="panel-heading"><div><h2>Programs solved by branch</h2><p>Totals grouped from the consolidated sheet</p></div><span className="soft-tag">{branchStats.length} branches</span></div><div className="branch-chart">{branchStats.length ? branchStats.map(item => <div className="branch-row" key={item.name}><span className="branch-name">{item.name}</span><div className="bar-track"><i style={{ width: `${Math.max(3, item.solved / branchMax * 100)}%` }}/></div><b>{item.solved.toLocaleString()}</b><small>{item.count} students</small></div>) : <div className="empty-chart">Branch summary will appear when the sheet is available.</div>}</div></article><article className="panel leaders-panel"><div className="panel-heading"><div><h2>Highest solved counts</h2><p>Top 5 in the current roster</p></div><span className="leader-icon"><BookOpen size={16}/></span></div><div className="leader-list">{[...data.students].sort((a,b)=>(b.solved??-Infinity)-(a.solved??-Infinity)).slice(0,5).map((student,index)=><button className="leader-row" key={student.id} onClick={()=>setSelected(student)}><span className={`leader-rank rank-${index+1}`}>{String(index+1).padStart(2,"0")}</span><span className="leader-name"><b>{student.name}</b><small>{student.branch} · {student.id}</small></span><strong>{student.solved ?? "—"}</strong></button>)}{!data.students.length&&<div className="empty-chart">No roster data loaded.</div>}</div></article></section>
    <section className="panel roster-panel"><div className="roster-heading"><div><h2>Consolidated student roster</h2><p>Search, filter and sort the fields in the source sheet.</p></div><div className="roster-controls"><label className="search-control"><Search size={15}/><input placeholder="Search students or ID" aria-label="Search students" value={search} onChange={event=>setSearch(event.target.value)}/></label><select aria-label="Filter by branch" value={branch} onChange={event=>setBranch(event.target.value)}><option>All branches</option>{branches.map(item=><option key={item}>{item}</option>)}</select><button className="action-button compact" onClick={exportCsv} disabled={!filtered.length}><Download size={14}/> Export</button></div></div>
      <div className="table-viewport"><table className="roster-table"><thead><tr>{[["id","Registration no."],["name","Student"],["college","College"],["branch","Branch"],["solved","Solved"],["remaining","Yet to solve"],["days","Active days"]].map(([key,label])=><th key={key}><button onClick={()=>toggleSort(key as keyof Student)}>{label}<ArrowDownUp size={12}/></button></th>)}</tr></thead><tbody>{error&&!data.students.length?<tr><td colSpan={7}><div className="table-empty"><b>Live source unavailable</b><span>{error}</span><small>No sample data is being used.</small></div></td></tr>:loading&&!data.students.length?<tr><td colSpan={7}><div className="table-empty">Loading consolidated student roster…</div></td></tr>:filtered.length?filtered.map(student=><tr key={student.id} className={selected?.id===student.id?"row-selected":""} onClick={()=>setSelected(student)}><td className="id-cell">{student.id}</td><td><b>{student.name}</b></td><td>{student.college||"—"}</td><td><span className="branch-pill">{student.branch||"—"}</span></td><td className="numeric">{student.solved??"—"}</td><td className="numeric">{student.remaining??"—"}</td><td className="numeric">{student.days??"—"}</td></tr>):<tr><td colSpan={7}><div className="table-empty">No students match these filters.</div></td></tr>}</tbody></table></div><div className="table-summary"><span>Showing <b>{filtered.length}</b> of {data.students.length} students</span><span>Click a row to inspect the source values</span></div>
    </section>
    <footer className="dash-footer"><span>RHP NEXUS <i>·</i> Consolidated sheet dashboard</span><a href={data.source||"#"} target="_blank" rel="noreferrer">Open source spreadsheet ↗</a></footer>
    {selected&&<div className="detail-backdrop" onClick={()=>setSelected(null)}><aside className="detail-drawer" onClick={event=>event.stopPropagation()}><div className="drawer-top"><span className="metric-icon green"><Users size={18}/></span><button aria-label="Close student details" onClick={()=>setSelected(null)}><X size={18}/></button></div><span className="kicker">STUDENT SOURCE RECORD</span><h2>{selected.name}</h2><p className="drawer-subtitle">{selected.id} <span>·</span> {selected.branch}</p><div className="detail-stats"><div><span>Programs solved</span><b>{selected.solved??"—"}</b></div><div><span>Yet to solve</span><b>{selected.remaining??"—"}</b></div><div><span>Active days</span><b>{selected.days??"—"}</b></div></div><div className="drawer-note">These values are read from the consolidated sheet as reported. This dashboard does not estimate a completion percentage.</div><a className="drawer-link" href={data.source} target="_blank" rel="noreferrer">View spreadsheet</a></aside></div>}
  </main>;
}
