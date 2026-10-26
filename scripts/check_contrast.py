#!/usr/bin/env python3
"""Launch the checker under the shared diagnostic supervisor before loading it."""
import os
import sys
from pathlib import Path

if __name__ == "__main__":
    try:
        base = Path(__file__).resolve().parent
        os.execvp("node", ["node", str(base / "run.mjs"), sys.executable, "-B",
                           str(base / "contrast_contract.py"), *sys.argv[1:]])
    except Exception:
        sys.stderr.write("diagnostic-boundary: command unavailable\n")
        sys.exit(1)
