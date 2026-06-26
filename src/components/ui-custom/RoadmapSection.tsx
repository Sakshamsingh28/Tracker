'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { RoadmapPhase } from '@/types';

function phaseProgress(phase: RoadmapPhase) {
  if (!phase.tasks.length) return 0;
  return Math.round(
    (phase.tasks.filter((t) => t.completed).length / phase.tasks.length) * 100,
  );
}

export default function RoadmapSection({ phases }: { phases: RoadmapPhase[] }) {
  const [openId, setOpenId] = useState<string | null>(phases[0]?.id ?? null);

  if (!phases.length) {
    return <p className="text-sm text-gray-400 text-center py-6">Roadmap coming soon.</p>;
  }

  return (
    <div className="space-y-2">
      {phases.map((phase, i) => {
        const pct    = phaseProgress(phase);
        const isOpen = openId === phase.id;

        return (
          <div key={phase.id} className="rounded-xl border border-white/40 bg-white/90 md:bg-white/20 backdrop-blur-none md:backdrop-blur-sm overflow-hidden shadow-[0_2px_12px_0_rgba(0,0,0,0.01)]">
            <button
              onClick={() => setOpenId(isOpen ? null : phase.id)}
              className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-white/30 transition-colors"
            >
              <span className="shrink-0 w-7 h-7 rounded-full bg-gray-100 text-xs font-semibold text-gray-500 flex items-center justify-center">
                {i + 1}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-gray-900">{phase.phaseName}</span>
                  <span
                    className={`text-xs font-semibold shrink-0 ${
                      pct === 100 ? 'text-emerald-600' : 'text-gray-400'
                    }`}
                  >
                    {pct}%
                  </span>
                </div>
                <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      pct === 100 ? 'bg-emerald-400' : 'bg-gray-900'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <ChevronDown
                size={14}
                className={`shrink-0 text-gray-400 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isOpen && (
              <div className="px-5 pb-5 border-t border-gray-50">
                <ul className="mt-3 space-y-2">
                  {phase.tasks.map((task) => (
                    <li key={task.name} className="flex items-center gap-2.5 text-sm">
                      <span
                        className={`shrink-0 w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                          task.completed
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600'
                            : 'bg-white/40 border border-gray-200/50 text-transparent'
                        }`}
                      >
                        ✓
                      </span>
                      <span className={task.completed ? 'text-gray-600' : 'text-gray-400'}>
                        {task.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
