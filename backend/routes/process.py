import os
import subprocess
import threading
import time
from flask import Blueprint, request, jsonify, current_app
from services.job_manager import job_manager
from services.ffmpeg_service import FFmpegService
from services.color_service import ColorService
from services.resize_service import ResizeService
from services.ai_upscaler import AIUpscalerService
from services.frame_interpolation import FrameInterpolationService

process_bp = Blueprint("process", __name__)
ffmpeg_service = FFmpegService()
color_service = ColorService()
resize_service = ResizeService()
frame_interp = FrameInterpolationService()

def run_ffmpeg_async(job_id: str, cmd: list, output_path: str, duration: float):
    job = job_manager.jobs.get(job_id)
    if not job:
        return
    job["status"] = "processing"
    job["started_at"] = time.time()
    job["stage"] = "Rendering frames..."

    try:
        proc = subprocess.Popen(cmd, stderr=subprocess.PIPE, text=True)
        job["process"] = proc

        for line in proc.stderr:
            # parse time=00:00:05.12
            if "time=" in line:
                try:
                    time_part = line.split("time=")[1].split()[0]
                    parts = time_part.split(":")
                    if len(parts) == 3:
                        current_secs = int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
                        pct = min(99, int((current_secs / max(duration, 0.1)) * 100))
                        job["progress"] = pct
                        job["stage"] = f"Processing ({pct}%)..."
                except Exception:
                    pass

        proc.wait()
        if proc.returncode == 0 and os.path.exists(output_path):
            job["status"] = "completed"
            job["progress"] = 100
            job["stage"] = "Done"
            job["completed_at"] = time.time()
        else:
            if job["status"] != "cancelled":
                job["status"] = "failed"
                job["stage"] = "FFmpeg error"
    except Exception as e:
        job["status"] = "failed"
        job["error"] = str(e)

@process_bp.route("/api/process", methods=["POST"])
def start_processing():
    data = request.get_json() or {}
    filename = data.get("filename")
    modules = data.get("modules", {})

    if not filename:
        return jsonify({"error": "filename required"}), 400

    input_path = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
    if not os.path.exists(input_path):
        return jsonify({"error": "source file not found"}), 404

    metadata = ffmpeg_service.get_metadata(input_path)
    job_id = f"job_{int(time.time())}"
    output_filename = f"enhanced_{filename}"
    output_path = os.path.join(current_app.config["PROCESSED_FOLDER"], output_filename)

    # Build filters
    filters = []
    if "enhance" in modules:
        enh = modules["enhance"]
        if enh.get("noiseReduction", 0) > 0:
            val = (enh["noiseReduction"] / 100.0) * 10
            filters.append(f"hqdn3d={val:.1f}:{val:.1f}:6:6")
        if enh.get("sharpening", 0) > 0:
            val = (enh["sharpening"] / 100.0) * 1.5
            filters.append(f"unsharp=5:5:{val:.2f}:5:5:0.0")

    if "color" in modules:
        filters.extend(color_service.build_color_filters(modules["color"]))

    cmd = ["ffmpeg", "-y", "-i", input_path]
    if filters:
        cmd.extend(["-vf", ",".join(filters)])

    cmd.extend(["-c:v", "libx264", "-preset", "fast", "-crf", "19", "-c:a", "aac", output_path])

    job_manager.create_job(job_id, f"Process {filename}", filename, output_filename)

    thread = threading.Thread(target=run_ffmpeg_async, args=(job_id, cmd, output_path, metadata["duration"]))
    thread.daemon = True
    thread.start()

    return jsonify({"success": True, "job_id": job_id, "message": "Processing job queued"})

@process_bp.route("/api/jobs/<job_id>", methods=["GET"])
def get_job(job_id):
    job = job_manager.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(job)

@process_bp.route("/api/jobs/<job_id>/cancel", methods=["POST"])
def cancel_job(job_id):
    success = job_manager.cancel_job(job_id)
    return jsonify({"success": success})

@process_bp.route("/api/jobs", methods=["GET"])
def list_jobs():
    return jsonify(job_manager.list_jobs())
