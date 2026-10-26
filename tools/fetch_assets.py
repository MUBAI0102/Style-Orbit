"""Download the Wibi Style sample thumbnails used by the offline gallery.

The upstream repo publishes one transformed-photo example per Skill.  We keep
only those small thumbnails locally so the page can run without a network.
"""

from __future__ import annotations

import json
import re
import time
from pathlib import Path

import requests
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "skills"
README = ROOT / "tools" / "wibi-README.md"
CDN = "https://fastly.jsdelivr.net/gh/Vieeeeeee/wibi-style@main/assets/thumbs/"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) StyleVerse/1.0"}


def download(url: str, target: Path) -> bytes:
    last_error: Exception | None = None
    for attempt in range(6):
        try:
            response = requests.get(url, timeout=40, headers=HEADERS)
            response.raise_for_status()
            target.write_bytes(response.content)
            return response.content
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            time.sleep(1.2 * (attempt + 1))
    raise RuntimeError(f"Failed {url}: {last_error}")


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    if not README.exists():
        download(
            "https://fastly.jsdelivr.net/gh/Vieeeeeee/wibi-style@main/README.md",
            README,
        )

    text = README.read_text(encoding="utf-8")
    paths = sorted(set(re.findall(r"assets/thumbs/([^\"?]+\.jpg)", text)))
    print(f"Found {len(paths)} thumbnails")

    metadata = []
    for index, name in enumerate(paths, 1):
        target = ASSETS / name
        if not target.exists() or target.stat().st_size < 1000:
            print(f"[{index:02d}/{len(paths)}] {name}", end=" ", flush=True)
            try:
                payload = download(CDN + name, target)
                print(f"{len(payload) // 1024} KB")
            except Exception as exc:  # noqa: BLE001
                print("ERROR", exc)
                continue
        with Image.open(target) as image:
            metadata.append(
                {
                    "file": name,
                    "width": image.width,
                    "height": image.height,
                    "size": target.stat().st_size,
                }
            )

    (ROOT / "tools" / "thumbs.json").write_text(
        json.dumps(metadata, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"Ready: {len(metadata)} images")


if __name__ == "__main__":
    main()
