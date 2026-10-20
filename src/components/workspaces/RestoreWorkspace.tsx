import React from 'react';
import { RotateCcw, Shield, Activity, RefreshCw } from 'lucide-react';
import { RestoreSettings } from '../../types';

interface RestoreWorkspaceProps {
  settings: RestoreSettings;
  onChange: (patch: Partial<RestoreSettings>) => void;
  onReset: () => void;
}

export const RestoreWorkspace: React.FC<RestoreWorkspaceProps> = ({
  settings,
  onChange,
  onReset,
}) => {
  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full text-xs">
      <div className="flex items-center justify-between border-b border-[#1c2638] pb-3">
        <div>
          <h3 className="font-bold text-zinc-100 flex items-center gap-1.5 text-sm">
            <RotateCcw className="w-4 h-4 text-emerald-400" />
            <span>Archive Video Restoration</span>
          </h3>
          <p className="text-[11px] text-zinc-400">
            Fix interlacing, camera shake, strobe flickers, and vintage color fading.
          </p>
        </div>
        <button
          onClick={onReset}
          className="text-[11px] text-zinc-400 hover:text-emerald-400 font-medium transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Restoration Sliders */}
      <div className="space-y-3.5 bg-[#101622] p-3 rounded-xl border border-[#1b2638]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
          Analog & Digital Correction Strength
        </div>

        {/* Denoise Strength */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-zinc-300">Denoise & Grain Scrubber</span>
            <span className="font-mono text-emerald-400">{settings.denoiseStrength}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.denoiseStrength}
            onChange={(e) => onChange({ denoiseStrength: parseInt(e.target.value, 10) })}
            className="w-full"
          />
        </div>

        {/* Sharpening */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-zinc-300">Unsharp Reconstruction</span>
            <span className="font-mono text-emerald-400">{settings.sharpening}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.sharpening}
            onChange={(e) => onChange({ sharpening: parseInt(e.target.value, 10) })}
            className="w-full"
          />
        </div>

        {/* Grain Preservation */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-zinc-300">Film Grain Preservation</span>
            <span className="font-mono text-emerald-400">{settings.grainPreservation}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.grainPreservation}
            onChange={(e) => onChange({ grainPreservation: parseInt(e.target.value, 10) })}
            className="w-full"
          />
        </div>
      </div>

      {/* Hardware Restoration Modules */}
      <div className="space-y-2 bg-[#101622] p-3 rounded-xl border border-[#1b2638]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
          Specialized Restoration Filters
        </div>

        {[
          { key: 'deflicker', label: 'Deflicker (Luminance Stabilizer)', desc: 'Eliminates time-lapse & archival exposure strobing' },
          { key: 'deinterlace', label: 'Deinterlace (YADIF Engine)', desc: 'Converts interlaced scan lines into clean progressive frames' },
          { key: 'stabilization', label: 'Camera Deshake & Stabilization', desc: 'Translational & rotational jitter motion dampening' },
          { key: 'colorFadingCorrection', label: 'Color Fading Recovery', desc: 'Restores lost dynamic range and chromatic vibrancy' },
          { key: 'compressionArtifactRemoval', label: 'Compression Cleanup', desc: 'Removes mosquito noise and ringing artifacts' },
          { key: 'deblocking', label: 'Macroblock Deblocking', desc: 'Smooths tile seams in low-bitrate MPEG/H.264 streams' },
          { key: 'deband', label: 'Debanding', desc: 'Eliminates false contour banding across sky and walls' },
          { key: 'motionBlurReduction', label: 'Motion Blur Sharpening', desc: 'Enhances moving edge definition' },
        ].map((item) => {
          const isChecked = (settings as any)[item.key];
          return (
            <label
              key={item.key}
              className="flex items-center justify-between p-2.5 rounded-lg bg-[#0c1018] hover:bg-[#151c2a] cursor-pointer border border-[#182232] transition-colors"
            >
              <div>
                <div className="font-semibold text-zinc-200">{item.label}</div>
                <div className="text-[10px] text-zinc-500 leading-tight">{item.desc}</div>
              </div>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => onChange({ [item.key]: e.target.checked } as any)}
                className="w-4 h-4 rounded text-emerald-500 bg-zinc-900 border-zinc-700 cursor-pointer"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
};
