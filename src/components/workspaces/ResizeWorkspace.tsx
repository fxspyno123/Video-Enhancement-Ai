import React from 'react';
import { Crop, Sparkles, Layers, Sliders, CheckCircle2 } from 'lucide-react';
import { ResizeSettings, VideoMetadata } from '../../types';

interface ResizeWorkspaceProps {
  settings: ResizeSettings;
  onChange: (patch: Partial<ResizeSettings>) => void;
  currentVideo: VideoMetadata | null;
  onReset: () => void;
}

export const ResizeWorkspace: React.FC<ResizeWorkspaceProps> = ({
  settings,
  onChange,
  currentVideo,
  onReset,
}) => {
  const aspectRatios = [
    { id: 'original', label: 'Original', ratio: currentVideo ? `${currentVideo.width}:${currentVideo.height}` : 'Native', desc: 'No reframing' },
    { id: '9:16', label: '9:16 Vertical', ratio: '1080 x 1920', desc: 'Reels / Shorts / TikTok' },
    { id: '1:1', label: '1:1 Square', ratio: '1080 x 1080', desc: 'Instagram Feed & Square Ads' },
    { id: '16:9', label: '16:9 Landscape', ratio: '1920 x 1080', desc: 'YouTube & TV Standard' },
    { id: '4:5', label: '4:5 Portrait', ratio: '1080 x 1350', desc: 'Social Portrait Post' },
    { id: 'custom', label: 'Custom Canvas', ratio: 'Custom', desc: 'Manual width & height' },
  ];

  const modes = [
    {
      id: 'blur-background',
      title: 'Blur Background (Recommended)',
      desc: 'Enlarged blurred motion background behind the 100% visible, centered original video.',
      badge: 'Popular',
    },
    {
      id: 'fit-preserve',
      title: 'Fit & Preserve',
      desc: '100% of frame visible. Never crops, stretches, or distorts. Pads remaining canvas.',
      badge: 'Zero-Loss',
    },
    {
      id: 'solid-background',
      title: 'Solid Color Background',
      desc: 'Fill pillarbox/letterbox areas with black, white, or brand color.',
      badge: 'Minimal',
    },
    {
      id: 'ai-background-extension',
      title: 'AI Background Extension',
      desc: 'Generative edge extension synthesizing realistic continuation of scene surroundings.',
      badge: 'Generative AI',
    },
    {
      id: 'smart-reframe',
      title: 'Smart Reframe (Dynamic Crop)',
      desc: 'Tracks and centers the focal subject. Crops edges only when selected.',
      badge: 'Crop & Fill',
    },
  ];

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full text-xs">
      <div className="flex items-center justify-between border-b border-[#1c2638] pb-3">
        <div>
          <h3 className="font-bold text-zinc-100 flex items-center gap-1.5 text-sm">
            <Crop className="w-4 h-4 text-sky-400" />
            <span>Smart Aspect Ratio Reframer</span>
          </h3>
          <p className="text-[11px] text-zinc-400">
            Convert aspect ratios (e.g. 1:1 or 16:9 to 9:16) without losing any content.
          </p>
        </div>
        <button
          onClick={onReset}
          className="text-[11px] text-zinc-400 hover:text-sky-400 font-medium transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Target Aspect Ratio */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
          Target Aspect Ratio
        </label>
        <div className="grid grid-cols-2 gap-2">
          {aspectRatios.map((ar) => (
            <button
              key={ar.id}
              onClick={() => onChange({ aspectRatio: ar.id as any })}
              className={`p-2 rounded-xl border text-left transition-all ${
                settings.aspectRatio === ar.id
                  ? 'bg-sky-950/60 border-sky-500/60 text-white shadow-sm shadow-sky-500/20'
                  : 'bg-[#121824] border-[#1e2a3c] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="font-bold text-[11px]">{ar.label}</div>
              <div className="text-[10px] text-zinc-500 font-mono">{ar.ratio}</div>
              <div className="text-[9px] text-zinc-500 mt-0.5">{ar.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Resize Modes */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Composition & Canvas Mode
        </label>
        <div className="space-y-2">
          {modes.map((m) => {
            const isSelected = settings.mode === m.id;
            return (
              <div
                key={m.id}
                onClick={() => onChange({ mode: m.id as any })}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-sky-950/60 border-sky-500/70 text-white shadow-sm shadow-sky-500/20'
                    : 'bg-[#111724] border-[#1e2a3c] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-zinc-100">{m.title}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-sky-900/60 text-sky-300 border border-sky-700/60">
                    {m.badge}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-tight">{m.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Blur Background Controls */}
      {settings.mode === 'blur-background' && (
        <div className="space-y-3.5 bg-[#101622] p-3 rounded-xl border border-[#1b2638]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
            Background Blur Tuning
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-300">Blur Radius</span>
              <span className="font-mono text-sky-400">{settings.blurRadius}px</span>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              value={settings.blurRadius}
              onChange={(e) => onChange({ blurRadius: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-300">Background Saturation</span>
              <span className="font-mono text-sky-400">{settings.blurSaturation}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={200}
              value={settings.blurSaturation}
              onChange={(e) => onChange({ blurSaturation: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Solid Background Controls */}
      {settings.mode === 'solid-background' && (
        <div className="space-y-2 bg-[#101622] p-3 rounded-xl border border-[#1b2638]">
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Solid Fill Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={settings.solidColor || '#000000'}
              onChange={(e) => onChange({ solidColor: e.target.value })}
              className="w-10 h-8 rounded bg-transparent cursor-pointer border border-[#222f44]"
            />
            <span className="font-mono text-xs text-zinc-300">{settings.solidColor || '#000000'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
