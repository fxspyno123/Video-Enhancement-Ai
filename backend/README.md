# EnhanceAI Studio — Standalone Python & AI Model Backend

This directory contains the complete standalone Python backend for **EnhanceAI Studio**, built with Flask, PyTorch, FFmpeg/FFprobe, and real AI video processing architectures.

---

## 🛠 Features

- **FFmpeg 4.4+ / 6.0+ Integration**: Fast native encoding with `libx264`, `libx265` (HEVC), and `libvpx-vp9`.
- **AI Upscaling (480p to 4K)**: Supports Real-ESRGAN (`realesrgan-x4plus`, `realesr-animevideov3`), Waifu2x, and EDSR.
- **Anime Enhancer**: Line-art preservation, flat-color debanding, edge refinement, and color vibrancy.
- **Smart Resize Without Losing Content**:
  - `Fit & Preserve`: 100% visible frame without cropping or stretching.
  - `Blur Background`: Enlarged blurred background with centered sharp foreground.
  - `Solid Background`: Letterbox/pillarbox with custom hex colors.
  - `Smart Reframe`: Subject detection & dynamic cropping.
- **Optical Flow & FPS Interpolation**: `minterpolate` motion-compensated bidirectional optical flow up to 60 FPS and 120 FPS.
- **Video Restoration**: Denoising (`hqdn3d`), deblocking, debanding, deflickering, deinterlacing (`yadif`), and video stabilization (`deshake`).
- **Color Grading**: Real-time luminance curves, RGB color wheels, saturation, gamma, exposure, vignette, and cinematic LUT simulations.

---

## 🚀 Quickstart Installation

### 1. Prerequisites
Ensure you have Python 3.10+ and FFmpeg installed on your operating system:
```bash
# Ubuntu / Debian
sudo apt-get update && sudo apt-get install -y ffmpeg python3-pip

# macOS (Homebrew)
brew install ffmpeg python
```

### 2. Install Python Dependencies
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Start the Flask Server
```bash
python3 app.py
```
The backend will launch at `http://localhost:5000`.

---

## 🧪 Running Tests
```bash
pytest tests/
```
