export default function Home() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">SPED Tracker</h1>

      <p className="text-gray-600">
        Choose a page to begin.
      </p>

      <div className="space-y-4">
        <a
          href="/case-manager"
          className="block bg-blue-600 text-white px-4 py-2 rounded text-center"
        >
          Case Manager Dashboard
        </a>

        <a
          href="/teacher"
          className="block bg-green-600 text-white px-4 py-2 rounded text-center"
        >
          Teacher Weekly Input
        </a>
      </div>
    </div>
  );
}
