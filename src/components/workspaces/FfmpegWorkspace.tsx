import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Copy,
  Check,
  Play,
  Code,
  Sparkles,
  Info,
  Search,
  ExternalLink,
  Loader2,
  FileVideo,
  Download,
} from 'lucide-react';
import {
  VideoMetadata,
  EnhanceSettings,
  UpscaleSettings,
  RestoreSettings,
  ColorSettings,
  ResizeSettings,
  FpsSettings,
  EditorSettings,
  ExportSettings,
} from '../../types';

interface FfmpegWorkspaceProps {
  currentVideo: VideoMetadata | null;
  enhanceSettings: EnhanceSettings;
  upscaleSettings: UpscaleSettings;
  restoreSettings: RestoreSettings;
  colorSettings: ColorSettings;
  resizeSettings: ResizeSettings;
  fpsSettings: FpsSettings;
  editorSettings: EditorSettings;
  exportSettings: ExportSettings;
  onJobStarted: (jobId: string) => void;
}

export const FfmpegWorkspace: React.FC<FfmpegWorkspaceProps> = ({
  currentVideo,
  enhanceSettings,
  upscaleSettings,
  restoreSettings,
  colorSettings,
  resizeSettings,
  fpsSettings,
  editorSettings,
  exportSettings,
  onJobStarted,
}) => {
  const [copied, setCopied] = useState(false);
  const [customFilter, setCustomFilter] = useState('');
  const [customFlags, setCustomFlags] = useState('-c:v libx264 -crf 19 -preset fast -c:a aac -b:a 192k');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<string | null>(null);
  const [outputFileUrl, setOutputFileUrl] = useState<string | null>(null);

  // System info
  const [filterCatalog, setFilterCatalog] = useState<any[]>([]);
  const [filterSearch, setFilterSearch] = useState('');
  const [ffmpegVersion, setFfmpegVersion] = useState('FFmpeg 4.4 / 6.0');

  useEffect(() => {
    fetch('/api/ffmpeg/info')
      .then((r) => r.json())
      .then((data) => {
        if (data.version) setFfmpegVersion(data.version);
        if (data.popularFilters) setFilterCatalog(data.popularFilters);
      })
      .catch(console.error);
  }, []);

  // Compute live command from current studio parameters
  const generateCurrentCommand = () => {
    const inputName = currentVideo ? currentVideo.filename : 'input.mp4';
    const outputName = currentVideo ? `enhanced_${currentVideo.filename}` : 'output.mp4';
    const parts = ['ffmpeg', '-y'];

    if (editorSettings.trimStart > 0) {
      parts.push(`-ss ${editorSettings.trimStart}`);
    }
    if (editorSettings.trimEnd > 0) {
      const dur = editorSettings.trimEnd - (editorSettings.trimStart || 0);
      if (dur > 0) parts.push(`-t ${dur}`);
    }

    parts.push(`-i "${inputName}"`);

    const filters: string[] = [];

    // Enhancement
    if (enhanceSettings.noiseReduction > 0) {
      const val = (enhanceSettings.noiseReduction / 100) * 12;
      filters.push(`hqdn3d=${val.toFixed(1)}:${val.toFixed(1)}:6:6`);
    }
    if (enhanceSettings.sharpening > 0 || enhanceSettings.detailRecovery > 0) {
      const sharp = ((enhanceSettings.sharpening + enhanceSettings.detailRecovery) / 100) * 1.8;
      filters.push(`unsharp=5:5:${sharp.toFixed(2)}:5:5:0.0`);
    }
    if (enhanceSettings.deblocking) filters.push('deblock=filter=weak:block=4');
    if (enhanceSettings.debanding) filters.push('deband=1:64:16:16');
    if (enhanceSettings.deblur) filters.push('unsharp=7:7:1.5:7:7:0.0');

    // Restoration
    if (restoreSettings.deflicker) filters.push('deflicker');
    if (restoreSettings.deinterlace) filters.push('yadif=0:-1:0');
    if (restoreSettings.stabilization) filters.push('deshake');

    // Color
    const b = (colorSettings.brightness / 200).toFixed(2);
    const c = (1.0 + colorSettings.contrast / 100).toFixed(2);
    const s = (1.0 + colorSettings.saturation / 100).toFixed(2);
    const g = (1.0 + colorSettings.gamma / 100).toFixed(2);
    filters.push(`eq=brightness=${b}:contrast=${c}:saturation=${s}:gamma=${g}`);

    if (colorSettings.vignette > 0) {
      filters.push(`vignette=PI/4*${((colorSettings.vignette / 100) * 0.6).toFixed(2)}`);
    }

    // Upscale
    if (upscaleSettings.targetResolution === '4k') {
      filters.push('scale=3840:2160:flags=lanczos+accurate_rnd');
    } else if (upscaleSettings.targetResolution === '2k') {
      filters.push('scale=2560:1440:flags=lanczos+accurate_rnd');
    } else if (upscaleSettings.targetResolution === '1080p') {
      filters.push('scale=1920:1080:flags=lanczos+accurate_rnd');
    }

    // Optical Flow
    if (fpsSettings.outputFps !== 'original') {
      const fps = fpsSettings.outputFps;
      if (fpsSettings.method === 'optical-flow') {
        filters.push(`minterpolate=mi_mode=mci:mc_mode=aobmc:fps=${fps}`);
      } else {
        filters.push(`fps=${fps}`);
      }
    }

    if (resizeSettings.aspectRatio !== 'original' && resizeSettings.mode === 'blur-background') {
      const complex = `"[0:v]split[fg][bg];[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=25:5[bgb];[fg]scale='min(1080,iw*1920/ih)':'min(1920,ih*1080/iw)'[fgc];[bgb][fgc]overlay=(W-w)/2:(H-h)/2"`;
      parts.push(`-filter_complex ${complex}`);
    } else if (filters.length > 0) {
      parts.push(`-vf "${filters.join(',')}"`);
    }

    const codec = exportSettings.codec === 'hevc' ? 'libx265' : exportSettings.codec === 'vp9' ? 'libvpx-vp9' : 'libx264';
    parts.push(`-c:v ${codec} -preset fast -crf 19 -c:a aac -b:a 192k "${outputName}"`);

    return parts.join(' \\\n  ');
  };

  const liveCommand = generateCurrentCommand();

  const handleCopy = () => {
    navigator.clipboard.writeText(liveCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Run Custom FFmpeg Command
  const handleExecuteCustom = async () => {
    if (!currentVideo) return;
    setIsExecuting(true);
    setExecutionOutput(null);
    setOutputFileUrl(null);

    try {
      const res = await fetch('/api/ffmpeg/run-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: currentVideo.filename,
          customFilter,
          customFlags,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Execution failed');

      setExecutionOutput(`Command dispatched successfully:\n${data.command}\nJob ID: ${data.jobId}`);
      if (data.jobId) onJobStarted(data.jobId);
    } catch (err: any) {
      setExecutionOutput(`Execution Error: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // Pro Snippets
  const proSnippets = [
    {
      title: 'Neural 4K Super-Resolution & Unsharp',
      filter: 'scale=3840:2160:flags=lanczos+accurate_rnd,unsharp=5:5:0.8:5:5:0.0',
      flags: '-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p',
    },
    {
      title: '60 FPS Motion-Compensated Optical Flow',
      filter: 'minterpolate=mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:fps=60',
      flags: '-c:v libx264 -preset medium -crf 19',
    },
    {
      title: '9:16 Vertical Blur-Background Composition',
      filter: 'split[fg][bg];[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:5[bgb];[fg]scale=\'min(1080,iw*1920/ih)\':\'min(1920,ih*1080/iw)\'[fgc];[bgb][fgc]overlay=(W-w)/2:(H-h)/2',
      flags: '-c:v libx264 -crf 19',
    },
    {
      title: 'YADIF Deinterlace & Camera Stabilization',
      filter: 'yadif=0:-1:0,deshake=edge=mirror',
      flags: '-c:v libx264 -preset fast -crf 18',
    },
    {
      title: 'High-Fidelity 35mm Vintage Film Grain',
      filter: 'curves=vintage,eq=contrast=1.1:saturation=1.15,noise=alls=12:allf=t+u',
      flags: '-c:v libx264 -crf 19',
    },
    {
      title: 'Lossless Audio Extraction (AAC / 320k)',
      filter: '',
      flags: '-vn -c:a aac -b:a 320k',
    },
  ];

  const filteredCatalog = filterCatalog.filter(
    (f) =>
      f.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
      f.description.toLowerCase().includes(filterSearch.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full text-xs">
      <div className="border-b border-[#1c2638] pb-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-zinc-100 flex items-center gap-1.5 text-sm">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>FFmpeg Engine Lab & CLI Generator</span>
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
            Native CLI 4.4+
          </span>
        </div>
        <p className="text-[11px] text-zinc-400 mt-0.5">
          Live syntax-highlighted FFmpeg commands, custom pipeline execution, and filter inspection.
        </p>
      </div>

      {/* Live Generated FFmpeg Command Card */}
      <div className="space-y-2 bg-[#0a0e16] border border-[#1d273a] rounded-xl p-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-zinc-300 font-semibold text-xs">
            <Code className="w-3.5 h-3.5 text-cyan-400" />
            <span>Active Pipeline Command</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#162032] hover:bg-[#202e48] text-zinc-200 border border-[#263752] transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-emerald-300 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-zinc-400" />
                <span className="text-[10px]">Copy CLI</span>
              </>
            )}
          </button>
        </div>

        <pre className="font-mono text-[10px] text-zinc-300 bg-[#06090e] p-2.5 rounded-lg border border-[#161f2e] overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
          <span className="text-cyan-400 font-bold">{liveCommand}</span>
        </pre>
      </div>

      {/* Custom Command Runner */}
      <div className="space-y-3 bg-[#101622] p-3.5 rounded-xl border border-[#1b2638]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
          <span>Custom Filter & Flags Runner</span>
          <span className="text-zinc-500 font-normal">Active Input: {currentVideo?.filename || 'None'}</span>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-zinc-400">Custom Video Filtergraph (-vf)</label>
          <input
            type="text"
            value={customFilter}
            onChange={(e) => setCustomFilter(e.target.value)}
            placeholder="e.g. hqdn3d=8:8:6:6,unsharp=5:5:1.2,eq=contrast=1.2"
            className="w-full bg-[#090d14] border border-[#202c40] rounded-lg p-2 font-mono text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-zinc-400">Encoding Flags & Codecs</label>
          <input
            type="text"
            value={customFlags}
            onChange={(e) => setCustomFlags(e.target.value)}
            className="w-full bg-[#090d14] border border-[#202c40] rounded-lg p-2 font-mono text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          onClick={handleExecuteCustom}
          disabled={!currentVideo || isExecuting}
          className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Dispatching FFmpeg Child Process...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Execute Custom Command in Studio</span>
            </>
          )}
        </button>

        {executionOutput && (
          <div className="bg-[#070a10] border border-[#1a2538] p-2.5 rounded-lg text-[10px] font-mono text-zinc-300 whitespace-pre-wrap">
            {executionOutput}
          </div>
        )}
      </div>

      {/* Pro FFmpeg Snippets Library */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Pro FFmpeg Command Presets
        </label>
        <div className="space-y-1.5">
          {proSnippets.map((snip, idx) => (
            <div
              key={idx}
              onClick={() => {
                setCustomFilter(snip.filter);
                setCustomFlags(snip.flags);
              }}
              className="p-2.5 rounded-xl bg-[#111724] hover:bg-[#162032] border border-[#1e2a3c] hover:border-emerald-500/50 cursor-pointer transition-all flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-200">{snip.title}</span>
                <span className="text-[9px] text-emerald-400 font-mono font-bold">Load ↵</span>
              </div>
              <div className="text-[10px] font-mono text-zinc-400 truncate">
                {snip.filter ? `-vf "${snip.filter}" ` : ''}{snip.flags}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Installed Filter Catalog */}
      <div className="space-y-2 bg-[#101622] p-3 rounded-xl border border-[#1b2638]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            FFmpeg Installed Filters ({filteredCatalog.length})
          </span>
          <div className="relative w-36">
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Search filter..."
              className="w-full bg-[#090d14] border border-[#202c40] rounded px-2 py-0.5 text-[10px] font-mono text-zinc-200 focus:outline-none"
            />
          </div>
        </div>

        <div className="max-h-48 overflow-y-auto space-y-1">
          {filteredCatalog.map((f, i) => (
            <div
              key={i}
              onClick={() => setCustomFilter((prev) => (prev ? `${prev},${f.name}` : f.name))}
              className="flex items-center justify-between p-1.5 rounded bg-[#0c1018] hover:bg-[#162030] text-[10px] cursor-pointer border border-[#182232] transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-cyan-300 font-bold">{f.name}</span>
                <span className="text-zinc-500 truncate max-w-[140px]">{f.description}</span>
              </div>
              <span className="font-mono text-[9px] text-zinc-500 px-1 rounded bg-[#141b28]">
                {f.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
