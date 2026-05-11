import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ fontFamily: "sans-serif" }}>
      
      {/* HERO */}
      <section style={{ textAlign: "center", padding: "3rem 1.5rem 2rem" }}>
        <div
          style={{
            display: "inline-block",
            fontSize: "12px",
            padding: "6px 12px",
            borderRadius: "8px",
            background: "#eef6ff",
            color: "#2563eb",
            marginBottom: "16px",
            fontWeight: 500,
          }}
        >
          ✨ Special Education Tracker
        </div>

        <h1 style={{ fontSize: "34px", marginBottom: "10px" }}>
          SPED Tracker
        </h1>

        <p style={{ maxWidth: "520px", margin: "0 auto", color: "#555" }}>
          Track student progress, manage IEP goals, and log weekly notes in one simple system built for teachers.
        </p>
      </section>

      {/* CARDS */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
          maxWidth: "800px",
          margin: "0 auto",
          padding: "0 1.5rem 2rem",
        }}
      >
        {/* TEACHER */}
        <Link
          href="/teacher"
          style={{
            border: "1px solid #ddd",
            borderRadius: "12px",
            padding: "20px",
            textDecoration: "none",
            color: "inherit",
            background: "white",
          }}
        >
          <div style={{ fontSize: "28px" }}>✏️</div>
          <h3>Teacher Input</h3>
          <p style={{ fontSize: "14px", color: "#666" }}>
            Log progress notes and track student goals.
          </p>
          <div style={{ marginTop: "10px", color: "#2563eb" }}>
            Open →
          </div>
        </Link>

        {/* CASE MANAGER */}
        <Link
          href="/case-manager"
          style={{
            border: "1px solid #ddd",
            borderRadius: "12px",
            padding: "20px",
            textDecoration: "none",
            color: "inherit",
            background: "white",
          }}
        >
          <div style={{ fontSize: "28px" }}>👥</div>
          <h3>Case Manager</h3>
          <p style={{ fontSize: "14px", color: "#666" }}>
            Manage students, IEPs, and long-term progress.
          </p>
          <div style={{ marginTop: "10px", color: "#16a34a" }}>
            Open →
          </div>
        </Link>
      </section>

      {/* FEATURES */}
      <section style={{ maxWidth: "800px", margin: "0 auto", padding: "0 1.5rem 3rem" }}>
        <h4 style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>
          KEY FEATURES
        </h4>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <div style={box}>📋 IEP Goal Tracking</div>
          <div style={box}>📈 Progress Monitoring</div>
          <div style={box}>📝 Teacher Notes</div>
        </div>
      </section>
    </main>
  );
}

const box = {
  flex: "1",
  minWidth: "180px",
  padding: "14px",
  border: "1px solid #eee",
  borderRadius: "10px",
  fontSize: "13px",
  color: "#555",
};