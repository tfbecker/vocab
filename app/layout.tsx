import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vocab - Spaced Repetition",
  description: "Learn vocabulary with FSRS-6 spaced repetition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-slate-900 text-slate-50 antialiased">
        <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
          <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
            <a href="/" className="text-xl font-bold text-sky-400">vocab</a>
            <div className="flex gap-6">
              <a href="/decks" className="text-slate-300 hover:text-white transition">Decks</a>
              <a href="/stats" className="text-slate-300 hover:text-white transition">Stats</a>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-4xl px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
