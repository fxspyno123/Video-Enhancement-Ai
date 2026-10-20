import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopToolbar } from './components/TopToolbar';
import { VideoPlayer } from './components/VideoPlayer';
import { HomeWorkspace } from './components/workspaces/HomeWorkspace';
import { EnhanceWorkspace } from './components/workspaces/EnhanceWorkspace';
import { UpscaleWorkspace } from './components/workspaces/UpscaleWorkspace';
import { RestoreWorkspace } from './components/workspaces/RestoreWorkspace';
import { AnimeWorkspace } from './components/workspaces/AnimeWorkspace';
import { ColorWorkspace } from './components/workspaces/ColorWorkspace';
import { ResizeWorkspace } from './components/workspaces/ResizeWorkspace';
import { EditorWorkspace } from './components/workspaces/EditorWorkspace';
import { AssistantWorkspace } from './components/workspaces/AssistantWorkspace';
import { ExportWorkspace } from './components/workspaces/ExportWorkspace';
import { HistoryWorkspace } from './components/workspaces/HistoryWorkspace';
import { SettingsWorkspace } from './components/workspaces/SettingsWorkspace';
import { FfmpegWorkspace } from './components/workspaces/FfmpegWorkspace';
import {
  WorkspaceTab,
  VideoMetadata,
  EnhanceSettings,
  UpscaleSettings,
  RestoreSettings,
  AnimeSettings,
  ColorSettings,
  ResizeSettings,
  FpsSettings,
  EditorSettings,
  ExportSettings,
  ProcessingJob,
  AssistantChangeProposal,
} from './types';
import { StudioPreset } from './utils/presets';

const defaultEnhance: EnhanceSettings = {
  mode: 'hq',
  enhancementStrength: 65,
  noiseReduction: 40,
  sharpening: 45,
  detailRecovery: 50,
  texturePreservation: 70,
  deblocking: true,
  deblockingStrength: 50,
  debanding: true,
  debandingStrength: 50,
  deblur: false,
  deblurStrength: 0,
  edgeEnhancement: 35,
  grainPreservation: 25,
  faceEnhancement: true,
  motionArtifactReduction: true,
};

const defaultUpscale: UpscaleSettings = {
  targetResolution: '1080p',
  customWidth: 1920,
  customHeight: 1080,
  scaleFactor: '2x',
  aiModel: 'realesrgan-x4plus',
  maintainAspectRatio: true,
  denoiseBeforeUpscale: 30,
  sharpening: 40,
  detailRecovery: 50,
};

const defaultRestore: RestoreSettings = {
  denoiseStrength: 35,
  deblocking: true,
  deblockingStrength: 50,
  deband: true,
  debandStrength: 50,
  deflicker: false,
  deinterlace: false,
  stabilization: false,
  compressionArtifactRemoval: true,
  sharpening: 40,
  colorFadingCorrection: false,
  grainPreservation: 25,
  motionBlurReduction: false,
};

const defaultAnime: AnimeSettings = {
  preset: 'anime-2k',
  lineArtPreservation: 85,
  flatColorPreservation: 90,
  edgeRefinement: 80,
  colorBandingReduction: 85,
  compressionCleanup: 75,
  denoising: 60,
  fineLineEnhancement: 80,
  frameInterpolation: false,
};

const defaultColor: ColorSettings = {
  brightness: 0,
  contrast: 10,
  exposure: 0,
  saturation: 15,
  temperature: 0,
  tint: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  gamma: 0,
  vibrance: 10,
  sharpness: 30,
  fade: 0,
  vignette: 0,
  hue: 0,
  rgbRed: 0,
  rgbGreen: 0,
  rgbBlue: 0,
  lutPreset: 'none',
  lutIntensity: 100,
};

const defaultResize: ResizeSettings = {
  aspectRatio: 'original',
  customRatioWidth: 1920,
  customRatioHeight: 1080,
  mode: 'blur-background',
  blurRadius: 20,
  blurSaturation: 110,
  blurBrightness: 100,
  solidColor: '#000000',
  position: 'center',
};

const defaultFps: FpsSettings = {
  outputFps: 'original',
  method: 'optical-flow',
  slowMotionFactor: 1.0,
  interpolationStrength: 80,
  sceneChangeDetection: true,
  motionArtifactReduction: true,
};

