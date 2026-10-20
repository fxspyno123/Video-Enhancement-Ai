import React from 'react';
import {
  Sparkles,
  Maximize2,
  Crop,
  Film,
  RotateCcw,
  Bot,
  Zap,
  CheckCircle2,
  Play,
  ArrowRight,
  Terminal,
} from 'lucide-react';
import { VideoMetadata, WorkspaceTab } from '../../types';

interface HomeWorkspaceProps {
  onSelectTab: (tab: WorkspaceTab) => void;
  onSelectSample: (sampleFilename: string) => void;
  samples: VideoMetadata[];
}

export const HomeWorkspace: React.FC<HomeWorkspaceProps> = ({
  onSelectTab,
  onSelectSample,
  samples,
}) => {
  const quickFeatures = [
    {
      title: 'AI Video Enhancement',
      desc: 'Deep neural de-noising, micro-texture recovery, de-blocking, and edge sharpening.',
      tab: 'enhance' as WorkspaceTab,
      icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
      accent: 'border-cyan-500/30 bg-cyan-950/20',
    },
    {
      title: 'AI Upscaling to 4K',
      desc: 'Real-ESRGAN & Lanczos high-fidelity upscaling from 480p up to pristine 3840x2160.',
      tab: 'upscale' as WorkspaceTab,
      icon: <Maximize2 className="w-5 h-5 text-violet-400" />,
      accent: 'border-violet-500/30 bg-violet-950/20',
    },
    {
      title: 'Smart Resize (Fit & Blur)',
      desc: 'Convert 1:1, 16:9, and 9:16 without losing content using animated blurred backgrounds.',
      tab: 'resize' as WorkspaceTab,
      icon: <Crop className="w-5 h-5 text-sky-400" />,
      accent: 'border-sky-500/30 bg-sky-950/20',
    },
    {
      title: 'Anime Enhancer',
      desc: 'Specialized 2D animation line-art preservation, flat-color debanding, and 60 FPS.',
      tab: 'anime' as WorkspaceTab,
      icon: <Film className="w-5 h-5 text-pink-400" />,
      accent: 'border-pink-500/30 bg-pink-950/20',
    },
    {
      title: 'Video Restoration',
      desc: 'Deflicker, deinterlace (yadif), camera shake stabilization, and color fading recovery.',
      tab: 'restore' as WorkspaceTab,
      icon: <RotateCcw className="w-5 h-5 text-emerald-400" />,
      accent: 'border-emerald-500/30 bg-emerald-950/20',
    },
    {
      title: 'Gemini AI Assistant',
      desc: 'Natural language video editing: describe your vision and automatically apply settings.',
      tab: 'assistant' as WorkspaceTab,
      icon: <Bot className="w-5 h-5 text-fuchsia-400" />,
      accent: 'border-fuchsia-500/30 bg-fuchsia-950/20',
    },
    {
      title: 'FFmpeg Engine Lab & CLI',
      desc: 'Real-time generated command inspection, custom filtergraphs, and CLI diagnostics.',
      tab: 'ffmpeg' as WorkspaceTab,
      icon: <Terminal className="w-5 h-5 text-emerald-400" />,
      accent: 'border-emerald-500/30 bg-emerald-950/20',
    },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-w-4xl mx-auto">
      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#121a29] via-[#161f30] to-[#1a1c2e] border border-[#233148] p-6 shadow-2xl">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>Next-Gen Video AI Studio</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">
            Professional AI Video Enhancement & Restoration
          </h1>
          <p className="text-sm text-zinc-300 leading-relaxed max-w-2xl">
            Enhance low-resolution footage, upscale up to 4K UHD, eliminate film grain and compression artifacts, convert aspect ratios without cropping, and interpolate smooth 60/120 FPS using real neural pipelines.
          </p>
        </div>
      </div>

      {/* Quick Test Samples */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
            One-Click Test Samples
          </h2>
          <span className="text-xs text-zinc-500">Instant preview without uploading</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {samples.map((s) => (
            <div
              key={s.filename}
              onClick={() => onSelectSample(s.filename)}
              className="group cursor-pointer bg-[#111724] hover:bg-[#172033] border border-[#1e2a3d] hover:border-cyan-500/50 rounded-xl p-3.5 transition-all shadow-md flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1a2334] group-hover:bg-cyan-950/60 flex items-center justify-center text-cyan-400 border border-[#2a384e] group-hover:border-cyan-500/50 transition-colors">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                    {s.originalName.replace('.mp4', '').replace(/_/g, ' ')}
                  </h4>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                    {s.resolutionLabel} • {s.fps} FPS • {s.formattedDuration}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </div>
          ))}
        </div>
      </div>

      {/* Feature Grid */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300 mb-3">
          Core Workspaces
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickFeatures.map((f) => (
            <div
              key={f.title}
              onClick={() => onSelectTab(f.tab)}
              className={`cursor-pointer rounded-xl p-4 border transition-all hover:scale-[1.01] ${f.accent} hover:shadow-lg`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                {f.icon}
                <h3 className="text-xs font-bold text-zinc-100">{f.title}</h3>
              </div>
              <p className="text-[11px] text-zinc-400 leading-normal mb-3">{f.desc}</p>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 group">
                <span>Launch Workspace</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
