import React, { useState } from 'react';
import {
  Clock,
  Download,
  XCircle,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { ProcessingJob } from '../../types';

interface HistoryWorkspaceProps {
  jobs: ProcessingJob[];
  onCancelJob: (jobId: string) => void;
  onDeleteJob: (jobId: string) => void;
  onRefreshJobs: () => void;
  onPlayJobOutput?: (outputUrl: string, originalName: string) => void;
}

export const HistoryWorkspace: React.FC<HistoryWorkspaceProps> = ({
  jobs,
  onCancelJob,
  onDeleteJob,
  onRefreshJobs,
  onPlayJobOutput,
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Reliable blob download that works seamlessly in sandboxed iframes
  const handleDownload = async (job: ProcessingJob) => {
    if (!job.outputUrl || !job.outputFile) return;
    setDownloadingId(job.id);
    try {
      const response = await fetch(job.outputUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = job.outputFile;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      // Fallback: direct download route
      window.location.href = `/api/download/${job.outputFile}`;
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCopyLink = (job: ProcessingJob) => {
    if (!job.outputUrl) return;
    const fullUrl = `${window.location.origin}${job.outputUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(job.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full text-xs">
      <div className="flex items-center justify-between border-b border-[#1c2638] pb-3">
        <div>
          <h3 className="font-bold text-zinc-100 flex items-center gap-1.5 text-sm">
            <Clock className="w-4 h-4 text-orange-400" />
            <span>Processing Queue & History</span>
          </h3>
          <p className="text-[11px] text-zinc-400">
            Real-time FFmpeg progress, active rendering tasks, and completed master downloads.
          </p>
        </div>
        <button
          onClick={onRefreshJobs}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-[#121824] border border-[#1e2a3c] transition-colors"
          title="Refresh Queue"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 space-y-2">
          <Clock className="w-8 h-8 mx-auto opacity-40 text-orange-400" />
          <p className="font-semibold text-zinc-400">Queue is currently empty</p>
          <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
            Jobs will appear here as you render video enhancements, super-resolution upscales, or aspect ratio reframes.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const isProcessing = job.status === 'processing';
            const isCompleted = job.status === 'completed';
            const isFailed = job.status === 'failed';
            const isCancelled = job.status === 'cancelled';
            const isDownloadingThis = downloadingId === job.id;

            return (
              <div
                key={job.id}
                className={`bg-[#101622] border rounded-xl p-3.5 transition-all shadow-md space-y-2.5 ${
                  isProcessing
                    ? 'border-cyan-500/50 shadow-cyan-500/10'
                    : isCompleted
                    ? 'border-emerald-500/40 shadow-emerald-500/10'
                    : isFailed
                    ? 'border-red-500/40'
                    : 'border-[#1b2638]'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-200 truncate">{job.title}</span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                          isProcessing
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 animate-pulse'
                            : isCompleted
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : isCancelled
                            ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            : 'bg-red-950 text-red-300 border border-red-800'
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>

                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5 flex items-center gap-2">
                      <span>{job.sourceFile}</span>
                      <span>•</span>
                      <span>{new Date(job.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isProcessing && (
                      <button
                        onClick={() => onCancelJob(job.id)}
                        className="px-2 py-1 rounded text-[10px] font-semibold bg-red-950/60 text-red-400 border border-red-800/60 hover:bg-red-900/80 transition-colors flex items-center gap-1"
                      >
                        <XCircle className="w-3 h-3" />
                        <span>Cancel</span>
                      </button>
                    )}

                    {isCompleted && (
                      <button
                        onClick={() => handleDownload(job)}
                        disabled={isDownloadingThis}
                        className="px-2.5 py-1 rounded text-[10px] font-bold bg-cyan-600 hover:bg-cyan-500 text-black transition-colors flex items-center gap-1 shadow-sm active:scale-95"
                      >
                        {isDownloadingThis ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Download className="w-3 h-3" />
                        )}
                        <span>{isDownloadingThis ? 'Downloading...' : 'Download'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteJob(job.id)}
                      className="p-1 rounded text-zinc-500 hover:text-red-400 transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                {isProcessing && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                      <span className="flex items-center gap-1.5 text-cyan-300">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>{job.stage}</span>
                      </span>
                      <span>{job.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#090d14] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Completed Details with Direct Action Pills */}
                {isCompleted && job.outputFile && (
                  <div className="space-y-2 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-900/40">
                    <div className="text-[10px] font-mono text-emerald-400 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{job.outputFile}</span>
                      </div>
                      {job.formattedOutputSize && (
                        <span className="text-zinc-200 font-bold shrink-0">{job.formattedOutputSize}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      {onPlayJobOutput && job.outputUrl && (
                        <button
                          onClick={() => onPlayJobOutput(job.outputUrl!, job.outputFile!)}
                          className="px-2 py-1 rounded text-[10px] font-semibold bg-[#162234] hover:bg-[#20324c] text-cyan-300 border border-cyan-800/60 flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Preview in Studio</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleCopyLink(job)}
                        className="px-2 py-1 rounded text-[10px] font-semibold bg-[#162234] hover:bg-[#20324c] text-zinc-300 border border-[#23354e] flex items-center gap-1"
                      >
                        {copiedId === job.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === job.id ? 'Copied URL' : 'Copy Link'}</span>
                      </button>

                      <a
                        href={`/api/download/${job.outputFile}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 rounded text-[10px] font-semibold bg-[#162234] hover:bg-[#20324c] text-zinc-300 border border-[#23354e] flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Direct URL</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {isFailed && (
                  <div className="p-2 rounded-lg bg-red-950/30 border border-red-500/40 text-red-300 text-[10px] flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>{job.error || 'Failed processing video frames'}</span>
                  </div>
                )}

                {/* Applied Modules Badges */}
                {job.appliedModules && job.appliedModules.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {job.appliedModules.map((mod, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-[#162030] text-zinc-300 border border-[#253650]"
                      >
                        {mod}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
