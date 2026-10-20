import React from 'react';
import { Download, Sparkles, HardDrive, FileVideo, Cpu, Play } from 'lucide-react';
import { ExportSettings, VideoMetadata, ProcessingJob } from '../../types';
import { estimateExportFileSize } from '../../utils/formatters';

interface ExportWorkspaceProps {
  settings: ExportSettings;
  onChange: (patch: Partial<ExportSettings>) => void;
  currentVideo: VideoMetadata | null;
  onStartExport: () => void;
  isProcessing: boolean;
  activeJob?: ProcessingJob | null;
}

export const ExportWorkspace: React.FC<ExportWorkspaceProps> = ({
  settings,
  onChange,
  currentVideo,
  onStartExport,
  isProcessing,
  activeJob,
}) => {
  const estimatedSize = estimateExportFileSize(
    currentVideo?.duration || 10,
    settings.resolution,
    settings.bitrateMode === 'custom' ? settings.bitrateMbps : 'auto'
  );

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full text-xs">
      <div className="border-b border-[#1c2638] pb-3">
        <h3 className="font-bold text-zinc-100 flex items-center gap-1.5 text-sm">
          <Download className="w-4 h-4 text-blue-400" />
          <span>Export & Master Encoder Settings</span>
        </h3>
        <p className="text-[11px] text-zinc-400">
          Configure video containers, hardware codecs, bitrates, and audio re-encoding.
        </p>
      </div>

      {/* Live Active Job Card */}
      {activeJob && (
        <div
          className={`p-3.5 rounded-xl border space-y-2.5 shadow-lg transition-all ${
            activeJob.status === 'processing'
              ? 'bg-cyan-950/40 border-cyan-500/50'
              : activeJob.status === 'completed'
              ? 'bg-emerald-950/40 border-emerald-500/50'
              : activeJob.status === 'failed'
              ? 'bg-red-950/40 border-red-500/50'
              : 'bg-zinc-900 border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-200 text-xs flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  activeJob.status === 'processing'
                    ? 'bg-cyan-400 animate-ping'
                    : activeJob.status === 'completed'
                    ? 'bg-emerald-400'
                    : 'bg-red-400'
                }`}
              />
              <span>
                {activeJob.status === 'processing'
                  ? 'Active FFmpeg Encoding'
                  : activeJob.status === 'completed'
                  ? 'Master File Ready'
                  : 'Encoding Failed'}
              </span>
            </span>
            <span className="font-mono text-[10px] text-cyan-300 font-bold">{activeJob.progress}%</span>
          </div>

          <div className="w-full h-1.5 bg-[#090d14] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                activeJob.status === 'failed'
                  ? 'bg-red-500'
                  : 'bg-gradient-to-r from-cyan-500 to-violet-500'
              }`}
              style={{ width: `${Math.max(5, activeJob.progress)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
            <span>{activeJob.stage}</span>
            {activeJob.status === 'completed' && activeJob.outputUrl && (
              <a
                href={`/api/download/${activeJob.outputFile}`}
                download={activeJob.outputFile}
                className="px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center gap-1 shadow-md transition-colors"
              >
                <Download className="w-3 h-3" />
                <span>Save File</span>
              </a>
            )}
          </div>
          {activeJob.error && (
            <div className="text-[10px] text-red-300 font-mono bg-red-950/60 p-2 rounded border border-red-800/40">
              {activeJob.error}
            </div>
          )}
        </div>
      )}

      {/* Output File Size Estimator Card */}
      <div className="bg-gradient-to-r from-blue-950/40 via-[#131d2e] to-[#121927] border border-blue-500/30 rounded-xl p-3.5 flex items-center justify-between shadow-lg">
        <div>
          <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Estimated File Size</span>
          </div>
          <div className="text-base font-black text-white font-mono mt-0.5">
            {estimatedSize}
          </div>
          <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
            Duration: {currentVideo?.formattedDuration || '00:10'} • {settings.codec.toUpperCase()}
          </div>
        </div>

        <button
          onClick={onStartExport}
          disabled={!currentVideo || isProcessing}
          className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-40"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isProcessing ? 'Encoding...' : 'Start Render'}</span>
        </button>
      </div>

      {/* Target Resolution */}
      <div className="space-y-1.5 bg-[#101622] p-3 rounded-xl border border-[#1b2638]">
        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Export Resolution
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {['original', '720p', '1080p', '2k', '4k'].map((r) => (
            <button
              key={r}
              onClick={() => onChange({ resolution: r as any })}
              className={`py-1.5 rounded-lg border font-mono font-bold text-xs transition-colors ${
                settings.resolution === r
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/20'
                  : 'bg-[#121824] border-[#1e2a3c] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Codec & Format */}
      <div className="space-y-3 bg-[#101622] p-3 rounded-xl border border-[#1b2638]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Codec & Container Format
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'h264', label: 'H.264 (AVC)', tag: 'Universal Compatibility' },
            { id: 'hevc', label: 'H.265 (HEVC)', tag: '50% Higher Efficiency' },
            { id: 'vp9', label: 'VP9 / WebM', tag: 'Web Optimized' },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => onChange({ codec: c.id as any })}
              className={`p-2 rounded-xl border text-left transition-colors ${
                settings.codec === c.id
                  ? 'bg-blue-950/60 border-blue-500/60 text-white'
                  : 'bg-[#121824] border-[#1e2a3c] text-zinc-400'
              }`}
            >
              <div className="font-bold text-[11px]">{c.label}</div>
              <div className="text-[9px] text-zinc-500">{c.tag}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <label className="text-[10px] text-zinc-400">Container</label>
            <select
              value={settings.format}
              onChange={(e) => onChange({ format: e.target.value as any })}
              className="w-full bg-[#0c1018] border border-[#222f44] rounded p-1.5 font-mono text-xs text-white"
            >
              <option value="mp4">MP4 (.mp4)</option>
              <option value="webm">WebM (.webm)</option>
              <option value="mkv">Matroska (.mkv)</option>
              <option value="mov">QuickTime (.mov)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-zinc-400">Bitrate Control</label>
            <select
              value={settings.bitrateMode}
              onChange={(e) => onChange({ bitrateMode: e.target.value as any })}
              className="w-full bg-[#0c1018] border border-[#222f44] rounded p-1.5 font-mono text-xs text-white"
            >
              <option value="auto">Auto Adaptive (CRF 19)</option>
              <option value="custom">Custom Bitrate (Mbps)</option>
            </select>
          </div>
        </div>

        {settings.bitrateMode === 'custom' && (
          <div className="space-y-1 pt-1">
            <div className="flex justify-between">
              <span className="text-zinc-300">Target Bitrate (Mbps)</span>
              <span className="font-mono text-blue-400">{settings.bitrateMbps} Mbps</span>
            </div>
            <input
              type="range"
              min={2}
              max={60}
              step={1}
              value={settings.bitrateMbps}
              onChange={(e) => onChange({ bitrateMbps: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* Audio Export Configuration */}
      <div className="space-y-3 bg-[#101622] p-3 rounded-xl border border-[#1b2638]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Audio Passthrough & Compression
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'passthrough', label: 'Copy Original' },
            { id: 'reencode', label: 'Re-encode AAC' },
            { id: 'mute', label: 'Mute / Strip' },
          ].map((a) => (
            <button
              key={a.id}
              onClick={() => onChange({ audioMode: a.id as any })}
              className={`py-1.5 rounded-lg border font-semibold text-xs transition-colors ${
                settings.audioMode === a.id
                  ? 'bg-blue-950/60 border-blue-500/60 text-white'
                  : 'bg-[#121824] border-[#1e2a3c] text-zinc-400'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
