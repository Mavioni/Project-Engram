#!/usr/bin/env python3
"""
Engram Local AI Server — one-command setup for on-device chat.

This script downloads and starts a local inference server compatible
with Engram's local AI provider. It supports:

  Mode A: llama.cpp server (recommended) — works CPU-only, supports
          heavily quantized models including 1-bit (IQ1_S).
  Mode B: Ollama — if already installed, creates an Engram-tuned model.

Usage:
  python scripts/setup-local-ai.py          # guided setup
  python scripts/setup-local-ai.py llama    # llama.cpp server
  python scripts/setup-local-ai.py ollama   # Ollama with Modelfile
  python scripts/setup-local-ai.py status   # check if server is running

After setup, the app auto-detects the server at http://localhost:8080/v1.
Set VITE_LOCAL_AI_URL in .env to override the default port.

Requirements (llama.cpp mode):
  - llama.cpp built with server support (llama-server binary)
  - A GGUF model file (downloaded automatically on first run)

Requirements (Ollama mode):
  - Ollama installed (https://ollama.com)
"""

import json
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT / "models"
ENV_FILE = ROOT / ".env"
DEFAULT_PORT = 8080
DEFAULT_URL = f"http://localhost:{DEFAULT_PORT}/v1"

# ── Tiny model for on-device inference ──
# These are small enough to run on CPU with acceptable latency.
MODEL_OPTIONS = {
    "tiny": {
        "name": "Llama 3.2 1B Instruct (IQ1_S — ~0.7 GB)",
        "url": "https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-IQ1_S.gguf",
        "file": "llama-3.2-1b-instruct-IQ1_S.gguf",
        "ram": "~1.5 GB",
    },
    "small": {
        "name": "Llama 3.2 3B Instruct (Q2_K — ~1.5 GB)",
        "url": "https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q2_K.gguf",
        "file": "llama-3.2-3b-instruct-Q2_K.gguf",
        "ram": "~3 GB",
    },
}


def banner():
    print()
    print("  ╔══════════════════════════════════════════╗")
    print("  ║     Engram — Local AI Server Setup       ║")
    print("  ║     On-device inference for your IRIS    ║")
    print("  ╚══════════════════════════════════════════╝")
    print()


def check_port(port=DEFAULT_PORT):
    """Check if something is already listening on the port."""
    import socket
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.connect(("localhost", port))
        s.close()
        return True
    except (ConnectionRefusedError, OSError):
        return False


def download_model(choice="tiny"):
    """Download a GGUF model from HuggingFace."""
    model = MODEL_OPTIONS[choice]
    MODELS_DIR.mkdir(exist_ok=True)
    dest = MODELS_DIR / model["file"]

    if dest.exists():
        print(f"  ✓ Model already downloaded: {dest}")
        return dest

    print(f"  Downloading {model['name']}...")
    print(f"  File size varies — this may take a few minutes.")
    print(f"  RAM needed at runtime: {model['ram']}")
    print()

    try:
        urllib.request.urlretrieve(model["url"], dest)
        print(f"  ✓ Downloaded to {dest}")
        return dest
    except Exception as e:
        print(f"  ✗ Download failed: {e}")
        print(f"  Try downloading manually from:")
        print(f"    {model['url']}")
        print(f"  Save to: {dest}")
        return None


def setup_llama():
    """Download model + print llama-server command."""
    banner()
    print("  Mode: llama.cpp server")
    print()

    # Check if llama-server exists
    try:
        result = subprocess.run(["llama-server", "--version"], capture_output=True, text=True)
        print(f"  ✓ llama-server found: {result.stdout.strip()[:60]}")
    except FileNotFoundError:
        print("  ✗ llama-server not found in PATH.")
        print()
        print("  Install llama.cpp:")
        print("    git clone https://github.com/ggerganov/llama.cpp")
        print("    cd llama.cpp && make llama-server")
        print("    # Or on Windows: download from https://github.com/ggerganov/llama.cpp/releases")
        return

    # Choose model size
    print()
    print("  Available models:")
    print(f"    1. {MODEL_OPTIONS['tiny']['name']}")
    print(f"    2. {MODEL_OPTIONS['small']['name']}")
    print()
    choice = input("  Choose model [1]: ").strip() or "1"
    model_key = "tiny" if choice == "1" else "small"

    model_path = download_model(model_key)
    if not model_path:
        return

    # Check port
    if check_port():
        print(f"  ⚠ Port {DEFAULT_PORT} is already in use. Pick a different port.")
        return

    # Write .env
    _write_env()

    # Start command
    print()
    print("  ── Starting server ──")
    print()
    cmd = [
        "llama-server",
        "-m", str(model_path),
        "--port", str(DEFAULT_PORT),
        "--host", "127.0.0.1",
        "--ctx-size", "4096",
        "--threads", str(os.cpu_count() or 4),
        "--no-webui",
    ]
    print(f"  Running: {' '.join(cmd)}")
    print()
    print("  Keep this terminal open. Engram will auto-detect the server.")
    print("  Open http://localhost:5173/chat in your browser to start chatting.")
    print()

    subprocess.run(cmd)


