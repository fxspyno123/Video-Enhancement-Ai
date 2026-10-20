import os
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from routes.upload import upload_bp
from routes.process import process_bp
from routes.export import export_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register blueprints
    app.register_blueprint(upload_bp)
    app.register_blueprint(process_bp)
    app.register_blueprint(export_bp)

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({
            "status": "healthy",
            "service": "EnhanceAI Studio Python Backend",
            "device": Config.DEVICE,
            "ffmpeg": Config.FFMPEG_BINARY
        })

    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("FLASK_PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
