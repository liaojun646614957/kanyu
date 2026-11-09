"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 过场视频（对齐 sajutight 的 LoadingVideo）。
 *
 * 结构是「两层」：
 *   <div fixed inset-0 bg-black>           全屏黑底，铺满视口
 *     <div mx-auto h-full max-w-[440px]>   中间一条手机宽度的列
 *       <video absolute inset-0 cover>     视频只铺满这一列
 *
 * 所以手机上是满屏，桌面是中间一条竖屏 + 两侧纯黑。
 * 之前只写了 h-[100dvh] w-full，少了 max-w 这一层，桌面上会被拉成
 * 1440px 宽——人像被裁到只剩局部，看着就像「莫名全屏了」。
 *
 * 气泡规格照抄原站：固定尺寸的椭圆（不是圆角矩形）、固定位置、
 * 按视频进度的时间轴出现。
 */

type Props = {
  name: string;
  video: string;
  poster: string;
  onSettled?: () => void;
  loadingOnly?: boolean;
};

/** 时间轴取视频比例；尺寸/位置是原站的写死值 */
const BUBBLES = [
  { at: [0.08, 0.3] as const, side: "left" as const, top: "16%", w: 150, h: 188 },
  { at: [0.4, 0.62] as const, side: "right" as const, top: "40%", w: 166, h: 206 },
  { at: [0.72, 0.94] as const, side: "left" as const, top: "60%", w: 174, h: 216 },
];

export default function StoryHero({ name, video, poster, onSettled, loadingOnly }: Props) {
  const [t, setT] = useState(0);
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const who = name.trim() || "你";
  const lines = [who, "你終究\n來到了這裏", "準備好\n面對你的緣分"];

  // 用视频真实进度驱动气泡——气泡和画面永远同步
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

  // 兜底：视频加载失败也最多 9 秒后放开
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        setDone(true);
        onSettled?.();
      }
    }, 9000);
    return () => window.clearTimeout(id);
  }, [onSettled]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="relative mx-auto h-full w-full max-w-[440px] overflow-hidden">
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
          preload="auto"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            done ? "opacity-30" : "opacity-100"
          }`}
        />

        {/* 气泡层：pointer-events-none，不挡任何手势 */}
        <div className="pointer-events-none absolute inset-0 z-10">
          {BUBBLES.map((b, i) => {
            const on = t >= b.at[0] && t < b.at[1];
            const text = lines[i] ?? "";
            const isName = i === 0;
            const tight = isName && Array.from(who).length > 6;
            return (
              <div
                key={i}
                className="absolute flex items-center justify-center px-4 text-center transition-all duration-700"
                style={{
                  top: b.top,
                  [b.side]: 16,
                  width: b.w,
                  height: b.h,
                  borderRadius: "50%",
                  background: "rgba(217,217,217,0.70)",
                  border: "3px solid rgba(0,0,0,0.50)",
                  opacity: on ? 1 : 0,
                  transform: on ? "scale(1)" : "scale(0.9)",
                }}
              >
                <p
                  className="whitespace-pre-line font-serif font-medium leading-tight text-black"
                  style={{
                    fontSize: tight ? 17 : 22,
                    letterSpacing: "-0.4px",
                  }}
                >
                  {text}
                </p>
              </div>
            );
          })}
        </div>

        {/* 顶部进度条 */}
        <div
          className="absolute left-4 right-4 top-4 z-20 h-1"
          style={{ background: "rgba(250,250,250,0.20)" }}
        >
          <div
            className="h-full transition-[width] duration-200"
            style={{ width: `${Math.min(100, t * 100)}%`, background: "#e2604a" }}
          />
        </div>

        {/* 视频播完之后（仅内嵌场景）提示下滑 */}
        {done && !loadingOnly && (
          <div className="absolute inset-x-0 bottom-8 z-20 flex flex-col items-center gap-1.5">
            <span className="text-[10.5px] tracking-[0.24em] text-white/45">往下看你的盘</span>
            <span className="animate-bounce text-[15px] text-white/35">↓</span>
          </div>
        )}
      </div>
    </div>
  );
}
