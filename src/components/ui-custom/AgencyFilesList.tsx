import { Download, File } from 'lucide-react';
import type { AgencyFile } from '@/types';

function FileTypeIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    pdf: 'text-red-400', zip: 'text-amber-400', docx: 'text-blue-400',
    jpg: 'text-violet-400', jpeg: 'text-violet-400', png: 'text-violet-400',
  };
  return <File size={15} className={map[ext] ?? 'text-gray-400'} />;
}

export default function AgencyFilesList({ files }: { files: AgencyFile[] }) {
  if (!files.length) {
    return <p className="text-sm text-gray-400 text-center py-6">No files shared yet.</p>;
  }

  return (
    <div className="space-y-1.5">
      {files.map((f) => (
        <a
          key={f.id}
          href={f.fileURL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <FileTypeIcon name={f.fileName} />
          <span className="text-sm text-gray-700 truncate flex-1">{f.fileName}</span>
          <Download
            size={13}
            className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0"
          />
        </a>
      ))}
    </div>
  );
}
