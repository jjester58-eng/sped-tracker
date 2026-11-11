import Link from "next/link";

const workspaces = [
  { href: "/teacher", number: "01", eyebrow: "TEACHER WORKSPACE", title: "Record student progress", description: "Capture classroom observations, select students, document accommodations, and save progress notes.", action: "Open teacher workspace", tone: "purple" },
  { href: "/case-manager", number: "02", eyebrow: "CASE MANAGER", title: "Review the full picture", description: "Explore student caseloads, follow observation timelines, and review IEP goals in one place.", action: "Open case manager", tone: "sage" },
  { href: "/admin", number: "03", eyebrow: "ADMINISTRATION", title: "Manage your program", description: "Maintain staff, student records, goals, and the settings that keep your tracker organized.", action: "Open administration", tone: "blue" },
];

export default function HomePage() {
  return (
    <main className="home-page">
      <div className="home-shell">
        <section className="home-hero">
          <div className="home-kicker"><span className="home-kicker-mark">✦</span> A clearer view of student growth</div>
          <h1>Good information.<br /><span>Better support.</span></h1>
          <p className="home-intro">One thoughtful workspace for documenting progress, coordinating support, and keeping student goals in focus.</p>
          <div className="home-hero-note"><span className="home-note-dot" />Built for the people who work with students every day</div>
        </section>
        <section className="workspace-section" aria-label="Choose a workspace">
          <div className="workspace-heading">
            <div><p className="section-eyebrow">YOUR WORKSPACES</p><h2>Where would you like to start?</h2></div>
            <span className="workspace-count">03 AREAS</span>
          </div>
          <div className="workspace-grid">
            {workspaces.map((workspace) => (
              <Link href={workspace.href} className={`workspace-card workspace-${workspace.tone}`} key={workspace.href}>
                <div className="workspace-card-top"><span className="workspace-number">{workspace.number}</span><span className="workspace-arrow" aria-hidden="true">↗</span></div>
                <p className="workspace-eyebrow">{workspace.eyebrow}</p>
                <h3>{workspace.title}</h3>
                <p className="workspace-description">{workspace.description}</p>
                <span className="workspace-action">{workspace.action}<span aria-hidden="true"> →</span></span>
              </Link>
            ))}
          </div>
        </section>
        <footer className="home-footer"><span>SPED TRACKER</span><span>Progress is a team effort.</span></footer>
      </div>
    </main>
  );
}
