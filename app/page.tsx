export default function Home() {
  return (
    <div className="p-8 max-w-3xl mx-auto space-y-10">
      <h1 className="text-4xl font-bold text-center">SPED Tracker</h1>

      <div className="flex justify-center space-x-6 text-lg font-semibold">
        <a
          href="#teacher"
          className="px-4 py-2 border-b-4 border-transparent hover:border-blue-600"
        >
          Teacher
        </a>

        <a
          href="#case-manager"
          className="px-4 py-2 border-b-4 border-transparent hover:border-green-600"
        >
          Case Manager
        </a>
      </div>

      {/* Teacher Section */}
      <section id="teacher" className="space-y-4 border p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-blue-700">Teacher Tools</h2>

        <p className="text-gray-700">
          Select students, subjects, grade levels, weekly goals, and enter notes.
        </p>

        <a
          href="/teacher"
          className="block bg-blue-600 text-white px-4 py-2 rounded text-center"
        >
          Go to Teacher Weekly Input
        </a>
      </section>

      {/* Case Manager Section */}
      <section id="case-manager" className="space-y-4 border p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-green-700">Case Manager Tools</h2>

        <p className="text-gray-700">
          Upload/download CSVs, edit student data, view profiles, archive records.
        </p>

        <a
          href="/case-manager"
          className="block bg-green-600 text-white px-4 py-2 rounded text-center"
        >
          Go to Case Manager Dashboard
        </a>
      </section>
    </div>
  );
}
