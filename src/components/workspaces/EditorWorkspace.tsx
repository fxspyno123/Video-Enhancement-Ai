import React from 'react';
import { Scissors, RotateCw, FlipHorizontal, FlipVertical, Volume2, VolumeX, FastForward, Activity } from 'lucide-react';
import { EditorSettings, FpsSettings, VideoMetadata } from '../../types';
import { formatSecondsToTimecode } from '../../utils/formatters';

interface EditorWorkspaceProps {
  editorSettings: EditorSettings;
  fpsSettings: FpsSettings;
  onEditorChange: (patch: Partial<EditorSettings>) => void;
  onFpsChange: (patch: Partial<FpsSettings>) => void;
  currentVideo: VideoMetadata | null;
  onReset: () => void;
}

export const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({
  editorSettings,
  fpsSettings,
  onEditorChange,
  onFpsChange,
  currentVideo,
  onReset,
}) => {
  const duration = currentVideo?.duration || 10;

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full text-xs">
      <div className="flex items-center justify-between border-b border-[#1c2638] pb-3">
        <div>
          <h3 className="font-bold text-zinc-100 flex items-center gap-1.5 text-sm">
            <Scissors className="w-4 h-4 text-indigo-400" />
            <span>Timeline Trimmer & Optical Flow</span>
          </h3>
          <p className="text-[11px] text-zinc-400">
            Cut segments, flip/rotate orientation, speed ramp, and 60/120 FPS optical flow.
          </p>
        </div>
        <button
          onClick={onReset}
          className="text-[11px] text-zinc-400 hover:text-indigo-400 font-medium transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Optical Flow & FPS Section */}
      <div className="space-y-3 bg-[#101622] p-3 rounded-xl border border-[#1b2638]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          <span>FPS & Optical Flow Frame Interpolation</span>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-zinc-400">Target Output Frame Rate</label>
          <div className="grid grid-cols-4 gap-2">
            {['original', '30', '60', '120'].map((fps) => (
              <button
                key={fps}
                onClick={() => onFpsChange({ outputFps: fps as any })}
                className={`py-1.5 rounded-lg border font-mono font-bold text-xs transition-colors ${
                  fpsSettings.outputFps === fps
                    ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-500/20'
                    : 'bg-[#121824] border-[#1e2a3c] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {fps === 'original' ? 'Native' : `${fps} FPS`}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-zinc-400">Interpolation Engine</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'optical-flow', label: 'Optical Flow (MCI)', desc: 'Adaptive block matching' },
              { id: 'standard', label: 'Frame Duplicate', desc: 'Fast render' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => onFpsChange({ method: m.id as any })}
                className={`p-2 rounded-lg border text-left transition-colors ${
                  fpsSettings.method === m.id
                    ? 'bg-cyan-950/60 border-cyan-500/60 text-white'
                    : 'bg-[#121824] border-[#1e2a3c] text-zinc-400'
                }`}
              >
                <div className="font-bold text-[11px]">{m.label}</div>
                <div className="text-[9px] text-zinc-500">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Trimming In / Out Points */}
      <div className="space-y-3 bg-[#101622] p-3 rounded-xl border border-[#1b2638]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
          Trim Video Segment
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400">In Point (Start)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={editorSettings.trimEnd || duration}
                step={0.1}
                value={editorSettings.trimStart}
                onChange={(e) => onEditorChange({ trimStart: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#0c1018] border border-[#222f44] rounded p-1.5 font-mono text-cyan-300 text-xs"
              />
              <span className="text-[10px] font-mono text-zinc-500">sec</span>
            </div>
            <div className="text-[10px] font-mono text-zinc-500">
              {formatSecondsToTimecode(editorSettings.trimStart)}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400">Out Point (End)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={editorSettings.trimStart || 0}
                max={duration}
                step={0.1}
                value={editorSettings.trimEnd || duration}
                onChange={(e) => onEditorChange({ trimEnd: parseFloat(e.target.value) || duration })}
                className="w-full bg-[#0c1018] border border-[#222f44] rounded p-1.5 font-mono text-cyan-300 text-xs"
              />
              <span className="text-[10px] font-mono text-zinc-500">sec</span>
            </div>
            <div className="text-[10px] font-mono text-zinc-500">
              {formatSecondsToTimecode(editorSettings.trimEnd || duration)}
            </div>
          </div>
        </div>
      </div>

      {/* Rotation & Flip */}
      <div className="space-y-3 bg-[#101622] p-3 rounded-xl border border-[#1b2638]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Orientation & Flip
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onEditorChange({ rotate: ((editorSettings.rotate + 90) % 360) as any })}
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#0c1018] hover:bg-[#151c2a] text-zinc-300 border border-[#202c40] font-semibold transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Rotate {editorSettings.rotate}°</span>
          </button>

          <button
            onClick={() => onEditorChange({ flipHorizontal: !editorSettings.flipHorizontal })}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border font-semibold transition-colors ${
              editorSettings.flipHorizontal
                ? 'bg-cyan-950/60 border-cyan-500/60 text-white'
                : 'bg-[#0c1018] hover:bg-[#151c2a] text-zinc-300 border-[#202c40]'
            }`}
          >
            <FlipHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Flip H</span>
          </button>

          <button
            onClick={() => onEditorChange({ flipVertical: !editorSettings.flipVertical })}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border font-semibold transition-colors ${
              editorSettings.flipVertical
                ? 'bg-cyan-950/60 border-cyan-500/60 text-white'
                : 'bg-[#0c1018] hover:bg-[#151c2a] text-zinc-300 border-[#202c40]'
            }`}
          >
            <FlipVertical className="w-3.5 h-3.5 text-cyan-400" />
            <span>Flip V</span>
          </button>
        </div>
      </div>

      {/* Speed & Audio */}
      <div className="space-y-3 bg-[#101622] p-3 rounded-xl border border-[#1b2638]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Playback Speed & Audio Sync
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-zinc-300">Speed Multiplier (Slow-mo to Fast)</span>
            <span className="font-mono text-cyan-400">{editorSettings.playbackSpeed}x</span>
          </div>
          <input
            type="range"
            min={0.25}
            max={3.0}
            step={0.25}
            value={editorSettings.playbackSpeed}
            onChange={(e) => onEditorChange({ playbackSpeed: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        <label className="flex items-center justify-between p-2 rounded-lg bg-[#0c1018] border border-[#182232] cursor-pointer">
          <div className="flex items-center gap-2">
            {editorSettings.muteAudio ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span className="font-semibold text-zinc-200">Mute Audio Track</span>
          </div>
          <input
            type="checkbox"
            checked={editorSettings.muteAudio}
            onChange={(e) => onEditorChange({ muteAudio: e.target.checked })}
            className="w-4 h-4 rounded text-red-500 bg-zinc-900 border-zinc-700 cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
};
