"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, ArrowDownUp, BookOpen, Check, Clock3, Download, ExternalLink, RefreshCw, Search, Users } from "lucide-react";

type Student = {
  id: string;
  name: string;
  college: string;
  branch: string;
  solved: number | null;
  remaining: number | null;
  days: number | null;
  interviews: number;
  lastInterview: string;
};
type Payload = { students: Student[]; refreshedAt: string; sources: { skillrack: string; interviews: string }; error?: string };
const emptyPayload: Payload = { students: [], refreshedAt: "", sources: { skillrack: "", interviews: "" } };
const dateLabel = (value: string) => value ? new Date(value).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function Home() {
  const [data, setData] = useState<Payload>(emptyPayload);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<keyof Student>("name");
  const [ascending, setAscending] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/sheets", { cache: "no-store" });
      const result = await response.json() as Payload;
      if (!response.ok) throw new Error(result.error || "The Google Sheets could not be read.");
      setData(result);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The Google Sheets could not be read.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 120_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const students = data.students.filter(student => !query || `${student.name} ${student.id} ${student.branch}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => {
    const first = a[sortBy]; const second = b[sortBy];
    const comparison = typeof first === "number" && typeof second === "number" ? first - second : String(first ?? "").localeCompare(String(second ?? ""), undefined, { numeric: true, sensitivity: "base" });
    return comparison * (ascending ? 1 : -1);
  });
  const totalSolved = data.students.reduce((total, student) => total + (student.solved ?? 0), 0);
  const totalInterviews = data.students.reduce((total, student) => total + student.interviews, 0);
  const exportCsv = () => {
    const columns = ["Registration number", "Name", "College", "Branch", "Programs solved", "Yet to solve", "Days", "Mock interviews", "Most recent interview", "Third sheet completion"];
    const rows = students.map(student => [student.id, student.name, student.college, student.branch, student.solved ?? "", student.remaining ?? "", student.days ?? "", student.interviews, student.lastInterview, ""]);
    const csv = [columns, ...rows].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); link.download = "rhp-live-sheet-data.csv"; link.click(); URL.revokeObjectURL(link.href);
  };
  const sort = (column: keyof Student) => { if (sortBy === column) setAscending(!ascending); else { setSortBy(column); setAscending(true); } };

  return <main className="live-app">
    <header className="live-topbar"><a className="live-brand" href="#"><span className="brand-icon">R</span><span><b>RHP <i>NEXUS</i></b><small>TRAINING WORKSPACE</small></span></a><span className="live-label"><span className="live-dot"/>{error ? "SOURCE ISSUE" : "LIVE SHEET VIEW"}</span></header>
    <div className={`connection-banner ${error ? "connection-error" : ""}`}><Activity size={16}/><div><b>{error ? "Google Sheets connection needs attention" : "Connected to the source workbooks"}</b><span>{error || (data.refreshedAt ? `Read-only data · refreshed ${new Date(data.refreshedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Reading the latest sheet values…")}</span></div><button onClick={() => void refresh()} disabled={loading}><RefreshCw size={15} className={loading ? "spin" : ""}/>{loading ? "Refreshing" : "Refresh now"}</button></div>
    <section className="live-heading"><div><div className="live-eyebrow">RMK ENGINEERING COLLEGE <span>/</span> 2025–29</div><h1>RHP cohort dashboard</h1><p>Student progress and mock interview activity, read directly from the linked Google Sheets.</p></div><div className="heading-buttons"><button className="live-button" onClick={exportCsv} disabled={!students.length}><Download size={15}/> Export CSV</button></div></section>
    <section className="live-kpis"><article><div className="kpi-icon"><Users size={18}/></div><span>Students in roster</span><b>{loading && !data.students.length ? "—" : data.students.length}</b><small>From the Skillrack consolidated tab</small></article><article><div className="kpi-icon green"><Check size={18}/></div><span>Programs solved</span><b>{loading && !data.students.length ? "—" : totalSolved.toLocaleString()}</b><small>Total reported in the source roster</small></article><article><div className="kpi-icon blue"><BookOpen size={18}/></div><span>Mock interviews logged</span><b>{loading && !data.students.length ? "—" : totalInterviews}</b><small>Matched by registration number</small></article><article><div className="kpi-icon amber"><Clock3 size={18}/></div><span>Last refreshed</span><b className="time-value">{data.refreshedAt ? new Date(data.refreshedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</b><small>Automatically every 2 minutes</small></article></section>
    <section className="live-panel"><div className="live-panel-head"><div><h2>Student progress</h2><p>Values reflect the linked sheets. Use the column headings to sort.</p></div><div className="live-tools"><label className="live-search"><Search size={15}/><input aria-label="Search students" placeholder="Search name, ID or branch" value={query} onChange={event => setQuery(event.target.value)}/></label><button className="live-button" onClick={exportCsv} disabled={!students.length}><Download size={15}/> Export</button></div></div>
      <div className="live-table-wrap"><table className="live-table"><thead><tr>{[["id","Registration no."],["name","Student"],["college","College"],["branch","Branch"],["solved","Programs solved"],["remaining","Yet to solve"],["days","Days"],["interviews","Mock interviews"],["lastInterview","Latest interview"],["name","Third sheet completion"]].map(([key,title], index) => <th key={`${title}-${index}`}><button onClick={() => sort(key as keyof Student)}>{title}{index < 9 && <ArrowDownUp size={12}/>}</button></th>)}</tr></thead><tbody>
        {error && !data.students.length ? <tr><td colSpan={10}><div className="table-message"><b>Live source unavailable</b><span>{error}</span><small>The dashboard does not substitute demo records.</small></div></td></tr> : loading && !data.students.length ? <tr><td colSpan={10}><div className="table-message">Loading Google Sheets…</div></td></tr> : students.length ? students.map(student => <tr key={student.id}><td className="reg-cell">{student.id || "—"}</td><td><b>{student.name || "—"}</b></td><td>{student.college || "—"}</td><td>{student.branch || "—"}</td><td className="number-cell">{student.solved ?? "—"}</td><td className="number-cell">{student.remaining ?? "—"}</td><td className="number-cell">{student.days ?? "—"}</td><td><span className="interview-count">{student.interviews}</span></td><td>{dateLabel(student.lastInterview)}</td><td><span className="blank-source">—</span></td></tr>) : <tr><td colSpan={10}><div className="table-message">No students matched “{query}”.</div></td></tr>}
      </tbody></table></div><div className="table-foot"><span>{students.length} students shown</span><span>The third sheet completion column is intentionally blank.</span></div>
    </section>
    <section className="live-sources"><div><span className="source-symbol"><Activity size={17}/></span><div><b>Skillrack program status</b><small>Roster, solved count, remaining count and activity days</small></div><a href={data.sources.skillrack || "https://docs.google.com/spreadsheets/d/1DJpzA_e5XRI_lL7yACPYE6K6aabms_sQ/edit"} target="_blank" rel="noreferrer">Open sheet <ExternalLink size={13}/></a></div><div><span className="source-symbol interview"><BookOpen size={17}/></span><div><b>Mock interview tracker</b><small>Interview dates matched using registration number</small></div><a href={data.sources.interviews || "https://docs.google.com/spreadsheets/d/1h3vkStbXplqjXPE8eoN0OtG3cp0eFbCA/edit"} target="_blank" rel="noreferrer">Open sheet <ExternalLink size={13}/></a></div></section>
    <footer className="live-footer">RHP NEXUS <span>·</span> Read-only Google Sheets connection <span>·</span> No sample data</footer>
  </main>;
}
