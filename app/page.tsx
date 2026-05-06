import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ fontFamily: "sans-serif" }}>
      {/* Hero Section */}
      <div style={{ textAlign: "center", padding: "2rem 1.5rem 1.5rem" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "var(--color-background-info)",
            color: "var(--color-text-info)",
            fontSize: "11px",
            fontWeight: 500,
            padding: "6px 12px",
            borderRadius: "var(--border-radius-md)",
            marginBottom: "1.5rem",
          }}
        >
          ✨ Special education
        </div>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 500,
            color: "var(--color-text-primary)",
            margin: "0 0 0.75rem",
            letterSpacing: "-0.5px",
          }}
        >
          SPED Tracker
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "var(--color-text-secondary)",
            margin: "0",
            maxWidth: "420px",
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.6,
          }}
        >
          Track student progress, manage IEP goals, and log weekly notes — all in one place.
        </p>
      </div>

      {/* Action Cards */}
      <div
        style={{
          padding: "0 1.5rem 2rem",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          maxWidth: "700px",
          margin: "0 auto",
        }}
      >
        <Link
          href="/teacher"
          style={{
            background: "var(--color-background-primary)",
            border: "0.5px solid var(--color-border-tertiary)",
            borderRadius: "var(--border-radius-lg)",
            padding: "1.5rem",
            textDecoration: "none",
            color: "inherit",
            display: "flex",
            flexDirection: "column",
            transition: "all 0.2s",
            cursor: "pointer",
          }}
          className="hover:border-secondary hover:-translate-y-0.5"
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border-secondary)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border-tertiary)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              background: "var(--color-background-info)",
              borderRadius: "var(--border-radius-md)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem",
              fontSize: "24px",
            }}
          >
            ✏️
          </div>
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 500,
              color: "var(--color-text-primary)",
              margin: "0 0 0.5rem",
            }}
          >
            Teacher input
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "var(--color-text-secondary)",
              margin: "0 0 1rem",
              lineHeight: 1.6,
              flexGrow: 1,
            }}
          >
            Log weekly progress notes for students by subject and goal.
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--color-text-info)",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            <span>Open workspace</span>
            <span>→</span>
          </div>
        </Link>

        <Link
          href="/case-manager"
          style={{
            background: "var(--color-background-primary)",
            border: "0.5px solid var(--color-border-tertiary)",
            borderRadius: "var(--border-radius-lg)",
            padding: "1.5rem",
            textDecoration: "none",
            color: "inherit",
            display: "flex",
            flexDirection: "column",
            transition: "all 0.2s",
            cursor: "pointer",
          }}
          className="hover:border-secondary hover:-translate-y-0.5"
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border-secondary)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border-tertiary)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              background: "var(--color-background-success)",
              borderRadius: "var(--border-radius-md)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem",
              fontSize: "24px",
            }}
          >
            👥
          </div>
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 500,
              color: "var(--color-text-primary)",
              margin: "0 0 0.5rem",
            }}
          >
            Case manager
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "var(--color-text-secondary)",
              margin: "0 0 1rem",
              lineHeight: 1.6,
              flexGrow: 1,
            }}
          >
            Manage student rosters, IEP goals, and review progress history.
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--color-text-success)",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            <span>Open workspace</span>
            <span>→</span>
          </div>
        </Link>
      </div>

      {/* Divider */}
      <div
        style={{
          borderTop: "0.5px solid var(--color-border-tertiary)",
          margin: "2rem 1.5rem",
          maxWidth: "700px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      />

      {/* Feature Cards */}
      <div
        style={{
          padding: "0 1.5rem 2rem",
          maxWidth: "700px",
          margin: "0 auto",
        }}
      >
        <h3
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--color-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            margin: "0 0 1rem",
            padding: "0",
          }}
        >
          Key features
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
          }}
        >
          <div
            style={{
              background: "var(--color-background-secondary)",
              borderRadius: "var(--border-radius-md)",
              padding: "1rem",
              textAlign: "center",
              border: "0.5px solid var(--color-border-tertiary)",
            }}
          >
            <div style={{ fontSize: "28px", marginBottom: "0.75rem" }}>📋</div>
            <p
              style={{
                fontSize: "13px",
                color: "var(--color-text-secondary)",
                margin: "0",
                lineHeight: 1.5,
              }}
            >
              IEP goal tracking
            </p>
          </div>
          <div
            style={{
              background: "var(--color-background-secondary)",
              borderRadius: "var(--border-radius-md)",
              padding: "1rem",
              textAlign: "center",
              border: "0.5px solid var(--color-border-tertiary)",
            }}
          >
            <div style={{ fontSize: "28px", marginBottom: "0.75rem" }}>📈</div>
            <p
              style={{
                fontSize: "13px",
                color: "var(--color-text-secondary)",
                margin: "0",
                lineHeight: 1.5,
              }}
            >
              Progress history
            </p>
          </div>
          <div
            style={{
              background: "var(--color-background-secondary)",
              borderRadius: "var(--border-radius-md)",
              padding: "1rem",
              textAlign: "center",
              border: "0.5px solid var(--color-border-tertiary)",
            }}
          >
            <div style={{ fontSize: "28px", marginBottom: "0.75rem" }}>📤</div>
            <p
              style={{
                fontSize: "13px",
                color: "var(--color-text-secondary)",
                margin: "0",
                lineHeight: 1.5,
              }}
            >
              CSV import
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}