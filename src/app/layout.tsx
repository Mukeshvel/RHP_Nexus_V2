import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "RHP Nexus · Training workspace", description: "Live RHP cohort dashboard connected to the provided Google Sheets." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
