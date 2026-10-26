"""End-to-end browser QA for the local add / duplicate / edit / delete flow."""

from __future__ import annotations

import json
import time
from pathlib import Path

from qa_capture import BASE, CDP, new_page, session, wait_ready

ROOT = Path(__file__).resolve().parents[1]
TEST_IMAGE = ROOT / "assets" / "skills" / "alt-manga-avatar.jpg"
RESULTS = []


def check(name, condition, detail=""):
    RESULTS.append((name, bool(condition), detail))
    print(("PASS " if condition else "FAIL ") + name + ((" " + str(detail)) if detail else ""))


def js(cdp, expression):
    return cdp.evaluate(expression)


def fill(cdp, selector, value):
    js(
        cdp,
        f"""(() => {{
          const el = document.querySelector({json.dumps(selector)});
          if (!el) return false;
          el.value = {json.dumps(value)};
          el.dispatchEvent(new Event('input', {{bubbles:true}}));
          el.dispatchEvent(new Event('change', {{bubbles:true}}));
          return true;
        }})()""",
    )


def click(cdp, selector):
    js(cdp, f"document.querySelector({json.dumps(selector)})?.click()")


def modal_info(cdp):
    return js(
        cdp,
        """(() => ({
          open: document.querySelector('#addModal')?.classList.contains('is-open'),
          duplicateClass: document.querySelector('#addDuplicate')?.className,
          duplicateText: document.querySelector('#addDuplicateBody')?.innerText,
          submitDisabled: document.querySelector('#addSubmit')?.disabled,
          confirmHidden: document.querySelector('#addConfirmWrap')?.hidden,
          title: document.querySelector('#addHeading')?.innerText,
          preview: document.querySelector('#addImagePreview')?.src.slice(0, 30),
        }))()""",
    )


def page_info(cdp):
    return js(
        cdp,
        """(() => ({
          cards: window.styleOrbit?.cards?.length,
          total: document.querySelector('#catalogTitle')?.textContent,
          localChip: [...document.querySelectorAll('.filter-chip')].map(n => n.textContent).filter(Boolean),
          localCount: document.querySelector('.catalog-footer [data-local-count]')?.textContent,
          hash: location.hash,
          detail: document.querySelector('#detailTitle')?.textContent,
          localActions: document.querySelector('#detailLocalActions')?.hidden,
          badge: document.querySelector('#detailBadge')?.textContent,
          storage: Object.keys(localStorage).filter(k => k.includes('style-orbit')).map(k => [k, localStorage.getItem(k)?.length]),
        }))()""",
    )


def wait_reload(cdp):
    time.sleep(2.6)
    ready = wait_ready(cdp)
    time.sleep(0.7)
    return ready


def reload_page(cdp):
    cdp.send("Page.reload", {"ignoreCache": True})
    return wait_reload(cdp)


