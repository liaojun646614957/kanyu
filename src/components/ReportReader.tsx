"use client";

import { useEffect, useRef, useState } from "react";
import type { Chapter, Report, Section } from "@/lib/report";

/**
 * 报告阅读器。
 *
 * 排版抄 sajutight 的「溶白」封面：
 *   顶部压暗渐变（保证图片上的白字可读）
 *   + 底部 backdrop-blur + 白色渐变 + mask 三层叠加
 *   → 图片自然溶进白纸，而不是硬切一条白边
 *
 * 阅读方式：纵向整章滚动，右侧有章进度点。
 * 付费章节用遮罩卡住，只露出第一节的标题。
 */

export default function ReportReader({
  report,
  onClose,
}: {
  report: Report;
  onClose: () => void;
}) {
  const [activeCh, setActiveCh] = useState(0);
  const chRefs = useRef<(HTMLElement | null)[]>([]);

  // 滚动时高亮当前章
  useEffect(() => {
    const onScroll = () => {
      let idx = 0;
      chRefs.current.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= 140) idx = i;
      });
      setActiveCh(idx);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (i: number) => {
    chRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-[440px] bg-white">
      {/* 顶栏 */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-black/5 bg-white/85 px-4 py-3 backdrop-blur-xl">
        <button
          type="button"
          onClick={onClose}
          className="press flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-[13px] text-black/60"
          aria-label="关闭报告"
        >
          ✕
        </button>
        <span className="font-serif text-[12px] tracking-[0.2em] text-black/45">
          {report.product}
        </span>
        <span className="w-8" />
      </div>

      {/* 右侧章导航 */}
      <div className="fixed right-2.5 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-2">
        {report.chapters.map((ch, i) => (
          <button
            key={ch.id}
            type="button"
            onClick={() => scrollTo(i)}
            aria-label={`跳到第 ${ch.no} 章`}
            className={`h-1.5 w-1.5 rounded-full transition-all ${
              activeCh === i ? "h-4 bg-cinnabar-500" : "bg-black/15"
            }`}
          />
        ))}
      </div>

      {report.chapters.map((ch, i) => (
        <section
          key={ch.id}
          ref={(el) => {
            chRefs.current[i] = el;
          }}
        >
          <ChapterView chapter={ch} />
        </section>
      ))}

      <div className="h-24" />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 一章
 * ------------------------------------------------------------------ */

function ChapterView({ chapter }: { chapter: Chapter }) {
  const [unlocked, setUnlocked] = useState(!chapter.paid);

  return (
    <article>
      {/* 封面：溶白效果 */}
      <div className="relative h-[520px] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={chapter.cover}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: `center ${chapter.coverOffsetY ?? 0}px` }}
        />

        {/* 顶部压暗：保证 CHAPTER 号可读 */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[180px]"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.12) 60%, rgba(0,0,0,0) 100%)",
          }}
        />

        {/* 底部溶白：blur + 渐变 + mask 三层 */}
        <div className="absolute inset-x-0 bottom-0 isolate flex min-h-[240px] flex-col items-start justify-end gap-3 px-5 pb-12">
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[240px]"
            style={{
              backdropFilter: "blur(7.9px)",
              WebkitBackdropFilter: "blur(7.9px)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.56) 38.5%, #FFFFFF 100%)",
              maskImage:
                "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.08) 18%, rgba(0,0,0,0.35) 34%, rgba(0,0,0,0.72) 52%, black 72%)",
              WebkitMaskImage:
                "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.08) 18%, rgba(0,0,0,0.35) 34%, rgba(0,0,0,0.72) 52%, black 72%)",
            }}
          />

          <div className="flex items-center gap-2">
            <span className="rounded bg-black/20 px-1.5 py-0.5 text-[10px] font-medium tracking-[0.16em] text-white backdrop-blur-[4px]">
              CHAPTER {String(chapter.no).padStart(2, "0")}
            </span>
            {chapter.paid && (
              <span className="rounded bg-[#FF1F66]/20 px-1.5 py-0.5 text-[10px] font-medium tracking-[0.12em] text-[#FF1F66] backdrop-blur-[4px]">
                付费
              </span>
            )}
          </div>

          <h2 className="whitespace-pre-line text-[29px] font-bold leading-[1.35] tracking-[-0.45px] text-[#2f0f0f]">
            {chapter.title}
          </h2>
          <p className="text-[15px] font-medium leading-[1.4] tracking-[-0.24px] text-[#2f0f0f]/45">
            {chapter.subtitle}
          </p>
        </div>
      </div>

      {/* 小节 */}
      <div className="relative px-5 pb-16 pt-6">
        <div className="flex flex-col gap-14">
          {chapter.sections.map((s, i) => {
            const locked = !unlocked && i > 0;
            if (locked) return null;
            return <SectionView key={i} section={s} />;
          })}
        </div>

        {/* 付费遮罩 */}
        {!unlocked && (
          <div className="relative mt-2">
            {/* 露出下一节的标题，制造"想知道" */}
            <div className="pointer-events-none select-none opacity-25">
              <h3 className="text-[19px] font-semibold leading-[1.4] tracking-[-0.1px] text-[#2F0F0F]">
                {chapter.sections[1]?.title}
              </h3>
              <p className="mt-1 text-[13px] leading-[1.4] text-[#7C7C86]">
                {chapter.sections[1]?.subtitle}
              </p>
            </div>

            <div className="absolute inset-x-0 -top-6 bottom-0 bg-gradient-to-b from-white/0 via-white/90 to-white" />

            <div className="relative mt-6 rounded-2xl border border-black/8 bg-[#FAF8F5] p-5">
              <p className="text-[15px] font-semibold leading-[1.4] text-[#2F0F0F]">
                下面 {chapter.sections.length - 1} 节要付费才能看
              </p>
              <p className="mt-2 text-[12.5px] leading-[1.6] text-[#7C7C86]">
                这几节讲的是：
                {chapter.sections.slice(1).map((s) => s.title).join("、")}。
              </p>
              <button
                type="button"
                onClick={() => setUnlocked(true)}
                className="press mt-4 w-full rounded-full bg-cinnabar-500 py-3.5 text-[14px] font-medium text-white shadow-[0_10px_30px_-10px_rgba(207,74,52,0.8)]"
              >
                解锁完整报告
              </button>
              <p className="mt-2.5 text-center text-[10px] text-black/25">
                演示版本：点击即解锁，无需真实支付
              </p>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ *
 * 一节
 * ------------------------------------------------------------------ */

function SectionView({ section }: { section: Section }) {
  return (
    <div className="flex flex-col gap-4">
      {/* 标题块 */}
      <div className="flex flex-col gap-1.5">
        <h3 className="text-[19px] font-semibold leading-[1.4] tracking-[-0.1px] text-[#2F0F0F]">
          {section.title}
        </h3>
        {section.subtitle && (
          <p className="text-[13px] leading-[1.45] tracking-[-0.08px] text-[#7C7C86]">
            {section.subtitle}
          </p>
        )}
      </div>

      {/* 徽章 */}
      {section.tags && section.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {section.tags.map((t) => (
            <span
              key={t.label}
              className="rounded-full bg-[#FFE9F0] px-2 py-1.5 text-[11px] font-semibold tracking-[-0.4px] text-[#FF4C85]"
            >
              {t.emoji} {t.label}
            </span>
          ))}
        </div>
      )}

      {/* 视觉 */}
      {section.visual?.kind === "bars" && (
        <BarVisual data={section.visual.data} />
      )}
      {section.visual?.kind === "pillars" && (
        <PillarVisual pillars={section.visual.pillars} />
      )}

      {/* 金句卡：预先写死的层，可截图 */}
      {section.quotes && section.quotes.length > 0 && (
        <div className="rounded-2xl border border-[#ECE7E2] bg-[#FAF8F5] px-5 py-4">
          <ul className="flex flex-col gap-2 text-[15px] leading-[1.5] tracking-[-0.08px] text-[#4B5563]">
            {section.quotes.map((q, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#FF4C85]" />
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 正文 */}
      {section.body && (
        <div className="whitespace-pre-line text-[15px] leading-[1.75] tracking-[-0.08px] text-[#4B5563]">
          {section.body}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 视觉
 * ------------------------------------------------------------------ */

function BarVisual({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex gap-2.5 rounded-2xl border border-[#ECE7E2] bg-white p-4">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex h-[76px] w-full items-end">
            <div
              className="w-full rounded-t-[4px] bg-gradient-to-t from-[#FF4C85]/70 to-[#FF8FB2]/90"
              style={{ height: `${Math.max(10, (d.value / max) * 100)}%` }}
            />
          </div>
          <span className="font-serif text-[11px] text-[#2F0F0F]/70">{d.label}</span>
          <span className="text-[9.5px] tabular-nums text-black/30">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

function PillarVisual({ pillars }: { pillars: { label: string; text: string }[] }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {pillars.map((p) => (
        <div
          key={p.label}
          className="flex flex-col items-center gap-1 rounded-xl border border-[#ECE7E2] bg-[#FAF8F5] py-3"
        >
          <span className="text-[9px] tracking-[0.18em] text-black/30">{p.label}</span>
          <span className="font-serif text-[17px] text-[#2F0F0F]">{p.text}</span>
        </div>
      ))}
    </div>
  );
}
