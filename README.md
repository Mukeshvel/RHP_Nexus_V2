# RHP Nexus

RHP Nexus is a responsive, read-only dashboard for the **CONSOLIDATED** tab in the supplied Skillrack workbook. It reads the roster fields directly from Google Sheets through a server route and refreshes the browser every two minutes. It includes cohort totals, branch comparisons, a top solved-count list, searchable and sortable student rows, a student detail drawer, and CSV export.

## Run locally

Requirements: Node.js 20 or newer and npm.

```powershell
npm install
npm run dev
```

Open http://localhost:3000. Use **Refresh** to request the sheet immediately. The app reads but never writes to the spreadsheet. It uses the source values as reported and does not invent a completion percentage.

## Data source

The spreadsheet link and consolidated-tab ID are configured in `src/lib/config/data-sources.ts`. The link must permit the dashboard server to read a CSV export. If the sheet is private, use an approved server-side Google Sheets API credential flow; do not make private student records public to enable access.

The dashboard reads registration number, student name, college, branch, program solved count, yet-to-solve count, and number of days. It omits the source sheet's contact numbers and email addresses. No demo data is substituted if the connection fails.

The roster includes student identifiers and academic progress. Add sign-in and server-side access control before deploying this dashboard to a public URL. The current app has no authentication.

## Verify and build

```powershell
npx tsc --noEmit
npm run build
```
