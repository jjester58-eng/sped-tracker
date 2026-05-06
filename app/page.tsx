import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center", padding: "2rem 1.5rem 1.5rem" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: "var(--color-background-info)",
          color: "var(--color-text-info)",
          fontSize: "11px",
          fontWeight: 500,
          padding: "6px 12px",
          borderRadius: "var(--border-radius-md)",
          marginBottom: "1.5rem"
        }}>
          ✨ Special education
        </div>
        <h1 style={{ fontSize: "32px", fontWeight: 500, margin: "0 0 0.75rem" }}>
          SPED Tracker
        </h1>
        <p style={{ fontSize: "16px", color: "var(--color-text-secondary)", maxWidth: "420px", margin: "0 auto", lineHeight: 1.6 }}>
          Track student progress, manage IEP goals, and log weekly notes — all in one place.
        </p>
      </div>

      <div style={{ padding: "0 1.5rem 2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", maxWidth: "640px", margin: "0 auto" }}>
        <Link href="/teacher" style={{
          background: "var(--color-background-primary)",
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "var(--border-radius-lg)",
          padding: "1.5rem",
          textDecoration: "none",
          color: "inherit",
          display: "flex",
          flexDirection: "column",
          transition: "all 0.2s"
        }} className="hover:border-border-secondary hover:-translate-y-0.5">
          <div style={{ width: "48px", height: "48px", background: "var(--color-background-info)", borderRadius: "var(--border-radius-md)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem", fontSize: "24px" }}>✏️</div>
          <h2 style={{ fontSize: "16px", fontWeight: 500, margin: "0 0 0.5rem" }}>Teacher input</h2>
          <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: "0 0 1rem", lineHeight: 1.6, flexGrow: 1 }}>Log weekly progress notes for students by subject and goal.</p>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--color-text-info)", fontSize: "14px", fontWeight: 500 }}>
            <span>Open workspace</span> →
          </div>
        </Link>
        {/* ... case-manager card follows same pattern */}
      </div>
    </main>
  );
}