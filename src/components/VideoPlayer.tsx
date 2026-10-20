import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  SlidersHorizontal,
  Columns,
  Eye,
  SkipBack,
  SkipForward,
  Repeat,
  Sparkles,
} from 'lucide-react';
import { VideoMetadata, ColorSettings, EnhanceSettings, ResizeSettings } from '../types';
import { formatSecondsToTimecode } from '../utils/formatters';

interface VideoPlayerProps {
  currentVideo: VideoMetadata | null;
  colorSettings: ColorSettings;
  enhanceSettings: EnhanceSettings;
  resizeSettings: ResizeSettings;
  trimStart: number;
  trimEnd: number;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  currentVideo,
  colorSettings,
  enhanceSettings,
  resizeSettings,
  trimStart,
  trimEnd,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const secondaryVideoRef = useRef<HTMLVideoElement>(null);
  const sideVideoRef = useRef<HTMLVideoElement>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Comparison & View modes
  const [viewMode, setViewMode] = useState<'split' | 'side-by-side' | 'enhanced' | 'original'>('split');
  const [splitPos, setSplitPos] = useState(50); // percentage 0-100
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  // Zoom & Pan
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = fit, 1.5 = 150%, 2 = 200%
  const [previewQuality, setPreviewQuality] = useState<'proxy' | '720p' | 'original'>('original');

  // Video time update
  const syncSecondaryVideos = (time: number, play: boolean) => {
    [secondaryVideoRef, sideVideoRef].forEach((ref) => {
      if (ref.current) {
        if (Math.abs(ref.current.currentTime - time) > 0.08) {
          ref.current.currentTime = time;
        }
        if (play && ref.current.paused) {
          ref.current.play().catch(() => {});
        } else if (!play && !ref.current.paused) {
          ref.current.pause();
        }
      }
    });
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);
      syncSecondaryVideos(cur, isPlaying);

