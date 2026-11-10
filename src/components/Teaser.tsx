"use client";

import { useEffect, useState } from "react";
import { TEASER, type Beat } from "@/lib/teaser";

/**
 * Teaser 播放器。
 *
 * 这是「她在跟你说话」的一段，不是分析报告。
 * 每个 beat 占满一屏：立绘 + 一句台词。
 * 向下滚动逐页推进（也可点击），最后一页接回输入流程。
 *
 * 文字排版抄 mzpian：
 *   - top    ：顶部白字压黑底（大标题感）
 *   - bubble ：白色半透明气泡（对话感）
 *   - center ：居中大字（停顿/重击）
 *   - bottom ：底部压黑条
 */
export default function Teaser({ index, onNext }: { index: number; onNext: () => void }) {
  const [revealed, setRevealed] = useState(false);

  const beat = TEASER[index];
  const last = index === TEASER.length - 1;

  useEffect(() => {
    // 每页进入后 300ms 再显示文字，制造"她在说"的节奏
    const t = window.setTimeout(() => setRevealed(true), 280);
    return () => window.clearTimeout(t);
  }, [index]);

  return (
    <div
      className="relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-black"
      onClick={onNext}
    >
      {/* 立绘：kenburns 缓慢推近 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={beat.art + index}
        src={beat.art}
        alt=""
        aria-hidden="true"
        className="kenburns absolute inset-0 h-full w-full object-cover"
      />

      {/* 压暗：按文字位置决定方向 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            beat.style === "top"
              ? "linear-gradient(180deg, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.55) 32%, rgba(0,0,0,0.15) 62%, rgba(0,0,0,0.7) 100%)"
              : beat.style === "center"
                ? "radial-gradient(ellipse 90% 60% at 50% 50%, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.86) 100%)"
                : "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.2) 30%, rgba(0,0,0,0.8) 72%, rgba(0,0,0,0.95) 100%)",
        }}
      />

      {/* 进度：极细分段 */}
      <div className="relative z-20 flex gap-1 pl-16 pr-4 pt-7">
        {TEASER.map((_, k) => (
          <div
            key={k}
            className={`h-[2px] flex-1 rounded-full transition-colors duration-300 ${
              k <= index ? "bg-cinnabar-400/80" : "bg-white/12"
            }`}
          />
        ))}
      </div>

      {/* 台词 */}
      <div className="relative z-20 flex flex-1 flex-col">
        {beat.style === "top" && (
          <div className="px-6 pt-12">
            <Line text={beat.text} accent={beat.accent} on={revealed} size="title" />
          </div>
        )}

        {beat.style === "center" && (
          <div className="flex flex-1 items-center justify-center px-8">
            <Line text={beat.text} accent={beat.accent} on={revealed} size="hero" />
          </div>
        )}

        {beat.style === "bubble" && (
          <div className="mt-auto px-5 pb-28">
            <div
              className={`max-w-[86%] transition-all duration-700 ${
                beat.pos === "right" ? "ml-auto" : ""
              }`}
              style={{
                opacity: revealed ? 1 : 0,
                transform: revealed ? "translateY(0)" : "translateY(12px)",
              }}
            >
              <div className="rounded-[20px] border border-white/25 bg-white/82 px-4 py-3 backdrop-blur-[3px]">
                <Line text={beat.text} accent={beat.accent} on size="bubble" />
              </div>
            </div>
          </div>
        )}

        {beat.style === "bottom" && (
          <div className="mt-auto bg-black/70 px-6 py-8 backdrop-blur-sm">
            <Line text={beat.text} accent={beat.accent} on={revealed} size="title" />
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className="relative z-20 flex flex-col items-center gap-1.5 pb-7">
        <span className="text-[10px] tracking-[0.22em] text-white/32">
          {last ? "点一下，看结果" : "轻点继续"}
        </span>
        <span className="animate-bounce text-[13px] text-white/25">↓</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 一行台词，支持强调色
 * ------------------------------------------------------------------ */

function Line({
  text,
  accent,
  on,
  size,
}: {
  text: string;
  accent?: string;
  on: boolean;
  size: "hero" | "title" | "bubble";
}) {
  const cls =
    size === "hero"
      ? "font-serif text-[30px] leading-[1.6] text-white"
      : size === "title"
        ? "font-serif text-[23px] leading-[1.7] text-white"
        : "font-serif text-[16px] leading-[1.75] text-[#2a0d0d]";

  // 把 accent 词标红
  const nodes = (() => {
    if (!accent || !text.includes(accent)) return text;
    const parts = text.split(accent);
    return parts.flatMap((p, idx) =>
      idx === 0
        ? [p]
        : [
            <span
              key={idx}
              className={size === "bubble" ? "font-bold text-[#b31b1b]" : "text-[#e05252]"}
            >
              {accent}
            </span>,
            p,
          ],
    );
  })();

  return (
    <p
      className={`${cls} whitespace-pre-line transition-all duration-700 ${
        on ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-2 blur-[2px]"
      } ${size !== "bubble" ? "drop-shadow-[0_2px_18px_rgba(0,0,0,0.95)]" : ""}`}
    >
      {nodes}
    </p>
  );
}
