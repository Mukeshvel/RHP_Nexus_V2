import { NextResponse } from "next/server";
import { DATA_SOURCES } from "@/lib/config/data-sources";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = string[];
function parseCsv(text: string): Row[] {
  const rows: Row[] = []; let row: string[] = []; let cell = ""; let quoted = false;
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
const normal = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const findColumn = (headers: Row, names: string[]) => headers.findIndex(cell => names.some(name => normal(cell).includes(normal(name))));
const numeric = (value: string | undefined) => { if (!value?.trim()) return null; const parsed = Number(value.replace(/,/g, "").trim()); return Number.isFinite(parsed) ? parsed : null; };

export async function GET() {
  try {
    const spreadsheetId = DATA_SOURCES.dsa.spreadsheetUrl.match(/\/spreadsheets\/d\/([^/]+)/)?.[1];
    if (!spreadsheetId) throw new Error("Set the DSA spreadsheet link in src/lib/config/data-sources.ts.");
    const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${DATA_SOURCES.dsa.gid}`;
    const response = await fetch(exportUrl, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
    if (!response.ok) throw new Error(`The consolidated sheet returned HTTP ${response.status}. Check its link-sharing access.`);
    const text = await response.text();
    if (text.trimStart().startsWith("<!DOCTYPE html") || text.includes("accounts.google.com")) throw new Error("Google did not provide a CSV export. The consolidated tab must be readable by the dashboard server.");
    const rows = parseCsv(text);
    const headerIndex = rows.findIndex(row => ["regn num", "registration number"].some(key => row.some(cell => normal(cell).includes(normal(key)))) && row.some(cell => normal(cell).includes("name")) && row.some(cell => normal(cell).includes("solved count")));
    if (headerIndex < 0) throw new Error("Could not find the registration, name and solved-count columns in the consolidated tab.");
    const headers = rows[headerIndex];
    const idx = {
      id: findColumn(headers, ["Regn Num", "Registration Number"]), name: findColumn(headers, ["Name"]),
      college: findColumn(headers, ["College", "Institution"]), branch: findColumn(headers, ["Branch"]),
      solved: findColumn(headers, ["Programs Solved Count", "Solved Count"]),
      remaining: findColumn(headers, ["Yet to solve"]), days: findColumn(headers, ["No.of days", "Number of days"]),
    };
    const students = rows.slice(headerIndex + 1).flatMap(row => {
      const id = row[idx.id]?.trim() ?? ""; const name = row[idx.name]?.trim() ?? "";
      if (!id || !name || !/[0-9]/.test(id)) return [];
      return [{ id: id.replace(/\.0+$/, ""), name, college: row[idx.college]?.trim() ?? "", branch: row[idx.branch]?.trim() ?? "", solved: numeric(row[idx.solved]), remaining: numeric(row[idx.remaining]), days: numeric(row[idx.days]) }];
    });
    if (!students.length) throw new Error("The consolidated tab loaded, but no student rows were found below the header.");
    return NextResponse.json({ students, refreshedAt: new Date().toISOString(), source: DATA_SOURCES.dsa.spreadsheetUrl }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not read the consolidated sheet.";
    return NextResponse.json({ students: [], refreshedAt: "", source: DATA_SOURCES.dsa.spreadsheetUrl, error: message }, { status: 502, headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}