const defaultEditor: EditorSettings = {
  trimStart: 0,
  trimEnd: 0,
  playbackSpeed: 1.0,
  cropEnabled: false,
  crop: null,
  rotate: 0,
  flipHorizontal: false,
  flipVertical: false,
  muteAudio: false,
  volume: 100,
  fadeIn: 0,
  fadeOut: 0,
};

const defaultExport: ExportSettings = {
  resolution: '1080p',
  fps: 'original',
  bitrateMode: 'auto',
  bitrateMbps: 16,
  codec: 'h264',
  format: 'mp4',
  audioMode: 'passthrough',
  audioCodec: 'aac',
  audioBitrate: '192k',
  outputFilename: 'enhanced_master.mp4',
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<WorkspaceTab>('home');
  const [currentVideo, setCurrentVideo] = useState<VideoMetadata | null>(null);
  const [samples, setSamples] = useState<VideoMetadata[]>([]);
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Settings
  const [enhanceSettings, setEnhanceSettings] = useState<EnhanceSettings>(defaultEnhance);
  const [upscaleSettings, setUpscaleSettings] = useState<UpscaleSettings>(defaultUpscale);
  const [restoreSettings, setRestoreSettings] = useState<RestoreSettings>(defaultRestore);
  const [animeSettings, setAnimeSettings] = useState<AnimeSettings>(defaultAnime);
  const [colorSettings, setColorSettings] = useState<ColorSettings>(defaultColor);
  const [resizeSettings, setResizeSettings] = useState<ResizeSettings>(defaultResize);
  const [fpsSettings, setFpsSettings] = useState<FpsSettings>(defaultFps);
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(defaultEditor);
  const [exportSettings, setExportSettings] = useState<ExportSettings>(defaultExport);

  // Load sample videos on startup
  const loadSamples = useCallback(async () => {
    try {
      const res = await fetch('/api/sample-videos');
      if (res.ok) {
        const data = await res.json();
        setSamples(data);
        // Automatically select the first sample if no video selected
        if (!currentVideo && data.length > 0) {
          setCurrentVideo(data[0]);
          setEditorSettings((prev) => ({ ...prev, trimEnd: data[0].duration }));
        }
      }
    } catch (err) {
      console.warn('Failed to fetch sample videos:', err);
    }
  }, [currentVideo]);

  // Load jobs queue
  const loadJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/jobs');
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
        const hasActive = data.some((j: ProcessingJob) => j.status === 'processing' || j.status === 'queued');
        setIsProcessing(hasActive);
      }
    } catch (err) {
      console.warn('Failed to fetch jobs:', err);
    }
  }, []);

  useEffect(() => {
    loadSamples();
    loadJobs();
  }, [loadSamples, loadJobs]);

  // Polling for active jobs
  useEffect(() => {
    const hasActive = jobs.some((j) => j.status === 'processing' || j.status === 'queued');
    if (!hasActive) return;

    const interval = setInterval(() => {
      loadJobs();
    }, 1500);

    return () => clearInterval(interval);
  }, [jobs, loadJobs]);

  // Upload video file
  const handleUploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('video', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Upload failed with status ${res.status}`);
      }

      const data = await res.json();
      if (data.metadata) {
        setCurrentVideo(data.metadata);
        setEditorSettings((prev) => ({
          ...prev,
          trimStart: 0,
          trimEnd: data.metadata.duration,
        }));
        if (currentTab === 'home') {
          setCurrentTab('enhance');
        }
      }
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Select sample video
  const handleSelectSample = (sampleFilename: string) => {
    const s = samples.find((x) => x.filename === sampleFilename);
    if (s) {
      setCurrentVideo(s);
      setEditorSettings((prev) => ({
        ...prev,
        trimStart: 0,
        trimEnd: s.duration,
      }));
    }
  };

  // Apply preset
  const handleApplyPreset = (preset: StudioPreset) => {
    if (preset.enhance) setEnhanceSettings((prev) => ({ ...prev, ...preset.enhance }));
    if (preset.upscale) setUpscaleSettings((prev) => ({ ...prev, ...preset.upscale }));
    if (preset.restore) setRestoreSettings((prev) => ({ ...prev, ...preset.restore }));
    if (preset.anime) setAnimeSettings((prev) => ({ ...prev, ...preset.anime }));
    if (preset.color) setColorSettings((prev) => ({ ...prev, ...preset.color }));
    if (currentTab === 'home') setCurrentTab('enhance');
  };

  // Reset all
  const handleResetSettings = () => {
    setEnhanceSettings(defaultEnhance);
    setUpscaleSettings(defaultUpscale);
    setRestoreSettings(defaultRestore);
    setAnimeSettings(defaultAnime);
    setColorSettings(defaultColor);
    setResizeSettings(defaultResize);
    setFpsSettings(defaultFps);
    setEditorSettings(defaultEditor);
    setExportSettings(defaultExport);
  };

  // Apply proposal from Gemini Assistant
  const handleApplyProposal = (proposal: AssistantChangeProposal) => {
    const patch = proposal.configPatch;
    if (patch.enhance) setEnhanceSettings((prev) => ({ ...prev, ...patch.enhance }));
    if (patch.upscale) setUpscaleSettings((prev) => ({ ...prev, ...patch.upscale }));
    if (patch.restore) setRestoreSettings((prev) => ({ ...prev, ...patch.restore }));
    if (patch.anime) setAnimeSettings((prev) => ({ ...prev, ...patch.anime }));
    if (patch.color) setColorSettings((prev) => ({ ...prev, ...patch.color }));
    if (patch.resize) setResizeSettings((prev) => ({ ...prev, ...patch.resize }));
    if (patch.fps) setFpsSettings((prev) => ({ ...prev, ...patch.fps }));
    if (patch.editor) setEditorSettings((prev) => ({ ...prev, ...patch.editor }));
    if (patch.exportSettings) setExportSettings((prev) => ({ ...prev, ...patch.exportSettings }));
  };

  // Trigger export / render
  const handleTriggerExport = async () => {
    if (!currentVideo) {
      alert('Please upload or select a video to render');
      return;
    }

    setIsProcessing(true);
    setCurrentTab('history');

    try {
      const payload = {
        filename: currentVideo.filename,
        modules: {
          enhance: enhanceSettings,
          upscale: upscaleSettings,
          restore: restoreSettings,
          anime: currentTab === 'anime' ? animeSettings : undefined,
          color: colorSettings,
          resize: resizeSettings,
          fps: fpsSettings,
          editor: editorSettings,
          exportSettings,
        },
      };

      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Render start failed: ${res.status}`);
      }

      loadJobs();
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
      setIsProcessing(false);
    }
  };

  // Cancel job
  const handleCancelJob = async (jobId: string) => {
    try {
      await fetch(`/api/jobs/${jobId}/cancel`, { method: 'POST' });
      loadJobs();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete job
  const handleDeleteJob = async (jobId: string) => {
    try {
      await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
      loadJobs();
    } catch (err) {
      console.error(err);
    }
  };

  const activeJobsCount = jobs.filter((j) => j.status === 'processing' || j.status === 'queued').length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090c10] text-[#e2e8f0]">
      {/* 1. Left Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeJobsCount={activeJobsCount}
      />

      {/* 2. Main Studio Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Toolbar */}
        <TopToolbar
          currentVideo={currentVideo}
          onUploadFile={handleUploadFile}
          onSelectSample={handleSelectSample}
          onApplyPreset={handleApplyPreset}
          onResetSettings={handleResetSettings}
          onTriggerExport={handleTriggerExport}
          onOpenFfmpegLab={() => setCurrentTab('ffmpeg')}
          samples={samples}
          isUploading={isUploading}
        />

        {/* Content Area: Player on Left, Inspector Workspace on Right */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Central Area: Video Player or Home Overview */}
          {currentTab === 'home' ? (
            <div className="flex-1 overflow-y-auto">
              <HomeWorkspace
                onSelectTab={setCurrentTab}
                onSelectSample={(sample) => {
                  handleSelectSample(sample);
                  setCurrentTab('enhance');
                }}
                samples={samples}
              />
            </div>
          ) : (
            <VideoPlayer
              currentVideo={currentVideo}
              colorSettings={colorSettings}
              enhanceSettings={enhanceSettings}
              resizeSettings={resizeSettings}
              trimStart={editorSettings.trimStart}
              trimEnd={editorSettings.trimEnd}
            />
          )}

          {/* Right Inspector Panel */}
          <div className="w-80 md:w-96 bg-[#0d121c] border-l border-[#1c2638] flex flex-col shrink-0 h-full overflow-hidden z-10">
            {currentTab === 'home' && (
              <div className="p-4 space-y-4 overflow-y-auto h-full text-xs">
                <div className="border-b border-[#1c2638] pb-3">
                  <h3 className="font-bold text-zinc-100 text-sm">Quick Overview</h3>
                  <p className="text-[11px] text-zinc-400">
                    Select a workspace from the left sidebar to access dedicated controls.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="bg-[#121824] p-3 rounded-xl border border-[#1e2a3c]">
                    <div className="font-bold text-cyan-400 mb-1">Active Video Input</div>
                    <div className="text-zinc-300 font-semibold truncate">
                      {currentVideo?.originalName || 'None selected'}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-1">
                      {currentVideo ? `${currentVideo.resolutionLabel} • ${currentVideo.fps} FPS • ${currentVideo.formattedDuration}` : 'Pick a sample to begin'}
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentTab('enhance')}
                    className="w-full py-2.5 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/20 hover:opacity-95 transition-all text-xs"
                  >
                    Open Enhancement Controls
                  </button>
                </div>
              </div>
            )}

            {currentTab === 'enhance' && (
              <EnhanceWorkspace
                settings={enhanceSettings}
                onChange={(patch) => setEnhanceSettings((prev) => ({ ...prev, ...patch }))}
                onReset={() => setEnhanceSettings(defaultEnhance)}
              />
            )}

            {currentTab === 'upscale' && (
              <UpscaleWorkspace
                settings={upscaleSettings}
                onChange={(patch) => setUpscaleSettings((prev) => ({ ...prev, ...patch }))}
                currentVideo={currentVideo}
                onReset={() => setUpscaleSettings(defaultUpscale)}
              />
            )}

            {currentTab === 'restore' && (
              <RestoreWorkspace
                settings={restoreSettings}
                onChange={(patch) => setRestoreSettings((prev) => ({ ...prev, ...patch }))}
                onReset={() => setRestoreSettings(defaultRestore)}
              />
            )}

            {currentTab === 'anime' && (
              <AnimeWorkspace
                settings={animeSettings}
                onChange={(patch) => setAnimeSettings((prev) => ({ ...prev, ...patch }))}
                onReset={() => setAnimeSettings(defaultAnime)}
              />
            )}

            {currentTab === 'color' && (
              <ColorWorkspace
                settings={colorSettings}
                onChange={(patch) => setColorSettings((prev) => ({ ...prev, ...patch }))}
                onReset={() => setColorSettings(defaultColor)}
              />
            )}

            {currentTab === 'resize' && (
              <ResizeWorkspace
                settings={resizeSettings}
                onChange={(patch) => setResizeSettings((prev) => ({ ...prev, ...patch }))}
                currentVideo={currentVideo}
                onReset={() => setResizeSettings(defaultResize)}
              />
            )}

            {currentTab === 'editor' && (
              <EditorWorkspace
                editorSettings={editorSettings}
                fpsSettings={fpsSettings}
                onEditorChange={(patch) => setEditorSettings((prev) => ({ ...prev, ...patch }))}
                onFpsChange={(patch) => setFpsSettings((prev) => ({ ...prev, ...patch }))}
                currentVideo={currentVideo}
                onReset={() => {
                  setEditorSettings(defaultEditor);
                  setFpsSettings(defaultFps);
                }}
              />
            )}

            {currentTab === 'assistant' && (
              <AssistantWorkspace
                currentVideo={currentVideo}
                onApplyProposal={handleApplyProposal}
              />
            )}

            {currentTab === 'ffmpeg' && (
              <FfmpegWorkspace
                currentVideo={currentVideo}
                enhanceSettings={enhanceSettings}
                upscaleSettings={upscaleSettings}
                restoreSettings={restoreSettings}
                colorSettings={colorSettings}
                resizeSettings={resizeSettings}
                fpsSettings={fpsSettings}
                editorSettings={editorSettings}
                exportSettings={exportSettings}
                onJobStarted={(jobId) => {
                  loadJobs();
                  setCurrentTab('history');
                }}
              />
            )}

            {currentTab === 'export' && (
              <ExportWorkspace
                settings={exportSettings}
                onChange={(patch) => setExportSettings((prev) => ({ ...prev, ...patch }))}
                currentVideo={currentVideo}
                onStartExport={handleTriggerExport}
                isProcessing={isProcessing}
              />
            )}

            {currentTab === 'history' && (
              <HistoryWorkspace
                jobs={jobs}
                onCancelJob={handleCancelJob}
                onDeleteJob={handleDeleteJob}
                onRefreshJobs={loadJobs}
              />
            )}

            {currentTab === 'settings' && <SettingsWorkspace />}
          </div>
        </div>
      </div>
    </div>
  );
}
