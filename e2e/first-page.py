"""生产构建上的第一页点击断言。真实 Chromium，不用 jsdom。

用法：
  BASE_URL=http://127.0.0.1:3010 python3 e2e/first-page.py
"""

import os
import sys
from urllib.parse import parse_qs, urlparse

from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE_URL", "http://127.0.0.1:3010")
FIRST = "雨夜。巷子尽头"
SECOND = "你推门。檐下的铜铃响了一声。"
THIRD = "「你终于来了。」"
MARKS = [
    FIRST,
    "铜铃",
    "你终于来了",
    "我们见过",
    "写了七遍",
    "很旧的名册",
    "坐到天亮",
]
NAME = "林小满"
STAY = "留下。我想知道为什么是我"
STAY_REPLY = "她合上册子"

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
          if (!e) return "elementFromPoint -> null";
          const lines = [];
          let n = e;
          for (let i = 0; i < 8 && n; i++) {
            const cs = getComputedStyle(n);
            const r = n.getBoundingClientRect();
            const stage = n.getAttribute && n.getAttribute("data-stage");
            lines.push(
              n.tagName +
                (n.id ? "#" + n.id : "") +
                (stage ? "[data-stage=" + stage + "]" : "") +
                (n.hasAttribute && n.hasAttribute("data-continue") ? "[data-continue]" : "") +
                (n.hasAttribute && n.hasAttribute("data-back") ? "[data-back]" : "") +
                " pe=" + cs.pointerEvents +
                " z=" + cs.zIndex +
                " " + Math.round(r.width) + "x" + Math.round(r.height) +
                ' "' + (n.innerText || "").replace(/\\s+/g, " ").slice(0, 28) + '"'
            );
            n = n.parentElement;
          }
          return lines.join("\\n");
        }""",
        [x, y],
    )


def beat_of(url: str) -> int:
    q = parse_qs(urlparse(url).query)
    raw = q.get("b", ["0"])[0]
    try:
        return int(raw)
    except ValueError:
        return 0


def click_xy(page, x: float, y: float) -> None:
    page.mouse.click(x, y)


def summarize() -> int:
    failed = [name for name, ok, _ in results if not ok]
    print("---")
    print(f"{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


def main() -> int:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 400, "height": 860}, locale="zh-CN")
        page.goto(BASE + "/", wait_until="networkidle")
        card = page.locator("a[href='/play/seven']")
        if card.count() == 0:
            record("1. 首页进入", False, "找不到剧目卡")
            browser.close()
            return summarize()
        card.click()
        try:
            page.wait_for_url("**/play/seven", timeout=1000)
            page.wait_for_selector(f"text={FIRST}", timeout=1000)
            record(
                "1. 首页卡片 1 秒内进入 /play/seven 且首句可见",
                page.url.rstrip("/").endswith("/play/seven") and FIRST in page.inner_text("body"),
                f"url={page.url}",
            )
        except Exception as e:
            record("1. 首页卡片 1 秒内进入 /play/seven 且首句可见", False, f"url={page.url}\n{e}")
            browser.close()
            return summarize()

        # —— 2. 5x5 扫格：画面内每个点的命中元素必须就是 advance ——
        xs = [(i + 0.5) * 400 / 5 for i in range(5)]
        ys = [(i + 0.5) * 860 / 5 for i in range(5)]
        bad: list[str] = []
        checked = 0
        for y in ys:
            for x in xs:
                top = page.evaluate(
                    """([x, y]) => {
                      const e = document.elementFromPoint(x, y);
                      if (!e) return { tag: "null", stage: false, back: false };
                      return {
                        tag: e.tagName,
                        stage: e.getAttribute("data-stage") === "advance",
                        back: !!(e.closest && e.closest("[data-back], a[aria-label='返回']")),
                      };
                    }""",
                    [x, y],
                )
                if top["back"]:
                    continue
                checked += 1
                if top["tag"] in ("IMG", "VIDEO") or not top["stage"]:
                    bad.append(f"({x:.0f},{y:.0f}) {top['tag']}\n{hit_chain(page, x, y)}")
        record(
            "2. 5x5 扫格：画面内每点都打在 advance 上",
            checked > 0 and not bad,
            f"检查 {checked} 点，拦截 {len(bad)}\n" + ("\n\n".join(bad) if bad else "无拦截"),
        )
        if bad:
            browser.close()
            return summarize()

        # —— 3. 视频区域点击也能推进 ——
        vbox = page.locator("video").bounding_box()
        if not vbox:
            record("3. 点击视频区域推进", False, "这一拍没有 video")
            browser.close()
            return summarize()
        vx = vbox["x"] + min(vbox["width"], 400) / 2
        vy = vbox["y"] + min(240, vbox["height"] * 0.35)
        vchain = hit_chain(page, vx, vy)
        vtop = page.evaluate(
            """([x, y]) => {
              const e = document.elementFromPoint(x, y);
              return e ? e.tagName + (e.getAttribute("data-stage") ? "[advance]" : "") : "null";
            }""",
            [vx, vy],
        )
        if vtop.startswith("IMG") or vtop.startswith("VIDEO") or "advance" not in vtop:
            record("3. 点击视频区域推进", False, f"视频区域被挡住 {vtop}\n{vchain}")
            browser.close()
            return summarize()
        click_xy(page, vx, vy)
        try:
            page.wait_for_function(
                """() => {
                  const v = document.querySelector('video');
                  const img = document.querySelector('img');
                  if (!v || !img) return false;
                  const vs = getComputedStyle(v);
                  return location.href.includes('b=1')
                    && (v.currentSrc || '').endsWith('02-bell.mp4')
                    && v.paused === false
                    && vs.opacity === '1'
                    && vs.zIndex === '2';
                }""",
                timeout=2000,
            )
            page.wait_for_selector(f"text={SECOND}", timeout=2000)
            seen = page.evaluate(
                """() => {
                  const v = document.querySelector('video');
                  const img = document.querySelector('img');
                  return {
                    src: (v.currentSrc || '').split('/').pop(),
                    paused: v.paused,
                    t: Math.round(v.currentTime * 100) / 100,
                    vOp: getComputedStyle(v).opacity,
                    iOp: getComputedStyle(img).opacity,
                  };
                }"""
            )
            record(
                "3. 点击视频区域推进",
                SECOND in page.inner_text("body")
                and FIRST not in page.inner_text("body")
                and seen["src"] == "02-bell.mp4"
                and seen["paused"] is False,
                f"url={page.url}\nclick ({vx:.0f},{vy:.0f}) 命中 {vtop}\nvideo={seen}\n{vchain}",
            )
        except Exception as e:
            record("3. 点击视频区域推进", False, f"url={page.url}\n{vchain}\n{e}")
            browser.close()
            return summarize()

        # 先把选项和名字填上，再回到第一幕连点，确认 ?b= 不会清空。
        page.goto(BASE + "/play/seven?b=7", wait_until="networkidle")
        page.locator(f"text={STAY}").click()
        page.locator("button", has_text="继续").click()
        page.wait_for_selector("text=把手放在桌上")
        for _ in range(12):
            if page.locator("text=叫什么").count():
                break
            love = page.locator("text=确认他还在不在乎我")
            if love.count() and page.locator("button", has_text="继续").count() == 0:
                love.click()
                page.locator("button", has_text="继续").click()
                page.wait_for_timeout(400)
                continue
            stage = page.locator("[data-stage='advance']")
            if stage.count():
                sb = stage.bounding_box()
                click_xy(page, sb["x"] + sb["width"] / 2, sb["y"] + sb["height"] * 0.5)
                page.wait_for_load_state("domcontentloaded")
                continue
            cont = page.locator("button", has_text="继续")
            if cont.count():
                cont.click()
                page.wait_for_timeout(400)
                continue
            break
        if page.locator("input[type=text]").count() == 0:
            record(
                "4. 从第一幕连点 6 次，名字和选项不丢",
                False,
                f"没走到名字页 url={page.url}\n{page.inner_text('body')[:240]}",
            )
            browser.close()
            return summarize()
        page.locator("input[type=text]").fill(NAME)
        page.locator("button", has_text="说完了").click()
        page.wait_for_timeout(200)
        saved = page.evaluate("() => sessionStorage.getItem('kanyu:seven')")
        if not saved or NAME not in saved or "stay" not in saved:
            record(
                "4. 连续 6 次推进且名字、选项不丢",
                False,
                f"填写后 sessionStorage 里没有名字或选项: {saved}",
            )
            browser.close()
            return summarize()

        page.goto(BASE + "/play/seven", wait_until="networkidle")
        page.wait_for_selector(f"text={FIRST}")
        logs = []
        ok4 = True
        for step in range(1, 7):
            before = beat_of(page.url)
            marker = MARKS[step]
            sb = page.locator("[data-stage='advance']").bounding_box()
            if not sb:
                ok4 = False
                logs.append(f"第 {step} 下没有 advance 层 url={page.url}")
                break
            click_xy(page, sb["x"] + sb["width"] / 2, sb["y"] + sb["height"] * 0.45)
            try:
                page.wait_for_function(
                    "(n) => location.href.includes('b=' + n)",
                    arg=before + 1,
                    timeout=2000,
                )
                page.wait_for_selector(f"text={marker}", timeout=2000)
            except Exception as e:
                ok4 = False
                logs.append(f"第 {step} 下失败 url={page.url}\n{hit_chain(page, sb['x']+sb['width']/2, sb['y']+sb['height']*0.45)}\n{e}")
                break
            store = page.evaluate("() => sessionStorage.getItem('kanyu:seven') || ''")
            body = page.inner_text("body")
            advanced = beat_of(page.url) == before + 1 and marker in body and MARKS[step - 1] not in body
            kept = NAME in store and "stay" in store
            logs.append(f"第 {step} 下 b={beat_of(page.url)} 前进={advanced} 状态还在={kept}")
            if not advanced or not kept:
                ok4 = False
                break
        # 回到名字页和选项页，界面上还要看得到
        if ok4:
            page.goto(BASE + "/play/seven?b=12", wait_until="networkidle")
            page.wait_for_selector("input[type=text]")
            page.wait_for_timeout(300)
            typed = page.locator("input[type=text]").input_value()
            page.goto(BASE + "/play/seven?b=7", wait_until="networkidle")
            page.wait_for_timeout(400)
            reply = STAY_REPLY in page.inner_text("body")
            logs.append(f"名字页输入框={typed!r} 选项页仍有回复={reply}")
            if typed != NAME or not reply:
                ok4 = False
        record("4. 从第一幕连点 6 次，名字和选项不丢", ok4, "\n".join(logs))

        browser.close()
    return summarize()


if __name__ == "__main__":
    sys.exit(main())