      // Handle trimming loop
      if (trimEnd > 0 && cur >= trimEnd) {
        videoRef.current.currentTime = Math.max(0, trimStart);
        syncSecondaryVideos(Math.max(0, trimStart), isPlaying);
        if (!isLooping) {
          videoRef.current.pause();
          setIsPlaying(false);
          syncSecondaryVideos(Math.max(0, trimStart), false);
        }
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || currentVideo?.duration || 0);
      if (trimStart > 0) {
        videoRef.current.currentTime = trimStart;
        syncSecondaryVideos(trimStart, false);
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      syncSecondaryVideos(videoRef.current.currentTime, false);
    } else {
      if (trimEnd > 0 && videoRef.current.currentTime >= trimEnd) {
        videoRef.current.currentTime = trimStart;
      }
      videoRef.current.play().catch(console.error);
      setIsPlaying(true);
      syncSecondaryVideos(videoRef.current.currentTime, true);
    }
  };

  const stepFrame = (frames: number) => {
    if (!videoRef.current) return;
    const fps = currentVideo?.fps || 30;
    const frameTime = 1 / fps;
    const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + frames * frameTime));
    videoRef.current.currentTime = newTime;
    syncSecondaryVideos(newTime, false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      syncSecondaryVideos(time, isPlaying);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !isMuted;
    setIsMuted(next);
    videoRef.current.muted = next;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  };

  // Dragging split slider
  const handleSplitMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingSplit || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSplitPos(pct);
  };

  const handleSplitMouseUp = () => {
    setIsDraggingSplit(false);
  };

  // Keyboard shortcuts (Space = play/pause, Arrow keys = step frames)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        stepFrame(-1);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        stepFrame(1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPlaying, duration]);

  // Compute CSS filter string for real-time live preview of enhancement & color settings
  const computeEnhancedFilterStyle = () => {
    const b = 1 + colorSettings.brightness / 100;
    const c = 1 + colorSettings.contrast / 100;
    const s = 1 + colorSettings.saturation / 100;
    const h = colorSettings.hue;
    const blurNr = enhanceSettings.noiseReduction > 40 ? 0.3 : 0; // slight smoothing for noise reduction

    let filter = `brightness(${b}) contrast(${c}) saturate(${s}) hue-rotate(${h}deg)`;
    if (colorSettings.fade > 0) {
      filter += ` opacity(${1 - (colorSettings.fade / 100) * 0.3})`;
    }
    if (colorSettings.lutPreset === 'film-look') {
      filter += ' sepia(0.2) contrast(1.1)';
    } else if (colorSettings.lutPreset === 'cinematic') {
      filter += ' contrast(1.15) saturate(1.1)';
    } else if (colorSettings.lutPreset === 'vibrant-anime') {
      filter += ' saturate(1.4) contrast(1.15)';
    } else if (colorSettings.lutPreset === 'dark-moody') {
      filter += ' brightness(0.9) contrast(1.25) saturate(0.85)';
    }
    return filter;
  };

  // Compute smart resize styles
  const isBlurBgMode = resizeSettings.aspectRatio !== 'original' && resizeSettings.mode === 'blur-background';

  return (
    <div
      ref={containerRef}
      onMouseMove={handleSplitMouseMove}
      onMouseUp={handleSplitMouseUp}
      className="flex-1 flex flex-col bg-[#070a0f] relative overflow-hidden select-none min-h-0"
    >
      {/* Top Floating Preview HUD Bar */}
      <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Mode Selector HUD */}
        <div className="pointer-events-auto flex items-center gap-1 bg-[#0f1522]/90 backdrop-blur-md border border-[#202c42] p-1 rounded-xl shadow-xl">
          <button
            onClick={() => setViewMode('split')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              viewMode === 'split'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Split Slider</span>
          </button>
          <button
            onClick={() => setViewMode('side-by-side')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              viewMode === 'side-by-side'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>
          <button
            onClick={() => setViewMode('enhanced')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              viewMode === 'enhanced'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Enhanced</span>
          </button>
          <button
            onClick={() => setViewMode('original')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              viewMode === 'original'
                ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Original</span>
          </button>
        </div>

        {/* Zoom & Quality HUD */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-[#0f1522]/90 backdrop-blur-md border border-[#202c42] rounded-xl px-1.5 py-1 text-xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
              className="p-1 text-zinc-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-zinc-300 font-mono text-[11px] font-semibold min-w-[46px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(4, z + 0.25))}
              className="p-1 text-zinc-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 hover:text-white font-medium"
            >
              Fit
            </button>
          </div>

          {/* Proxy quality */}
          <select
            value={previewQuality}
            onChange={(e: any) => setPreviewQuality(e.target.value)}
            className="bg-[#0f1522]/90 backdrop-blur-md border border-[#202c42] rounded-xl px-2.5 py-1 text-xs text-zinc-300 font-mono focus:outline-none"
          >
            <option value="proxy">Proxy 360p (Fastest)</option>
            <option value="720p">720p Preview</option>
            <option value="original">Full Fidelity</option>
          </select>
        </div>
      </div>

      {/* Main Video Viewport Canvas */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden p-6">
        {currentVideo ? (
          <div
            className="relative flex items-center justify-center transition-transform duration-100 ease-out max-w-full max-h-full"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* Aspect Ratio Blurred Background Simulation */}
            {isBlurBgMode && (
              <div
                className="absolute inset-0 -m-8 overflow-hidden rounded-2xl pointer-events-none opacity-40 blur-2xl scale-125"
                style={{
                  backgroundImage: `url(${currentVideo.thumbnailUrl || currentVideo.url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            )}

            {/* View Mode 1: Split Screen Slider */}
            {viewMode === 'split' && (
              <div className="relative overflow-hidden rounded-xl shadow-2xl border border-[#223046] max-h-[64vh] flex items-center justify-center">
                {/* Master Video (Original Basis) */}
                <video
                  ref={videoRef}
                  src={currentVideo.url}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  loop={isLooping}
                  className="max-h-[64vh] max-w-full object-contain block"
                  playsInline
                />

                {/* Enhanced Top Overlay Layer with clip-path */}
                <div
                  className="absolute inset-0 pointer-events-none overflow-hidden"
                  style={{
                    clipPath: `polygon(${splitPos}% 0, 100% 0, 100% 100%, ${splitPos}% 100%)`,
                  }}
                >
                  <video
                    ref={secondaryVideoRef}
                    src={currentVideo.url}
                    className="w-full h-full object-contain block"
                    style={{
                      filter: computeEnhancedFilterStyle(),
                    }}
                    muted
                    playsInline
                  />
                  {/* Enhanced Label Pill */}
                  <div className="absolute top-4 right-4 bg-violet-950/80 backdrop-blur-md border border-violet-500/50 text-violet-300 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider font-mono shadow-lg flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-violet-400" />
                    <span>ENHANCED</span>
                  </div>
                </div>

                {/* Original Label Pill */}
                <div
                  className="absolute top-4 left-4 bg-zinc-950/80 backdrop-blur-md border border-zinc-700 text-zinc-300 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider font-mono shadow-lg pointer-events-none"
                  style={{ opacity: splitPos > 15 ? 1 : 0 }}
                >
                  ORIGINAL
                </div>

                {/* Draggable Divider Handle */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-cyan-400 cursor-ew-resize flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.8)] z-10"
                  style={{ left: `${splitPos}%` }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsDraggingSplit(true);
                  }}
                >
                  <div className="w-7 h-7 rounded-full bg-cyan-500 text-black flex items-center justify-center shadow-lg border-2 border-white scale-90 hover:scale-100 transition-transform">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            )}

            {/* View Mode 2: Side-by-Side Dual Comparison */}
            {viewMode === 'side-by-side' && (
              <div className="grid grid-cols-2 gap-4 max-h-[64vh] max-w-full">
                <div className="relative rounded-xl overflow-hidden border border-[#223046] shadow-xl bg-black flex items-center justify-center">
                  <div className="absolute top-3 left-3 bg-zinc-950/80 text-zinc-300 px-2.5 py-1 rounded text-[11px] font-bold font-mono border border-zinc-700 z-10">
                    ORIGINAL
                  </div>
                  <video
                    ref={videoRef}
                    src={currentVideo.url}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    loop={isLooping}
                    className="max-h-[60vh] max-w-full object-contain"
                    playsInline
                  />
                </div>
                <div className="relative rounded-xl overflow-hidden border border-violet-500/40 shadow-xl bg-black flex items-center justify-center">
                  <div className="absolute top-3 right-3 bg-violet-950/80 text-violet-300 px-2.5 py-1 rounded text-[11px] font-bold font-mono border border-violet-500/50 z-10 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-violet-400" />
                    <span>ENHANCED</span>
                  </div>
                  <video
                    ref={sideVideoRef}
                    src={currentVideo.url}
                    className="max-h-[60vh] max-w-full object-contain"
                    style={{ filter: computeEnhancedFilterStyle() }}
                    muted
                    playsInline
                  />
                </div>
              </div>
            )}

            {/* View Mode 3: Enhanced Only */}
            {viewMode === 'enhanced' && (
              <div className="relative rounded-xl overflow-hidden border border-violet-500/40 shadow-2xl max-h-[64vh]">
                <div className="absolute top-4 right-4 bg-violet-950/80 text-violet-300 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono border border-violet-500/50 z-10 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-violet-400" />
                  <span>ENHANCED PREVIEW</span>
                </div>
                <video
                  ref={videoRef}
                  src={currentVideo.url}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  loop={isLooping}
                  className="max-h-[64vh] max-w-full object-contain block"
                  style={{ filter: computeEnhancedFilterStyle() }}
                  playsInline
                />
              </div>
            )}

            {/* View Mode 4: Original Only */}
            {viewMode === 'original' && (
              <div className="relative rounded-xl overflow-hidden border border-[#223046] shadow-2xl max-h-[64vh]">
                <div className="absolute top-4 left-4 bg-zinc-950/80 text-zinc-300 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono border border-zinc-700 z-10">
                  ORIGINAL
                </div>
                <video
                  ref={videoRef}
                  src={currentVideo.url}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  loop={isLooping}
                  className="max-h-[64vh] max-w-full object-contain block"
                  playsInline
                />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-[#141b28] border border-[#233148] flex items-center justify-center mx-auto mb-4 text-cyan-400 shadow-xl">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-zinc-200 mb-1">Ready for Neural Processing</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Upload any MP4, MOV, MKV, AVI, or WebM video up to 1GB or choose a sample clip from the top toolbar to begin.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Timeline Controls Bar */}
      <div className="h-16 bg-[#0c111a] border-t border-[#1c2638] px-4 flex flex-col justify-center shrink-0 z-20">
        {/* Scrubber & In/Out markers */}
        <div className="relative flex items-center mb-1.5 group">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.01}
            value={currentTime}
            onChange={handleSeek}
            disabled={!currentVideo}
            className="w-full h-2 bg-[#1a2333] rounded-lg appearance-none cursor-pointer"
          />

          {/* Trim in/out visual indicators on timeline */}
          {trimEnd > 0 && duration > 0 && (
            <div
              className="absolute top-0 bottom-0 bg-cyan-500/30 rounded pointer-events-none"
              style={{
                left: `${(trimStart / duration) * 100}%`,
                width: `${((trimEnd - trimStart) / duration) * 100}%`,
              }}
            />
          )}
        </div>

        {/* Transport controls */}
        <div className="flex items-center justify-between text-xs text-zinc-300">
          {/* Left: Timecode & Step Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => stepFrame(-1)}
              disabled={!currentVideo}
              title="Step 1 Frame Back (Left Arrow)"
              className="p-1 hover:text-white disabled:opacity-40"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={togglePlay}
              disabled={!currentVideo}
              className="w-8 h-8 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black flex items-center justify-center shadow-md shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-40"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => stepFrame(1)}
              disabled={!currentVideo}
              title="Step 1 Frame Forward (Right Arrow)"
              className="p-1 hover:text-white disabled:opacity-40"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            <div className="font-mono text-[11px] text-zinc-300 flex items-center gap-1.5 bg-[#141b29] px-2 py-0.5 rounded border border-[#233148]">
              <span className="text-cyan-400 font-semibold">{formatSecondsToTimecode(currentTime)}</span>
              <span className="text-zinc-500">/</span>
              <span className="text-zinc-400">{formatSecondsToTimecode(duration)}</span>
            </div>

            <button
              onClick={() => setIsLooping(!isLooping)}
              title={isLooping ? 'Looping enabled' : 'Looping disabled'}
              className={`p-1 transition-colors ${isLooping ? 'text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: Audio Volume, Playback Speed, Fullscreen */}
          <div className="flex items-center gap-4">
            {/* Speed Selector */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Speed</span>
              <select
                value={playbackRate}
                onChange={(e) => {
                  const rate = parseFloat(e.target.value);
                  setPlaybackRate(rate);
                  if (videoRef.current) videoRef.current.playbackRate = rate;
                }}
                className="bg-[#141b29] border border-[#233148] rounded px-1.5 py-0.5 text-[11px] font-mono text-zinc-300 focus:outline-none"
              >
                <option value={0.25}>0.25x</option>
                <option value={0.5}>0.5x</option>
                <option value={1}>1.0x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2.0x</option>
              </select>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="hover:text-white text-zinc-400">
                {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-[#1a2333] rounded"
              />
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1 hover:text-white text-zinc-400"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
