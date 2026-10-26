"""Produce the final presentation screenshots found in previews/."""

from __future__ import annotations

import json
import time

from qa_capture import BASE, new_page, session, wait_ready


def prepare(cdp):
    wait_ready(cdp)
    time.sleep(2.6)
    cdp.evaluate("document.querySelector('#coachClose')?.click()")
    time.sleep(0.4)


def close(cdp, target):
    cdp.close()
    session.get(f"{BASE}/json/close/{target['id']}", timeout=10)


def capture_desktop():
    cdp, target = new_page(1440, 900)
    try:
        prepare(cdp)
        cdp.screenshot("preview-orbit.png")

        cdp.evaluate("document.querySelector('#autoToggle')?.click()")
        time.sleep(2.4)
        card = cdp.evaluate(
            """(() => {
              const api = window.styleOrbit;
              const preferred = ['y2k-pop-poster','watercolor-travel-card','gathered-scenes-zine-skill','electric-blue-halftone-poster'];
              for (const slug of preferred) {
                const p = api.getCardScreen(slug);
                const c = api.cards.find(card => card.skill.slug === slug);
                if (p && p.visible && p.onscreen && p.x > 450 && p.x < 1240 && p.y > 280 && p.y < 700) return {slug, name: c.skill.zh, ...p};
              }
              for (const c of api.cards) {
                if (c.skill.sourceType !== 'douyin') continue;
                const p = api.getCardScreen(c.skill.slug);
                if (p && p.visible && p.onscreen && p.x > 450) return {slug: c.skill.slug, name: c.skill.zh, ...p};
              }
              return null;
            })()"""
        )
        print("preview hover card:", json.dumps(card, ensure_ascii=False))
        if card:
            cdp.move(card["x"], card["y"])
            time.sleep(1.1)
            cdp.screenshot("preview-hover.png")

        # Deliberately land on a newly added Douyin style for the detail still.
        cdp.evaluate("location.hash = '#/skill/y2k-pop-poster'")
        time.sleep(1.2)
        cdp.screenshot("preview-detail.png")

        # A prompt entry, showing the dedicated long-text panel.
        cdp.evaluate("location.hash = '#/skill/ink-diptych-postcard'")
        time.sleep(1.1)
        cdp.screenshot("preview-prompt.png")

        # Catalogue, scrolled to the new Douyin entries.
        cdp.evaluate("document.querySelector('#detailBack')?.click()")
        time.sleep(0.8)
        cdp.evaluate("document.querySelector('#catalogBtn')?.click()")
        time.sleep(0.9)
        cdp.evaluate(
            """(() => {
              const grid = document.querySelector('#catalogGrid');
              const card = document.querySelector('[data-slug="y2k-pop-poster"]');
              if (!grid || !card) return;
              const gridTop = grid.getBoundingClientRect().top;
              grid.scrollTop += card.getBoundingClientRect().top - gridTop - 12;
            })()"""
        )
        time.sleep(0.7)
        cdp.screenshot("preview-catalog.png")
        cdp.evaluate("document.querySelector('[data-close-catalog]')?.click()")
        time.sleep(0.5)

        # Guide.
        cdp.evaluate("document.querySelector('#guideBtn')?.click()")
        time.sleep(0.7)
        cdp.screenshot("preview-guide.png")
        cdp.evaluate("document.querySelector('[data-close-guide]')?.click()")
        time.sleep(0.4)
    finally:
        close(cdp, target)


def capture_mobile():
    cdp, target = new_page(390, 844, mobile=True, touch=True)
    try:
        prepare(cdp)
        cdp.screenshot("preview-mobile.png")
    finally:
        close(cdp, target)


if __name__ == "__main__":
    capture_desktop()
    capture_mobile()
