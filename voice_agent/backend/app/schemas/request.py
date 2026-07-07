"""
Pydantic request schemas.
"""

from pydantic import BaseModel, field_validator


class TextRequest(BaseModel):
    text: str

    @field_validator("text")
    @classmethod
    def text_must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Text must not be empty.")
        return v.strip()
