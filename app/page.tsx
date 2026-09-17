import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#302722", minHeight: "100vh" }}>
      <section style={{ textAlign: "center", padding: "3rem 1.5rem 2rem" }}>
        <div style={{ display: "inline-block", fontSize: "12px", padding: "6px 12px", borderRadius: "999px", background: "#4a3a32", color: "#d7a78b", marginBottom: "14px", fontWeight: 600 }}>
          Special Education Platform
        </div>
        <h1 style={{ fontSize: "38px", margin: "0 0 10px", fontWeight: 700, color: "#eee5dc" }}>SPED Tracker</h1>
        <p style={{ maxWidth: "520px", margin: "0 auto", color: "#c0b2a5", lineHeight: 1.6, fontSize: "15px" }}>
          Track student progress, manage IEP goals, and log weekly notes in one simple system built for teachers and case managers.
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px", maxWidth: "820px", margin: "0 auto", padding: "0 1.5rem 2rem" }}>
        <Link href="/teacher" style={cardStyle}>
          <div style={iconStyle("#c48762")}>✏️</div>
          <div>
            <h2 style={titleStyle}>Teacher Workspace</h2>
            <p style={descStyle}>Log student progress, select goals, and record instructional notes.</p>
          </div>
          <div style={actionStyle("#c48762")}>Open workspace →</div>
        </Link>

        <Link href="/case-manager" style={cardStyle}>
          <div style={iconStyle("#91a083")}>👥</div>
          <div>
            <h2 style={titleStyle}>Case Manager</h2>
            <p style={descStyle}>Review student rosters, IEP goals, and teacher progress input.</p>
          </div>
          <div style={actionStyle("#91a083")}>Open dashboard →</div>
        </Link>

        <Link href="/admin" style={cardStyle}>
          <div style={iconStyle("#9b8a78")}>⚙️</div>
          <div>
            <h2 style={titleStyle}>Admin</h2>
            <p style={descStyle}>Manage teachers, case managers, students, goals, and school settings.</p>
          </div>
          <div style={actionStyle("#9b8a78")}>Open administration →</div>
        </Link>
      </section>
    </main>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#3b302a",
  border: "1px solid #5b4a40",
  borderRadius: "16px",
  padding: "20px",
  textDecoration: "none",
  color: "inherit",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  boxShadow: "0 4px 18px rgba(10,7,5,0.18)",
  transition: "transform 0.15s ease, box-shadow 0.15s ease",
};

const iconStyle = (color: string): React.CSSProperties => ({
  width: "44px", height: "44px", borderRadius: "12px", background: `${color}18`,
  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", color,
});

const titleStyle: React.CSSProperties = { fontSize: "18px", fontWeight: 700, margin: "0 0 4px", color: "#eee5dc" };
const descStyle: React.CSSProperties = { fontSize: "14px", color: "#c0b2a5", lineHeight: 1.5, margin: 0 };
const actionStyle = (color: string): React.CSSProperties => ({ marginTop: "6px", fontSize: "13px", fontWeight: 600, color });