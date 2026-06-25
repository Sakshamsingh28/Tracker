import type { Update } from '@/types';

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7)  return `${days} Days Ago`;
  if (days < 30) return `${Math.floor(days / 7)} Weeks Ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function UpdatesTimeline({ updates }: { updates: Update[] }) {
  if (!updates.length) {
    return <p className="text-sm text-gray-400 text-center py-6">No updates yet.</p>;
  }

  return (
    <div className="relative pl-5">
      <div className="absolute left-[7px] top-1 bottom-1 w-px bg-gray-100" />
      <ul className="space-y-5">
        {updates.map((u) => (
          <li key={u.id} className="relative flex gap-4 items-start">
            <div className="absolute -left-5 top-[5px] w-2 h-2 rounded-full bg-gray-900 ring-2 ring-white" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 font-medium leading-snug">{u.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{relativeDate(u.date)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
