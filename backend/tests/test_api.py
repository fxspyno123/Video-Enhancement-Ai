import unittest
import os
import json
from app import create_app

class EnhanceAIApiTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()

    def test_health(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data["status"], "healthy")

    def test_list_jobs(self):
        response = self.client.get("/api/jobs")
        self.assertEqual(response.status_code, 200)

if __name__ == "__main__":
    unittest.main()
