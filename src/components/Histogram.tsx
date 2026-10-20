import React, { useEffect, useRef } from 'react';
import { ColorSettings } from '../types';

interface HistogramProps {
  colorSettings: ColorSettings;
}

export const Histogram: React.FC<HistogramProps> = ({ colorSettings }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw background grid lines
    ctx.strokeStyle = '#1a2333';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += width / 4) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Synthesize realistic bell-curve luminance & RGB channels shifted by colorSettings
    const shift = (colorSettings.brightness / 100) * (width * 0.2);
    const contrastSpread = 1 + (colorSettings.contrast / 100) * 0.5;
    const rShift = shift + (colorSettings.rgbRed / 100) * 15 + (colorSettings.temperature / 100) * 15;
    const gShift = shift + (colorSettings.rgbGreen / 100) * 15;
    const bShift = shift + (colorSettings.rgbBlue / 100) * 15 - (colorSettings.temperature / 100) * 15;

    const drawChannel = (centerShift: number, color: string, alpha: number) => {
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(0, height);

      const mean = width * 0.45 + centerShift;
      const std = (width * 0.18) * contrastSpread;

      for (let x = 0; x <= width; x += 2) {
        const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(std, 2));
        const y = height - Math.exp(exponent) * (height * 0.85);
        ctx.lineTo(x, Math.max(2, y));
      }

      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
    };

    // Draw RGB and Luminance curves
    drawChannel(rShift, '#ef4444', 0.35); // Red
    drawChannel(gShift, '#10b981', 0.35); // Green
    drawChannel(bShift, '#06b6d4', 0.45); // Blue/Cyan
    drawChannel(shift, '#ffffff', 0.25);  // White Luminance

    ctx.globalAlpha = 1.0;
  }, [colorSettings]);

  return (
    <div className="bg-[#0b0f17] border border-[#1a2333] rounded-lg p-2.5">
      <div className="flex items-center justify-between mb-1.5 text-[10px] uppercase font-bold tracking-wider text-zinc-400">
        <span>RGB & Luminance Scopes</span>
        <span className="font-mono text-cyan-400">IRE 0 - 100</span>
      </div>
      <canvas
        ref={canvasRef}
        width={240}
        height={64}
        className="w-full h-16 rounded bg-[#070a0f] block"
      />
    </div>
  );
};
