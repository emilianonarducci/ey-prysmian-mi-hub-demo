"""LLM client: Anthropic Claude + Voyage embeddings with fallback handling."""
import os
from typing import Any
from anthropic import Anthropic
from anthropic.types import Message

_anthropic_client: Anthropic | None = None

def get_anthropic() -> Anthropic:
    global _anthropic_client
    if _anthropic_client is None:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key or api_key.startswith("sk-ant-REPLACE"):
            raise RuntimeError("ANTHROPIC_API_KEY not set")
        _anthropic_client = Anthropic(api_key=api_key)
    return _anthropic_client

def call_claude(
    system: str,
    messages: list[dict],
    tools: list[dict] | None = None,
    model: str | None = None,
    max_tokens: int = 4096,
    temperature: float = 0.2,
) -> Message:
    """Single call to Claude with optional tools."""
    client = get_anthropic()
    primary = model or os.environ.get("LLM_MODEL_PRIMARY", "claude-sonnet-4-6")
    try:
        return client.messages.create(
            model=primary, system=system, messages=messages,
            tools=tools or [], max_tokens=max_tokens, temperature=temperature,
        )
    except Exception as e:
        # Fallback to Haiku
        fallback = os.environ.get("LLM_MODEL_FALLBACK", "claude-haiku-4-5")
        if primary != fallback:
            print(f"[LLM] Primary {primary} failed ({e}); falling back to {fallback}")
            return client.messages.create(
                model=fallback, system=system, messages=messages,
                tools=tools or [], max_tokens=max_tokens, temperature=temperature,
            )
        raise

# Embeddings: Voyage AI (primary) — falls back to Anthropic if Voyage unavailable
_voyage_client = None
def get_voyage():
    global _voyage_client
    if _voyage_client is None:
        try:
            import voyageai
            _voyage_client = voyageai.Client(api_key=os.environ.get("VOYAGE_API_KEY"))
        except Exception:
            _voyage_client = False
    return _voyage_client

def embed_text(text: str, model: str | None = None) -> list[float] | None:
    """Return 1024-dim embedding via Voyage; returns None if unavailable (silver still indexes by keyword)."""
    client = get_voyage()
    if client is False:
        return None
    model_name = model or os.environ.get("EMBEDDING_MODEL", "voyage-3-large")
    try:
        result = client.embed([text], model=model_name)
        return result.embeddings[0]
    except Exception as e:
        print(f"[Embed] Failed: {e}")
        return None
