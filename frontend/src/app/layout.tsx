import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '../components/Navbar';

export const metadata: Metadata = {
  title: 'SatQuery AI — Agentic Vision-Language Assistant for Remote Sensing',
  description: 'Smart India Hackathon 2026 — Multi-modal remote sensing VLM system supporting single-image VQA, bi-temporal change detection, and optical-SAR cross-modal fusion.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}

