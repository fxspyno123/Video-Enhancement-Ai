import React, { useState } from 'react';
import { Palette, Sun, Sliders, Droplet, Layers } from 'lucide-react';
import { ColorSettings } from '../../types';
import { Histogram } from '../Histogram';

interface ColorWorkspaceProps {
  settings: ColorSettings;
  onChange: (patch: Partial<ColorSettings>) => void;
  onReset: () => void;
}

export const ColorWorkspace: React.FC<ColorWorkspaceProps> = ({
  settings,
  onChange,
  onReset,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'basic' | 'rgb' | 'lut'>('basic');

  const lutPresets: { id: ColorSettings['lutPreset']; name: string; desc: string }[] = [
    { id: 'none', name: 'None / Rec.709', desc: 'Standard balance' },
    { id: 'natural', name: 'Natural True', desc: 'Accurate skin tones & foliage' },
    { id: 'cinematic', name: 'Cinematic Teal & Orange', desc: 'Blockbuster contrast & split tones' },
    { id: 'warm', name: 'Golden Hour Warm', desc: 'Rich amber and sunset warmth' },
    { id: 'cool', name: 'Nordic Cool', desc: 'Crisp glacial cyan shadows' },
    { id: 'film-look', name: 'Vintage 35mm Film', desc: 'Organic roll-off & gentle fade' },
    { id: 'dark-moody', name: 'Dark & Moody Drama', desc: 'Desaturated noir aesthetic' },
    { id: 'vibrant-anime', name: 'Vibrant Anime Pop', desc: 'Hyper-saturated color spectrum' },
    { id: 'social-media', name: 'Social Media Punch', desc: 'Bright, sharp and punchy' },
  ];

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full text-xs">
      <div className="flex items-center justify-between border-b border-[#1c2638] pb-3">
        <div>
          <h3 className="font-bold text-zinc-100 flex items-center gap-1.5 text-sm">
            <Palette className="w-4 h-4 text-amber-400" />
            <span>Master Color Grading</span>
          </h3>
          <p className="text-[11px] text-zinc-400">
            Full 32-bit float color transform pipeline & LUT emulation.
          </p>
        </div>
        <button
          onClick={onReset}
          className="text-[11px] text-zinc-400 hover:text-amber-400 font-medium transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Real-time RGB & Luminance Histogram */}
      <Histogram colorSettings={settings} />

      {/* Subtab Selector */}
      <div className="flex items-center gap-1 bg-[#101622] p-1 rounded-xl border border-[#1b2638]">
        {[
          { id: 'basic', label: 'Basic Wheels' },
          { id: 'rgb', label: 'RGB Balance' },
          { id: 'lut', label: 'LUT Presets' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveSubTab(t.id as any)}
            className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-colors ${
              activeSubTab === t.id
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Subtab 1: Basic Controls */}
      {activeSubTab === 'basic' && (
        <div className="space-y-3.5 bg-[#101622] p-3 rounded-xl border border-[#1b2638]">
          {/* Brightness */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-300">Brightness</span>
              <span className="font-mono text-amber-400">{settings.brightness}</span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={settings.brightness}
              onChange={(e) => onChange({ brightness: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>

          {/* Contrast */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-300">Contrast</span>
              <span className="font-mono text-amber-400">{settings.contrast}</span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={settings.contrast}
              onChange={(e) => onChange({ contrast: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>

          {/* Saturation */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-300">Saturation</span>
              <span className="font-mono text-amber-400">{settings.saturation}</span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={settings.saturation}
              onChange={(e) => onChange({ saturation: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>

          {/* Temperature */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-300">Color Temperature</span>
              <span className="font-mono text-amber-400">{settings.temperature}</span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={settings.temperature}
              onChange={(e) => onChange({ temperature: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>

          {/* Tint */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-300">Tint (Magenta / Green)</span>
              <span className="font-mono text-amber-400">{settings.tint}</span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={settings.tint}
              onChange={(e) => onChange({ tint: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>

          {/* Gamma */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-300">Gamma / Midtones</span>
              <span className="font-mono text-amber-400">{settings.gamma}</span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={settings.gamma}
              onChange={(e) => onChange({ gamma: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>

          {/* Vignette */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-300">Lens Vignette</span>
              <span className="font-mono text-amber-400">{settings.vignette}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.vignette}
              onChange={(e) => onChange({ vignette: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>

          {/* Hue Rotate */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-300">Hue Angle</span>
              <span className="font-mono text-amber-400">{settings.hue}°</span>
            </div>
            <input
              type="range"
              min={-180}
              max={180}
              value={settings.hue}
              onChange={(e) => onChange({ hue: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Subtab 2: RGB Balance */}
      {activeSubTab === 'rgb' && (
        <div className="space-y-3.5 bg-[#101622] p-3 rounded-xl border border-[#1b2638]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Per-Channel Primaries
          </div>

          {/* Red */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-red-400 font-semibold">Red Channel</span>
              <span className="font-mono text-red-400">{settings.rgbRed}</span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={settings.rgbRed}
              onChange={(e) => onChange({ rgbRed: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>

          {/* Green */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-emerald-400 font-semibold">Green Channel</span>
              <span className="font-mono text-emerald-400">{settings.rgbGreen}</span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={settings.rgbGreen}
              onChange={(e) => onChange({ rgbGreen: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>

          {/* Blue */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-sky-400 font-semibold">Blue Channel</span>
              <span className="font-mono text-sky-400">{settings.rgbBlue}</span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={settings.rgbBlue}
              onChange={(e) => onChange({ rgbBlue: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Subtab 3: LUT Presets */}
      {activeSubTab === 'lut' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-zinc-300">
              <span>LUT Intensity</span>
              <span className="font-mono text-amber-400">{settings.lutIntensity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.lutIntensity}
              onChange={(e) => onChange({ lutIntensity: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            {lutPresets.map((l) => (
              <div
                key={l.id}
                onClick={() => onChange({ lutPreset: l.id })}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                  settings.lutPreset === l.id
                    ? 'bg-amber-950/60 border-amber-500/70 text-white shadow-sm'
                    : 'bg-[#111724] border-[#1e2a3c] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="font-semibold text-zinc-200">{l.name}</div>
                <div className="text-[10px] text-zinc-500">{l.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
