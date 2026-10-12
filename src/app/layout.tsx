import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "RHP Nexus · Student progress", description: "RHP cohort progress from the Skillrack consolidated sheet." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
