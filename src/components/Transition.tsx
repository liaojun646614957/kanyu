"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 过渡页：她为你准备的那一段。
 *
 * 抄的是 sajutight mzpian 的做法：
 *   - 气泡按视频时间轴依次出现（不是一次性显示）
 *   - 第一句就带用户的名字
 *   - 气泡位置错开（左/右/左），像真的有人在画面周围说话
 *
 * 但我不照搬它的时间点。它的三段是
 *   {start:.08,end:.3} / {.4,.62} / {.72,.94}
 * 我改成按「读得完」的节奏，且总时长可控（默认 9 秒，可跳过）。
 */

type Props = {
  /** 用户名字；空则用「你」 */
  name: string;
  /** 主视频（复用现有素材） */
  video: string;
  /** 兜底静图 */
  poster: string;
  /** 进度条时长（毫秒） */
  duration?: number;
  /** 完成回调 */
  onDone: () => void;
};

/**
 * 三句台词的位置与出现窗口。
 * 总时长 9 秒时：
 *   0.9s–3.2s  名字（最大，居中偏上）
 *   3.6s–6.0s  第二句
 *   6.4s–9.0s  第三句
 * 中间留白，让每句话都有被读完的时间。
 */
const BUBBLES: {
  at: [number, number];
  side: "left" | "right";
  top: string;
}[] = [
  { at: [0.1, 0.36], side: "left", top: "20%" },
  { at: [0.4, 0.66], side: "right", top: "40%" },
  { at: [0.7, 1.01], side: "left", top: "58%" },
];

export default function Transition({
  name,
  video,
  poster,
  duration = 9000,
  onDone,
}: Props) {
  const [t, setT] = useState(0); // 0..1
  const doneRef = useRef(false);

  const who = name.trim() || "你";

  const lines = [
    who,
    "你終究\n來到了這裡",
    "準備好\n面對你的緣分了嗎",
  ];

  useEffect(() => {
    const started = Date.now();
    const id = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - started) / duration);
      setT(p);
      if (p >= 1 && !doneRef.current) {
        doneRef.current = true;
        window.clearInterval(id);
        onDone();
      }
    }, 50);
    return () => window.clearInterval(id);
  }, [duration, onDone]);

  const skip = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-black">
      {/* 视频层 */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={poster}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <video
          src={video}
          muted
          playsInline
          autoPlay
          loop
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      {/* 压暗 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.9) 100%)",
        }}
      />

      {/* 气泡 */}
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
                  isName
                    ? "border-white/40 bg-white/85"
                    : "border-white/25 bg-white/70"
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

      {/* 底部进度 + 跳过 */}
      <div className="relative z-20 mt-auto flex flex-col gap-3 px-5 pb-8">
        <div className="h-[2px] w-full overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-cinnabar-400/85"
            style={{ width: `${t * 100}%`, transition: "width 120ms linear" }}
          />
        </div>
        <button
          type="button"
          onClick={skip}
          className="press self-center text-[11px] tracking-[0.18em] text-white/40"
        >
          跳过
        </button>
      </div>
    </div>
  );
}
