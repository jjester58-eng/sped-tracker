import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SPED Tracker",
  description: "Special education progress tracker for teachers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <nav className="nav border-b bg-white shadow-sm">
          <div className="nav-inner max-w-5xl mx-auto px-6 py-4">   {/* ← Important */}
            <div className="flex justify-between items-center">
              <span className="nav-brand text-2xl font-bold">🎓 SPED Tracker</span>
              
              <div className="nav-links flex gap-8">
                <Link href="/" className="nav-link hover:text-blue-600 transition">Home</Link>
                <Link href="/teacher" className="nav-link hover:text-blue-600 transition">Teacher Input</Link>
                <Link href="/case-manager" className="nav-link hover:text-blue-600 transition font-medium">Case Manager</Link>
              </div>
            </div>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}