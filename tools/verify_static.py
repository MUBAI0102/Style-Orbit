from __future__ import annotations

import re
from collections import Counter
from pathlib import Path

from lxml import html

ROOT = Path(__file__).resolve().parents[1]
index = (ROOT / "index.html").read_text(encoding="utf-8")
tree = html.fromstring(index)

ids = tree.xpath("//@id")
dupes = [item for item, count in Counter(ids).items() if count > 1]
print("IDs:", len(ids), "duplicates:", dupes)

missing = []
for node in tree.xpath("//*[@src or @href]"):
    for attr in ("src", "href"):
        value = node.get(attr)
        if not value:
            continue
        if value.startswith(("http:", "https:", "data:", "mailto:", "#", "javascript:")):
            continue
        clean = value.split("?", 1)[0].split("#", 1)[0]
        path = (ROOT / clean).resolve()
        if not path.exists():
            missing.append(value)
print("missing local references:", missing)

expected_ids = [
    "scene",
    "bootScreen",
    "hoverLabel",
    "detailPage",
    "detailImage",
    "detailTitle",
    "guideModal",
    "catalogModal",
    "catalogGrid",
    "clickFlash",
]
for element_id in expected_ids:
    if not tree.xpath(f"//*[@id='{element_id}']"):
        print("MISSING ID", element_id)
print("meta viewport:", bool(tree.xpath("//meta[@name='viewport']")))
print("stylesheet:", bool(tree.xpath("//link[contains(@href,'styles.css')]")))
print("bundle script:", bool(tree.xpath("//script[contains(@src,'app.bundle.js')]")))

# Check inline image count in photos module without parsing the full base64 strings.
photos = (ROOT / "src" / "photos.js").read_text(encoding="utf-8")
data_count = len(re.findall(r"data:image/webp;base64,", photos))
print("inlined webp samples:", data_count)
print("all 75:", data_count == 75)
