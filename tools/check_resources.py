import time

from qa_capture import BASE, new_page, session, wait_ready

cdp, target = new_page(1280, 800)
try:
    wait_ready(cdp)
    time.sleep(1.0)
    resources = cdp.evaluate("performance.getEntriesByType('resource').map(e => e.name)")
    print("resources:")
    print("\n".join(resources or []))
    external = [
        item
        for item in (resources or [])
        if not (
            item.startswith("http://127.0.0.1:4173")
            or item.startswith("data:")
            or item.startswith("blob:")
        )
    ]
    print("external:", external)
finally:
    cdp.close()
    session.get(f"{BASE}/json/close/{target['id']}", timeout=10)
