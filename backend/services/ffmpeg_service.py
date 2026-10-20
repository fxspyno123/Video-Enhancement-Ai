import subprocess
import json
import os
from typing import Dict, Any, Optional

class FFmpegService:
    def __init__(self, ffmpeg_bin: str = "ffmpeg", ffprobe_bin: str = "ffprobe"):
        self.ffmpeg_bin = ffmpeg_bin
        self.ffprobe_bin = ffprobe_bin

    def get_metadata(self, file_path: str) -> Dict[str, Any]:
        """Extract media streams, duration, codecs, FPS, and dimensions using ffprobe."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        cmd = [
            self.ffprobe_bin,
            "-v", "error",
            "-show_entries", "stream=width,height,codec_name,codec_type,r_frame_rate,bit_rate,channels,sample_rate",
            "-show_entries", "format=duration,size,bit_rate",
            "-print_format", "json",
            file_path
        ]

        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        data = json.loads(result.stdout)

        format_data = data.get("format", {})
        streams = data.get("streams", [])

        video_stream = next((s for s in streams if s.get("codec_type") == "video"), {})
        audio_stream = next((s for s in streams if s.get("codec_type") == "audio"), {})

        width = int(video_stream.get("width", 1280))
        height = int(video_stream.get("height", 720))

        fps = 30.0
        fps_str = video_stream.get("r_frame_rate", "30/1")
        if "/" in fps_str:
            num, den = fps_str.split("/")
            if int(den) > 0:
                fps = round(int(num) / int(den), 2)
        else:
            try:
                fps = float(fps_str)
            except ValueError:
                fps = 30.0

        duration = float(format_data.get("duration", 0.0))
        size = int(format_data.get("size", os.path.getsize(file_path)))
        bitrate = int(format_data.get("bit_rate") or video_stream.get("bit_rate") or 0)

        return {
            "width": width,
            "height": height,
            "fps": fps,
            "duration": duration,
            "size": size,
            "bitrate": bitrate,
            "codec": video_stream.get("codec_name", "unknown"),
            "audio_codec": audio_stream.get("codec_name", "none"),
            "audio_channels": audio_stream.get("channels", 0),
            "sample_rate": int(audio_stream.get("sample_rate", 0)),
        }

    def generate_thumbnail(self, input_path: str, output_path: str, seek_seconds: float = 1.0) -> bool:
        """Extract a single preview frame as JPEG."""
        cmd = [
            self.ffmpeg_bin,
            "-y",
            "-ss", str(seek_seconds),
            "-i", input_path,
            "-vframes", "1",
            "-vf", "scale=640:-1",
            "-q:v", "3",
            output_path
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return res.returncode == 0
