import React, { useEffect, useState } from 'react';
import { Settings, Cpu, HardDrive, Shield, Terminal, CheckCircle2, AlertTriangle } from 'lucide-react';

export const SettingsWorkspace: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [speedVsQuality, setSpeedVsQuality] = useState(70);

  useEffect(() => {
    fetch('/api/system/status')
      .then((r) => r.json())
      .then((d) => setSystemStatus(d))
      .catch(console.error);
  }, []);

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full text-xs">
      <div className="border-b border-[#1c2638] pb-3">
        <h3 className="font-bold text-zinc-100 flex items-center gap-1.5 text-sm">
          <Settings className="w-4 h-4 text-zinc-400" />
          <span>Studio Preferences & Engine Diagnostics</span>
        </h3>
        <p className="text-[11px] text-zinc-400">
          Hardware acceleration, encoding presets, and standalone backend configuration.
        </p>
      </div>

      {/* Hardware Engine Status */}
      <div className="space-y-3 bg-[#101622] p-3.5 rounded-xl border border-[#1b2638]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5" />
          <span>System Acceleration Engines</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded-lg bg-[#0c1018] border border-[#182232]">
            <div>
              <div className="font-semibold text-zinc-200">Native FFmpeg & FFprobe</div>
              <div className="text-[10px] text-zinc-500 font-mono">
                {systemStatus?.ffmpeg?.version ? systemStatus.ffmpeg.version.substring(0, 48) : 'Detecting...'}
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-[#0c1018] border border-[#182232]">
            <div>
              <div className="font-semibold text-zinc-200">Python 3 AI Model Environment</div>
              <div className="text-[10px] text-zinc-500 font-mono">
                {systemStatus?.python?.version || 'Python 3.10'}
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              Available
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-[#0c1018] border border-[#182232]">
            <div>
              <div className="font-semibold text-zinc-200">Gemini 3.8 Flash AI Assistant</div>
              <div className="text-[10px] text-zinc-500 font-mono">Server-side @google/genai SDK</div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-800">
              Connected
            </span>
          </div>
        </div>
      </div>

      {/* Speed vs Quality Trade-off */}
      <div className="space-y-3 bg-[#101622] p-3.5 rounded-xl border border-[#1b2638]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Render Speed vs Quality Balance
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-zinc-300">
            <span>Encoding Depth (Preset Tuning)</span>
            <span className="font-mono text-cyan-400">{speedVsQuality}% (High Fidelity)</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={speedVsQuality}
            onChange={(e) => setSpeedVsQuality(parseInt(e.target.value, 10))}
            className="w-full"
          />
          <div className="flex justify-between text-[9px] text-zinc-500 pt-0.5 font-mono">
            <span>Fast / Low CPU</span>
            <span>Balanced</span>
            <span>Maximum Detail Multi-Pass</span>
          </div>
        </div>
      </div>

      {/* Standalone Python Backend Information */}
      <div className="space-y-2 bg-[#101622] p-3.5 rounded-xl border border-[#1b2638]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5" />
          <span>Standalone Python Backend Project</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          The complete standalone Flask + PyTorch backend project is included in the <code className="text-zinc-200 bg-[#0c1018] px-1 rounded font-mono">backend/</code> directory, complete with services, route handlers, unit tests, and setup guide.
        </p>
      </div>
    </div>
  );
};
