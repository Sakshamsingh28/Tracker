'use client';

import { useState, useRef } from 'react';
import { Upload, File, CheckCircle, X } from 'lucide-react';
import type { ClientUpload } from '@/types';

type UploadFn = (file: File, onProgress: (pct: number) => void) => Promise<ClientUpload>;

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/zip', 'application/x-zip-compressed',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function FileTypeIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    pdf: 'text-red-500', zip: 'text-amber-500', docx: 'text-blue-500',
    jpg: 'text-violet-500', jpeg: 'text-violet-500', png: 'text-violet-500', webp: 'text-violet-500',
  };
  return <File size={14} className={map[ext] ?? 'text-gray-400'} />;
}

export default function FileUploader({
  onUpload,
  existingUploads,
  isDemo,
}: {
  onUpload: UploadFn;
  existingUploads: ClientUpload[];
  isDemo: boolean;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [uploads,  setUploads]  = useState<ClientUpload[]>(existingUploads);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('File type not supported. Upload images, PDF, ZIP, or DOCX.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File too large. Maximum size is 50 MB.');
      return;
    }

    setError(null);
    setSuccess(false);
    setProgress(0);

    if (isDemo) {
      for (let i = 0; i <= 100; i += 20) {
        await new Promise((r) => setTimeout(r, 90));
        setProgress(i);
      }
      const fake: ClientUpload = {
        id: Date.now().toString(),
        fileName: file.name,
        fileURL: '#',
        uploadedAt: new Date().toISOString(),
      };
      setUploads((p) => [fake, ...p]);
      setProgress(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      return;
    }

    try {
      const result = await onUpload(file, setProgress);
      setUploads((p) => [result, ...p]);
      setProgress(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setProgress(null);
      setError('Upload failed. Please try again.');
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handle(file);
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all select-none
          ${dragging
            ? 'border-gray-900 bg-gray-50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.zip,.docx"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handle(f);
            e.target.value = '';
          }}
        />
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <Upload size={16} className="text-gray-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">Drop your file here</p>
          <p className="text-xs text-gray-400 mt-0.5">or click to browse</p>
        </div>
        <p className="text-[11px] text-gray-300 mt-1">Images · PDF · ZIP · DOCX · Max 50 MB</p>
      </div>

      {/* Progress bar */}
      {progress !== null && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Uploading…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-900 rounded-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Success toast */}
      {success && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-lg">
          <CheckCircle size={14} />
          Upload successful
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between text-sm text-red-700 bg-red-50 px-4 py-2.5 rounded-lg">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* File list */}
      {uploads.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Uploaded Files
          </p>
          {uploads.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50">
              <FileTypeIcon name={u.fileName} />
              <span className="text-sm text-gray-700 truncate flex-1">{u.fileName}</span>
              <span className="text-xs text-gray-400 shrink-0">
                {new Date(u.uploadedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
