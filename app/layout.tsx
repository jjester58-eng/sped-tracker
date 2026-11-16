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


/* Compact workspace dropdown navigation */
.nav-menu { position: relative; }
.nav-menu-trigger {
  list-style: none;
  display: inline-flex;
  align-items: center;
  gap: .45rem;
  padding: .55rem .9rem;
  border: 1px solid #d9d1e3;
  border-radius: 9px;
  background: #f4f0f8;
  color: #4e3d68;
  font-size: .84rem;
  font-weight: 700;
  cursor: pointer;
}
.nav-menu-trigger::-webkit-details-marker { display: none; }
.nav-menu-panel {
  position: absolute;
  right: 0;
  top: calc(100% + .55rem);
  z-index: 300;
  min-width: 210px;
  padding: .4rem;
  border: 1px solid #ded8e8;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 12px 30px rgba(35, 28, 48, .16);
}
.nav-menu-item {
  display: block;
  padding: .7rem .8rem;
  border-radius: 8px;
  color: #342944 !important;
  text-decoration: none;
  font-size: .88rem;
  font-weight: 650;
}
.nav-menu-item:hover, .nav-menu-item:focus-visible {
  background: #f0ebf8;
  color: #5b4381 !important;
  outline: none;
}
@media(max-width:640px) {
  .nav-menu-panel { right: auto; left: 0; }
}
