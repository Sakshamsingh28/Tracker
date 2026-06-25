'use client';

import { useState, useRef } from 'react';
import { Upload, File, CheckCircle, X, Link as LinkIcon, Paperclip } from 'lucide-react';
import type { AgencyFile } from '@/types';

type UploadFn = (
  file: File, 
  onProgress: (pct: number) => void
) => Promise<AgencyFile>;

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/zip', 'application/x-zip-compressed',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

interface AgencyFileUploaderProps {
  onUpload: UploadFn;
  onUploadLink: (fileName: string, fileURL: string) => Promise<AgencyFile>;
}

export default function AgencyFileUploader({ onUpload, onUploadLink }: AgencyFileUploaderProps) {
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');
  const [progress, setProgress] = useState<number | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

    try {
      await onUpload(file, setProgress);
      setProgress(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setProgress(null);
      setError('Upload failed. Please check file size and try again.');
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkName.trim() || !linkUrl.trim()) return;

    setError(null);
    setSuccess(false);
    setLinkLoading(true);

    try {
      await onUploadLink(linkName.trim(), linkUrl.trim());
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
              placeholder="e.g. Brand Guidelines, Design Asset"
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
            <span>Optimizing and saving file…</span>
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
          File shared successfully!
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
    </div>
  );
}
