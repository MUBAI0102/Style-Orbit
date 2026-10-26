from __future__ import annotations

import base64
import json
import sys
import time
from pathlib import Path

import requests
import websocket

BASE = "http://127.0.0.1:9333"
URL = "http://127.0.0.1:4173/"
OUT = Path(__file__).resolve().parents[1] / "previews"
OUT.mkdir(exist_ok=True)
session = requests.Session()


def http_json(path: str, method: str = "get"):
    url = BASE + path
    r = session.put(url, timeout=15) if method == "put" else session.get(url, timeout=15)
    r.raise_for_status()
    return r.json()


class CDP:
    def __init__(self, ws_url: str):
        self.ws = websocket.create_connection(ws_url, timeout=40)
        self.next_id = 0
        self.console = []
        self.errors = []

    def send(self, method: str, params: dict | None = None, timeout: int = 40):
        self.next_id += 1
        msg_id = self.next_id
        self.ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
        start = time.time()
        while time.time() - start < timeout:
            message = json.loads(self.ws.recv())
            if message.get("id") == msg_id:
                if "error" in message:
                    raise RuntimeError(f"{method}: {message['error']}")
                return message.get("result", {})
            self._event(message)
        raise TimeoutError(method)

    def _event(self, message: dict):
        method = message.get("method", "")
        if method == "Runtime.consoleAPICalled":
            args = [
                arg.get("value", arg.get("description", ""))
                for arg in message.get("params", {}).get("args", [])
            ]
            self.console.append({"type": message.get("params", {}).get("type"), "args": args})
        elif method == "Runtime.exceptionThrown":
            details = message.get("params", {}).get("exceptionDetails", {})
            self.errors.append(
                {
                    "kind": "exception",
                    "text": details.get("text"),
                    "description": details.get("exception", {}).get("description"),
                }
            )
        elif method == "Log.entryAdded":
            entry = message.get("params", {}).get("entry", {})
            if entry.get("level") in ("error", "warning"):
                self.errors.append(
                    {"kind": "log", "level": entry.get("level"), "text": entry.get("text")}
                )

    def evaluate(self, expression: str, await_promise: bool = True):
        result = self.send(
            "Runtime.evaluate",
            {
                "expression": expression,
                "returnByValue": True,
                "awaitPromise": await_promise,
                "userGesture": True,
            },
        )
        if "exceptionDetails" in result:
            self.errors.append(
                {
                    "kind": "eval",
                    "text": result["exceptionDetails"].get("text"),
                    "description": result["exceptionDetails"]
                    .get("exception", {})
                    .get("description"),
                }
            )
            return None
        return result.get("result", {}).get("value")

    def screenshot(self, name: str):
        result = self.send(
            "Page.captureScreenshot",
            {"format": "png", "captureBeyondViewport": False},
        )
        path = OUT / name
        path.write_bytes(base64.b64decode(result["data"]))
        print(f"screenshot -> {path} ({path.stat().st_size} bytes)")

    def move(self, x: float, y: float):
        self.send(
            "Input.dispatchMouseEvent",
            {"type": "mouseMoved", "x": x, "y": y, "button": "none"},
        )

    def click(self, x: float, y: float):
        self.move(x, y)
        time.sleep(0.12)
        self.send(
            "Input.dispatchMouseEvent",
            {"type": "mousePressed", "x": x, "y": y, "button": "left", "clickCount": 1},
        )
        time.sleep(0.08)
        self.send(
            "Input.dispatchMouseEvent",
            {"type": "mouseReleased", "x": x, "y": y, "button": "left", "clickCount": 1},
        )

    def close(self):
        self.ws.close()


def new_page(width: int, height: int, mobile: bool = False, touch: bool = False):
    target = http_json(
        f"/json/new?{requests.utils.quote(URL, safe=':/')}", method="put"
    )
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
        cdp.send(
            "Emulation.setTouchEmulationEnabled",
            {"enabled": True, "maxTouchPoints": 5},
        )
    cdp.send("Page.navigate", {"url": URL})
    return cdp, target


def wait_ready(cdp: CDP, timeout: int = 45):
    start = time.time()
    while time.time() - start < timeout:
        info = cdp.evaluate(
            "({ready: !!window.styleOrbit, boot: document.querySelector('#bootScreen')?.classList.contains('is-done'), hidden: getComputedStyle(document.querySelector('#bootScreen')).visibility, hash: location.hash})"
        )
        if info and info.get("ready") and info.get("boot"):
            return info
        time.sleep(0.4)
    return None


