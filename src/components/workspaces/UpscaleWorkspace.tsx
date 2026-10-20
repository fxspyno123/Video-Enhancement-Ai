import React from 'react';
import { Maximize2, Cpu, Sparkles, AlertCircle, HardDrive } from 'lucide-react';
import { UpscaleSettings, VideoMetadata } from '../../types';
import { estimateExportFileSize } from '../../utils/formatters';

interface UpscaleWorkspaceProps {
  settings: UpscaleSettings;
  onChange: (patch: Partial<UpscaleSettings>) => void;
  currentVideo: VideoMetadata | null;
  onReset: () => void;
}

export const UpscaleWorkspace: React.FC<UpscaleWorkspaceProps> = ({
  settings,
  onChange,
  currentVideo,
  onReset,
}) => {
  const resolutionOptions = [
    { id: 'original', label: 'Original', dim: currentVideo ? `${currentVideo.width}x${currentVideo.height}` : 'Native' },
    { id: '480p', label: '480p SD', dim: '854 x 480' },
    { id: '540p', label: '540p qHD', dim: '960 x 540' },
    { id: '720p', label: '720p HD', dim: '1280 x 720' },
    { id: '1080p', label: '1080p FHD', dim: '1920 x 1080' },
    { id: '2k', label: '2K QHD', dim: '2560 x 1440' },
    { id: '4k', label: '4K UHD', dim: '3840 x 2160' },
    { id: 'custom', label: 'Custom', dim: 'Manual' },
  ];

  const models = [
    {
      id: 'realesrgan-x4plus',
      name: 'Real-ESRGAN x4plus (Neural)',
      desc: 'Topaz-grade deep convolutional network for realistic video & photo restoration.',
      tag: 'Neural 4x',
    },
    {
      id: 'realesr-animevideov3',
      name: 'Real-ESRGAN AnimeVideo-v3',
      desc: 'Specialized 2D animation weights trained on high-contrast Japanese line art.',
      tag: 'Anime AI',
    },
    {
      id: 'waifu2x',
      name: 'Waifu2x Super-Resolution',
      desc: 'Double-resolution CNN with 2D compression cleanup.',
      tag: 'Waifu2x',
    },
    {
      id: 'edsr',
      name: 'EDSR (Enhanced Deep Residual)',
      desc: 'High-depth residual blocks preserving high-frequency edges.',
      tag: 'Deep EDSR',
    },
    {
      id: 'lanczos-hq',
      name: 'Lanczos-8 High Precision Sinc',
      desc: 'Algorithmic 8-lobe sinc interpolation with subpixel anti-aliasing.',
      tag: 'High-Speed',
    },
  ];

  // Output dimensions preview
  let targetWidth = currentVideo?.width || 1920;
  let targetHeight = currentVideo?.height || 1080;
  if (settings.targetResolution === '4k') {
    targetWidth = 3840; targetHeight = 2160;
  } else if (settings.targetResolution === '2k') {
    targetWidth = 2560; targetHeight = 1440;
  } else if (settings.targetResolution === '1080p') {
    targetWidth = 1920; targetHeight = 1080;
  } else if (settings.targetResolution === '720p') {
    targetWidth = 1280; targetHeight = 720;
  } else if (settings.targetResolution === '540p') {
    targetWidth = 960; targetHeight = 540;
  } else if (settings.targetResolution === '480p') {
    targetWidth = 854; targetHeight = 480;
  } else if (settings.targetResolution === 'custom') {
    targetWidth = settings.customWidth || 1920;
    targetHeight = settings.customHeight || 1080;
  }

  const estimatedSize = estimateExportFileSize(currentVideo?.duration || 10, settings.targetResolution, 'auto');

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full text-xs">
      <div className="flex items-center justify-between border-b border-[#1c2638] pb-3">
        <div>
          <h3 className="font-bold text-zinc-100 flex items-center gap-1.5 text-sm">
            <Maximize2 className="w-4 h-4 text-violet-400" />
            <span>AI Super-Resolution Upscaling</span>
          </h3>
          <p className="text-[11px] text-zinc-400">
            Upscale low-resolution videos up to 4K UHD with neural edge synthesis.
          </p>
        </div>
        <button
          onClick={onReset}
          className="text-[11px] text-zinc-400 hover:text-cyan-400 font-medium transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Target Resolution Selection */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Target Output Resolution
        </label>
        <div className="grid grid-cols-2 gap-2">
          {resolutionOptions.map((res) => (
            <button
              key={res.id}
              onClick={() => onChange({ targetResolution: res.id as any })}
              className={`p-2 rounded-lg border text-left transition-all ${
                settings.targetResolution === res.id
                  ? 'bg-violet-950/60 border-violet-500/60 text-white shadow-sm shadow-violet-500/20'
                  : 'bg-[#121824] border-[#1e2a3c] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="font-bold text-[11px]">{res.label}</div>
              <div className="text-[10px] text-zinc-500 font-mono">{res.dim}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Dimension Inputs */}
      {settings.targetResolution === 'custom' && (
        <div className="p-3 bg-[#111724] border border-[#1e2a3c] rounded-xl space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Custom Dimensions</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-zinc-400">Width (px)</label>
              <input
                type="number"
                value={settings.customWidth || 1920}
                onChange={(e) => onChange({ customWidth: parseInt(e.target.value, 10) || 1920 })}
                className="w-full bg-[#0a0e15] border border-[#222f44] rounded p-1.5 text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400">Height (px)</label>
              <input
                type="number"
                value={settings.customHeight || 1080}
                onChange={(e) => onChange({ customHeight: parseInt(e.target.value, 10) || 1080 })}
                className="w-full bg-[#0a0e15] border border-[#222f44] rounded p-1.5 text-xs font-mono text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Output Dimension & Size Indicator Card */}
      <div className="bg-gradient-to-r from-violet-950/40 to-[#121927] border border-violet-500/30 rounded-xl p-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Output Canvas</div>
          <div className="text-sm font-extrabold text-white font-mono mt-0.5">
            {targetWidth} × {targetHeight}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-zinc-400 flex items-center gap-1 justify-end">
            <HardDrive className="w-3 h-3 text-cyan-400" />
            <span>Est. File Size</span>
          </div>
          <div className="text-xs font-bold text-cyan-300 font-mono mt-0.5">
            {estimatedSize}
          </div>
        </div>
      </div>

      {/* Scale Factor */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Scale Multiplier
        </label>
        <div className="grid grid-cols-3 gap-2">
          {['1x', '2x', '4x'].map((fac) => (
            <button
              key={fac}
              onClick={() => onChange({ scaleFactor: fac as any })}
              className={`py-1.5 rounded-lg border text-center font-bold text-xs font-mono transition-colors ${
                settings.scaleFactor === fac
                  ? 'bg-violet-600 text-white border-violet-400 shadow-md shadow-violet-500/20'
                  : 'bg-[#121824] border-[#1e2a3c] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {fac} Upscale
            </button>
          ))}
        </div>
      </div>

      {/* AI Super-Resolution Models */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Neural Model Engine
        </label>
        <div className="space-y-2">
          {models.map((m) => (
            <div
              key={m.id}
              onClick={() => onChange({ aiModel: m.id as any })}
              className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                settings.aiModel === m.id
                  ? 'bg-violet-950/60 border-violet-500/70 text-white shadow-sm shadow-violet-500/20'
                  : 'bg-[#111724] border-[#1e2a3c] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-zinc-100">{m.name}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-violet-900/60 text-violet-300 border border-violet-700/60">
                  {m.tag}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-tight">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Maintain Aspect Ratio Toggle */}
      <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#111724] border border-[#1e2a3c] cursor-pointer">
        <div>
          <div className="font-semibold text-zinc-200">Maintain Original Aspect Ratio</div>
          <div className="text-[10px] text-zinc-500">Prevent distortion and non-uniform stretching</div>
        </div>
        <input
          type="checkbox"
          checked={settings.maintainAspectRatio}
          onChange={(e) => onChange({ maintainAspectRatio: e.target.checked })}
          className="w-4 h-4 rounded text-violet-500 bg-zinc-900 border-zinc-700 cursor-pointer"
        />
      </label>
    </div>
  );
};
