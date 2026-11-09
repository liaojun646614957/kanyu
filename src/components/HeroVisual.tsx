"use client";

import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ *
 * 干支环：60 个干支绕一圈，缓慢旋转。
 * 这是首屏的「东西」——用户第一眼看到的是物，不是表单。
 * ------------------------------------------------------------------ */

export function JiaziRing({ size = 360 }: { size?: number }) {
  const c = size / 2;
  const r = size / 2 - 26;
  // 只画刻度，不画文字——文字会被读屏和 SEO 抓成 60 个无意义词
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      focusable="false"
      role="presentation"
      className="jiazi-ring"
    >
      <defs>
        <radialGradient id="ringFade" cx="50%" cy="50%" r="50%">
          <stop offset="50%" stopColor="#0b0a09" stopOpacity="0" />
          <stop offset="100%" stopColor="#0b0a09" stopOpacity="0.96" />
        </radialGradient>
      </defs>

      <circle cx={c} cy={c} r={r + 12} fill="none" stroke="#262320" strokeWidth="1" />
      <circle
        cx={c}
        cy={c}
        r={r - 14}
        fill="none"
        stroke="#211e1b"
        strokeWidth="1"
        strokeDasharray="1 7"
      />

      {/* 60 道刻度：长短交替，纯几何，零文字 */}
      {Array.from({ length: 60 }).map((_, i) => {
        const angle = ((360 / 60) * i * Math.PI) / 180;
        const long = i % 5 === 0;
        const r1 = r - (long ? 9 : 5);
        const r2 = r + (long ? 9 : 5);
        return (
          <line
            key={i}
            x1={c + Math.sin(angle) * r1}
            y1={c - Math.cos(angle) * r1}
            x2={c + Math.sin(angle) * r2}
            y2={c - Math.cos(angle) * r2}
            stroke={long ? "#3a352f" : "#2a2723"}
            strokeWidth={long ? 1.2 : 1}
          />
        );
      })}

      {/* 4 个方位点 */}
      {[0, 90, 180, 270].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return (
          <circle
            key={deg}
            cx={c + Math.sin(a) * (r + 20)}
            cy={c - Math.cos(a) * (r + 20)}
            r={1.8}
            fill="#c9a227"
            opacity="0.5"
          />
        );
      })}

      <circle cx={c} cy={c} r={size / 2} fill="url(#ringFade)" />
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * 牌堆：三张立着的卡，轻微浮动、错开角度。
 * 点击即抽——不需要任何输入。
 * ------------------------------------------------------------------ */

export function CardStack({ onPick }: { onPick: (i: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="relative flex h-[190px] w-full items-center justify-center" style={{ perspective: 1000 }}>
      {[0, 1, 2].map((i) => {
        const offset = i - 1; // -1, 0, 1
        const rotated = offset * 9;
        const translateX = offset * 58;
        const translateY = Math.abs(offset) * 10;
        const isHover = hover === i;
        return (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onPick(i)}
            aria-label={`抽第 ${i + 1} 张`}
            className="card-in-stack press absolute"
            style={{
              transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotated}deg) translateY(${
                isHover ? -14 : 0
              }px) scale(${isHover ? 1.04 : 1})`,
              zIndex: isHover ? 10 : i === 1 ? 3 : 2,
              transition:
                "transform 420ms cubic-bezier(0.22,1,0.36,1), box-shadow 420ms ease",
            }}
          >
            <span className="card-face-back">
              <span className="text-[9px] tracking-[0.3em] text-ink-600">KANYU</span>
              <span className="font-serif text-[30px] leading-none text-ink-700">余</span>
              <span className="text-[8px] tracking-[0.25em] text-ink-700">今日</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 星点背景（首屏用，纯 CSS）
 * ------------------------------------------------------------------ */

export function StarField() {
  const [stars, setStars] = useState<{ x: number; y: number; s: number; o: number; d: number }[]>([]);

  useEffect(() => {
    const next = Array.from({ length: 34 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      s: Math.random() * 1.6 + 0.5,
      o: Math.random() * 0.4 + 0.12,
      d: Math.random() * 6,
    }));
    setStars(next);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-ink-100"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.s,
            height: s.s,
            opacity: s.o,
            animation: `twinkle 4.5s ease-in-out ${s.d}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
