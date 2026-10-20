import os
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from services.ffmpeg_service import FFmpegService

upload_bp = Blueprint("upload", __name__)
ffmpeg_service = FFmpegService()

@upload_bp.route("/api/upload", methods=["POST"])
def upload_file():
    if "video" not in request.files:
        return jsonify({"error": "No video file provided"}), 400

    file = request.files["video"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    filename = secure_filename(file.filename)
    save_path = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
    file.save(save_path)

    try:
        metadata = ffmpeg_service.get_metadata(save_path)
        metadata["filename"] = filename
        metadata["url"] = f"/api/media/{filename}"

        # Thumbnail
        thumb_name = f"thumb_{os.path.splitext(filename)[0]}.jpg"
        thumb_path = os.path.join(current_app.config["PROCESSED_FOLDER"], thumb_name)
        ffmpeg_service.generate_thumbnail(save_path, thumb_path)
        metadata["thumbnail_url"] = f"/api/media/{thumb_name}"

        return jsonify({"success": True, "metadata": metadata})
    except Exception as e:
        if os.path.exists(save_path):
            os.remove(save_path)
        return jsonify({"error": str(e)}), 500
