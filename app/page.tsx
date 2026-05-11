import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ fontFamily: "sans-serif", background: "#f3f4f6", minHeight: "100vh" }}>

      {/* HERO */}
      <section style={{ textAlign: "center", padding: "3rem 1.5rem 2rem" }}>
        <div style={{
          display: "inline-block",
          fontSize: "12px",
          padding: "6px 12px",
          borderRadius: "999px",
          background: "#dbeafe",
          color: "#1d4ed8",
          marginBottom: "14px",
          fontWeight: 600,
        }}>
          Special Education Platform
        </div>

        <h1 style={{
          fontSize: "38px",
          margin: "0 0 10px",
          fontWeight: 700,
          color: "#111827",
        }}>
          SPED Tracker
        </h1>

        <p style={{
          maxWidth: "520px",
          margin: "0 auto",
          color: "#374151",
          lineHeight: 1.6,
          fontSize: "15px",
        }}>
          Track student progress, manage IEP goals, and log weekly notes in one simple system built for teachers and case managers.
        </p>
      </section>

      {/* CARDS */}
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
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "20px",
  textDecoration: "none",
  color: "inherit",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
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
  fontSize: "18px",
  fontWeight: 700,
  margin: "0 0 4px",
  color: "#111827", // FIX: strong contrast
};

const descStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#4b5563", // FIX: darker gray
  lineHeight: 1.5,
  margin: 0,
};

const actionStyle = (color: string): React.CSSProperties => ({
  marginTop: "6px",
  fontSize: "13px",
  fontWeight: 600,
  color,
});