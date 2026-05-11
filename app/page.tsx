import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ fontFamily: "sans-serif", background: "#fafafa", minHeight: "100vh" }}>

      {/* HERO */}
      <section style={{ textAlign: "center", padding: "3rem 1.5rem 2rem" }}>
        <div style={{
          display: "inline-block",
          fontSize: "12px",
          padding: "6px 12px",
          borderRadius: "999px",
          background: "#eef6ff",
          color: "#2563eb",
          marginBottom: "14px",
          fontWeight: 600,
        }}>
          Special Education Platform
        </div>

        <h1 style={{ fontSize: "36px", margin: "0 0 10px" }}>
          SPED Tracker
        </h1>

        <p style={{ maxWidth: "520px", margin: "0 auto", color: "#666", lineHeight: 1.5 }}>
          Track student progress, manage IEP goals, and log weekly notes in one simple system built for teachers and case managers.
        </p>
      </section>

      {/* MAIN CARDS */}
      <section style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "18px",
        maxWidth: "820px",
        margin: "0 auto",
        padding: "0 1.5rem 2rem",
      }}>

        {/* TEACHER */}
        <Link href="/teacher" style={cardStyle}>
          <div style={iconStyle("#2563eb")}>✏️</div>

          <div>
            <h2 style={titleStyle}>Teacher Workspace</h2>
            <p style={descStyle}>
              Log student progress, select goals, and record instructional notes.
            </p>
          </div>

          <div style={actionStyle("#2563eb")}>
            Open workspace →
          </div>
        </Link>

        {/* CASE MANAGER */}
        <Link href="/case-manager" style={cardStyle}>
          <div style={iconStyle("#16a34a")}>👥</div>

          <div>
            <h2 style={titleStyle}>Case Manager</h2>
            <p style={descStyle}>
              Manage student rosters, review IEP goals, and track long-term progress.
            </p>
          </div>

          <div style={actionStyle("#16a34a")}>
            Open dashboard →
          </div>
        </Link>

      </section>
    </main>
  );
}

/* ---------- STYLES ---------- */

const cardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "20px",
  textDecoration: "none",
  color: "inherit",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  transition: "0.2s",
};

const iconStyle = (color: string): React.CSSProperties => ({
  width: "44px",
  height: "44px",
  borderRadius: "12px",
  background: `${color}15`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
  color,
});

const titleStyle: React.CSSProperties = {
  fontSize: "17px",
  fontWeight: 600,
  margin: "0 0 4px",
};

const descStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b7280",
  lineHeight: 1.5,
  margin: 0,
};

const actionStyle = (color: string): React.CSSProperties => ({
  marginTop: "6px",
  fontSize: "13px",
  fontWeight: 600,
  color,
});