def diag(cdp: CDP, label: str):
    info = cdp.evaluate(
        """(() => {
      const c = document.querySelector('#scene');
      const gl = c && (c.getContext('webgl2') || c.getContext('webgl'));
      return {
        title: document.title,
        viewport: [innerWidth, innerHeight, devicePixelRatio],
        bodyClass: document.body.className,
        canvas: c ? [c.width, c.height, c.clientWidth, c.clientHeight] : null,
        webgl: gl ? gl.getParameter(gl.VERSION) : null,
        boot: document.querySelector('#bootScreen')?.className,
        hero: getComputedStyle(document.querySelector('.hero')).opacity,
        hash: location.hash,
        detailOpen: document.querySelector('#detailPage')?.classList.contains('is-open'),
        hover: {text: document.querySelector('#hoverName')?.textContent, cls: document.querySelector('#hoverLabel')?.className}
      };
    })()"""
    )
    print(f"--- {label} ---")
    print(json.dumps(info, ensure_ascii=False, indent=2))
    if cdp.errors:
        print("ERRORS:", json.dumps(cdp.errors[-16:], ensure_ascii=False, indent=2))
    warns = [x for x in cdp.console if x.get("type") in ("warning", "error")]
    if warns:
        print("CONSOLE:", json.dumps(warns[-16:], ensure_ascii=False, indent=2))


def card_positions(cdp: CDP):
    return cdp.evaluate(
        """(() => {
          const api = window.styleOrbit;
          if (!api || !api.getCardScreen) return null;
          return ['diamond-kid-head-card','electric-blue-halftone-poster','kid-head-card','clear-sky-urban-cel','wibi-frame','paper-portrait-cd']
            .map(slug => ({slug, ...(api.getCardScreen(slug) || {})}));
        })()"""
    )


def run_desktop():
    cdp, target = new_page(1440, 900)
    try:
        ok = wait_ready(cdp)
        print("ready:", ok)
        time.sleep(2.4)
        diag(cdp, "desktop initial")
        cdp.screenshot("desktop-initial.png")

        positions = card_positions(cdp)
        print("cards:", json.dumps(positions, ensure_ascii=False, indent=2))
        if isinstance(positions, list):
            point = next((p for p in positions if p.get("visible") and p.get("onscreen")), None)
            if not point:
                point = next((p for p in positions if p.get("x") and p.get("y")), None)
            if point:
                cdp.move(point["x"], point["y"])
                time.sleep(1.2)
                diag(cdp, "after hover")
                cdp.screenshot("desktop-hover.png")
                cdp.click(point["x"], point["y"])
                time.sleep(0.5)
                cdp.screenshot("desktop-flash.png")
                time.sleep(0.9)
                diag(cdp, "after click / detail")
                cdp.screenshot("desktop-detail.png")

        cdp.evaluate("document.querySelector('#detailBack')?.click()")
        time.sleep(1.2)
        diag(cdp, "back to orbit")
        cdp.screenshot("desktop-back.png")

        cdp.evaluate("document.querySelector('#catalogBtn')?.click()")
        time.sleep(1.0)
        cdp.screenshot("desktop-catalog.png")
        cdp.evaluate("document.querySelector('[data-close-catalog]')?.click()")
        time.sleep(0.5)

        cdp.evaluate("document.querySelector('#guideBtn')?.click()")
        time.sleep(0.8)
        cdp.screenshot("desktop-guide.png")
        cdp.evaluate("document.querySelector('[data-close-guide]')?.click()")
        time.sleep(0.5)
        diag(cdp, "desktop final")
    finally:
        cdp.close()
        session.get(f"{BASE}/json/close/{target['id']}", timeout=10)


def run_mobile():
    cdp, target = new_page(390, 844, mobile=True)
    try:
        ok = wait_ready(cdp)
        print("ready:", ok)
        time.sleep(2.0)
        diag(cdp, "mobile initial")
        cdp.screenshot("mobile-initial.png")
        cdp.evaluate("document.querySelector('#catalogBtn')?.click()")
        time.sleep(0.9)
        cdp.screenshot("mobile-catalog.png")
        cdp.evaluate("document.querySelector('[data-slug=\"diamond-kid-head-card\"]')?.click()")
        time.sleep(1.2)
        cdp.screenshot("mobile-detail-top.png")
        cdp.evaluate("document.querySelector('#detailScroll').scrollTop = 700")
        time.sleep(0.7)
        cdp.screenshot("mobile-detail-scroll.png")
        diag(cdp, "mobile final")
    finally:
        cdp.close()
        session.get(f"{BASE}/json/close/{target['id']}", timeout=10)


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "desktop"
    if mode == "mobile":
        run_mobile()
    else:
        run_desktop()
