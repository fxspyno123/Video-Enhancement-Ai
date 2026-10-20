import React from 'react';
import { Sparkles, Sliders, ShieldCheck, Zap, Info } from 'lucide-react';
import { EnhanceSettings } from '../../types';

interface EnhanceWorkspaceProps {
  settings: EnhanceSettings;
  onChange: (patch: Partial<EnhanceSettings>) => void;
  onReset: () => void;
}

export const EnhanceWorkspace: React.FC<EnhanceWorkspaceProps> = ({
  settings,
  onChange,
  onReset,
}) => {
  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full text-xs">
      <div className="flex items-center justify-between border-b border-[#1c2638] pb-3">
        <div>
          <h3 className="font-bold text-zinc-100 flex items-center gap-1.5 text-sm">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>AI Video Enhancement</span>
          </h3>
          <p className="text-[11px] text-zinc-400">
            Recover fine details, eliminate compression blocks and noise.
          </p>
        </div>
        <button
          onClick={onReset}
          className="text-[11px] text-zinc-400 hover:text-cyan-400 font-medium transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Processing Modes */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Processing Mode
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'fast', label: 'Fast', desc: 'Hardware filters' },
            { id: 'hq', label: 'High Quality', desc: 'Multi-pass Lanczos' },
            { id: 'ai', label: 'AI Enhance', desc: 'Deep neural model' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => onChange({ mode: m.id as any })}
              className={`p-2 rounded-lg border text-left transition-all ${
                settings.mode === m.id
                  ? 'bg-cyan-950/60 border-cyan-500/60 text-white shadow-sm shadow-cyan-500/20'
                  : 'bg-[#121824] border-[#1e2a3c] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="font-bold text-[11px]">{m.label}</div>
              <div className="text-[9px] text-zinc-500">{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Sliders Group 1: Core Neural Strength */}
      <div className="space-y-3.5 bg-[#101622] p-3 rounded-xl border border-[#1b2638]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
          Core Restoration Sliders
        </div>

        {/* Enhancement Strength */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-zinc-300">Enhancement Strength</span>
            <span className="font-mono text-cyan-400">{settings.enhancementStrength}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.enhancementStrength}
            onChange={(e) => onChange({ enhancementStrength: parseInt(e.target.value, 10) })}
            className="w-full"
          />
        </div>

        {/* Noise Reduction */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-zinc-300">Noise Reduction (Denoising)</span>
            <span className="font-mono text-cyan-400">{settings.noiseReduction}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.noiseReduction}
            onChange={(e) => onChange({ noiseReduction: parseInt(e.target.value, 10) })}
            className="w-full"
          />
        </div>

        {/* Sharpening */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-zinc-300">Sharpening</span>
            <span className="font-mono text-cyan-400">{settings.sharpening}%</span>
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

        {/* Detail Recovery */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-zinc-300">Detail Recovery</span>
            <span className="font-mono text-cyan-400">{settings.detailRecovery}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.detailRecovery}
            onChange={(e) => onChange({ detailRecovery: parseInt(e.target.value, 10) })}
            className="w-full"
          />
        </div>

        {/* Texture Preservation */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-zinc-300">Texture Preservation</span>
            <span className="font-mono text-cyan-400">{settings.texturePreservation}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.texturePreservation}
            onChange={(e) => onChange({ texturePreservation: parseInt(e.target.value, 10) })}
            className="w-full"
          />
        </div>
      </div>

      {/* Sliders Group 2: Edge & Grain */}
      <div className="space-y-3.5 bg-[#101622] p-3 rounded-xl border border-[#1b2638]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
          Edge & Grain Fine Tuning
        </div>

        {/* Edge Enhancement */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-zinc-300">Edge Enhancement</span>
            <span className="font-mono text-violet-400">{settings.edgeEnhancement}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.edgeEnhancement}
            onChange={(e) => onChange({ edgeEnhancement: parseInt(e.target.value, 10) })}
            className="w-full violet-thumb"
          />
        </div>

        {/* Grain Preservation */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-zinc-300">Grain Preservation</span>
            <span className="font-mono text-violet-400">{settings.grainPreservation}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.grainPreservation}
            onChange={(e) => onChange({ grainPreservation: parseInt(e.target.value, 10) })}
            className="w-full violet-thumb"
          />
        </div>
      </div>

      {/* Artifact Cleanup Toggles */}
      <div className="space-y-2 bg-[#101622] p-3 rounded-xl border border-[#1b2638]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
          Advanced Artifact Removal
        </div>

        {[
          { key: 'deblocking', label: 'Deblocking', desc: 'Remove MPEG macroblock boundaries' },
          { key: 'debanding', label: 'Debanding', desc: 'Smooth 8-bit color stepping & gradients' },
          { key: 'deblur', label: 'Deblur', desc: 'Correct motion and camera focus blur' },
          { key: 'faceEnhancement', label: 'Face Enhancement', desc: 'Prioritize facial micro-detail recovery' },
          { key: 'motionArtifactReduction', label: 'Motion Artifact Reduction', desc: 'Suppress temporal flicker' },
        ].map((item) => {
          const isChecked = (settings as any)[item.key];
          return (
            <label
              key={item.key}
              className="flex items-center justify-between p-2 rounded-lg bg-[#0c1018] hover:bg-[#151c2a] cursor-pointer border border-[#182232] transition-colors"
            >
              <div>
                <div className="font-semibold text-zinc-200">{item.label}</div>
                <div className="text-[10px] text-zinc-500">{item.desc}</div>
              </div>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => onChange({ [item.key]: e.target.checked } as any)}
                className="w-4 h-4 rounded text-cyan-500 bg-zinc-900 border-zinc-700 focus:ring-0 cursor-pointer"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
};
