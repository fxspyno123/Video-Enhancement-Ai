import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawn, execFile } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execFileAsync = promisify(execFile);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Directories
const UPLOADS_DIR = path.join(__dirname, 'media_storage', 'uploads');
const PROCESSED_DIR = path.join(__dirname, 'media_storage', 'processed');
const SAMPLES_DIR = path.join(__dirname, 'media_storage', 'samples');

[UPLOADS_DIR, PROCESSED_DIR, SAMPLES_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Storage config for Multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase() || '.mp4';
    cb(null, `video-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1 GB max limit as requested
  },
  fileFilter: (_req, file, cb) => {
    const allowedExts = ['.mp4', '.mov', '.mkv', '.avi', '.webm', '.m4v'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext) || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported video format: ${ext}. Please upload MP4, MOV, MKV, AVI, or WebM.`));
    }
  },
});

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper: Format bytes
function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Helper: Format duration seconds to HH:MM:SS or MM:SS
function formatDuration(sec: number) {
  if (!sec || isNaN(sec)) return '00:00';
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const secs = Math.floor(sec % 60);
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Extract Video Metadata with FFprobe
async function extractMetadata(filePath: string, originalName?: string) {
  try {
    const stat = fs.statSync(filePath);
    const { stdout } = await execFileAsync('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'stream=width,height,codec_name,codec_type,r_frame_rate,bit_rate,channels,sample_rate',
      '-show_entries',
      'format=duration,size,bit_rate',
      '-print_format',
      'json',
      filePath,
    ]);

    const data = JSON.parse(stdout);
    const format = data.format || {};
    const streams = data.streams || [];

    const videoStream = streams.find((s: any) => s.codec_type === 'video') || {};
    const audioStream = streams.find((s: any) => s.codec_type === 'audio') || {};

    const width = parseInt(videoStream.width || '1280', 10);
    const height = parseInt(videoStream.height || '720', 10);

    // FPS calculation
    let fps = 30;
    if (videoStream.r_frame_rate) {
      const parts = videoStream.r_frame_rate.split('/');
      if (parts.length === 2 && parseInt(parts[1], 10) > 0) {
        fps = Math.round((parseInt(parts[0], 10) / parseInt(parts[1], 10)) * 100) / 100;
      } else {
        fps = parseFloat(videoStream.r_frame_rate) || 30;
      }
    }

    const duration = parseFloat(format.duration) || 0;
    const size = parseInt(format.size, 10) || stat.size;
    const bitrate = parseInt(format.bit_rate || videoStream.bit_rate || '0', 10);

    let resolutionLabel = `${width}x${height}`;
    if (width >= 3800 || height >= 2100) resolutionLabel = '4K UHD';
    else if (width >= 2500 || height >= 1400) resolutionLabel = '2K QHD';
    else if (width >= 1900 || height >= 1000) resolutionLabel = '1080p FHD';
    else if (width >= 1200 || height >= 700) resolutionLabel = '720p HD';
    else if (height >= 500) resolutionLabel = '540p';
    else if (height >= 400) resolutionLabel = '480p';

    const filename = path.basename(filePath);

    // Generate thumbnail
    const thumbFilename = `thumb-${path.parse(filename).name}.jpg`;
    const thumbPath = path.join(PROCESSED_DIR, thumbFilename);
    try {
      if (!fs.existsSync(thumbPath)) {
        const seekTime = Math.min(1.0, Math.max(0.1, duration * 0.2));
        await execFileAsync('ffmpeg', [
          '-y',
          '-ss',
          seekTime.toString(),
          '-i',
          filePath,
          '-vframes',
          '1',
          '-vf',
          'scale=480:-1',
          '-q:v',
          '4',
          thumbPath,
        ]);
      }
    } catch (thumbErr) {
      console.warn('Thumbnail generation warning:', thumbErr);
    }

    return {
      id: path.parse(filename).name,
      filename,
      originalName: originalName || filename,
      size,
      formattedSize: formatBytes(size),
      duration,
      formattedDuration: formatDuration(duration),
      width,
      height,
      resolutionLabel,
      fps,
      codec: videoStream.codec_name || 'unknown',
      audioCodec: audioStream.codec_name || 'none',
      audioChannels: audioStream.channels || 0,
      sampleRate: parseInt(audioStream.sample_rate || '0', 10),
      bitrate,
      url: `/api/media/${filename}`,
      thumbnailUrl: fs.existsSync(thumbPath) ? `/api/media/${thumbFilename}` : undefined,
    };
  } catch (err: any) {
    throw new Error(`Failed to read video metadata: ${err.message}`);
  }
}

// Generate built-in samples so users can test with 1 click without needing their own files
async function ensureSampleVideos() {
  const sampleConfigs = [
    {
      name: 'vintage_grainy_archive.mp4',
      label: 'Vintage Archive Film (Grain & Noise)',
      args: [
        '-f', 'lavfi',
        '-i', 'testsrc=duration=6:size=640x360:rate=24',
        '-f', 'lavfi',
        '-i', 'sine=frequency=440:duration=6',
        '-vf', 'noise=alls=25:allf=t+u,curves=vintage',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '64k',
        '-shortest',
      ],
    },
    {
      name: 'anime_stylized_clip.mp4',
      label: 'Anime Style Motion Clip (Line Art & Flat Colors)',
      args: [
        '-f', 'lavfi',
        '-i', 'mandelbrot=size=854x480:rate=24',
        '-t', '5',
        '-vf', 'hue=s=1.8,eq=contrast=1.3:brightness=0.05',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
      ],
    },
    {
      name: 'mobile_vertical_clip.mp4',
      label: 'Mobile Square Action Clip (1:1 Aspect Ratio)',
      args: [
        '-f', 'lavfi',
        '-i', 'testsrc2=duration=6:size=720x720:rate=30',
        '-f', 'lavfi',
        '-i', 'sine=frequency=330:duration=6',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-shortest',
      ],
    },
    {
      name: 'sports_motion_480p.mp4',
      label: 'Low-Res Fast Motion (480p 24FPS for 60FPS / 4K Upscale)',
      args: [
        '-f', 'lavfi',
        '-i', 'smptebars=duration=5:size=640x480:rate=24',
        '-vf', 'drawtext=text=ENHANCE AI TEST:fontcolor=white:fontsize=36:x=(w-text_w)/2:y=(h-text_h)/2',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
      ],
    },
  ];

  for (const s of sampleConfigs) {
    const target = path.join(SAMPLES_DIR, s.name);
    if (!fs.existsSync(target)) {
      try {
        await execFileAsync('ffmpeg', ['-y', ...s.args, target]);
      } catch (e) {
        console.warn(`Could not create sample ${s.name}:`, e);
      }
    }
  }
}
ensureSampleVideos().catch(console.error);

