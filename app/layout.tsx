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
                <details className="nav-menu">
                  <summary className="nav-menu-trigger">Menu <span aria-hidden="true">⌄</span></summary>
                  <div className="nav-menu-panel">
                    <Link href="/admin" className="nav-menu-item">Admin</Link>
                    <Link href="/admin/login" className="nav-menu-item">Login</Link>
                    <Link href="/student-scheduler" className="nav-menu-item">Student Scheduler</Link>
                    <Link href="/student-scheduler?tab=master" className="nav-menu-item">Master Schedule</Link>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
