"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export default function Navigation() {
  const menuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        menuRef.current.open = false;
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && menuRef.current) {
        menuRef.current.open = false;
      }
    }

    document.addEventListener("click", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("click", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <nav className="nav">
      <div className="nav-inner" style={{ padding: "0.75rem 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <Link href="/" className="nav-brand" style={{ textDecoration: "none" }}>
            <span className="nav-logo" aria-hidden="true">✦</span>
            <span>SPED Tracker</span>
          </Link>
          <div className="nav-links">
            <details className="nav-menu" ref={menuRef}>
              <summary className="nav-menu-trigger">Menu <span aria-hidden="true">⌄</span></summary>
              <div className="nav-menu-panel">
                <Link href="/admin" className="nav-menu-item">Admin</Link>
                <Link href="/admin/login" className="nav-menu-item">Login</Link>
                <Link href="/student-scheduler" className="nav-menu-item">Student Scheduler</Link>
                <Link href="/master-schedule" className="nav-menu-item">Master Schedule</Link>
                <Link href="/inclusion-support" className="nav-menu-item">Inclusion Support</Link>
              </div>
            </details>
          </div>
        </div>
      </div>
    </nav>
  );
}
