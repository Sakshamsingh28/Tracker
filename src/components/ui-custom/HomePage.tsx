'use client';

import { useState } from 'react';

interface HomePageProps {
  onSubmit: (projectId: string) => void;
}

export default function HomePage({ onSubmit }: HomePageProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) onSubmit(value.trim());
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      {/* Wordmark */}
      <div className="mb-10 flex items-center gap-2.5">
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-gray-900 inline-block" />
          <span className="w-2 h-2 rounded-full bg-gray-900 inline-block" />
        </div>
        <span className="text-sm font-semibold tracking-[0.18em] text-gray-900 uppercase select-none">
          Double S Studio
        </span>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-gray-100 bg-white shadow-[0_2px_24px_0_rgba(0,0,0,0.06)] p-8">
          <h1 className="text-[1.4rem] font-semibold text-gray-900 mb-1 tracking-tight">
            Track Your Project
          </h1>
          <p className="text-sm text-gray-400 mb-7 leading-relaxed">
            Enter your project name to view progress and upload assets.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Project name…"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
              autoFocus
            />
            <button
              type="submit"
              disabled={!value.trim()}
              className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              View Project
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            Try{' '}
            <button
              onClick={() => onSubmit('demo')}
              className="underline underline-offset-2 hover:text-gray-600 transition-colors"
            >
              demo
            </button>{' '}
            to preview the dashboard
          </p>
        </div>
      </div>

      <p className="mt-10 text-xs text-gray-300 tracking-wide">Built by Double S Studio</p>
    </div>
  );
}
