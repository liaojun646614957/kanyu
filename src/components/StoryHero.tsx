"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 首屏：视频 + 气泡，向下滚动就是图文正文。
 *
 * 之前的错误：把过渡页做成了一个独立页面，播完 → 跳转到另一个页面 → 还要点「解锁」。
 * sajutight 的做法是：视频占满首屏，气泡按时间轴出现，
 * 视频结束（或用户开始滚动）后，**同一页继续向下**就是报告正文。
 * 没有任何跳转，没有解锁按钮。
 *
 * 所以这里是一个「长页面的顶部」——
 * 它不负责"切换"，只负责"首屏那一下"。
 */

type Props = {
  name: string;
  video: string;
  poster: string;
  /** 视频播完后是否吸附在顶部（让下面的图文自然接上） */
  onSettled?: () => void;
};

const BUBBLES: { at: [number, number]; side: "left" | "right"; top: string }[] = [
  { at: [0.1, 0.36], side: "left", top: "20%" },
  { at: [0.4, 0.66], side: "right", top: "40%" },
  { at: [0.7, 1.01], side: "left", top: "58%" },
];

export default function StoryHero({ name, video, poster, onSettled }: Props) {
  const [t, setT] = useState(0);
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);

  const who = name.trim() || "你";
  const videoRef = useRef<HTMLVideoElement>(null);

  // 用视频真实进度驱动气泡（而不是定时器）——这样气泡和画面永远同步
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const onTime = () => {
      const d = el.duration;
      if (!d || Number.isNaN(d)) return;
      setT(el.currentTime / d);
    };
    const onEnd = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      setDone(true);
      onSettled?.();
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnd);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnd);
    };
  }, [onSettled]);

  // 兜底：视频加载失败也最多 6 秒后放开
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        setDone(true);
        onSettled?.();
      }
    }, 6000);
    return () => window.clearTimeout(id);
  }, [onSettled]);

  const lines = [who, "你終究\n來到了這裡", "準備好\n面對你的緣分了嗎"];

  return (
    <div className="relative h-[100dvh] w-full shrink-0 overflow-hidden bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <video
        ref={videoRef}
        src={video}
        muted
        playsInline
        autoPlay
        loop
        preload="auto"
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
          done ? "opacity-40" : "opacity-100"
        }`}
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: done
            ? "linear-gradient(180deg, rgba(8,5,6,0.86) 0%, rgba(8,5,6,0.7) 55%, #0b0809 100%)"
            : "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.9) 100%)",
        }}
      />

      {/* 气泡 */}
      {!done && (
        <div className="pointer-events-none absolute inset-0">
          {BUBBLES.map((b, i) => {
            const on = t >= b.at[0] && t < b.at[1];
            const isName = i === 0;
            return (
              <div
                key={i}
                className="absolute max-w-[62%] transition-all duration-700"
                style={{
                  top: b.top,
                  left: b.side === "left" ? 24 : undefined,
                  right: b.side === "right" ? 24 : undefined,
                  opacity: on ? 1 : 0,
                  transform: on ? "translateY(0) scale(1)" : "translateY(10px) scale(0.95)",
                }}
              >
                <div
                  className={`rounded-[18px] border px-4 py-2.5 backdrop-blur-[3px] ${
                    isName ? "border-white/40 bg-white/85" : "border-white/25 bg-white/70"
                  }`}
                >
                  <p
                    className={`whitespace-pre-line text-center font-serif leading-snug text-[#2a0d0d] ${
                      isName ? "text-[22px] font-bold tracking-[0.06em]" : "text-[15px] font-medium"
                    }`}
                  >
                    {lines[i]}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 底部：进度 / 下滑提示 */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 px-5 pb-8">
        {!done ? (
          <>
            <div className="h-[2px] w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-cinnabar-400/85"
                style={{ width: `${t * 100}%` }}
              />
            </div>
            <span className="text-[10px] tracking-[0.2em] text-white/35">向下滚</span>
          </>
        ) : (
          <div className="animate-bounce flex flex-col items-center gap-1.5">
            <span className="text-[10.5px] tracking-[0.24em] text-white/45">往下看你的盘</span>
            <span className="text-[15px] text-white/35">↓</span>
          </div>
        )}
      </div>
    </div>
  );
}
