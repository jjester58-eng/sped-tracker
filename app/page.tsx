import Link from "next/link";

export default function HomePage() {
  return (
    <main className="p-8 max-w-4xl mx-auto text-center">
      <h1 className="text-4xl font-bold mb-2">SPED Tracker</h1>

      <p className="text-gray-600 mb-10">
        Choose your workspace
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <Link
          href="/teacher"
          className="border p-6 rounded hover:bg-gray-50 block"
        >
          <h2 className="text-2xl font-semibold">Teacher Input</h2>
          <p className="text-gray-500">Enter weekly progress</p>
        </Link>

        <Link
          href="/case-manager"
          className="border p-6 rounded hover:bg-gray-50 block"
        >
          <h2 className="text-2xl font-semibold">Case Manager</h2>
          <p className="text-gray-500">Manage students & IEP goals</p>
        </Link>
      </div>
    </main>
  );
}