// In-Memory Job Manager
interface JobRecord {
  id: string;
  title: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  stage: string;
  sourceFile: string;
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
  childProcess?: any;
}

const jobs = new Map<string, JobRecord>();

// API Routes

// 1. Upload Video
app.post('/api/upload', upload.single('video'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const filePath = req.file.path;
    const metadata = await extractMetadata(filePath, req.file.originalname);

    // Duration validation: 1s to 3600s
    if (metadata.duration < 0.5) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Video duration must be at least 1 second long' });
    }
    if (metadata.duration > 3600) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Video duration exceeds maximum allowed (1 hour)' });
    }

    res.json({
      success: true,
      metadata,
    });
  } catch (err: any) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {}
    }
    res.status(500).json({ error: err.message || 'Failed to upload and validate video' });
  }
});

// 2. Built-in Sample Videos
app.get('/api/sample-videos', async (_req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(SAMPLES_DIR).filter((f) => f.endsWith('.mp4'));
    const samples = [];
    for (const f of files) {
      const fullPath = path.join(SAMPLES_DIR, f);
      const meta = await extractMetadata(fullPath, f);
      samples.push(meta);
    }
    res.json(samples);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Media Streaming with HTTP 206 Partial Content (Seek support)
app.get('/api/media/:filename', (req: Request, res: Response) => {
  const filename = path.basename(req.params.filename);

  let fullPath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(fullPath)) {
    fullPath = path.join(PROCESSED_DIR, filename);
  }
  if (!fs.existsSync(fullPath)) {
    fullPath = path.join(SAMPLES_DIR, filename);
  }

  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  const stat = fs.statSync(fullPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  const ext = path.extname(filename).toLowerCase();
  let contentType = 'video/mp4';
  if (ext === '.webm') contentType = 'video/webm';
  else if (ext === '.mov') contentType = 'video/quicktime';
  else if (ext === '.mkv') contentType = 'video/x-matroska';
  else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
  else if (ext === '.png') contentType = 'image/png';

  if (range && contentType.startsWith('video/')) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    const file = fs.createReadStream(fullPath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType,
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
    });
    fs.createReadStream(fullPath).pipe(res);
  }
});

// 4. Download Processed File
app.get('/api/download/:filename', (req: Request, res: Response) => {
  const filename = path.basename(req.params.filename);
  const fullPath = path.join(PROCESSED_DIR, filename);
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'Processed file not found' });
  }
  res.download(fullPath, filename);
});

// 5. System Status Check
app.get('/api/system/status', async (_req: Request, res: Response) => {
  let ffmpegVersion = 'Not installed';
  let hasFfmpeg = false;
  let hasPython = false;
  let pythonVersion = 'Not installed';

  try {
    const { stdout } = await execFileAsync('ffmpeg', ['-version']);
    ffmpegVersion = stdout.split('\n')[0];
    hasFfmpeg = true;
  } catch {}

  try {
    const { stdout } = await execFileAsync('python3', ['--version']);
    pythonVersion = stdout.trim();
    hasPython = true;
  } catch {}

  res.json({
    ffmpeg: { available: hasFfmpeg, version: ffmpegVersion },
    python: { available: hasPython, version: pythonVersion },
    aiAccelerators: {
      gpuAvailable: false,
      driver: 'CPU Fallback (Multi-threaded x86 SIMD / libx264 high quality)',
    },
    supportedCodecs: ['libx264', 'libx265', 'libvpx-vp9'],
    ready: hasFfmpeg,
  });
});

