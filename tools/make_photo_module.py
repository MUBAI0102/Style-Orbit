"""Create an inlined WebP photo module so the gallery also works from file://.

Includes the original Wibi Style examples plus the new Douyin-sourced cards.
"""

from __future__ import annotations

import base64
import io
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIRS = [ROOT / "assets" / "skills", ROOT / "assets" / "douyin"]
SRC = ROOT / "src"
SRC.mkdir(exist_ok=True)

lines = [
    "// Inlined sample thumbnails from github.com/Vieeeeeee/wibi-style",
    "// and from the Douyin works listed in tools/douyin/summary.json.",
    "// Visual content remains the property of the respective authors.",
    "export const PHOTO_DATA = {",
]
total = 0
count = 0
for source_dir in SOURCE_DIRS:
    for path in sorted(source_dir.glob("*")):
        if path.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
            continue
        with Image.open(path) as image:
            image = image.convert("RGB")
            # Wibi thumbnails are already small; Douyin cards are 600x800.
            if max(image.size) > 800:
                image.thumbnail((600, 800), Image.Resampling.LANCZOS)
            encoded = io.BytesIO()
            image.save(encoded, "WEBP", quality=88, method=6)
            payload = encoded.getvalue()
        total += len(payload)
        count += 1
        b64 = base64.b64encode(payload).decode("ascii")
        lines.append(f'  "{path.stem}": "data:image/webp;base64,{b64}",')

lines.append("};")
lines.append("export const PHOTO_COUNT = Object.keys(PHOTO_DATA).length;")
out = SRC / "photos.js"
out.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"Wrote {out} ({out.stat().st_size / 1024 / 1024:.2f} MiB, {count} images, webp payload {total / 1024:.0f} KiB)")
