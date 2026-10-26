"""End-to-end interaction checks using the Chrome DevTools protocol."""

from __future__ import annotations

import json
import math
import time

from qa_capture import BASE, new_page, session, wait_ready

results: list[tuple[str, bool, str]] = []


def check(name: str, condition: bool, detail: str = ""):
    results.append((name, bool(condition), detail))
    print(("PASS" if condition else "FAIL"), name, detail)


def main():
    cdp, target = new_page(1440, 900)
    try:
        ready = wait_ready(cdp)
        check("boot & three.js ready", bool(ready), json.dumps(ready, ensure_ascii=False))
        time.sleep(1.2)
        state = cdp.evaluate(
            "({cards: window.styleOrbit.cards.length, slugs: new Set(window.styleOrbit.cards.map(c=>c.skill.slug)).size, camera: window.styleOrbit.camera.position.toArray(), errors: 0})"
        )
        check("75 unique cards", state and state["cards"] == 75 and state["slugs"] == 75, str(state))

        # Drag orbit.
        before = cdp.evaluate("window.styleOrbit.camera.position.toArray()")
        cdp.send("Input.dispatchMouseEvent", {"type": "mousePressed", "x": 700, "y": 560, "button": "left", "clickCount": 1})
        for x in range(710, 861, 25):
            cdp.send("Input.dispatchMouseEvent", {"type": "mouseMoved", "x": x, "y": 560, "button": "left", "buttons": 1})
            time.sleep(0.03)
        cdp.send("Input.dispatchMouseEvent", {"type": "mouseReleased", "x": 860, "y": 560, "button": "left", "clickCount": 1})
        time.sleep(1.0)
        after = cdp.evaluate("window.styleOrbit.camera.position.toArray()")
        delta = math.dist(before, after) if before and after else 0
        check("drag rotates camera", delta > 0.05, f"delta={delta:.3f}")

        # Zoom.
        before = cdp.evaluate("window.styleOrbit.camera.position.toArray()")
        cdp.send(
            "Input.dispatchMouseEvent",
            {"type": "mouseWheel", "x": 720, "y": 450, "deltaX": 0, "deltaY": -320, "button": "none"},
        )
        time.sleep(0.7)
        after = cdp.evaluate("window.styleOrbit.camera.position.toArray()")
        delta = math.dist(before, after) if before and after else 0
        check("wheel zooms camera", delta > 0.05, f"delta={delta:.3f}")

        # Reset view.
        cdp.evaluate("document.querySelector('#resetView')?.click()")
        time.sleep(1.3)
        cam = cdp.evaluate("window.styleOrbit.camera.position.toArray()")
        check("reset view returns home", cam and abs(cam[0]) < 0.01 and abs(cam[2] - 14.3) < 0.05, str(cam))

        # Freeze orbit and hover a visible card.
        cdp.evaluate("document.querySelector('#autoToggle')?.click()")
        time.sleep(1.4)
        point = cdp.evaluate(
            """(() => {
              const api = window.styleOrbit;
              for (const card of api.cards) {
                const p = api.getCardScreen(card.skill.slug);
                if (p && p.visible && p.onscreen && p.x > 430) return {slug: card.skill.slug, name: card.skill.zh, ...p};
              }
              return null;
            })()"""
        )
        check("a card is projectable", bool(point), str(point))
        if point:
            cdp.move(point["x"], point["y"])
            time.sleep(0.8)
            hover = cdp.evaluate(
                "({visible: document.querySelector('#hoverLabel').classList.contains('is-visible'), name: document.querySelector('#hoverName').textContent})"
            )
            check("hover label appears", bool(hover and hover["visible"]), str(hover))

            # Click card.
            cdp.click(point["x"], point["y"])
            time.sleep(1.1)
            opened = cdp.evaluate(
                "({open: document.querySelector('#detailPage').classList.contains('is-open'), hash: location.hash, title: document.querySelector('#detailTitle').textContent, cmd: document.querySelector('#detailCommand').textContent, img: !!document.querySelector('#detailImage').src})"
            )
            check("card click opens detail", bool(opened and opened["open"] and opened["hash"].startswith("#/skill/")), str(opened))
            check("detail content filled", bool(opened and opened["title"] and opened["cmd"] and opened["img"]), str(opened))

            # Next / previous.
            old_hash = opened["hash"] if opened else ""
            cdp.evaluate("document.querySelector('#detailNext')?.click()")
            time.sleep(0.5)
            new_data = cdp.evaluate("({hash: location.hash, title: document.querySelector('#detailTitle').textContent, idx: document.querySelector('#detailIndex').textContent})")
            check("next skill navigates", bool(new_data and new_data["hash"] != old_hash and new_data["title"]), str(new_data))
            cdp.evaluate("document.querySelector('#detailPrev')?.click()")
            time.sleep(0.5)
            back_data = cdp.evaluate("({hash: location.hash, title: document.querySelector('#detailTitle').textContent})")
            check("previous skill navigates", bool(back_data and back_data["hash"] == old_hash), str(back_data))

            # Copy command.
            cdp.evaluate("document.querySelector('#copyUsage')?.click()")
            time.sleep(0.35)
            toast = cdp.evaluate("({text: document.querySelector('#toast').textContent, visible: document.querySelector('#toast').classList.contains('is-visible')})")
            check("copy command gives feedback", bool(toast and toast["visible"]), str(toast))

            # Close detail with Escape.
            cdp.evaluate("window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))")
            time.sleep(1.1)
            closed = cdp.evaluate(
                "({open: document.querySelector('#detailPage').classList.contains('is-open'), aria: document.querySelector('#detailPage').getAttribute('aria-hidden'), hash: location.hash})"
            )
            check("Escape closes detail", bool(closed and not closed["open"]), str(closed))

        # Catalog open / count / filter / search.
        cdp.evaluate("document.querySelector('#catalogBtn')?.click()")
        time.sleep(0.5)
        cat = cdp.evaluate(
            "({open: document.querySelector('#catalogModal').classList.contains('is-open'), count: document.querySelectorAll('.catalog-card').length, visible: [...document.querySelectorAll('.catalog-card')].filter(c => !c.hidden).length})"
        )
        check("catalog opens with all 75", bool(cat and cat["open"] and cat["count"] == 75 and cat["visible"] == 75), str(cat))
        cdp.evaluate("document.querySelector('[data-filter=\"kid\"]')?.click()")
        time.sleep(0.25)
        kid_count = cdp.evaluate("[...document.querySelectorAll('.catalog-card')].filter(c => !c.hidden).length")
        check("catalog category filter", kid_count == 2, str(kid_count))
        cdp.evaluate("document.querySelector('[data-filter=\"douyin\"]')?.click()")
        time.sleep(0.25)
        douyin_count = cdp.evaluate("[...document.querySelectorAll('.catalog-card')].filter(c => !c.hidden).length")
        check("catalog Douyin source filter", douyin_count == 31, str(douyin_count))
        cdp.evaluate("document.querySelector('[data-filter=\"all\"]')?.click()")
        cdp.evaluate(
            "(() => { const input=document.querySelector('#catalogSearch'); input.value='海报'; input.dispatchEvent(new Event('input',{bubbles:true})); })()"
        )
        time.sleep(0.35)
        search_count = cdp.evaluate("[...document.querySelectorAll('.catalog-card')].filter(c => !c.hidden).length")
        check("catalog search filters", 0 < (search_count or 0) < 75, str(search_count))
        cdp.evaluate("document.querySelector('[data-close-catalog]')?.click()")
        time.sleep(0.5)

        # Guide modal open/close.
        cdp.evaluate("document.querySelector('#guideBtn')?.click()")
        time.sleep(0.4)
        guide_open = cdp.evaluate("document.querySelector('#guideModal').classList.contains('is-open')")
        check("guide opens", bool(guide_open), str(guide_open))
        cdp.evaluate("document.querySelector('[data-close-guide]')?.click()")
        time.sleep(0.35)
        guide_closed = cdp.evaluate("!document.querySelector('#guideModal').classList.contains('is-open')")
        check("guide closes", bool(guide_closed), str(guide_closed))

        # Auto toggle keyboard, reset keyboard.
        auto_before = cdp.evaluate("document.querySelector('#autoToggle').getAttribute('aria-pressed')")
        cdp.evaluate("window.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',key:' ',bubbles:true}))")
        time.sleep(0.3)
        auto_after = cdp.evaluate("document.querySelector('#autoToggle').getAttribute('aria-pressed')")
        check("space toggles auto orbit", auto_before != auto_after, f"{auto_before}->{auto_after}")

        check("no runtime exceptions", not [e for e in cdp.errors if e.get("kind") in ("exception", "eval")], json.dumps(cdp.errors[-6:], ensure_ascii=False))

        # Deep link via hashchange.
        cdp.evaluate("location.hash = '#/skill/cream-home-sketch'")
        time.sleep(0.9)
        deep = cdp.evaluate("({open: document.querySelector('#detailPage').classList.contains('is-open'), title: document.querySelector('#detailTitle').textContent, cls: document.querySelector('#detailTitle').className})")
        check("hash deep-link opens long-title detail", bool(deep and deep["open"] and deep["title"] == "奶油纸复古家居速写"), str(deep))
        time.sleep(0.3)
        cdp.screenshot("final-detail-long.png")
    finally:
        failed = [name for name, ok, _ in results if not ok]
        print("\nSUMMARY", f"{len(results)-len(failed)}/{len(results)} passed")
        if failed:
            print("FAILED:", failed)
        cdp.close()
        session.get(f"{BASE}/json/close/{target['id']}", timeout=10)


if __name__ == "__main__":
    main()