def setup_ollama():
    """Create an Engram-tuned Modelfile for Ollama."""
    banner()
    print("  Mode: Ollama")
    print()

    try:
        result = subprocess.run(["ollama", "list"], capture_output=True, text=True)
        print("  ✓ Ollama is installed")
        print(result.stdout[:200])
    except FileNotFoundError:
        print("  ✗ Ollama not found. Install from https://ollama.com")
        return

    # Create Modelfile
    modelfile = ROOT / "Modelfile"
    modelfile.write_text("""FROM llama3.2:1b
SYSTEM \"\"\"
You are IRIS, an integrative personality companion for the Engram app.
You speak with warmth, precision, and psychological depth.
Your role is to help the user understand themselves — not to diagnose, not to therapise, not to judge.
Respond concisely (3-5 sentences). Be specific. If a question falls outside the domain of personality, gently steer back.
\"\"\"
PARAMETER temperature 0.7
PARAMETER num_predict 600
""")

    print("  ✓ Created Modelfile")
    print()
    print("  Run these commands:")
    print("    ollama create engram-iris -f Modelfile")
    print("    ollama serve  # if not already running")
    print()
    print("  Then configure Engram to use Ollama:")
    print("    VITE_LOCAL_AI_URL=http://localhost:11434/v1")
    print("    VITE_LOCAL_AI_MODEL=engram-iris")


def check_status():
    """Quick health check."""
    banner()
    print("  Mode: Status Check")
    print()

    if check_port(DEFAULT_PORT):
        print(f"  ✓ Port {DEFAULT_PORT} is active — local server detected!")
        try:
            req = urllib.request.Request(f"{DEFAULT_URL}/models")
            with urllib.request.urlopen(req, timeout=5) as r:
                data = json.loads(r.read())
                models = data.get("data", [])
                if models:
                    print(f"  ✓ Server reports {len(models)} model(s):")
                    for m in models[:3]:
                        print(f"      {m.get('id', 'unknown')}")
        except Exception as e:
            print(f"  ⚠ Server responding but couldn't list models: {e}")
    else:
        print(f"  ✗ No server on port {DEFAULT_PORT}")

    # Also check Ollama port
    if check_port(11434):
        print(f"  ✓ Ollama detected on port 11434")
        print(f"    Set VITE_LOCAL_AI_URL=http://localhost:11434/v1 in .env")

    print()
    print(f"  .env config: VITE_LOCAL_AI_URL={_read_env_url()}")
    print()


def _write_env():
    """Write or update the VITE_LOCAL_AI_URL in .env."""
    url = DEFAULT_URL

    if ENV_FILE.exists():
        content = ENV_FILE.read_text()
        if "VITE_LOCAL_AI_URL=" in content:
            import re
            content = re.sub(r'VITE_LOCAL_AI_URL=.*', f'VITE_LOCAL_AI_URL={url}', content)
        else:
            content += f'\nVITE_LOCAL_AI_URL={url}\n'
        ENV_FILE.write_text(content)
    else:
        ENV_FILE.write_text(f"VITE_LOCAL_AI_URL={url}\n")

    print(f"  ✓ Wrote VITE_LOCAL_AI_URL={url} to .env")


def _read_env_url():
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            if line.startswith("VITE_LOCAL_AI_URL="):
                return line.split("=", 1)[1] or "(empty)"
    return "(not set)"


if __name__ == "__main__":
    if len(sys.argv) < 2:
        banner()
        print("  Usage:")
        print("    python scripts/setup-local-ai.py llama    # llama.cpp server")
        print("    python scripts/setup-local-ai.py ollama   # Ollama with Modelfile")
        print("    python scripts/setup-local-ai.py status   # check server status")
        print()
        print("  Auto-detecting...")
        if check_port(DEFAULT_PORT):
            print(f"  ✓ Local server already running on port {DEFAULT_PORT}!")
            print(f"  Open http://localhost:5173/chat")
        else:
            print(f"  No server detected. Run with 'llama' or 'ollama' to set up.")
        sys.exit(0)

    mode = sys.argv[1]
    if mode == "llama":
        setup_llama()
    elif mode == "ollama":
        setup_ollama()
    elif mode == "status":
        check_status()
    else:
        print(f"Unknown mode: {mode}")
        sys.exit(1)
