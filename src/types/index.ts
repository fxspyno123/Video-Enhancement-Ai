export type WorkspaceTab =
  | 'home'
  | 'enhance'
  | 'upscale'
  | 'restore'
  | 'anime'
  | 'color'
  | 'resize'
  | 'editor'
  | 'assistant'
  | 'ffmpeg'
  | 'export'
  | 'history'
  | 'settings';

export interface VideoMetadata {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  formattedSize: string;
  duration: number;
  formattedDuration: string;
  width: number;
  height: number;
  resolutionLabel: string;
  fps: number;
  codec: string;
  audioCodec: string;
  audioChannels: number;
  sampleRate: number;
  bitrate: number;
  url: string;
  thumbnailUrl?: string;
}

export interface EnhanceSettings {
  mode: 'fast' | 'hq' | 'ai';
  enhancementStrength: number;
  noiseReduction: number;
  sharpening: number;
  detailRecovery: number;
  texturePreservation: number;
  deblocking: boolean;
  deblockingStrength: number;
  debanding: boolean;
  debandingStrength: number;
  deblur: boolean;
  deblurStrength: number;
  edgeEnhancement: number;
  grainPreservation: number;
  faceEnhancement: boolean;
  motionArtifactReduction: boolean;
}

export interface UpscaleSettings {
  targetResolution: 'original' | '480p' | '540p' | '720p' | '1080p' | '2k' | '4k' | 'custom';
  customWidth: number;
  customHeight: number;
  scaleFactor: '1x' | '2x' | '4x';
  aiModel: 'realesrgan-x4plus' | 'realesr-animevideov3' | 'waifu2x' | 'edsr' | 'bicubic-sharp' | 'lanczos-hq';
  maintainAspectRatio: boolean;
  denoiseBeforeUpscale: number;
  sharpening: number;
  detailRecovery: number;
}

export interface RestoreSettings {
  denoiseStrength: number;
  deblocking: boolean;
  deblockingStrength: number;
  deband: boolean;
  debandStrength: number;
  deflicker: boolean;
  deinterlace: boolean;
  stabilization: boolean;
  compressionArtifactRemoval: boolean;
  sharpening: number;
  colorFadingCorrection: boolean;
  grainPreservation: number;
  motionBlurReduction: boolean;
}

export interface AnimeSettings {
  preset:
    | 'anime-clean'
    | 'anime-1080p'
    | 'anime-2k'
    | 'anime-4k'
    | 'old-anime-restore'
    | 'anime-color-boost'
    | 'anime-60fps'
    | 'anime-120fps'
    | 'custom';
  lineArtPreservation: number;
  flatColorPreservation: number;
  edgeRefinement: number;
  colorBandingReduction: number;
  compressionCleanup: number;
  denoising: number;
  fineLineEnhancement: number;
  frameInterpolation: boolean;
}

export interface ColorSettings {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  exposure: number; // -100 to 100
  saturation: number; // -100 to 100
  temperature: number; // -100 to 100
  tint: number; // -100 to 100
  highlights: number; // -100 to 100
  shadows: number; // -100 to 100
  whites: number; // -100 to 100
  blacks: number; // -100 to 100
  gamma: number; // -100 to 100
  vibrance: number; // -100 to 100
  sharpness: number; // 0 to 100
  fade: number; // 0 to 100
  vignette: number; // 0 to 100
  hue: number; // -180 to 180
  rgbRed: number; // -100 to 100
  rgbGreen: number; // -100 to 100
  rgbBlue: number; // -100 to 100
  lutPreset:
    | 'none'
    | 'natural'
    | 'cinematic'
    | 'warm'
    | 'cool'
    | 'film-look'
    | 'dark-moody'
    | 'vibrant-anime'
    | 'social-media';
  lutIntensity: number; // 0 to 100
}

export interface ResizeSettings {
  aspectRatio: 'original' | '1:1' | '9:16' | '16:9' | '4:5' | 'custom';
  customRatioWidth: number;
  customRatioHeight: number;
  mode: 'fit-preserve' | 'blur-background' | 'solid-background' | 'ai-background-extension' | 'smart-reframe';
  blurRadius: number; // 1 to 50
  blurSaturation: number; // 0 to 200
  blurBrightness: number; // 0 to 200
  solidColor: string;
  position: 'center' | 'top' | 'bottom';
}

export interface FpsSettings {
  outputFps: 'original' | '30' | '60' | '120';
  method: 'standard' | 'optical-flow' | 'rife-ai' | 'slow-motion';
  slowMotionFactor: number; // 0.25 to 1.0
  interpolationStrength: number; // 0 to 100
  sceneChangeDetection: boolean;
  motionArtifactReduction: boolean;
}

export interface EditorSettings {
  trimStart: number;
  trimEnd: number;
  playbackSpeed: number; // 0.25 to 4.0
  cropEnabled: boolean;
  crop: { x: number; y: number; width: number; height: number } | null;
  rotate: 0 | 90 | 180 | 270;
  flipHorizontal: boolean;
  flipVertical: boolean;
  muteAudio: boolean;
  volume: number; // 0 to 200
  fadeIn: number; // seconds
  fadeOut: number; // seconds
}

export interface ExportSettings {
  resolution: 'original' | '480p' | '540p' | '720p' | '1080p' | '2k' | '4k' | 'custom';
  fps: 'original' | '30' | '60' | '120';
  bitrateMode: 'auto' | 'custom';
  bitrateMbps: number;
  codec: 'h264' | 'hevc' | 'vp9';
  format: 'mp4' | 'webm' | 'mkv' | 'mov';
  audioMode: 'passthrough' | 'reencode' | 'mute';
  audioCodec: 'aac' | 'mp3' | 'opus';
  audioBitrate: string;
  outputFilename: string;
}

export interface ProcessingJob {
  id: string;
  title: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  stage: string;
  sourceFile: string;
  sourceMetadata?: VideoMetadata;
  outputFile?: string;
  outputUrl?: string;
  outputSize?: number;
  formattedOutputSize?: string;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  etaSeconds?: number;
  appliedModules: string[];
}

export interface AssistantChangeProposal {
  explanation: string;
  summary: string;
  changes: {
    module: string;
    setting: string;
    oldValue: any;
    newValue: any;
  }[];
  configPatch: {
    enhance?: Partial<EnhanceSettings>;
    upscale?: Partial<UpscaleSettings>;
    restore?: Partial<RestoreSettings>;
    anime?: Partial<AnimeSettings>;
    color?: Partial<ColorSettings>;
    resize?: Partial<ResizeSettings>;
    fps?: Partial<FpsSettings>;
    editor?: Partial<EditorSettings>;
    exportSettings?: Partial<ExportSettings>;
  };
}
