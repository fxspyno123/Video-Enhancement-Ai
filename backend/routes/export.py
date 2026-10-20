import os
from flask import Blueprint, send_from_directory, current_app, abort

export_bp = Blueprint("export", __name__)

@export_bp.route("/api/download/<filename>", methods=["GET"])
def download_file(filename):
    folder = current_app.config["PROCESSED_FOLDER"]
    file_path = os.path.join(folder, filename)
    if not os.path.exists(file_path):
        abort(404)
    return send_from_directory(folder, filename, as_attachment=True)

@export_bp.route("/api/media/<filename>", methods=["GET"])
def stream_media(filename):
    # Check uploads then processed
    for folder in [current_app.config["UPLOAD_FOLDER"], current_app.config["PROCESSED_FOLDER"]]:
        path = os.path.join(folder, filename)
        if os.path.exists(path):
            return send_from_directory(folder, filename)
    abort(404)