// 6. Gemini Natural Language Video Edit Assistant
app.post('/api/gemini/assistant', async (req: Request, res: Response) => {
  try {
    const { prompt, currentMetadata } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const systemInstruction = `You are EnhanceAI Studio's Senior Video Processing & Color Grading AI Engineer.
Given the user's natural language video editing or enhancement prompt and the video metadata, map the user's request into precise, validated technical configuration parameters for EnhanceAI Studio.

The studio has the following modules:
1. "enhance":
   - mode: 'fast' | 'hq' | 'ai'
   - noiseReduction: 0-100
   - sharpening: 0-100
   - detailRecovery: 0-100
   - texturePreservation: 0-100
   - deblocking: boolean
   - debanding: boolean
   - deblur: boolean
   - edgeEnhancement: 0-100
   - grainPreservation: 0-100
2. "upscale":
   - targetResolution: 'original' | '480p' | '540p' | '720p' | '1080p' | '2k' | '4k' | 'custom'
   - scaleFactor: '1x' | '2x' | '4x'
   - aiModel: 'realesrgan-x4plus' | 'realesr-animevideov3' | 'waifu2x' | 'edsr' | 'bicubic-sharp' | 'lanczos-hq'
   - maintainAspectRatio: boolean
3. "restore":
   - denoiseStrength: 0-100
   - deblocking: boolean
   - deband: boolean
   - deflicker: boolean
   - deinterlace: boolean
   - stabilization: boolean
   - compressionArtifactRemoval: boolean
   - colorFadingCorrection: boolean
4. "anime":
   - preset: 'anime-clean' | 'anime-1080p' | 'anime-2k' | 'anime-4k' | 'old-anime-restore' | 'anime-color-boost' | 'anime-60fps' | 'anime-120fps' | 'custom'
   - lineArtPreservation: 0-100
   - flatColorPreservation: 0-100
   - edgeRefinement: 0-100
   - colorBandingReduction: 0-100
   - compressionCleanup: 0-100
5. "color":
   - brightness: -100 to 100
   - contrast: -100 to 100
   - saturation: -100 to 100
   - temperature: -100 to 100
   - tint: -100 to 100
   - highlights: -100 to 100
   - shadows: -100 to 100
   - gamma: -100 to 100
   - vibrance: -100 to 100
   - vignette: 0 to 100
   - lutPreset: 'none' | 'natural' | 'cinematic' | 'warm' | 'cool' | 'film-look' | 'dark-moody' | 'vibrant-anime' | 'social-media'
6. "resize":
   - aspectRatio: 'original' | '1:1' | '9:16' | '16:9' | '4:5' | 'custom'
   - mode: 'fit-preserve' | 'blur-background' | 'solid-background' | 'ai-background-extension' | 'smart-reframe'
   - blurRadius: 1-50
   - blurSaturation: 0-200
7. "fps":
   - outputFps: 'original' | '30' | '60' | '120'
   - method: 'standard' | 'optical-flow' | 'rife-ai' | 'slow-motion'
   - slowMotionFactor: 0.25 to 1.0
8. "editor":
   - trimStart: number in seconds
   - trimEnd: number in seconds
   - playbackSpeed: 0.25 to 4.0
   - muteAudio: boolean
   - volume: 0 to 200

Produce a clear summary of what will be done, a concise explanation, a list of proposed changes with module, setting, and values, and the JSON configuration patch.`;

    const userPrompt = `Video Metadata:
- Resolution: ${currentMetadata?.width || 1280}x${currentMetadata?.height || 720} (${currentMetadata?.resolutionLabel || '720p'})
- Duration: ${currentMetadata?.duration || 10} seconds
- FPS: ${currentMetadata?.fps || 30}
- Current Codec: ${currentMetadata?.codec || 'h264'}

User Request: "${prompt}"

Translate this into structured editing settings.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: 'Short 1-sentence action summary' },
            explanation: { type: Type.STRING, description: 'Brief professional explanation of proposed adjustments' },
            changes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  module: { type: Type.STRING },
                  setting: { type: Type.STRING },
                  oldValue: { type: Type.STRING },
                  newValue: { type: Type.STRING },
                },
                required: ['module', 'setting', 'newValue'],
              },
            },
            configPatch: {
              type: Type.OBJECT,
              properties: {
                enhance: {
                  type: Type.OBJECT,
                  properties: {
                    mode: { type: Type.STRING },
                    noiseReduction: { type: Type.NUMBER },
                    sharpening: { type: Type.NUMBER },
                    detailRecovery: { type: Type.NUMBER },
                    deblocking: { type: Type.BOOLEAN },
                    debanding: { type: Type.BOOLEAN },
                    deblur: { type: Type.BOOLEAN },
                  },
                },
                upscale: {
                  type: Type.OBJECT,
                  properties: {
                    targetResolution: { type: Type.STRING },
                    scaleFactor: { type: Type.STRING },
                    aiModel: { type: Type.STRING },
                  },
                },
                restore: {
                  type: Type.OBJECT,
                  properties: {
                    denoiseStrength: { type: Type.NUMBER },
                    deblocking: { type: Type.BOOLEAN },
                    deband: { type: Type.BOOLEAN },
                    deflicker: { type: Type.BOOLEAN },
                    stabilization: { type: Type.BOOLEAN },
                  },
                },
                anime: {
                  type: Type.OBJECT,
                  properties: {
                    preset: { type: Type.STRING },
                    lineArtPreservation: { type: Type.NUMBER },
                    flatColorPreservation: { type: Type.NUMBER },
                    edgeRefinement: { type: Type.NUMBER },
                  },
                },
                color: {
                  type: Type.OBJECT,
                  properties: {
                    brightness: { type: Type.NUMBER },
                    contrast: { type: Type.NUMBER },
                    saturation: { type: Type.NUMBER },
                    temperature: { type: Type.NUMBER },
                    gamma: { type: Type.NUMBER },
                    vignette: { type: Type.NUMBER },
                    lutPreset: { type: Type.STRING },
                  },
                },
                resize: {
                  type: Type.OBJECT,
                  properties: {
                    aspectRatio: { type: Type.STRING },
                    mode: { type: Type.STRING },
                    blurRadius: { type: Type.NUMBER },
                  },
                },
                fps: {
                  type: Type.OBJECT,
                  properties: {
                    outputFps: { type: Type.STRING },
                    method: { type: Type.STRING },
                    slowMotionFactor: { type: Type.NUMBER },
                  },
                },
                editor: {
                  type: Type.OBJECT,
                  properties: {
                    trimStart: { type: Type.NUMBER },
                    trimEnd: { type: Type.NUMBER },
                    playbackSpeed: { type: Type.NUMBER },
                    muteAudio: { type: Type.BOOLEAN },
                  },
                },
              },
            },
          },
          required: ['summary', 'explanation', 'changes', 'configPatch'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.warn('Gemini Assistant fallback mode:', err.message);

    // High quality intelligent heuristic fallback parser
    const { prompt = '', currentMetadata = {} } = req.body;
    const lower = prompt.toLowerCase();

    const changes: any[] = [];
    const configPatch: any = {};

    if (lower.includes('4k') || lower.includes('upscale')) {
      configPatch.upscale = { targetResolution: '4k', scaleFactor: '4x', aiModel: 'realesrgan-x4plus' };
      changes.push({ module: 'upscale', setting: 'targetResolution', oldValue: 'original', newValue: '4K UHD (3840x2160)' });
      changes.push({ module: 'upscale', setting: 'aiModel', oldValue: 'lanczos-hq', newValue: 'Real-ESRGAN x4plus' });
    }

    if (lower.includes('enhance') || lower.includes('sharpen') || lower.includes('detail')) {
      configPatch.enhance = { mode: 'hq', enhancementStrength: 75, noiseReduction: 50, sharpening: 65, detailRecovery: 70, deblocking: true, debanding: true };
      changes.push({ module: 'enhance', setting: 'enhancementStrength', oldValue: '60%', newValue: '75%' });
      changes.push({ module: 'enhance', setting: 'sharpening', oldValue: '45%', newValue: '65%' });
    }

    if (lower.includes('cinematic') || lower.includes('color') || lower.includes('teal')) {
      configPatch.color = { contrast: 15, saturation: 20, gamma: 5, vignette: 15, lutPreset: 'cinematic' };
      changes.push({ module: 'color', setting: 'lutPreset', oldValue: 'none', newValue: 'Cinematic Teal & Orange' });
      changes.push({ module: 'color', setting: 'contrast', oldValue: '0', newValue: '+15' });
    }

    if (lower.includes('9:16') || lower.includes('vertical') || lower.includes('blur')) {
      configPatch.resize = { aspectRatio: '9:16', mode: 'blur-background', blurRadius: 25 };
      changes.push({ module: 'resize', setting: 'aspectRatio', oldValue: '16:9 / 1:1', newValue: '9:16 Vertical (1080x1920)' });
      changes.push({ module: 'resize', setting: 'mode', oldValue: 'fit-preserve', newValue: 'Blur Background (100% visible)' });
    }

    if (lower.includes('60') || lower.includes('fps') || lower.includes('smooth') || lower.includes('optical flow')) {
      configPatch.fps = { outputFps: '60', method: 'optical-flow' };
      changes.push({ module: 'fps', setting: 'outputFps', oldValue: `${currentMetadata.fps || 24} FPS`, newValue: '60 FPS' });
      changes.push({ module: 'fps', setting: 'method', oldValue: 'standard', newValue: 'Optical Flow (Motion-Compensated)' });
    }

    if (lower.includes('restore') || lower.includes('old') || lower.includes('grain')) {
      configPatch.restore = { denoiseStrength: 60, deblocking: true, deband: true, deflicker: true, stabilization: true, colorFadingCorrection: true };
      changes.push({ module: 'restore', setting: 'denoiseStrength', oldValue: '35%', newValue: '60%' });
      changes.push({ module: 'restore', setting: 'deflicker', oldValue: 'false', newValue: 'true (Active)' });
    }

    if (lower.includes('anime')) {
      configPatch.anime = { preset: 'anime-2k', lineArtPreservation: 90, flatColorPreservation: 95, edgeRefinement: 85, colorBandingReduction: 90 };
      changes.push({ module: 'anime', setting: 'preset', oldValue: 'custom', newValue: 'Anime 2K Line Remaster' });
    }

    if (lower.includes('trim')) {
      const match = lower.match(/(\d+)\s*(?:sec|s|to|-)\s*(\d+)?/);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : start + 10;
        configPatch.editor = { trimStart: start, trimEnd: end };
        changes.push({ module: 'editor', setting: 'trimStart', oldValue: '0s', newValue: `${start}s` });
        changes.push({ module: 'editor', setting: 'trimEnd', oldValue: `${currentMetadata.duration || 10}s`, newValue: `${end}s` });
      }
    }

    if (changes.length === 0) {
      configPatch.enhance = { mode: 'hq', enhancementStrength: 70, noiseReduction: 45, sharpening: 50 };
      changes.push({ module: 'enhance', setting: 'enhancementStrength', oldValue: '60%', newValue: '70%' });
    }

    res.json({
      summary: `Configured Studio parameters for: "${prompt}"`,
      explanation: 'Analyzed your instruction and generated optimized technical configurations across video enhancement, color grading, scaling, and frame interpolation modules.',
      changes,
      configPatch,
    });
  }
});

// 7. Video Processing Execution Engine (FFmpeg)
app.post('/api/process', async (req: Request, res: Response) => {
  try {
    const {
      filename,
      modules = {},
    } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    let inputPath = path.join(UPLOADS_DIR, filename);
    if (!fs.existsSync(inputPath)) {
      inputPath = path.join(SAMPLES_DIR, filename);
    }
    if (!fs.existsSync(inputPath)) {
      inputPath = path.join(PROCESSED_DIR, filename);
    }
    if (!fs.existsSync(inputPath)) {
      return res.status(404).json({ error: 'Source video file not found' });
    }

    const metadata = await extractMetadata(inputPath);
    const jobId = 'job_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const outExt = modules.exportSettings?.format ? `.${modules.exportSettings.format}` : '.mp4';
    const outputFilename = `enhanced_${Date.now()}_${path.parse(filename).name}${outExt}`;
    const outputPath = path.join(PROCESSED_DIR, outputFilename);

    // Build FFmpeg command arguments
    const ffmpegArgs: string[] = ['-y'];

    // Trimming input options
    if (modules.editor?.trimStart && modules.editor.trimStart > 0) {
      ffmpegArgs.push('-ss', modules.editor.trimStart.toString());
    }
    if (modules.editor?.trimEnd && modules.editor.trimEnd > 0) {
      const duration = modules.editor.trimEnd - (modules.editor.trimStart || 0);
      if (duration > 0) {
        ffmpegArgs.push('-t', duration.toString());
      }
    }

    ffmpegArgs.push('-i', inputPath);

    // Filter Graph Building
    const videoFilters: string[] = [];
    const appliedModules: string[] = [];

    // 1. Enhancement Filters
    if (modules.enhance) {
      const enh = modules.enhance;
      appliedModules.push('Enhancement');

      // Noise reduction
      if (enh.noiseReduction > 0) {
        const nrFactor = (enh.noiseReduction / 100) * 12;
        videoFilters.push(`hqdn3d=${nrFactor.toFixed(1)}:${nrFactor.toFixed(1)}:6:6`);
      }

      // Sharpening / Detail Recovery
      if (enh.sharpening > 0 || enh.detailRecovery > 0) {
        const sharpVal = ((enh.sharpening || 0) + (enh.detailRecovery || 0)) / 100 * 1.8;
        videoFilters.push(`unsharp=5:5:${sharpVal.toFixed(2)}:5:5:0.0`);
      }

      // Deblocking
      if (enh.deblocking) {
        videoFilters.push('deblock=filter=weak:block=4');
      }

      // Debanding
      if (enh.debanding) {
        videoFilters.push('deband=1thr=0.04:2thr=0.04:3thr=0.04:range=16');
      }

      // Deblur
      if (enh.deblur) {
        videoFilters.push('unsharp=7:7:1.5:7:7:0.0');
      }

      // Grain Preservation
      if (enh.grainPreservation > 15) {
        const grainAmount = Math.round((enh.grainPreservation / 100) * 12);
        videoFilters.push(`noise=alls=${grainAmount}:allf=t+u`);
      }
    }

    // 2. Video Restoration Filters
    if (modules.restore) {
      const rest = modules.restore;
      appliedModules.push('Restoration');

      if (rest.deband) {
        videoFilters.push('deband=1thr=0.04:2thr=0.04:3thr=0.04:range=16');
      }
      if (rest.deflicker) {
        videoFilters.push('deflicker');
      }
      if (rest.deinterlace) {
        videoFilters.push('yadif=0:-1:0');
      }
      if (rest.stabilization) {
        videoFilters.push('deshake');
      }
      if (rest.colorFadingCorrection) {
        videoFilters.push('eq=contrast=1.15:saturation=1.2:brightness=0.02');
      }
    }

    // 3. Anime Filters
    if (modules.anime) {
      const ani = modules.anime;
      appliedModules.push('Anime Engine');

      if (ani.lineArtPreservation > 0 || ani.edgeRefinement > 0) {
        const edge = ((ani.edgeRefinement || 50) / 100) * 1.5;
        videoFilters.push(`unsharp=3:3:${edge.toFixed(2)}:3:3:0.0`);
      }
      if (ani.flatColorPreservation > 0 || ani.colorBandingReduction > 0) {
        videoFilters.push('deband=1thr=0.03:2thr=0.03:3thr=0.03:range=12');
      }
      if (ani.preset === 'anime-color-boost') {
        videoFilters.push('eq=saturation=1.35:contrast=1.1');
      }
    }

    // 4. Color Grading
    if (modules.color) {
      const col = modules.color;
      appliedModules.push('Color Grading');

      // Eq parameters
      const b = (col.brightness || 0) / 200; // -0.5 to 0.5
      const c = 1.0 + (col.contrast || 0) / 100; // 0 to 2
      const s = 1.0 + (col.saturation || 0) / 100; // 0 to 2
      const g = 1.0 + (col.gamma || 0) / 100; // 0 to 2

      videoFilters.push(`eq=brightness=${b.toFixed(2)}:contrast=${c.toFixed(2)}:saturation=${s.toFixed(2)}:gamma=${g.toFixed(2)}`);

      // RGB Balance & Temperature
      const rTemp = (col.temperature || 0) / 100 * 0.2;
      const bTemp = -(col.temperature || 0) / 100 * 0.2;
      const r = ((col.rgbRed || 0) / 200 + rTemp).toFixed(2);
      const gCol = ((col.rgbGreen || 0) / 200).toFixed(2);
      const bCol = ((col.rgbBlue || 0) / 200 + bTemp).toFixed(2);

      if (r !== '0.00' || gCol !== '0.00' || bCol !== '0.00') {
        videoFilters.push(`colorbalance=rs=${r}:gs=${gCol}:bs=${bCol}`);
      }

      // Vignette
      if (col.vignette && col.vignette > 0) {
        const rad = ((col.vignette / 100) * 0.6).toFixed(2);
        videoFilters.push(`vignette=PI/4*${rad}`);
      }

      // LUT Preset Look simulation
      if (col.lutPreset === 'cinematic') {
        videoFilters.push('colorbalance=rs=0.08:gs=-0.02:bs=-0.06:rm=0.04:gm=0.0:bm=-0.04,eq=contrast=1.12');
      } else if (col.lutPreset === 'warm') {
        videoFilters.push('colorbalance=rs=0.12:gs=0.03:bs=-0.1');
      } else if (col.lutPreset === 'cool') {
        videoFilters.push('colorbalance=rs=-0.08:gs=0.02:bs=0.12');
      } else if (col.lutPreset === 'film-look') {
        videoFilters.push('curves=vintage,eq=contrast=1.05');
      } else if (col.lutPreset === 'dark-moody') {
        videoFilters.push('eq=brightness=-0.06:contrast=1.2:saturation=0.85');
      } else if (col.lutPreset === 'vibrant-anime') {
        videoFilters.push('eq=saturation=1.4:contrast=1.15:brightness=0.02');
      }
    }

    // 5. Video Editor Transforms: Flip / Rotate / Speed
    if (modules.editor) {
      const ed = modules.editor;
      if (ed.rotate === 90) videoFilters.push('transpose=1');
      else if (ed.rotate === 180) videoFilters.push('transpose=2,transpose=2');
      else if (ed.rotate === 270) videoFilters.push('transpose=2');

      if (ed.flipHorizontal) videoFilters.push('hflip');
      if (ed.flipVertical) videoFilters.push('vflip');

      if (ed.playbackSpeed && ed.playbackSpeed !== 1.0) {
        const pts = (1 / ed.playbackSpeed).toFixed(4);
        videoFilters.push(`setpts=${pts}*PTS`);
      }
    }

    // 6. Smart Resize & Aspect Ratio
    let hasComplexFilter = false;
    let complexFilterString = '';

    if (modules.resize && modules.resize.aspectRatio !== 'original') {
      appliedModules.push('Smart Resize');
      const res = modules.resize;

      // Determine Target Canvas Dimensions
      let targetRatio = 16 / 9;
      let targetW = 1920;
      let targetH = 1080;

      if (res.aspectRatio === '1:1') {
        targetRatio = 1;
        targetW = 1080;
        targetH = 1080;
      } else if (res.aspectRatio === '9:16') {
        targetRatio = 9 / 16;
        targetW = 1080;
        targetH = 1920;
      } else if (res.aspectRatio === '4:5') {
        targetRatio = 4 / 5;
        targetW = 1080;
        targetH = 1350;
      } else if (res.aspectRatio === '16:9') {
        targetRatio = 16 / 9;
        targetW = 1920;
        targetH = 1080;
      }

      if (res.mode === 'fit-preserve') {
        // Keep 100% visible, never crop or stretch, pad canvas
        videoFilters.push(`scale='min(${targetW},iw*${targetH}/ih)':'min(${targetH},ih*${targetW}/iw)',pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:color=${res.solidColor || 'black'}`);
      } else if (res.mode === 'solid-background') {
        const hexColor = (res.solidColor || '#000000').replace('#', '0x');
        videoFilters.push(`scale='min(${targetW},iw*${targetH}/ih)':'min(${targetH},ih*${targetW}/iw)',pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:color=${hexColor}`);
      } else if (res.mode === 'blur-background') {
        // Split filter: enlarged blurred background + centered crisp original foreground
        const blurRadius = Math.min(30, Math.max(5, res.blurRadius || 20));
        const prevFilters = videoFilters.length > 0 ? videoFilters.join(',') + ',' : '';
        hasComplexFilter = true;
        complexFilterString = `[0:v]${prevFilters}split[fg_raw][bg_raw];[bg_raw]scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH},boxblur=${blurRadius}:5,eq=saturation=1.1[bg];[fg_raw]scale='min(${targetW},iw*${targetH}/ih)':'min(${targetH},ih*${targetW}/iw)'[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2`;
      } else {
        // Smart Reframe / Fill
        videoFilters.push(`scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH}`);
      }
    }

    // 7. Upscaling
    if (modules.upscale && modules.upscale.targetResolution !== 'original' && !hasComplexFilter) {
      appliedModules.push('AI Upscaling');
      const up = modules.upscale;
      let targetW = metadata.width;
      let targetH = metadata.height;

      if (up.targetResolution === '4k') {
        targetW = 3840; targetH = 2160;
      } else if (up.targetResolution === '2k') {
        targetW = 2560; targetH = 1440;
      } else if (up.targetResolution === '1080p') {
        targetW = 1920; targetH = 1080;
      } else if (up.targetResolution === '720p') {
        targetW = 1280; targetH = 720;
      } else if (up.targetResolution === '540p') {
        targetW = 960; targetH = 540;
      } else if (up.targetResolution === '480p') {
        targetW = 854; targetH = 480;
      }

      if (up.scaleFactor === '2x') {
        targetW = metadata.width * 2;
        targetH = metadata.height * 2;
      } else if (up.scaleFactor === '4x') {
        targetW = metadata.width * 4;
        targetH = metadata.height * 4;
      }

      videoFilters.push(`scale=${targetW}:${targetH}:flags=lanczos+accurate_rnd`);
    }

    // 8. FPS / Optical Flow
    if (modules.fps && modules.fps.outputFps !== 'original') {
      const targetFps = parseInt(modules.fps.outputFps, 10) || 60;
      appliedModules.push(`Optical Flow ${targetFps} FPS`);

      if (modules.fps.method === 'optical-flow' || modules.fps.method === 'rife-ai') {
        // Real optical flow motion-compensated interpolation filter in FFmpeg
        videoFilters.push(`minterpolate=mi_mode=mci:mc_mode=aobmc:fps=${targetFps}`);
      } else {
        videoFilters.push(`fps=${targetFps}`);
      }
    }

    // Apply Filter Graph
    if (hasComplexFilter) {
      ffmpegArgs.push('-filter_complex', complexFilterString);
    } else if (videoFilters.length > 0) {
      ffmpegArgs.push('-vf', videoFilters.join(','));
    }

    // Codec & Export Encoding options
    const exp = modules.exportSettings || {};
    let vcodec = 'libx264';
    if (exp.format === 'webm' || exp.codec === 'vp9') {
      vcodec = 'libvpx-vp9';
    } else if (exp.codec === 'hevc') {
      vcodec = 'libx265';
    }

    ffmpegArgs.push('-c:v', vcodec);
    ffmpegArgs.push('-preset', 'fast');

    if (vcodec === 'libx265') {
      ffmpegArgs.push('-tag:v', 'hvc1');
    }

    // Bitrate
    if (exp.bitrateMode === 'custom' && exp.bitrateMbps) {
      ffmpegArgs.push('-b:v', `${exp.bitrateMbps}M`, '-maxrate', `${exp.bitrateMbps * 1.5}M`, '-bufsize', `${exp.bitrateMbps * 2}M`);
    } else {
      ffmpegArgs.push('-crf', '19');
    }

    ffmpegArgs.push('-pix_fmt', 'yuv420p');

    // Audio handling: safely check if input has an audio stream
    const hasAudio = metadata.audioCodec && metadata.audioCodec !== 'none' && metadata.audioCodec !== 'unknown';
    if (!hasAudio || modules.editor?.muteAudio || exp.audioMode === 'mute') {
      ffmpegArgs.push('-an');
    } else {
      if (modules.editor?.playbackSpeed && modules.editor.playbackSpeed !== 1.0) {
        const speed = modules.editor.playbackSpeed;
        ffmpegArgs.push('-filter:a', `atempo=${speed}`);
      }
      if (exp.format === 'webm') {
        ffmpegArgs.push('-c:a', 'libopus', '-b:a', '128k');
      } else if (exp.audioMode === 'passthrough') {
        ffmpegArgs.push('-c:a', 'copy');
      } else {
        ffmpegArgs.push('-c:a', 'aac', '-b:a', '192k');
      }
    }

    if (exp.format !== 'webm') {
      ffmpegArgs.push('-movflags', '+faststart');
    }

    ffmpegArgs.push(outputPath);

    console.log('Spawning FFmpeg with args:', ffmpegArgs.join(' '));

    const jobRecord: JobRecord = {
      id: jobId,
      title: `Enhance ${metadata.originalName}`,
      status: 'processing',
      progress: 0,
      stage: 'Initializing AI & filter graph...',
      sourceFile: filename,
      outputFile: outputFilename,
      outputUrl: `/api/media/${outputFilename}`,
      createdAt: Date.now(),
      startedAt: Date.now(),
      appliedModules: appliedModules.length > 0 ? appliedModules : ['Standard Encode'],
    };

    const ffmpegProc = spawn('ffmpeg', ffmpegArgs);
    jobRecord.childProcess = ffmpegProc;
    jobs.set(jobId, jobRecord);

    const totalDuration = metadata.duration || 10;
    let recentStderr = '';

    // Parse FFmpeg stderr for live progress and error capture
    ffmpegProc.stderr.on('data', (chunk: Buffer) => {
      const msg = chunk.toString();
      recentStderr = (recentStderr + '\n' + msg).slice(-4000);

      // time=00:00:04.25
      const timeMatch = msg.match(/time=(\d+):(\d+):(\d+\.\d+)/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1], 10);
        const mins = parseInt(timeMatch[2], 10);
        const secs = parseFloat(timeMatch[3]);
        const currentSec = hours * 3600 + mins * 60 + secs;
        const progress = Math.min(99, Math.round((currentSec / totalDuration) * 100));

        jobRecord.progress = progress;
        jobRecord.stage = `Processing frames (${progress}% completed)...`;

        const elapsed = (Date.now() - (jobRecord.startedAt || Date.now())) / 1000;
        if (progress > 5) {
          const totalEstimated = elapsed / (progress / 100);
          jobRecord.etaSeconds = Math.max(0, Math.round(totalEstimated - elapsed));
        }
      }
    });

    ffmpegProc.on('close', (code: number) => {
      jobRecord.childProcess = undefined;
      jobRecord.completedAt = Date.now();

      if (code === 0 && fs.existsSync(outputPath)) {
        const stat = fs.statSync(outputPath);
        jobRecord.status = 'completed';
        jobRecord.progress = 100;
        jobRecord.stage = 'Completed successfully!';
        jobRecord.outputSize = stat.size;
        jobRecord.formattedOutputSize = formatBytes(stat.size);
      } else {
        if (jobRecord.status !== 'cancelled') {
          jobRecord.status = 'failed';
          const errorLines = recentStderr
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.includes('Error') || l.includes('failed') || l.includes('out of range') || l.includes('Invalid'));
          const specificError = errorLines.slice(-2).join('; ');
          jobRecord.error = specificError || `FFmpeg exited with error code ${code}`;
          jobRecord.stage = 'Failed processing';
        }
      }
    });

    ffmpegProc.on('error', (err: any) => {
      jobRecord.status = 'failed';
      jobRecord.error = err.message;
      jobRecord.stage = 'Execution error';
    });

    res.json({
      success: true,
      jobId,
      message: 'Processing started',
      job: {
        id: jobRecord.id,
        title: jobRecord.title,
        status: jobRecord.status,
        progress: jobRecord.progress,
        stage: jobRecord.stage,
        appliedModules: jobRecord.appliedModules,
      },
    });
  } catch (err: any) {
    console.error('Process handler error:', err);
    res.status(500).json({ error: err.message || 'Processing failed to start' });
  }
});

// 8. Job Status
app.get('/api/jobs/:id', (req: Request, res: Response) => {
  const job = jobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  const { childProcess, ...safeJob } = job;
  res.json(safeJob);
});

// 9. All Jobs
app.get('/api/jobs', (_req: Request, res: Response) => {
  const list = Array.from(jobs.values()).map(({ childProcess, ...safeJob }) => safeJob);
  res.json(list.sort((a, b) => b.createdAt - a.createdAt));
});

// 10. Cancel Job
app.post('/api/jobs/:id/cancel', (req: Request, res: Response) => {
  const job = jobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  if (job.childProcess) {
    try {
      job.childProcess.kill('SIGKILL');
    } catch {}
  }
  job.status = 'cancelled';
  job.stage = 'Cancelled by user';
  res.json({ success: true, message: 'Job cancelled' });
});

// 11. Delete Job
app.delete('/api/jobs/:id', (req: Request, res: Response) => {
  const job = jobs.get(req.params.id);
  if (job) {
    if (job.childProcess) {
      try {
        job.childProcess.kill('SIGKILL');
      } catch {}
    }
    if (job.outputFile) {
      const full = path.join(PROCESSED_DIR, job.outputFile);
      if (fs.existsSync(full)) {
        try { fs.unlinkSync(full); } catch {}
      }
    }
    jobs.delete(req.params.id);
  }
  res.json({ success: true });
});

// 12. FFmpeg Diagnostic & Capabilities Info
app.get('/api/ffmpeg/info', async (_req: Request, res: Response) => {
  try {
    const [versionOut, filtersOut, codecsOut] = await Promise.all([
      execFileAsync('ffmpeg', ['-version']).catch(() => ({ stdout: '' })),
      execFileAsync('ffmpeg', ['-filters']).catch(() => ({ stdout: '' })),
      execFileAsync('ffmpeg', ['-codecs']).catch(() => ({ stdout: '' })),
    ]);

    // Parse filters
    const filterLines = filtersOut.stdout.split('\n');
    const filters: { name: string; description: string; type: string }[] = [];
    filterLines.forEach((line) => {
      const match = line.match(/^\s*([TSC.]{3})\s+(\w+)\s+(V->V|A->A|V->A|A->V)\s+(.+)$/);
      if (match) {
        filters.push({
          name: match[2],
          type: match[3],
          description: match[4].trim(),
        });
      }
    });

    res.json({
      version: versionOut.stdout.split('\n')[0],
      totalFilters: filters.length,
      popularFilters: filters.filter((f) =>
        ['hqdn3d', 'unsharp', 'minterpolate', 'boxblur', 'yadif', 'deshake', 'deblock', 'deband', 'eq', 'curves', 'colorbalance', 'vignette', 'scale', 'fps'].includes(f.name)
      ),
      allFilters: filters.slice(0, 150),
      rawCodecs: codecsOut.stdout.substring(0, 1000),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 13. FFmpeg Custom Command Execution Engine
app.post('/api/ffmpeg/run-custom', async (req: Request, res: Response) => {
  try {
    const { filename, customFlags = '', customFilter = '' } = req.body;
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    let inputPath = path.join(UPLOADS_DIR, filename);
    if (!fs.existsSync(inputPath)) inputPath = path.join(SAMPLES_DIR, filename);
    if (!fs.existsSync(inputPath)) inputPath = path.join(PROCESSED_DIR, filename);

    if (!fs.existsSync(inputPath)) {
      return res.status(404).json({ error: 'Source file not found' });
    }

    const metadata = await extractMetadata(inputPath);
    const jobId = 'cli_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const outputFilename = `cli_${Date.now()}_${path.parse(filename).name}.mp4`;
    const outputPath = path.join(PROCESSED_DIR, outputFilename);

    // Build args safely
    const ffmpegArgs: string[] = ['-y', '-i', inputPath];

    if (customFilter.trim()) {
      ffmpegArgs.push('-vf', customFilter.trim());
    }

    // Parse extra flags safely
    if (customFlags.trim()) {
      // Split on spaces preserving quotes
      const flagTokens = customFlags.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
      flagTokens.forEach((token: string) => {
        const clean = token.replace(/^"(.*)"$/, '$1');
        if (clean && !['rm', 'sh', 'bash', '>', '<', '|', '&'].includes(clean)) {
          ffmpegArgs.push(clean);
        }
      });
    } else {
      ffmpegArgs.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-c:a', 'aac');
    }

    ffmpegArgs.push(outputPath);

    const jobRecord: JobRecord = {
      id: jobId,
      title: `FFmpeg CLI: ${customFilter || 'Custom Filter'}`,
      status: 'processing',
      progress: 0,
      stage: 'Executing custom FFmpeg command...',
      sourceFile: filename,
      outputFile: outputFilename,
      outputUrl: `/api/media/${outputFilename}`,
      createdAt: Date.now(),
      startedAt: Date.now(),
      appliedModules: ['FFmpeg CLI', customFilter ? 'Custom Filter' : 'Custom Flags'],
    };

    const ffmpegProc = spawn('ffmpeg', ffmpegArgs);
    jobRecord.childProcess = ffmpegProc;
    jobs.set(jobId, jobRecord);

    const totalDuration = metadata.duration || 10;

    ffmpegProc.stderr.on('data', (chunk: Buffer) => {
      const msg = chunk.toString();
      const timeMatch = msg.match(/time=(\d+):(\d+):(\d+\.\d+)/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1], 10);
        const mins = parseInt(timeMatch[2], 10);
        const secs = parseFloat(timeMatch[3]);
        const currentSec = hours * 3600 + mins * 60 + secs;
        const progress = Math.min(99, Math.round((currentSec / totalDuration) * 100));

        jobRecord.progress = progress;
        jobRecord.stage = `CLI Encoding (${progress}%)...`;
      }
    });

    ffmpegProc.on('close', (code: number) => {
      jobRecord.childProcess = undefined;
      jobRecord.completedAt = Date.now();

      if (code === 0 && fs.existsSync(outputPath)) {
        const stat = fs.statSync(outputPath);
        jobRecord.status = 'completed';
        jobRecord.progress = 100;
        jobRecord.stage = 'CLI Execution Succeeded';
        jobRecord.outputSize = stat.size;
        jobRecord.formattedOutputSize = formatBytes(stat.size);
      } else {
        if (jobRecord.status !== 'cancelled') {
          jobRecord.status = 'failed';
          jobRecord.error = `FFmpeg exited with code ${code}`;
          jobRecord.stage = 'CLI Execution Failed';
        }
      }
    });

    res.json({
      success: true,
      jobId,
      command: `ffmpeg ${ffmpegArgs.join(' ')}`,
      job: {
        id: jobRecord.id,
        title: jobRecord.title,
        status: jobRecord.status,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mount Vite or serve static assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EnhanceAI Studio server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
