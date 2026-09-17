import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f5f0e8", minHeight: "100vh" }}>

      {/* HERO */}
      <section style={{ textAlign: "center", padding: "3rem 1.5rem 2rem" }}>
        <div style={{
          display: "inline-block",
          fontSize: "12px",
          padding: "6px 12px",
          borderRadius: "999px",
          background: "#eadfd5",
          color: "#8f513c",
          marginBottom: "14px",
          fontWeight: 600,
        }}>
          Special Education Platform
        </div>

        <h1 style={{
          fontSize: "38px",
          margin: "0 0 10px",
          fontWeight: 700,
          color: "#3f3b36",
        }}>
          SPED Tracker
        </h1>

        <p style={{
          maxWidth: "520px",
          margin: "0 auto",
          color: "#675f56",
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
          <div style={iconStyle("#a85f46")}>✏️</div>

          <div>
            <h2 style={titleStyle}>Teacher Workspace</h2>
            <p style={descStyle}>
              Log student progress, select goals, and record instructional notes.
            </p>
          </div>

          <div style={actionStyle("#a85f46")}>
            Open workspace →
          </div>
        </Link>

        {/* CASE MANAGER */}
        <Link href="/case-manager" style={cardStyle}>
          <div style={iconStyle("#657b69")}>👥</div>

          <div>
            <h2 style={titleStyle}>Case Manager</h2>
            <p style={descStyle}>
              Review student rosters, IEP goals, and teacher progress input.
            </p>
          </div>

          <div style={actionStyle("#657b69")}>
            Open dashboard →
          </div>
        </Link>

        {/* ADMIN */}
        <Link href="/admin" style={cardStyle}>
          <div style={iconStyle("#6f7d78")}>⚙️</div>

          <div>
            <h2 style={titleStyle}>Admin</h2>
            <p style={descStyle}>
              Manage teachers, case managers, students, goals, and school settings.
            </p>
          </div>

          <div style={actionStyle("#6f7d78")}>
            Open administration →
          </div>
        </Link>

      </section>
    </main>
  );
}

/* ---------- STYLES ---------- */

const cardStyle: React.CSSProperties = {
  background: "#fffaf3",
  border: "1px solid #ded4c7",
  borderRadius: "16px",
  padding: "20px",
  textDecoration: "none",
  color: "inherit",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  boxShadow: "0 2px 10px rgba(80,65,50,0.06)",
  transition: "transform 0.15s ease, box-shadow 0.15s ease",
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
  color: "#3f3b36",
};

const descStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#675f56",
  lineHeight: 1.5,
  margin: 0,
};

const actionStyle = (color: string): React.CSSProperties => ({
  marginTop: "6px",
  fontSize: "13px",
  fontWeight: 600,
  color,
});