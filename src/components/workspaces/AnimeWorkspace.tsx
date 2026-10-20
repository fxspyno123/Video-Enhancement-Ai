import React from 'react';
import { Film, Sparkles, Check, Zap } from 'lucide-react';
import { AnimeSettings } from '../../types';

interface AnimeWorkspaceProps {
  settings: AnimeSettings;
  onChange: (patch: Partial<AnimeSettings>) => void;
  onReset: () => void;
}

export const AnimeWorkspace: React.FC<AnimeWorkspaceProps> = ({
  settings,
  onChange,
  onReset,
}) => {
  const animePresets: { id: AnimeSettings['preset']; label: string; desc: string }[] = [
    { id: 'anime-clean', label: 'Anime Clean', desc: 'Debanding and digital ink cleanup' },
    { id: 'anime-1080p', label: 'Anime 1080p', desc: 'Standard HD redraw & line sharpening' },
    { id: 'anime-2k', label: 'Anime 2K', desc: 'High-contrast line-art reconstruction' },
    { id: 'anime-4k', label: 'Anime 4K', desc: 'Ultra-crisp 4K cell animation upscale' },
    { id: 'old-anime-restore', label: 'Old Anime Restoration', desc: 'Fix 80s/90s cel-shading film dust & grain' },
    { id: 'anime-color-boost', label: 'Anime Color Boost', desc: 'Vibrant chromatic pop and saturation' },
    { id: 'anime-60fps', label: 'Anime 60 FPS', desc: 'Fluid 60 FPS frame interpolation' },
    { id: 'anime-120fps', label: 'Anime 120 FPS', desc: 'High-refresh rate display remaster' },
  ];

  const handleApplyPreset = (pId: AnimeSettings['preset']) => {
    let patch: Partial<AnimeSettings> = { preset: pId };
    if (pId === 'anime-clean') {
      patch = { ...patch, lineArtPreservation: 85, flatColorPreservation: 95, colorBandingReduction: 90, denoising: 60 };
    } else if (pId === 'anime-4k') {
      patch = { ...patch, lineArtPreservation: 95, edgeRefinement: 90, fineLineEnhancement: 95 };
    } else if (pId === 'old-anime-restore') {
      patch = { ...patch, denoising: 75, compressionCleanup: 85, colorBandingReduction: 80 };
    } else if (pId === 'anime-color-boost') {
      patch = { ...patch, flatColorPreservation: 90, edgeRefinement: 75 };
    } else if (pId === 'anime-60fps' || pId === 'anime-120fps') {
      patch = { ...patch, frameInterpolation: true };
    }
    onChange(patch);
  };

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full text-xs">
      <div className="flex items-center justify-between border-b border-[#1c2638] pb-3">
        <div>
          <h3 className="font-bold text-zinc-100 flex items-center gap-1.5 text-sm">
            <Film className="w-4 h-4 text-pink-400" />
            <span>Dedicated Anime Neural Enhancer</span>
          </h3>
          <p className="text-[11px] text-zinc-400">
            Specialized 2D animation line-art preservation & flat-color debanding.
          </p>
        </div>
        <button
          onClick={onReset}
          className="text-[11px] text-zinc-400 hover:text-pink-400 font-medium transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Anime Presets Grid */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-pink-400">
          Anime Engine Presets
        </label>
        <div className="grid grid-cols-2 gap-2">
          {animePresets.map((p) => {
            const isSelected = settings.preset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleApplyPreset(p.id)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-pink-950/60 border-pink-500/60 text-white shadow-sm shadow-pink-500/20'
                    : 'bg-[#121824] border-[#1e2a3c] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="font-bold text-[11px] text-pink-200">{p.label}</div>
                <div className="text-[10px] text-zinc-500 leading-tight mt-0.5">{p.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-3.5 bg-[#101622] p-3 rounded-xl border border-[#1b2638]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          2D Vector & Line Reconstruction Controls
        </div>

        {/* Line-Art Preservation */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-zinc-300">Line-Art Preservation</span>
            <span className="font-mono text-pink-400">{settings.lineArtPreservation}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.lineArtPreservation}
            onChange={(e) => onChange({ lineArtPreservation: parseInt(e.target.value, 10), preset: 'custom' })}
            className="w-full"
          />
        </div>

        {/* Flat Color Preservation */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-zinc-300">Flat-Color & Cell Shading Guard</span>
            <span className="font-mono text-pink-400">{settings.flatColorPreservation}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.flatColorPreservation}
            onChange={(e) => onChange({ flatColorPreservation: parseInt(e.target.value, 10), preset: 'custom' })}
            className="w-full"
          />
        </div>

        {/* Edge Refinement */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-zinc-300">Edge Refinement & Anti-Aliasing</span>
            <span className="font-mono text-pink-400">{settings.edgeRefinement}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.edgeRefinement}
            onChange={(e) => onChange({ edgeRefinement: parseInt(e.target.value, 10), preset: 'custom' })}
            className="w-full"
          />
        </div>

        {/* Color Banding Reduction */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-zinc-300">Color Banding Reduction</span>
            <span className="font-mono text-pink-400">{settings.colorBandingReduction}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.colorBandingReduction}
            onChange={(e) => onChange({ colorBandingReduction: parseInt(e.target.value, 10), preset: 'custom' })}
            className="w-full"
          />
        </div>

        {/* Fine Line Enhancement */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-zinc-300">Fine-Line Micro Enhancement</span>
            <span className="font-mono text-pink-400">{settings.fineLineEnhancement}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.fineLineEnhancement}
            onChange={(e) => onChange({ fineLineEnhancement: parseInt(e.target.value, 10), preset: 'custom' })}
            className="w-full"
          />
        </div>
      </div>

      {/* Frame Interpolation Toggle */}
      <label className="flex items-center justify-between p-3 rounded-xl bg-[#111724] border border-[#1e2a3c] cursor-pointer">
        <div>
          <div className="font-semibold text-zinc-200">Fluid Animation Interpolation</div>
          <div className="text-[10px] text-zinc-500">Synthesize intermediate 2D frames for 60/120 FPS playback</div>
        </div>
        <input
          type="checkbox"
          checked={settings.frameInterpolation}
          onChange={(e) => onChange({ frameInterpolation: e.target.checked })}
          className="w-4 h-4 rounded text-pink-500 bg-zinc-900 border-zinc-700 cursor-pointer"
        />
      </label>
    </div>
  );
};
