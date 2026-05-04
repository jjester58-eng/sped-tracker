import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SPED Tracker",
  description: "Special education progress tracker for teachers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <div className="nav-inner">
            <span className="nav-brand">🎓 SPED Tracker</span>
            <div className="nav-links">
              <Link href="/" className="nav-link">Home</Link>
              <Link href="/teacher" className="nav-link">Teacher Input</Link>
              <Link href="/case-manager" className="nav-link">Case Manager</Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}