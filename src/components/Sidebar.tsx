import React from 'react';
import {
  Home,
  Sparkles,
  Maximize2,
  RotateCcw,
  Film,
  Palette,
  Crop,
  Scissors,
  Bot,
  Download,
  Clock,
  Settings,
  Cpu,
  Layers,
  Terminal,
} from 'lucide-react';
import { WorkspaceTab } from '../types';

interface SidebarProps {
  currentTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  activeJobsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeJobsCount,
}) => {
  const navItems: { id: WorkspaceTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'enhance', label: 'Enhance', icon: <Sparkles className="w-4 h-4 text-cyan-400" /> },
    { id: 'upscale', label: 'AI Upscaling', icon: <Maximize2 className="w-4 h-4 text-violet-400" /> },
    { id: 'restore', label: 'Restore', icon: <RotateCcw className="w-4 h-4 text-emerald-400" /> },
    { id: 'anime', label: 'Anime Enhancer', icon: <Film className="w-4 h-4 text-pink-400" /> },
    { id: 'color', label: 'Color Grading', icon: <Palette className="w-4 h-4 text-amber-400" /> },
    { id: 'resize', label: 'Smart Resize', icon: <Crop className="w-4 h-4 text-sky-400" /> },
    { id: 'editor', label: 'Video Editor', icon: <Scissors className="w-4 h-4 text-indigo-400" /> },
    { id: 'assistant', label: 'AI Assistant', icon: <Bot className="w-4 h-4 text-fuchsia-400" />, badge: 'Gemini' },
    { id: 'ffmpeg', label: 'FFmpeg Lab', icon: <Terminal className="w-4 h-4 text-emerald-400" />, badge: 'CLI' },
    { id: 'export', label: 'Export', icon: <Download className="w-4 h-4 text-blue-400" /> },
    {
      id: 'history',
      label: 'History & Queue',
      icon: <Clock className="w-4 h-4 text-orange-400" />,
      badge: activeJobsCount > 0 ? `${activeJobsCount} Active` : undefined,
    },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4 text-zinc-400" /> },
  ];

  return (
    <aside className="w-64 bg-[#0a0d14] border-r border-[#1a2333] flex flex-col h-screen select-none shrink-0 z-30">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#1a2333] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 via-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-white text-base">EnhanceAI</span>
              <span className="text-xs px-1.5 py-0.5 font-bold uppercase rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                Studio
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 tracking-wider uppercase font-mono">v2.6 Neural Engine</p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          Workspaces
        </div>
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-950/80 to-violet-950/60 text-white border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#121927]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-cyan-400 scale-110 transition-transform' : 'opacity-80'}>
                  {item.icon}
                </span>
                <span className="tracking-wide">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                    item.badge.includes('Active')
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                      : 'bg-violet-900/40 text-violet-300 border border-violet-700/50'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Engine Status Footer */}
      <div className="p-3 border-t border-[#1a2333] bg-[#0c1018] text-xs">
        <div className="flex items-center justify-between text-zinc-400 mb-1.5">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-semibold text-zinc-300">FFmpeg 4.4 / 6.0</span>
          </div>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400"></span>
        </div>
        <p className="text-[10px] text-zinc-500 leading-relaxed">
          High-performance multi-threaded x86 video pipeline active.
        </p>
      </div>
    </aside>
  );
};
