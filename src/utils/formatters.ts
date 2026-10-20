export function formatSecondsToTimecode(sec: number): string {
  if (isNaN(sec) || sec < 0) return '00:00.00';
  const mins = Math.floor(sec / 60);
  const secs = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function estimateExportFileSize(
  durationSeconds: number,
  resolution: string,
  bitrateMbps: number | 'auto'
): string {
  let rate = 12; // default 12 Mbps
  if (typeof bitrateMbps === 'number' && bitrateMbps > 0) {
    rate = bitrateMbps;
  } else {
    if (resolution === '4k') rate = 35;
    else if (resolution === '2k') rate = 22;
    else if (resolution === '1080p') rate = 12;
    else if (resolution === '720p') rate = 6;
    else rate = 3.5;
  }

  // Audio ~192 kbps = 0.192 Mbps
  const totalMbps = rate + 0.192;
  const totalMegabytes = (totalMbps * (durationSeconds || 10)) / 8;
  return `~${totalMegabytes.toFixed(1)} MB`;
}
