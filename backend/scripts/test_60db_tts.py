"""Standalone smoke test for the 60dB (api.60db.ai) TTS integration.

Verifies your API key, lists your voices, and synthesizes one sentence to a
WAV file. Intentionally has NO app imports so it runs without loading torch /
Supabase / the full backend.

Usage:
    cd backend
    # SIXTYDB_API_KEY must be set (via .env or the environment)
    python scripts/test_60db_tts.py
    python scripts/test_60db_tts.py --voice-id <voice_id> --text "Hello there"
"""

import argparse
import base64
import os
import sys

import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("SIXTYDB_API_KEY", "")
API_URL = os.getenv("SIXTYDB_API_URL", "https://api.60db.ai")


def get_my_voices():
    """GET /myvoices -> list of voice objects."""
    resp = requests.get(
        f"{API_URL}/myvoices",
        headers={"Authorization": f"Bearer {API_KEY}"},
        timeout=30,
    )
    resp.raise_for_status()
    body = resp.json()
    if not body.get("success"):
        raise RuntimeError(f"/myvoices failed: {body.get('message')}")
    return body.get("data", [])


def synthesize(text: str, voice_id: str, out_path: str):
    """POST /tts-synthesize -> decode audio_base64 -> write wav."""
    payload = {
        "text": text,
        "output_format": "wav",
        "speed": 1,
        "stability": 50,
        "similarity": 75,
        "enhance": True,
    }
    if voice_id:
        payload["voice_id"] = voice_id

    resp = requests.post(
        f"{API_URL}/tts-synthesize",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=60,
    )
    resp.raise_for_status()
    body = resp.json()
    if not body.get("success") or not body.get("audio_base64"):
        raise RuntimeError(f"/tts-synthesize failed: {body.get('message')}")

    audio = base64.b64decode(body["audio_base64"])
    with open(out_path, "wb") as f:
        f.write(audio)

    return body


def main():
    parser = argparse.ArgumentParser(description="60dB TTS smoke test")
    parser.add_argument(
        "--voice-id",
        default=None,
        help="Voice to use. Defaults to the first voice from /myvoices.",
    )
    parser.add_argument(
        "--text",
        default="Hi! This is a sixty d B text to speech smoke test.",
        help="Text to synthesize.",
    )
    parser.add_argument(
        "--out",
        default="sixtydb_test.wav",
        help="Output WAV path.",
    )
    args = parser.parse_args()

    if not API_KEY:
        print("ERROR: SIXTYDB_API_KEY is not set (env or backend/.env).")
        sys.exit(1)

    print(f"Base URL: {API_URL}")

    print("\n[1/2] Fetching your voices ...")
    voices = get_my_voices()
    if not voices:
        print("  No voices found on this account.")
    for v in voices:
        labels = v.get("labels", {}) or {}
        print(
            f"  - {v.get('voice_id')}  "
            f"name={v.get('name')!r}  "
            f"model={v.get('model')!r}  "
            f"lang={labels.get('language')}  "
            f"gender={labels.get('gender')}"
        )

    voice_id = args.voice_id
    if not voice_id and voices:
        voice_id = voices[0]["voice_id"]
        print(f"\n  Using first voice: {voice_id}")

    print(f"\n[2/2] Synthesizing: {args.text!r}")
    meta = synthesize(args.text, voice_id, args.out)
    print(
        f"  OK -> {args.out}  "
        f"(sample_rate={meta.get('sample_rate')}, "
        f"duration={meta.get('duration_seconds')}s, "
        f"format={meta.get('output_format')})"
    )
    print("\nDone. This voice_id is what you'd store in toys.tts_code "
          "with toys.tts_model = 'SIXTYDB'.")


if __name__ == "__main__":
    main()
