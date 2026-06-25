import type { ReactNode } from 'react';

export default function Section({
  title,
  children,
  className = '',
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-100 bg-white shadow-[0_1px_12px_0_rgba(0,0,0,0.04)] p-6 ${className}`}
    >
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
        {title}
      </h2>
      {children}
    </div>
  );
}
