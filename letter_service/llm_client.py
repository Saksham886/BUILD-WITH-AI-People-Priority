import asyncio
import logging
import time
from dataclasses import dataclass

from config import Settings

logger = logging.getLogger(__name__)


class LLMGenerationError(RuntimeError):
    pass


@dataclass
class LLMClient:
    settings: Settings

    def __post_init__(self) -> None:
        self.provider = self.settings.llm_provider
        self._groq_client = None
        self._gemini_client = None
        if self.provider == "groq":
            from groq import Groq

            self._groq_client = Groq(api_key=self.settings.groq_api_key)
        else:
            from google import genai

            self._gemini_client = genai.Client(api_key=self.settings.gemini_api_key)

    @property
    def active_provider(self) -> str:
        return self.provider

    async def generate(self, system_prompt: str, user_prompt: str) -> str:
        return await asyncio.to_thread(self._generate_with_retry, system_prompt, user_prompt)

    def _generate_with_retry(self, system_prompt: str, user_prompt: str) -> str:
        last_error: Exception | None = None
        for attempt in range(2):
            try:
                return self._generate_once(system_prompt, user_prompt)
            except Exception as exc:  # pragma: no cover - provider/network specific
                last_error = exc
                if attempt == 0:
                    delay = 0.5 * (2 ** attempt)
                    logger.warning("llm call failed, retrying once", extra={"provider": self.provider, "delay_seconds": delay})
                    time.sleep(delay)
                    continue
        raise LLMGenerationError(str(last_error) if last_error else "LLM generation failed")

    def _generate_once(self, system_prompt: str, user_prompt: str) -> str:
        if self.provider == "groq":
            return self._generate_groq(system_prompt, user_prompt)
        return self._generate_gemini(system_prompt, user_prompt)

    def _generate_groq(self, system_prompt: str, user_prompt: str) -> str:
        if self._groq_client is None:
            raise LLMGenerationError("Groq client is not configured")

        response = self._groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
        )
        content = response.choices[0].message.content if response.choices else None
        if not content:
            raise LLMGenerationError("Groq returned an empty response")
        return content.strip()

    def _generate_gemini(self, system_prompt: str, user_prompt: str) -> str:
        if self._gemini_client is None:
            raise LLMGenerationError("Gemini client is not configured")

        from google.genai import types

        response = self._gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_prompt,
            config=types.GenerateContentConfig(system_instruction=system_prompt, temperature=0.3),
        )
        content = getattr(response, "text", None)
        if not content:
            raise LLMGenerationError("Gemini returned an empty response")
        return str(content).strip()