def main():
    cdp, target = new_page(1440, 900)
    try:
        ready = wait_ready(cdp)
        check("initial 75 loaded", ready and page_info(cdp)["cards"] == 75, str(page_info(cdp)))
        js(cdp, "localStorage.removeItem('style-orbit:custom-library:v1')")
        cdp.send("Page.navigate", {"url": "http://127.0.0.1:4173/?qa=local-1"})
        ready = wait_ready(cdp)
        check("clean local library", ready and page_info(cdp)["cards"] == 75, str(page_info(cdp)))

        click(cdp, "#addBtn")
        time.sleep(0.4)
        info = modal_info(cdp)
        check("add modal opens", info["open"], json.dumps(info, ensure_ascii=False))
        check("add button present", js(cdp, "!!document.querySelector('#addBtn')"), "")
        check("placeholder cover generated", (info["preview"] or "").startswith("data:image/svg+xml"), info["preview"])
        cdp.screenshot("qa-add-modal.png")

        # Exact duplicate by Chinese title.
        fill(cdp, "#addZh", "电蓝网点海报")
        time.sleep(0.45)
        info = modal_info(cdp)
        check(
            "exact duplicate is blocked",
            "has-exact" in info["duplicateClass"] and info["submitDisabled"] and "电蓝网点海报" in info["duplicateText"],
            json.dumps(info, ensure_ascii=False),
        )
        cdp.screenshot("qa-add-duplicate.png")

        # Near duplicate by containment.
        fill(cdp, "#addZh", "电蓝网点海报特别版")
        time.sleep(0.45)
        info = modal_info(cdp)
        check(
            "similar duplicate asks for confirmation",
            "has-similar" in info["duplicateClass"] and not info["confirmHidden"],
            json.dumps(info, ensure_ascii=False),
        )

        # Unique Skill + image upload.
        fill(cdp, "#addZh", "测试本地风格A")
        fill(cdp, "#addEn", "Test Local Style Alpha")
        fill(cdp, "#addSlug", "test-local-style-alpha")
        fill(cdp, "#addDescription", "这是浏览器 QA 添加的本地风格。")
        fill(cdp, "#addBestFor", "测试输入 · QA")
        fill(cdp, "#addTags", "本地, 测试, 验证")
        fill(cdp, "#addPrompt", "保持主体，加入柔和的纸张纹理和温暖的边缘光。")
        time.sleep(0.4)
        info = modal_info(cdp)
        check("unique candidate is clear", "is-clear" in info["duplicateClass"], info["duplicateText"])

        if TEST_IMAGE.exists():
            doc = cdp.send("DOM.getDocument", {"depth": -1})
            node = cdp.send(
                "DOM.querySelector",
                {"nodeId": doc["root"]["nodeId"], "selector": "#addImageInput"},
            )
            cdp.send(
                "DOM.setFileInputFiles",
                {"files": [str(TEST_IMAGE)], "nodeId": node["nodeId"]},
            )
            js(cdp, "document.querySelector('#addImageInput').dispatchEvent(new Event('change',{bubbles:true}))")
            time.sleep(1.3)
        info = modal_info(cdp)
        check(
            "image upload compressed to local data URL",
            (info["preview"] or "").startswith("data:image/webp"),
            info["preview"],
        )
        cdp.screenshot("qa-add-filled.png")

        click(cdp, "#addSubmit")
        ready = wait_reload(cdp)
        info = page_info(cdp)
        check("adding a skill reloads to 76 cards", ready and info["cards"] == 76, json.dumps(info, ensure_ascii=False))
        check("local count becomes 1", info["localCount"] == "1", json.dumps(info, ensure_ascii=False))
        check("local filter appears", any("本地 1" in x for x in info["localChip"]), json.dumps(info.get("localChip")))
        check("saved item opens in detail", info["hash"] == "#/skill/test-local-style-alpha" and info["detail"] == "测试本地风格A", json.dumps(info, ensure_ascii=False))
        check("local badge and actions visible", info["badge"] == "LOCAL SKILL" and info["localActions"] is False, json.dumps(info, ensure_ascii=False))
        cdp.screenshot("qa-local-detail.png")

        # Edit the saved item.
        click(cdp, "#detailEditLocal")
        time.sleep(0.5)
        info = modal_info(cdp)
        check(
            "edit modal opens prefilled",
            info["open"]
            and js(cdp, "document.querySelector('#addKicker').textContent.includes('EDIT LOCAL ENTRY')")
            and js(cdp, "document.querySelector('#addZh').value") == "测试本地风格A",
            json.dumps(info, ensure_ascii=False),
        )
        fill(cdp, "#addZh", "测试本地风格A改")
        fill(cdp, "#addDescription", "编辑后的本地风格说明。")
        time.sleep(0.35)
        click(cdp, "#addSubmit")
        ready = wait_reload(cdp)
        info = page_info(cdp)
        check("editing keeps 76 and updates detail", ready and info["cards"] == 76 and info["detail"] == "测试本地风格A改", json.dumps(info, ensure_ascii=False))

        # Add a local Prompt.
        click(cdp, "#addBtn")
        time.sleep(0.35)
        click(cdp, '[data-add-kind="prompt"]')
        time.sleep(0.2)
        fill(cdp, "#addZh", "测试本地提示词")
        fill(cdp, "#addEn", "Test Local Prompt")
        fill(cdp, "#addSlug", "test-local-prompt")
        fill(cdp, "#addPrompt", "请把上传照片重构为一张极简的本地提示词测试海报，只使用米白、墨黑和一点荧光绿色，保留主体轮廓，加入纸张颗粒与少量打字机文字。")
        time.sleep(0.5)
        info = modal_info(cdp)
        check("prompt form switches category", js(cdp, "document.querySelector('#addCategory').value") == "prompt", json.dumps(info, ensure_ascii=False))
        check("prompt candidate is clear", "is-clear" in info["duplicateClass"], info["duplicateText"])
        click(cdp, "#addSubmit")
        ready = wait_reload(cdp)
        info = page_info(cdp)
        check("adding a prompt reloads to 77", ready and info["cards"] == 77, json.dumps(info, ensure_ascii=False))
        check("prompt detail opens with local prompt badge", info["badge"] == "LOCAL PROMPT" and info["detail"] == "测试本地提示词", json.dumps(info, ensure_ascii=False))
        check("prompt panel is visible", js(cdp, "!document.querySelector('#promptPanel').hidden"), "")
        cdp.screenshot("qa-local-prompt.png")

        # Duplicate prompt text must be blocked.
        click(cdp, "#addBtn")
        time.sleep(0.35)
        click(cdp, '[data-add-kind="prompt"]')
        time.sleep(0.2)
        fill(cdp, "#addZh", "同提示词的不同名字")
        fill(cdp, "#addEn", "Another Name")
        fill(cdp, "#addPrompt", "请把上传照片重构为一张极简的本地提示词测试海报，只使用米白、墨黑和一点荧光绿色，保留主体轮廓，加入纸张颗粒与少量打字机文字。")
        time.sleep(0.5)
        info = modal_info(cdp)
        check(
            "same prompt text is blocked",
            "has-exact" in info["duplicateClass"] and "提示词全文" in info["duplicateText"] and info["submitDisabled"],
            json.dumps(info, ensure_ascii=False),
        )
        click(cdp, "[data-close-add]")
        time.sleep(0.4)

        # Delete the local prompt.
        js(cdp, "window.confirm = () => true")
        js(cdp, "location.hash = '#/skill/test-local-prompt'")
        time.sleep(0.9)
        click(cdp, "#detailDeleteLocal")
        ready = wait_reload(cdp)
        info = page_info(cdp)
        check("delete prompt returns to 76", ready and info["cards"] == 76 and info["hash"] in ("", "#orbit"), json.dumps(info, ensure_ascii=False))
        check("remaining local count is 1", info["localCount"] == "1", json.dumps(info, ensure_ascii=False))

        # Reload once more for persistence.
        ready = reload_page(cdp)
        info = page_info(cdp)
        check("local skill persists after reload", ready and info["cards"] == 76 and info["localCount"] == "1", json.dumps(info, ensure_ascii=False))

        check("no runtime errors", not [e for e in cdp.errors if e.get("kind") in ("exception", "eval")], json.dumps(cdp.errors[-8:], ensure_ascii=False))
        failed = [name for name, ok, _ in RESULTS if not ok]
        print("\nSUMMARY", f"{len(RESULTS) - len(failed)}/{len(RESULTS)} passed")
        if failed:
            print("FAILED", failed)
    finally:
        cdp.close()
        session.get(f"{BASE}/json/close/{target['id']}", timeout=10)


if __name__ == "__main__":
    main()
