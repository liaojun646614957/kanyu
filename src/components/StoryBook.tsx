"use client";

import { useEffect, useRef, useState } from "react";
import type { Chapter, Report, Section } from "@/lib/report";
import { renderPage, type PageText, type PageStyle } from "@/lib/pageRender";

/**
 * 真图文阅读器。
 *
 * 每一页先渲染成位图再显示——文字是像素，不是 DOM。
 * 这样在手机上不存在「字号不对 / 换行难看 / 排版塌掉」的问题。
 *
 * 结构（对齐 mzpian）：
 *   章封面（立绘 + CHAPTER 0N + 标题）
 *   → 章节目录（编号 + ♦ 递增）
 *   → 每节一页或多页（图 + 压字）
 *   → 付费页
 */

const ART = {
  1: "/img/p1.jpg",
  2: "/img/p2.jpg",
  3: "/img/p3.jpg",
};

/**
 * 每章一套构图规则。
 * 封面用 hero 大字，正文页用与背景匹配的 layout，
 * 让文字压在留白侧，而不是盖在人物脸上。
 */
const THEME: Record<number, PageStyle> = {
  1: { bg: ART[1], layout: "right", accent: "#d94b4b" },
  2: { bg: ART[2], layout: "bottom", accent: "#d94b4b" },
  3: { bg: ART[3], layout: "center", accent: "#d94b4b" },
};

/** 把一章拆成若干「页」，并标注每页的样式变体 */
function chapterPages(ch: Chapter): { page: PageText; hero?: boolean }[] {
  const pages: { page: PageText; hero?: boolean }[] = [];

  // 1. 封面：hero 大字
  pages.push({
    hero: true,
    page: {
      kicker: `CHAPTER ${String(ch.no).padStart(2, "0")}`,
      title: ch.title,
      subtitle: ch.subtitle,
    },
  });

  // 2. 目录
  if (ch.toc?.length) {
    pages.push({
      page: {
        kicker: "目录",
        title: "这一章讲什么",
        quotes: ch.toc.flatMap((g, i) => [
          `${i + 1}. ${g.heading}`,
          ...g.items.map((it) => `　♦ ${it}`),
        ]),
      },
    });
  }

  // 3. 每节：标题+金句 一页，正文 一页
  ch.sections.forEach((s: Section, i) => {
    pages.push({
      page: {
        kicker: `${String(ch.no).padStart(2, "0")} · ${String(i + 1).padStart(2, "0")}`,
        title: s.title,
        subtitle: s.subtitle,
        quotes: s.quotes,
      },
    });
    if (s.body) {
      pages.push({
        page: {
          kicker: s.title,
          title: "",
          paragraphs: s.body.split("\n\n").filter(Boolean),
        },
      });
    }
  });

  return pages;
}

export default function StoryBook({ report, onClose }: { report: Report; onClose: () => void }) {
  const [pages, setPages] = useState<{ ch: number; dataUrl: string; h: number }[]>([]);
  const [progress, setProgress] = useState(0);
  const [unlocked, setUnlocked] = useState<Record<number, boolean>>({});
  const doneRef = useRef(false);

  useEffect(() => {
    if (doneRef.current) return;
    doneRef.current = true;

    (async () => {
      const out: { ch: number; dataUrl: string; h: number }[] = [];
      const all: { ch: number; page: PageText; style: PageStyle }[] = [];

      for (const ch of report.chapters) {
        const base = THEME[ch.no] ?? THEME[1];
        chapterPages(ch).forEach(({ page, hero }) =>
          all.push({ ch: ch.no, page, style: { ...base, hero } }),
        );
      }

      for (let i = 0; i < all.length; i++) {
        const { ch, page, style } = all[i];
        const cv = await renderPage(page, style);
        out.push({ ch, dataUrl: cv.toDataURL("image/jpeg", 0.9), h: cv.height / 2 });
        setProgress((i + 1) / all.length);
        await new Promise((r) => setTimeout(r, 0));
        setPages([...out]);
      }
    })();
  }, [report]);

  const paying = report.chapters.some((c) => c.paid);

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-[440px] bg-[#0b0809]">
      {/* 顶栏 */}
      <div className="sticky top-0 z-40 flex items-center justify-between bg-[#0b0809]/90 px-4 py-3 backdrop-blur-xl">
        <button
          type="button"
          onClick={onClose}
          className="press flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-[13px] text-white/60"
          aria-label="关闭"
        >
          ✕
        </button>
        <span className="font-serif text-[11px] tracking-[0.22em] text-white/40">
          {report.product}
        </span>
        <span className="w-8" />
      </div>

      {/* 渲染进度 */}
      {progress < 1 && (
        <div className="sticky top-[56px] z-30 px-4">
          <div className="h-[2px] overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-cinnabar-500 transition-[width] duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* 页 */}
      <div className="flex flex-col">
        {pages.map((p, i) => {
          const isPaidCh = report.chapters.find((c) => c.no === p.ch)?.paid;
          const locked = isPaidCh && !unlocked[p.ch];
          if (locked) return null;
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={p.dataUrl}
              alt=""
              className="block w-full"
              style={{ height: p.h }}
            />
          );
        })}
      </div>

      {/* 付费墙 */}
      {paying &&
        report.chapters
          .filter((c) => c.paid)
          .map((c) =>
            unlocked[c.no] ? null : (
              <div
                key={c.id}
                className="sticky bottom-0 z-40 border-t border-white/10 bg-[#160a0b]/96 px-5 pb-6 pt-5 backdrop-blur-xl"
              >
                <p className="text-[13px] font-semibold text-white/90">
                  第 {c.no} 章「{c.title}」要付费才能看
                </p>
                <p className="mt-1.5 text-[11px] leading-5 text-white/40">
                  包含：{c.sections.map((s) => s.title).join("、")}
                </p>
                <button
                  type="button"
                  onClick={() => setUnlocked((u) => ({ ...u, [c.no]: true }))}
                  className="press mt-4 w-full rounded-full bg-[#c0392b] py-3.5 text-[13.5px] font-medium text-white"
                >
                  解锁第 {c.no} 章
                </button>
                <p className="mt-2 text-center text-[9px] text-white/20">
                  演示版本：点击即解锁
                </p>
              </div>
            ),
          )}
    </div>
  );
}
