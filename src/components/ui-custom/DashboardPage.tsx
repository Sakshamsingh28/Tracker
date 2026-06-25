'use client';

import { ArrowLeft, Clock } from 'lucide-react';
import type {
  Project, RoadmapPhase, Update, PendingItem, ClientUpload, AgencyFile,
} from '@/types';
import StatusBadge    from './StatusBadge';
import ProgressBar    from './ProgressBar';
import Section        from './Section';
import RoadmapSection from './RoadmapSection';
import UpdatesTimeline from './UpdatesTimeline';
import FileUploader   from './FileUploader';
import AgencyFilesList from './AgencyFilesList';

interface DashboardPageProps {
  project:       Project;
  roadmap:       RoadmapPhase[];
  updates:       Update[];
  pendingItems:  PendingItem[];
  clientUploads: ClientUpload[];
  agencyFiles:   AgencyFile[];
  onUpload:      (file: File, category: string, onProgress: (pct: number) => void) => Promise<ClientUpload>;
  onUploadLink:  (fileName: string, fileURL: string, category: string) => Promise<ClientUpload>;
  onBack:        () => void;
  isDemo:        boolean;
}

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export default function DashboardPage({
  project, roadmap, updates, pendingItems, clientUploads, agencyFiles, onUpload, onUploadLink, onBack, isDemo,
}: DashboardPageProps) {
  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      {/* Sticky nav */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={14} />
            Projects
          </button>

          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-900 inline-block" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-900 inline-block" />
            </div>
            <span className="text-xs font-semibold tracking-[0.15em] text-gray-900 uppercase">
              Double S Studio
            </span>
          </div>

          {isDemo ? (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
              Demo
            </span>
          ) : (
            <span className="w-16" />
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-16">
        {/* ── Hero Card ─────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-[0_1px_12px_0_rgba(0,0,0,0.04)] p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">{project.clientName}</p>
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight leading-tight">
                {project.projectName}
              </h1>
            </div>
            <StatusBadge status={project.status} />
          </div>

          <ProgressBar value={project.progress} />

          <div className="flex items-center gap-1.5 mt-4 text-xs text-gray-400">
            <Clock size={11} />
            Updated {relativeDate(project.lastUpdated)}
          </div>
        </div>

        {/* ── Current Phase + Task ───────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-[0_1px_12px_0_rgba(0,0,0,0.04)] p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Current Phase
            </p>
            <p className="text-sm font-semibold text-gray-900 leading-snug">
              {project.currentPhase}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white shadow-[0_1px_12px_0_rgba(0,0,0,0.04)] p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Current Task
            </p>
            <p className="text-sm font-semibold text-gray-900 leading-snug">
              {project.currentTask}
            </p>
          </div>
        </div>

        {/* ── Waiting For You ────────────────────────────────────── */}
        {pendingItems.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              <h2 className="text-xs font-semibold text-amber-700 uppercase tracking-widest">
                Waiting For You
              </h2>
            </div>
            <ul className="space-y-2.5">
              {pendingItems.map((item) => (
                <li key={item.id} className="flex items-center gap-3 text-sm text-amber-900">
                  <span className="w-4 h-4 rounded border-2 border-amber-300 shrink-0" />
                  {item.item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Project Roadmap ─────────────────────────────────────── */}
        <Section title="Project Roadmap">
          <RoadmapSection phases={roadmap} />
        </Section>

        {/* ── Recent Updates ──────────────────────────────────────── */}
        <Section title="Recent Updates">
          <UpdatesTimeline updates={updates} />
        </Section>

        {/* ── Upload Assets ───────────────────────────────────────── */}
        <Section title="Upload Assets">
          <FileUploader
            onUpload={onUpload}
            onUploadLink={onUploadLink}
            existingUploads={clientUploads}
            isDemo={isDemo}
          />
        </Section>

        {/* ── Project Files ───────────────────────────────────────── */}
        <Section title="Project Files">
          <AgencyFilesList files={agencyFiles} />
        </Section>
      </main>

      <footer className="text-center py-8 text-xs text-gray-300 tracking-wide">
        Built by Double S Studio
      </footer>
    </div>
  );
}
