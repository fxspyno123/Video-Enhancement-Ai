import time
import subprocess
from typing import Dict, Any, Optional

class JobManager:
    """Manages asynchronous processing jobs, progress monitoring, and cancellation."""
    def __init__(self):
        self.jobs: Dict[str, Dict[str, Any]] = {}

    def create_job(self, job_id: str, title: str, source_file: str, output_file: str) -> Dict[str, Any]:
        job = {
            "id": job_id,
            "title": title,
            "status": "queued",
            "progress": 0,
            "stage": "Queued",
            "source_file": source_file,
            "output_file": output_file,
            "created_at": time.time(),
            "started_at": None,
            "completed_at": None,
            "error": None,
            "process": None
        }
        self.jobs[job_id] = job
        return job

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        job = self.jobs.get(job_id)
        if not job:
            return None
        safe = {k: v for k, v in job.items() if k != "process"}
        return safe

    def cancel_job(self, job_id: str) -> bool:
        job = self.jobs.get(job_id)
        if not job:
            return False
        if job.get("process"):
            try:
                job["process"].kill()
            except Exception:
                pass
        job["status"] = "cancelled"
        job["stage"] = "Cancelled by user"
        return True

    def list_jobs(self):
        return [
            {k: v for k, v in job.items() if k != "process"}
            for job in sorted(self.jobs.values(), key=lambda j: j["created_at"], reverse=True)
        ]

job_manager = JobManager()
