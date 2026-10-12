# RHP Nexus

RHP Nexus is a live, read-only dashboard for the two Google Sheets supplied for this project. It reads the Skillrack consolidated roster and the first mock interview tab on the server, joins interview records by registration number, and refreshes the browser view every two minutes. The **Third sheet completion** column is intentionally blank as requested.

## Run locally

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Use **Refresh now** to request the latest values immediately. The dashboard does not write back to either sheet and does not show interview recording links or contact numbers. It does not fall back to demo data if a source cannot be read.

## Sheet access

The server downloads CSV exports from the two source workbooks using their current tab IDs. The Google Sheets must allow the server to read them through link access. If a workbook is private, the dashboard will show a source error; use an approved server-side Google Sheets API credential flow rather than making private student data public.

The site displays student names, registration numbers, branches, and learning progress. **Do not deploy this dashboard to a public URL without adding sign-in and server-side access control for the intended coordinators.** Anyone who can reach the dashboard API can otherwise read the student progress values returned by the source sheets.

## Data included

- Skillrack consolidated tab: registration number, student name, college, branch, solved count, remaining count, and reported activity days.
- Mock interview tab: interview count and latest date, matched to the roster by registration number.
- Third sheet completion: blank placeholder column.

Phone numbers and recording URLs are not returned to the dashboard. No demo records are included.
