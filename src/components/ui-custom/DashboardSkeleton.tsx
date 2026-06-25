function Sk({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} />;
}

export default function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-100 bg-white shadow-[0_1px_12px_0_rgba(0,0,0,0.04)] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Sk className="h-4 w-24" />
          <Sk className="h-6 w-20 rounded-full" />
        </div>
        <Sk className="h-7 w-48" />
        <Sk className="h-3 w-32" />
        <Sk className="h-2 w-full rounded-full" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white shadow-[0_1px_12px_0_rgba(0,0,0,0.04)] p-6 space-y-3">
            <Sk className="h-3 w-20" />
            <Sk className="h-5 w-32" />
          </div>
        ))}
      </div>

      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-gray-100 bg-white shadow-[0_1px_12px_0_rgba(0,0,0,0.04)] p-6 space-y-3">
          <Sk className="h-3 w-28" />
          <Sk className="h-12 w-full" />
          <Sk className="h-12 w-full" />
        </div>
      ))}
    </div>
  );
}
