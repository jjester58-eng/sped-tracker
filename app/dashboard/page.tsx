// app/dashboard/page.tsx
import Link from "next/link";

export default function Dashboard() {
  return (
    <main className="p-8 max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">Welcome back 👋</h1>
      <p className="text-gray-600 mb-10">What would you like to do today?</p>

      <div className="grid md:grid-cols-2 gap-6">
        <Link href="/case-manager" className="card-link">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-2xl font-semibold mb-2">Case Manager</h3>
          <p className="text-gray-600">Manage students, IEP goals, and import rosters</p>
        </Link>

        <Link href="/teacher" className="card-link">
          <div className="text-4xl mb-4">✍️</div>
          <h3 className="text-2xl font-semibold mb-2">Teacher Input</h3>
          <p className="text-gray-600">Enter student progress and observations</p>
        </Link>
      </div>
    </main>
  );
}