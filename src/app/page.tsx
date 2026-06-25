'use client';

import { useState } from 'react';
import HomePage from '@/components/ui-custom/HomePage';
import DashboardPage from '@/components/ui-custom/DashboardPage';
import DashboardSkeleton from '@/components/ui-custom/DashboardSkeleton';
import type {
  Project, RoadmapPhase, Update, PendingItem, ClientUpload, AgencyFile,
} from '@/types';
import {
  fetchProject, fetchRoadmap, fetchUpdates, fetchPendingItems,
  fetchClientUploads, uploadClientFile, fetchAgencyFiles,
} from '@/lib/firebase';
import {
  DEMO_PROJECT_ID,
  mockProject, mockRoadmap, mockUpdates, mockPendingItems,
  mockClientUploads, mockAgencyFiles,
} from '@/lib/mockData';

type View = 'home' | 'loading' | 'dashboard' | 'not-found';

interface DashboardData {
  project: Project;
  roadmap: RoadmapPhase[];
  updates: Update[];
  pendingItems: PendingItem[];
  clientUploads: ClientUpload[];
  agencyFiles: AgencyFile[];
  projectId: string;
  isDemo: boolean;
}

export default function Home() {
  const [view, setView] = useState<View>('home');
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (projectId: string) => {
    setView('loading');
    setError(null);

    // Demo mode — no Firebase needed
    if (projectId.toLowerCase() === DEMO_PROJECT_ID) {
      await new Promise((r) => setTimeout(r, 600)); // feel like it's loading
      setData({
        project: mockProject,
        roadmap: mockRoadmap,
        updates: mockUpdates,
        pendingItems: mockPendingItems,
        clientUploads: mockClientUploads,
        agencyFiles: mockAgencyFiles,
        projectId,
        isDemo: true,
      });
      setView('dashboard');
      return;
    }

    try {
      const project = await fetchProject(projectId);
      if (!project) {
        setView('not-found');
        return;
      }

      const [roadmap, updates, pendingItems, clientUploads, agencyFiles] = await Promise.all([
        fetchRoadmap(projectId),
        fetchUpdates(projectId),
        fetchPendingItems(projectId),
        fetchClientUploads(projectId),
        fetchAgencyFiles(projectId),
      ]);

      setData({
        project, roadmap, updates, pendingItems, clientUploads, agencyFiles,
        projectId, isDemo: false,
      });
      setView('dashboard');
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please check your connection and try again.');
      setView('home');
    }
  };

  const handleUpload = async (
    file: File,
    category: string,
    onProgress: (pct: number) => void,
  ): Promise<ClientUpload> => {
    if (!data) throw new Error('No project loaded');
    return uploadClientFile(data.projectId, file, category, onProgress);
  };

  const handleBack = () => {
    setView('home');
    setData(null);
    setError(null);
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-[#f9f9f9]">
        <header className="bg-white border-b border-gray-100 h-14" />
        <div className="max-w-2xl mx-auto px-4 py-6">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  // ── Not Found ────────────────────────────────────────────────────────────
  if (view === 'not-found') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <p className="text-5xl mb-5">🔍</p>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project not found</h2>
          <p className="text-sm text-gray-400 mb-7 max-w-xs">
            No project matches that name. Double-check the spelling and try again.
          </p>
          <button
            onClick={handleBack}
            className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────────────
  if (view === 'dashboard' && data) {
    return (
      <DashboardPage
        {...data}
        onUpload={handleUpload}
        onBack={handleBack}
      />
    );
  }

  // ── Home ─────────────────────────────────────────────────────────────────
  return (
    <>
      <HomePage onSubmit={handleSearch} />
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-600 text-white text-sm px-5 py-3 rounded-xl shadow-lg z-50 whitespace-nowrap">
          {error}
        </div>
      )}
    </>
  );
}
