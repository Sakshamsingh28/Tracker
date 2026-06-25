'use client';

import { useState, useRef } from 'react';
import { Upload, File, CheckCircle, X, Link as LinkIcon, Paperclip, Download } from 'lucide-react';
import type { ClientUpload } from '@/types';

type UploadFn = (
  file: File, 
  category: string, 
  onProgress: (pct: number) => void
) => Promise<ClientUpload>;

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/zip', 'application/x-zip-compressed',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const CATEGORIES = [
  'Logo & Branding',
  'Photos & Imagery',
  'Copywriting & Content',
  'Billing & Invoices',
  'Feedback & Mockups',
  'Other Assets',
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
  onUploadLink,
  existingUploads,
  isDemo,
}: {
  onUpload: UploadFn;
  onUploadLink: (fileName: string, fileURL: string, category: string) => Promise<ClientUpload>;
  existingUploads: ClientUpload[];
  isDemo: boolean;
}) {
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [progress, setProgress] = useState<number | null>(null);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [uploads,  setUploads]  = useState<ClientUpload[]>(existingUploads);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Link input states
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('File type not supported. Upload images, PDF, ZIP, or DOCX.');
      return;
    }
    // Direct file upload is now backed by Firebase Storage (2 MB limit)
    if (file.size > 2 * 1024 * 1024) {
      setError('Direct file upload is limited to 2 MB. For larger files, please paste a shareable link under the "Share Link" tab!');
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
        category,
      };
      setUploads((p) => [fake, ...p]);
      setProgress(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      return;
    }

    try {
      const result = await onUpload(file, category, setProgress);
      setUploads((p) => [result, ...p]);
      setProgress(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setProgress(null);
      setError(`Upload failed: ${err?.message || 'Please check file size and try again.'}`);
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkName.trim() || !linkUrl.trim()) return;

    setError(null);
    setSuccess(false);
    setLinkLoading(true);

    if (isDemo) {
      const fake: ClientUpload = {
        id: Date.now().toString(),
        fileName: linkName.trim(),
        fileURL: linkUrl.trim(),
        uploadedAt: new Date().toISOString(),
        category,
      };
      setUploads((p) => [fake, ...p]);
      setSuccess(true);
      setLinkName('');
      setLinkUrl('');
      setLinkLoading(false);
      setTimeout(() => setSuccess(false), 3000);
      return;
    }

    try {
      const result = await onUploadLink(linkName.trim(), linkUrl.trim(), category);
      setUploads((p) => [result, ...p]);
      setSuccess(true);
      setLinkName('');
      setLinkUrl('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save link. Please try again.');
    } finally {
      setLinkLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div className="space-y-4">
      {/* Category Dropdown Selector */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Select Asset Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200/60 bg-white/50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-transparent transition-all cursor-pointer font-medium backdrop-blur-sm"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex border-b border-gray-100 gap-4">
        <button
          type="button"
          onClick={() => { setUploadMode('file'); setError(null); }}
          className={`pb-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            uploadMode === 'file' ? 'border-gray-900 text-gray-900 font-bold' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Upload File (&lt;2MB)
        </button>
        <button
          type="button"
          onClick={() => { setUploadMode('link'); setError(null); }}
          className={`pb-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            uploadMode === 'link' ? 'border-gray-900 text-gray-900 font-bold' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Share Link (Any Size)
        </button>
      </div>

      {/* File Upload Mode */}
      {uploadMode === 'file' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all select-none backdrop-blur-sm
            ${dragging
              ? 'border-gray-900 bg-gray-900/[0.03]'
              : 'border-gray-200/60 hover:border-gray-300/80 hover:bg-white/40'
            }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.zip,.docx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileUpload(f);
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
          <p className="text-[11px] text-gray-300 mt-1">Images · PDF · DOCX (under 2 MB)</p>
        </div>
      )}

      {/* Link Share Mode */}
      {uploadMode === 'link' && (
        <form onSubmit={handleLinkSubmit} className="space-y-3 p-4 border border-gray-100 rounded-xl bg-white">
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              File Description / Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Acme Brand Guide, Raw Video Asset"
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200/60 rounded-lg text-xs bg-white/40 backdrop-blur-sm focus:outline-none focus:ring-1 focus:ring-gray-900/20"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Paste Shareable URL Link
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                required
                placeholder="e.g. https://drive.google.com/..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200/60 rounded-lg text-xs bg-white/40 backdrop-blur-sm focus:outline-none focus:ring-1 focus:ring-gray-900/20"
              />
              <button
                type="submit"
                disabled={linkLoading}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 disabled:opacity-40"
              >
                Add Link
              </button>
            </div>
            <p className="text-[10px] text-gray-300 mt-1">Share folders or assets using Google Drive, Dropbox, Figma, etc.</p>
          </div>
        </form>
      )}

      {/* Progress bar */}
      {progress !== null && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Optimizing and saving to "{category}"…</span>
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
          Asset shared successfully!
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between text-sm text-red-700 bg-red-50 px-4 py-2.5 rounded-lg">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* File list grouped by category */}
      {uploads.length > 0 && (
        <div className="space-y-4 pt-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
            Uploaded Client Assets
          </p>
          
          <div className="space-y-3">
            {CATEGORIES.map((cat) => {
              const catUploads = uploads.filter(
                (u) => u.category === cat || (!u.category && cat === 'Other Assets')
              );
              if (catUploads.length === 0) return null;

              return (
                <div key={cat} className="space-y-1.5">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
                    {cat}
                  </h4>
                  <div className="space-y-1">
                    {catUploads.map((u) => {
                      const isLink = u.fileURL && (u.fileURL.startsWith('http') || u.fileURL.startsWith('#'));
                      const isData = u.fileURL && u.fileURL.startsWith('data:');
                      
                      return (
                        <div key={u.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-white/40 bg-white/40 backdrop-blur-sm text-xs shadow-[0_2px_12px_0_rgba(0,0,0,0.01)]">
                          <div className="flex items-center gap-2.5 truncate">
                            {isLink ? (
                              <Paperclip size={13} className="text-gray-400 shrink-0" />
                            ) : (
                              <FileTypeIcon name={u.fileName} />
                            )}
                            <span className="text-sm font-medium text-gray-700 truncate">{u.fileName}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 shrink-0">
                              {new Date(u.uploadedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            {u.fileURL && u.fileURL !== '#' && (
                              isData ? (
                                <a 
                                  href={u.fileURL} 
                                  download={u.fileName}
                                  className="p-1 text-gray-400 hover:text-gray-800 border border-gray-100 rounded bg-gray-50/50 hover:bg-gray-50 flex items-center justify-center"
                                  title="Download File"
                                >
                                  <Download size={12} />
                                </a>
                              ) : (
                                <a 
                                  href={u.fileURL} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="p-1 text-gray-400 hover:text-gray-800 border border-gray-100 rounded bg-gray-50/50 hover:bg-gray-50 flex items-center justify-center"
                                  title="Open Link"
                                >
                                  {isLink ? <LinkIcon size={12} /> : <Upload size={12} />}
                                </a>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Handle legacy or unmapped categories */}
            {(() => {
              const legacyUploads = uploads.filter(
                (u) => u.category && !CATEGORIES.includes(u.category)
              );
              if (legacyUploads.length === 0) return null;

              return (
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
                    Misc Uploads
                  </h4>
                  <div className="space-y-1">
                    {legacyUploads.map((u) => (
                      <div key={u.id} className="flex items-center justify-between px-3 py-2 rounded-xl border border-gray-100 bg-white text-xs">
                        <div className="flex items-center gap-2.5 truncate">
                          <FileTypeIcon name={u.fileName} />
                          <span className="text-sm font-medium text-gray-700 truncate">{u.fileName}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {new Date(u.uploadedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
