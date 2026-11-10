"""生产构建上的第一页点击断言。用真实 Chromium，不用 jsdom。

用法：
  BASE_URL=http://127.0.0.1:3010 python3 e2e/first-page.py
"""

import os
import sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE_URL", "http://127.0.0.1:3010")
FIRST = "雨夜。巷子尽头"
SECOND = "你推门。檐下的铜铃响了一声。"
THIRD = "「你终于来了。」"

results: list[tuple[str, bool, str]] = []


def record(name: str, ok: bool, detail: str) -> None:
    results.append((name, ok, detail))
    print(f"{'PASS' if ok else 'FAIL'}  {name}")
    if detail:
        print(detail)


def hit_chain(page, x: float, y: float) -> str:
    return page.evaluate(
        """([x, y]) => {
          const e = document.elementFromPoint(x, y);
          if (!e) return 'elementFromPoint -> null';
          const lines = [];
          let n = e;
          for (let i = 0; i < 8 && n; i++) {
            const cs = getComputedStyle(n);
            const r = n.getBoundingClientRect();
            lines.push(
              `${n.tagName}` +
              (n.id ? '#' + n.id : '') +
              (n.getAttribute('data-stage') ? '[data-stage=' + n.getAttribute('data-stage') + ']' : '') +
              (n.getAttribute('data-continue') != null ? '[data-continue]' : '') +
              ` pe=${cs.pointerEvents} z=${cs.zIndex}` +
              ` ${Math.round(r.width)}x${Math.round(r.height)}` +
              ` "${(n.innerText || '').replace(/\\s+/g, ' ').slice(0, 24)}"`
            );
            n = n.parentElement;
          }
          return lines.join('\\n');
        }""",
        [x, y],
    )


def main() -> int:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 400, "height": 860}, locale="zh-CN")
        page.goto(BASE + "/", wait_until="networkidle")

        card = page.locator("a[href='/play/seven']")
        if card.count() == 0:
            record("1. 首页卡片进剧本", False, "找不到 a[href='/play/seven']")
            browser.close()
            return summarize()
        card.click()
        try:
            page.wait_for_url("**/play/seven", timeout=1000)
            page.wait_for_selector(f"text={FIRST}", timeout=1000)
            url_ok = page.url.rstrip("/").endswith("/play/seven")
            text_ok = FIRST in page.inner_text("body")
            record(
                "1. 首页卡片 1 秒内进入 /play/seven 且首句可见",
                url_ok and text_ok,
                f"url={page.url}",
            )
        except Exception as e:
            record(
                "1. 首页卡片 1 秒内进入 /play/seven 且首句可见",
                False,
                f"url={page.url}\n{e}",
            )
            browser.close()
            return summarize()

        # 2. 画面中部，避开「继续」和返回
        stage = page.locator("[data-stage='advance']")
        box = stage.bounding_box()
        if not box:
            record("2. 首屏任意位置点击推进", False, "没有 data-stage=advance")
            browser.close()
            return summarize()
        x = box["x"] + box["width"] / 2
        y = box["y"] + min(420, box["height"] * 0.45)
        chain = hit_chain(page, x, y)
        page.mouse.click(x, y)
        page.wait_for_timeout(250)
        body = page.inner_text("body")
        ok2 = SECOND in body and FIRST not in body
        record(
            "2. 首屏中部鼠标点击：雨夜… → 下一句",
            ok2,
            f"click ({x:.0f},{y:.0f})\n命中链:\n{chain}\n正文含第二句={SECOND in body} 仍含首句={FIRST in body}",
        )

        # 3. 点「继续」提示所在的坐标，不要求这个元素自己接住事件
        hint = page.locator("[data-continue]")
        hb = hint.bounding_box() if hint.count() else None
        if not hb:
            record("3. 点「继续」所在位置推进一句", False, "找不到 [data-continue]")
        else:
            cx = hb["x"] + hb["width"] / 2
            cy = hb["y"] + hb["height"] / 2
            chain3 = hit_chain(page, cx, cy)
            page.mouse.click(cx, cy)
            page.wait_for_timeout(250)
            body3 = page.inner_text("body")
            ok3 = THIRD in body3 and SECOND not in body3
            record(
                "3. 点「继续」所在位置：再推进一句",
                ok3,
                f"click ({cx:.0f},{cy:.0f})\n命中链:\n{chain3}\n正文含第三句={THIRD in body3} 仍含第二句={SECOND in body3}",
            )

        browser.close()
    return summarize()


def summarize() -> int:
    failed = [name for name, ok, _ in results if not ok]
    print("---")
    print(f"{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
