import json
from google import genai
from django.conf import settings


class GeminiService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)

    def generate_text(self, prompt: str) -> str:
        response = self.client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        return response.text if getattr(response, "text", None) else ""

    def generate_json(self, prompt: str, schema: dict) -> dict:
        response = self.client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_json_schema": schema,
            },
        )

        text = response.text if getattr(response, "text", None) else "{}"
        return json.loads(text)