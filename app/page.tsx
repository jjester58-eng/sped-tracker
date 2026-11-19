import Link from "next/link";

const workspaces = [
  { href: "/staff-planning", number: "01", eyebrow: "CAMPUS SCHEDULING", title: "Build the master schedule", description: "Manage staff loads, course offerings, teacher preps, A/B periods, and student course scheduling in one demo workspace.", action: "Open staff & course planning", tone: "purple" },
  { href: "/master-schedule", number: "02", eyebrow: "MASTER SCHEDULE", title: "Review teacher schedules", description: "Explore the shared teacher schedule, room assignments, availability, and non-teaching periods.", action: "Open master schedule", tone: "sage" },
  { href: "/inclusion-support", number: "03", eyebrow: "INCLUSION SUPPORT", title: "Plan classroom coverage", description: "Assign inclusion teachers to classes, check conflicts, and review each support teacher's daily schedule.", action: "Open inclusion support", tone: "purple" },
  { href: "/teacher", number: "04", eyebrow: "TEACHER WORKSPACE", title: "Record student progress", description: "Capture classroom observations, select students, document accommodations, and save progress notes.", action: "Open teacher workspace", tone: "sage" },
  { href: "/case-manager", number: "05", eyebrow: "CASE MANAGER", title: "Review the full picture", description: "Explore student caseloads, follow observation timelines, and review IEP goals in one place.", action: "Open case manager", tone: "purple" },
  { href: "/student-scheduler", number: "06", eyebrow: "STUDENT SCHEDULE LOOKUP", title: "Look up a student schedule", description: "Quickly view a student’s daily schedule, including courses, teachers, rooms, and periods.", action: "Explore student schedules", tone: "sage" },
];

export default function HomePage() {
  return (
    <main className="home-page">
      <div className="home-shell">
        <section className="home-hero">
          <div className="home-kicker"><span className="home-kicker-mark">✦</span> Scheduling, support, and student progress</div>
          <h1>One connected view<br /><span>of every student.</span></h1>
          <p className="home-intro">A unified workspace for student schedules, course planning, caseload management, meetings, and progress monitoring—bringing the information your team needs into one place.</p>
          <div className="home-hero-note"><span className="home-note-dot" />Built for the people who work with students every day</div>
        </section>
        <section className="workspace-section" aria-label="Choose a workspace">
          <div className="workspace-heading">
            <div><p className="section-eyebrow">YOUR WORKSPACES</p><h2>Where would you like to start?</h2></div>
            <span className="workspace-count">06 AREAS</span>
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
