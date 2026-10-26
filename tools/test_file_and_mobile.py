from __future__ import annotations

import json
import time
from pathlib import Path
from urllib.parse import quote

import requests

from qa_capture import BASE, CDP, OUT, session

ROOT = Path(__file__).resolve().parents[1]
FILE_URL = (ROOT / "index.html").as_uri()


def make_target(url: str, width: int, height: int, mobile: bool = False, touch: bool = False):
    target = session.put(
        f"{BASE}/json/new?{quote(url, safe=':/')}", timeout=15
    ).json()
    cdp = CDP(target["webSocketDebuggerUrl"])
    cdp.send("Page.enable")
    cdp.send("Runtime.enable")
    cdp.send("Log.enable")
    cdp.send(
        "Emulation.setDeviceMetricsOverride",
        {
            "width": width,
            "height": height,
            "deviceScaleFactor": 1,
            "mobile": mobile,
            "screenWidth": width,
            "screenHeight": height,
        },
    )
    if touch:
        cdp.send("Emulation.setTouchEmulationEnabled", {"enabled": True, "maxTouchPoints": 5})
    cdp.send("Page.navigate", {"url": url})
    return cdp, target


def wait_loaded(cdp, timeout=40):
    start = time.time()
    while time.time() - start < timeout:
        info = cdp.evaluate(
            "({ready: !!window.styleOrbit, booted: document.querySelector('#bootScreen')?.classList.contains('is-done'), body: document.body.className})"
        )
        if info and info.get("ready") and info.get("booted"):
            return info
        time.sleep(0.4)
    return None


def close(cdp, target):
    cdp.close()
    session.get(f"{BASE}/json/close/{target['id']}", timeout=10)


def test_file():
    cdp, target = make_target(FILE_URL, 1280, 800)
    try:
        info = wait_loaded(cdp)
        print("FILE ready:", info)
        errs = [e for e in cdp.errors if e.get("kind") in ("exception", "eval")]
        print("FILE errors:", json.dumps(errs[-5:], ensure_ascii=False))
        time.sleep(1.2)
        cdp.screenshot("check-file-protocol.png")
    finally:
        close(cdp, target)


def test_mobile_touch():
    cdp, target = make_target("http://127.0.0.1:4173/", 390, 844, mobile=True, touch=True)
    try:
        info = wait_loaded(cdp)
        print("TOUCH ready:", info)
        time.sleep(1.4)
        env = cdp.evaluate(
            "({touch: document.body.classList.contains('is-touch'), hoverMedia: matchMedia('(hover: none)').matches, dock: [...document.querySelectorAll('.dock-item')].filter(n => getComputedStyle(n).display !== 'none').map(n=>n.innerText.trim())})"
        )
        print("TOUCH env:", json.dumps(env, ensure_ascii=False))
        point = cdp.evaluate(
            """(() => {
              const api = window.styleOrbit;
              for (const card of api.cards) {
                const p = api.getCardScreen(card.skill.slug);
                if (p && p.visible && p.onscreen && p.x > 80 && p.x < 330 && p.y > 380 && p.y < 650) return {slug: card.skill.slug, name: card.skill.zh, ...p};
              }
              return null;
            })()"""
        )
        print("TOUCH card:", point)
        if point:
            cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": point["x"], "y": point["y"], "radiusX": 2, "radiusY": 2, "force": 1, "id": 1}]})
            time.sleep(0.1)
            cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
            time.sleep(1.2)
            result = cdp.evaluate("({open: document.querySelector('#detailPage').classList.contains('is-open'), title: document.querySelector('#detailTitle').textContent, hash: location.hash})")
            print("TOUCH tap result:", json.dumps(result, ensure_ascii=False))
            cdp.screenshot("check-mobile-detail-tap.png")
        cdp.screenshot("check-mobile-touch.png")
    finally:
        close(cdp, target)


if __name__ == "__main__":
    test_file()
    test_mobile_touch()
