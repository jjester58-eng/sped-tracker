import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ fontFamily: "sans-serif" }}>
      <div className="text-center px-8 pt-12 pb-8">
        <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 text-xs font-medium px-3 py-1 rounded-full mb-6">
          Special Education
        </span>
        <h1 className="text-4xl font-medium tracking-tight text-gray-900 mb-3">SPED Tracker</h1>
        <p className="text-gray-500 text-base max-w-md mx-auto leading-relaxed mb-10">
          Track student progress, manage IEP goals, and log weekly notes — all in one place.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto px-6 mb-12">
        <Link href="/teacher" className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-400 hover:-translate-y-0.5 transition-all block no-underline">
          <div className="w-11 h-11 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center text-xl mb-4">✏️</div>
          <h2 className="text-base font-medium text-gray-900 mb-1.5">Teacher input</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-4">Log weekly progress notes for students by subject and goal.</p>
          <span className="text-sm text-purple-700">Open workspace →</span>
        </Link>

        <Link href="/case-manager" className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-400 hover:-translate-y-0.5 transition-all block no-underline">
          <div className="w-11 h-11 bg-teal-100 text-teal-700 rounded-lg flex items-center justify-center text-xl mb-4">👥</div>
          <h2 className="text-base font-medium text-gray-900 mb-1.5">Case manager</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-4">Manage student rosters, IEP goals, and review progress history.</p>
          <span className="text-sm text-teal-700">Open workspace →</span>
        </Link>
      </div>

      <hr className="border-gray-100 max-w-2xl mx-auto mb-8" />

      <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto px-6 mb-12">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl mb-1">📋</div>
          <div className="text-xs text-gray-500">IEP goal tracking</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl mb-1">📈</div>
          <div className="text-xs text-gray-500">Progress history</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl mb-1">📤</div>
          <div className="text-xs text-gray-500">CSV import</div>
        </div>
      </div>
    </main>
  );
}
