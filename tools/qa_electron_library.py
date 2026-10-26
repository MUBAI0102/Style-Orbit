"""Verify the Electron desktop bridge, add flow and library.json persistence."""

from __future__ import annotations

import json
import time
from pathlib import Path

import requests

from qa_capture import CDP

ROOT = Path(__file__).resolve().parents[1]
TEST_IMAGE = ROOT / "assets" / "skills" / "alt-manga-avatar.jpg"
LIBRARY = ROOT / "desktop" / ".qa-data" / "library.json"
RESULTS = []


def check(name, condition, detail=""):
    RESULTS.append((name, bool(condition), detail))
    print(("PASS " if condition else "FAIL ") + name + ((" " + str(detail)) if detail else ""))


def fill(cdp, selector, value):
    cdp.evaluate(
        f"""(() => {{
          const el = document.querySelector({json.dumps(selector)});
          if (!el) return false;
          el.value = {json.dumps(value)};
          el.dispatchEvent(new Event('input', {{bubbles:true}}));
          el.dispatchEvent(new Event('change', {{bubbles:true}}));
          return true;
        }})()"""
    )


def page_info(cdp):
    return cdp.evaluate(
        """(() => ({
          cards: window.styleOrbit?.cards?.length,
          desktop: window.desktopAPI?.isDesktop,
          initialLibrary: window.desktopAPI?.initialLibrary?.length,
          total: document.querySelector('#catalogTitle')?.textContent,
          localCount: document.querySelector('.catalog-footer [data-local-count]')?.textContent,
          hash: location.hash,
          title: document.querySelector('#detailTitle')?.textContent,
          badge: document.querySelector('#detailBadge')?.textContent,
          localActions: document.querySelector('#detailLocalActions')?.hidden,
        }))()"""
    )


def wait_ready(cdp, timeout=40):
    start = time.time()
    while time.time() - start < timeout:
        info = cdp.evaluate(
            "({ready: !!window.styleOrbit, boot: document.querySelector('#bootScreen')?.classList.contains('is-done'), cards: window.styleOrbit?.cards?.length})"
        )
        if info and info.get("ready") and info.get("boot"):
            return info
        time.sleep(0.35)
    return None


def wait_reload(cdp):
    time.sleep(2.7)
    ready = wait_ready(cdp)
    time.sleep(0.6)
    return ready


def main():
    targets = requests.get("http://127.0.0.1:9334/json/list", timeout=5).json()
    target = targets[0]
    cdp = CDP(target["webSocketDebuggerUrl"])
    try:
        cdp.send("Page.enable")
        cdp.send("Runtime.enable")
        cdp.send("Log.enable")
        cdp.send("Emulation.setDeviceMetricsOverride", {"width": 1440, "height": 900, "deviceScaleFactor": 1, "mobile": False})
        ready = wait_ready(cdp)
        info = page_info(cdp)
        check("desktop renderer boots", bool(ready), json.dumps(info, ensure_ascii=False))
        check("desktop bridge is present", info["desktop"] and info["initialLibrary"] == 0, json.dumps(info, ensure_ascii=False))
        check("empty desktop library starts at 75", info["cards"] == 75, json.dumps(info, ensure_ascii=False))
        cdp.screenshot("qa-electron-initial.png")

        cdp.evaluate("document.querySelector('#addBtn')?.click()")
        time.sleep(0.5)
        check("desktop add modal opens", cdp.evaluate("document.querySelector('#addModal')?.classList.contains('is-open')"), "")
        fill(cdp, "#addZh", "电蓝网点海报")
        time.sleep(0.5)
        exact = cdp.evaluate(
            "({cls: document.querySelector('#addDuplicate')?.className, disabled: document.querySelector('#addSubmit')?.disabled, text: document.querySelector('#addDuplicateBody')?.innerText})"
        )
        check("desktop duplicate check blocks exact name", "has-exact" in exact["cls"] and exact["disabled"], json.dumps(exact, ensure_ascii=False))

        fill(cdp, "#addZh", "桌面本地测试条目")
        fill(cdp, "#addEn", "Desktop Local Test Entry")
        fill(cdp, "#addSlug", "desktop-local-test-entry")
        fill(cdp, "#addDescription", "用于验证桌面版保存到 library.json 的本地条目。")
        fill(cdp, "#addBestFor", "桌面测试 · 本地文件")
        fill(cdp, "#addTags", "桌面, 本地, 测试")
        fill(cdp, "#addPrompt", "把照片处理成一张桌面版本地测试示例，保留主体并加入纸张质感。")
        time.sleep(0.45)
        if TEST_IMAGE.exists():
            doc = cdp.send("DOM.getDocument", {"depth": -1})
            node = cdp.send("DOM.querySelector", {"nodeId": doc["root"]["nodeId"], "selector": "#addImageInput"})
            cdp.send("DOM.setFileInputFiles", {"files": [str(TEST_IMAGE)], "nodeId": node["nodeId"]})
            cdp.evaluate("document.querySelector('#addImageInput').dispatchEvent(new Event('change',{bubbles:true}))")
            time.sleep(1.2)
        image_state = cdp.evaluate("document.querySelector('#addImagePreview')?.src.slice(0,30)")
        check("desktop image is compressed locally", str(image_state).startswith("data:image/webp"), image_state)
        cdp.screenshot("qa-electron-add.png")

        cdp.evaluate("document.querySelector('#addSubmit')?.click()")
        ready = wait_reload(cdp)
        info = page_info(cdp)
        check("desktop save reloads to 76 cards", bool(ready) and info["cards"] == 76, json.dumps(info, ensure_ascii=False))
        check("desktop detail shows local entry", info["hash"] == "#/skill/desktop-local-test-entry" and info["badge"] == "LOCAL SKILL", json.dumps(info, ensure_ascii=False))
        check("preload sees saved library", info["initialLibrary"] == 1, json.dumps(info, ensure_ascii=False))
        cdp.screenshot("qa-electron-local.png")

        exists = LIBRARY.exists()
        raw = json.loads(LIBRARY.read_text(encoding="utf-8")) if exists else {}
        items = raw.get("items", [])
        check("library.json exists and contains one entry", exists and len(items) == 1, str(LIBRARY))
        check("library.json preserves image data", bool(items and str(items[0].get("image", "")).startswith("data:image/webp")), "image saved")
        check("library.json has schema and timestamp", raw.get("schemaVersion") == 1 and bool(raw.get("updatedAt")), str({k: raw.get(k) for k in ("schemaVersion", "updatedAt")}))

        if cdp.errors:
            errors = [e for e in cdp.errors if e.get("kind") in ("exception", "eval")]
            check("no desktop runtime exceptions", not errors, json.dumps(errors[-8:], ensure_ascii=False))
        else:
            check("no desktop runtime exceptions", True, "")

        print("\nSUMMARY", f"{sum(1 for _, ok, _ in RESULTS if ok)}/{len(RESULTS)} passed")
        print("LIBRARY", LIBRARY)
    finally:
        cdp.close()


if __name__ == "__main__":
    main()
