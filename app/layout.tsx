import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SPED Tracker",
  description: "Special education progress tracker for teachers and case managers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <div className="nav-inner" style={{ padding: "0.75rem 1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
              <Link href="/" className="nav-brand" style={{ textDecoration: "none" }}>
                <span className="nav-logo" aria-hidden="true">✦</span>
                <span>SPED Tracker</span>
              </Link>
              <div className="nav-links">
                <Link href="/" className="nav-link">Home</Link>
                <Link href="/teacher" className="nav-link">Teacher Input</Link>
                <Link href="/case-manager" className="nav-link">Case Manager</Link>
                <Link href="/admin" className="nav-link">Admin</Link>
                <Link href="/student-scheduler" className="nav-link">Student Scheduler</Link>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
