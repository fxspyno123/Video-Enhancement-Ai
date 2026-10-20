import React, { useRef, useState } from 'react';
import {
  Upload,
  Film,
  Sparkles,
  RotateCcw,
  Sliders,
  ChevronDown,
  Play,
  CheckCircle2,
  FileVideo,
  Layers,
  Terminal,
} from 'lucide-react';
import { VideoMetadata } from '../types';
import { STUDIO_PRESETS, StudioPreset } from '../utils/presets';

interface TopToolbarProps {
  currentVideo: VideoMetadata | null;
  onUploadFile: (file: File) => void;
  onSelectSample: (sampleFilename: string) => void;
  onApplyPreset: (preset: StudioPreset) => void;
  onResetSettings: () => void;
  onTriggerExport: () => void;
  onOpenFfmpegLab?: () => void;
  samples: VideoMetadata[];
  isUploading: boolean;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  currentVideo,
  onUploadFile,
  onSelectSample,
  onApplyPreset,
  onResetSettings,
  onTriggerExport,
  onOpenFfmpegLab,
  samples,
  isUploading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [samplesOpen, setSamplesOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadFile(e.target.files[0]);
    }
  };

  return (
    <header className="h-14 bg-[#0d121c] border-b border-[#1c2638] flex items-center justify-between px-4 select-none shrink-0 z-20">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="video/mp4,video/quicktime,video/x-matroska,video/avi,video/webm"
        className="hidden"
      />

      {/* Left: Active File Info */}
      <div className="flex items-center gap-3 min-w-0">
        {currentVideo ? (
          <div className="flex items-center gap-2.5 bg-[#141b29] border border-[#233148] px-3 py-1.5 rounded-lg max-w-md">
            <div className="p-1 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
              <FileVideo className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white truncate max-w-[180px]">
                  {currentVideo.originalName}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-violet-950 text-violet-300 font-mono border border-violet-800/60 font-medium">
                  {currentVideo.resolutionLabel}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
                <span>{currentVideo.formattedDuration}</span>
                <span>•</span>
                <span>{currentVideo.fps} FPS</span>
                <span>•</span>
                <span>{currentVideo.formattedSize}</span>
                <span>•</span>
                <span className="uppercase">{currentVideo.codec}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-zinc-400 italic">
            <Film className="w-4 h-4 text-zinc-500" />
            <span>No video selected. Upload or pick a sample to start.</span>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5">
        {/* Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1a2333] hover:bg-[#222e42] text-zinc-200 border border-[#2b3a52] transition-colors shadow-sm disabled:opacity-50"
        >
          <Upload className="w-3.5 h-3.5 text-cyan-400" />
          <span>{isUploading ? 'Uploading...' : 'Upload Video'}</span>
        </button>

        {/* Sample Clips Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setSamplesOpen(!samplesOpen);
              setPresetsOpen(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#141b29] hover:bg-[#1a2333] text-zinc-300 border border-[#222e42] transition-colors"
          >
            <Film className="w-3.5 h-3.5 text-pink-400" />
            <span>Sample Clips</span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {samplesOpen && (
            <div className="absolute right-0 mt-1 w-64 bg-[#111723] border border-[#223046] rounded-xl shadow-2xl py-1.5 z-50">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-[#1c2638]">
                Quick Test Clips
              </div>
              {samples.length > 0 ? (
                samples.map((s) => (
                  <button
                    key={s.filename}
                    onClick={() => {
                      onSelectSample(s.filename);
                      setSamplesOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[#1a2436] text-zinc-200 transition-colors flex flex-col gap-0.5"
                  >
                    <div className="font-semibold text-zinc-200">{s.originalName.replace('.mp4', '').replace(/_/g, ' ')}</div>
                    <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5">
                      <span className="text-cyan-400">{s.resolutionLabel}</span>
                      <span>•</span>
                      <span>{s.fps} FPS</span>
                      <span>•</span>
                      <span>{s.formattedDuration}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-zinc-500">Loading samples...</div>
              )}
            </div>
          )}
        </div>

        {/* Studio Presets Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setPresetsOpen(!presetsOpen);
              setSamplesOpen(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#141b29] hover:bg-[#1a2333] text-zinc-300 border border-[#222e42] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Presets</span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {presetsOpen && (
            <div className="absolute right-0 mt-1 w-72 bg-[#111723] border border-[#223046] rounded-xl shadow-2xl py-1.5 z-50">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-[#1c2638]">
                Professional Presets
              </div>
              {STUDIO_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onApplyPreset(p);
                    setPresetsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-[#1a2436] text-zinc-200 transition-colors flex flex-col gap-0.5"
                >
                  <div className="font-semibold text-cyan-300">{p.name}</div>
                  <div className="text-[10px] text-zinc-400 leading-tight">{p.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* FFmpeg CLI Lab Button */}
        {onOpenFfmpegLab && (
          <button
            onClick={onOpenFfmpegLab}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#111a26] hover:bg-[#192636] text-emerald-400 border border-emerald-500/30 transition-colors shadow-sm"
            title="Inspect & test generated FFmpeg CLI command"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>FFmpeg CLI</span>
          </button>
        )}

        {/* Reset Settings */}
        <button
          onClick={onResetSettings}
          title="Reset all settings to default"
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-[#1a2333] border border-transparent hover:border-[#222e42] transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Export / Render Action Button */}
        <button
          onClick={onTriggerExport}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Render & Export</span>
        </button>
      </div>
    </header>
  );
};
