type Status = 'In Progress' | 'Completed' | 'On Hold' | 'Review';

const config: Record<Status, { dot: string; bg: string; text: string }> = {
  'In Progress': { dot: 'bg-emerald-400', bg: 'bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm', text: 'text-emerald-700' },
  Completed:     { dot: 'bg-blue-400',    bg: 'bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm',    text: 'text-blue-700'    },
  'On Hold':     { dot: 'bg-amber-400',   bg: 'bg-amber-500/10 border border-amber-500/20 backdrop-blur-sm',   text: 'text-amber-700'   },
  Review:        { dot: 'bg-purple-400',  bg: 'bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm',  text: 'text-purple-700'  },
};

export default function StatusBadge({ status }: { status: Status }) {
  const c = config[status] ?? config['In Progress'];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}
