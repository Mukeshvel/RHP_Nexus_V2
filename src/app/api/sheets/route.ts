import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SKILLRACK_ID = "1DJpzA_e5XRI_lL7yACPYE6K6aabms_sQ";
const INTERVIEWS_ID = "1h3vkStbXplqjXPE8eoN0OtG3cp0eFbCA";
const SKILLRACK_GID = "1942151949";
const INTERVIEWS_GID = "968230959";

type Row = string[];
type Student = { id: string; name: string; college: string; branch: string; solved: number | null; remaining: number | null; days: number | null; interviews: number; lastInterview: string };

function parseCsv(text: string): Row[] {
  const rows: Row[] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { cell += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(cell); cell = ""; }
    else if (char === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
    else cell += char;
  }
  if (cell || row.length) { row.push(cell.replace(/\r$/, "")); rows.push(row); }
  return rows;
}

function normal(value: string) { return value.toLowerCase().replace(/[^a-z0-9]/g, ""); }
function column(headers: Row, ...names: string[]) { return headers.findIndex(header => names.some(name => normal(header).includes(normal(name)))); }
function numberValue(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const result = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(result) ? result : null;
}
function registration(value: string | undefined) { return (value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, ""); }
function dateValue(value: string | undefined): string {
  if (!value?.trim()) return "";
  const text = value.trim();
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

async function readCsv(id: string, gid: string, label: string): Promise<Row[]> {
  const url = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`${label} returned HTTP ${response.status}. Check that its link permits viewing.`);
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  if (contentType.includes("text/html") || text.trimStart().startsWith("<!DOCTYPE html")) {
    throw new Error(`${label} did not return a CSV export. The sheet must be readable by the dashboard server using its link-sharing access.`);
  }
  return parseCsv(text);
}

function findHeader(rows: Row[], required: string[][]) {
  return rows.findIndex(row => required.every(alternatives => row.some(cell => alternatives.some(name => normal(cell).includes(normal(name))))));
}

export async function GET() {
  try {
    const [skillRows, interviewRows] = await Promise.all([
      readCsv(SKILLRACK_ID, SKILLRACK_GID, "Skillrack workbook"),
      readCsv(INTERVIEWS_ID, INTERVIEWS_GID, "Mock interview workbook"),
    ]);
    const rosterHeaderIndex = findHeader(skillRows, [["Regn Num", "Registration Number"], ["Name"], ["Programs Solved Count", "Solved Count"]]);
    if (rosterHeaderIndex < 0) throw new Error("Could not find the registration, name and solved-count columns in the Skillrack consolidated tab.");
    const rosterHeaders = skillRows[rosterHeaderIndex];
    const idColumn = column(rosterHeaders, "Regn Num", "Registration Number");
    const nameColumn = column(rosterHeaders, "Name");
    const collegeColumn = column(rosterHeaders, "College", "Institution");
    const branchColumn = column(rosterHeaders, "Branch");
    const solvedColumn = column(rosterHeaders, "Programs Solved Count", "Solved Count");
    const remainingColumn = column(rosterHeaders, "Yet to solve", "Yet to Solve Count");
    const daysColumn = column(rosterHeaders, "No.of days", "Number of days");
    const students: Student[] = skillRows.slice(rosterHeaderIndex + 1).flatMap(row => {
      const id = row[idColumn]?.trim() ?? "";
      const name = row[nameColumn]?.trim() ?? "";
      if (!id || !name || !registration(id)) return [];
      return [{ id, name, college: row[collegeColumn]?.trim() ?? "", branch: row[branchColumn]?.trim() ?? "", solved: numberValue(row[solvedColumn]), remaining: numberValue(row[remainingColumn]), days: numberValue(row[daysColumn]), interviews: 0, lastInterview: "" }];
    });
    if (!students.length) throw new Error("The Skillrack tab was read, but no student rows were found beneath its header.");

    const interviewHeaderIndex = findHeader(interviewRows, [["REG. No", "Reg No", "Registration Number"], ["DATE", "Interview Date"]]);
    if (interviewHeaderIndex < 0) throw new Error("Could not find the registration-number and date columns in the mock interview tab.");
    const interviewHeaders = interviewRows[interviewHeaderIndex];
    const interviewIdColumn = column(interviewHeaders, "REG. No", "Reg No", "Registration Number");
    const interviewDateColumn = column(interviewHeaders, "DATE", "Interview Date");
    const byId = new Map(students.map(student => [registration(student.id), student]));
    for (const row of interviewRows.slice(interviewHeaderIndex + 1)) {
      const student = byId.get(registration(row[interviewIdColumn]));
      if (!student) continue;
      const date = dateValue(row[interviewDateColumn]);
      if (!date) continue;
      student.interviews += 1;
      if (!student.lastInterview || date > student.lastInterview) student.lastInterview = date;
    }

    return NextResponse.json({
      students,
      refreshedAt: new Date().toISOString(),
      sources: {
        skillrack: `https://docs.google.com/spreadsheets/d/${SKILLRACK_ID}/edit`,
        interviews: `https://docs.google.com/spreadsheets/d/${INTERVIEWS_ID}/edit`,
      },
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not read the Google Sheets.";
    return NextResponse.json({ students: [], refreshedAt: "", sources: { skillrack: "", interviews: "" }, error: message }, { status: 502, headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}
