"use client";

import { useMemo, useState } from "react";
import PillarCard from "@/components/PillarCard";
import GuaCast from "@/components/GuaCast";
import DailyDraw from "@/components/DailyDraw";
import { JiaziRing, CardStack, StarField } from "@/components/HeroVisual";

type View = "home" | "pillar" | "gua" | "draw";

/* ------------------------------------------------------------------ *
 * 首屏：先给一张牌，再谈生日。
 *
 * 设计理由（改过一版）：
 *   上一版一进来就是「出生日期 + 时辰 + 性别」三个输入框，是登记表。
 *   用户想的是「这好玩吗」，不是「我要登记什么」。
 *   所以首屏主体是牌堆——点一下就有东西，零输入、零承诺。
 *   生日是「解锁更准的」，不是入场券。
 * ------------------------------------------------------------------ */

const TEASERS = [
  {
    hanzi: "遇",
    title: "会碰到一个熟人",
    line: "一个很久没联系的人会出现，别装没看见。",
    tone: "cinnabar" as const,
  },
  {
    hanzi: "等",
    title: "先别买",
    line: "今天这单你会在三天后庆幸自己没下单。",
    tone: "gold" as const,
  },
  {
    hanzi: "停",
    title: "你不必每条都回",
    line: "今天的消息里，至少有一条你可以不回。",
    tone: "ink" as const,
  },
  {
    hanzi: "转",
    title: "计划乱了是好事",
    line: "被打乱的那件事，可能是在给你腾位置。",
    tone: "cinnabar" as const,
  },
  {
    hanzi: "猜",
    title: "你在自己吓自己",
    line: "你今天会为一件没发生的事难受很久。",
    tone: "ink" as const,
  },
  {
    hanzi: "软",
    title: "别硬撑了",
    line: "一句「其实我有点在意」比十句解释都管用。",
    tone: "gold" as const,
  },
];

function daySeed(): number {
  const d = new Date();
  const key = `${d.getFullYear()}${d.getMonth()}${d.getDate()}`;
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export default function Page() {
  const [view, setView] = useState<View>("home");
  const seed = useMemo(daySeed, []);
  const [picked, setPicked] = useState<number | null>(null);

  const card = picked === null ? null : TEASERS[(seed + picked * 2) % TEASERS.length];

  /* ---------------- 首屏 ---------------- */
  if (view === "home") {
    return (
      <main className="relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col overflow-hidden px-5 pb-10">
        <StarField />

        {/* 干支环做背景 */}
        <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 opacity-70">
          <JiaziRing size={400} />
        </div>

        <div className="relative z-10 flex flex-1 flex-col pt-12">
          {/* 品牌 */}
          <div className="flex flex-col items-center gap-2">
            <h1 className="font-serif text-[30px] tracking-[0.34em] text-ink-100">看余</h1>
            <p className="text-[11px] tracking-[0.28em] text-ink-500">读一读你的出厂设置</p>
          </div>

          {/* 牌堆 */}
          <div className="mt-10">
            {card === null ? (
              <>
                <CardStack onPick={setPicked} />
                <p className="mt-1 text-center text-[11px] text-ink-500">
                  不用填任何东西，点一张
                </p>
              </>
            ) : (
              <div className="animate-card-in flex flex-col items-center gap-5 px-2">
                <div
                  className={`relative flex h-[188px] w-full max-w-[300px] flex-col justify-between overflow-hidden rounded-xl border p-5 ${
                    card.tone === "cinnabar"
                      ? "border-cinnabar-600/40 bg-cinnabar-600/[0.07]"
                      : card.tone === "gold"
                        ? "border-gold-500/35 bg-gold-500/[0.06]"
                        : "border-ink-700 bg-ink-900/70"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`font-serif text-[46px] leading-none ${
                        card.tone === "gold" ? "text-gold-400" : "text-cinnabar-400"
                      }`}
                    >
                      {card.hanzi}
                    </span>
                    <span className="text-[10px] tracking-widest text-ink-500">
                      {new Date().getMonth() + 1} / {new Date().getDate()}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="font-serif text-lg text-ink-100">{card.title}</span>
                    <span className="text-[13px] leading-6 text-ink-300">{card.line}</span>
                  </div>
                </div>

                {/* 钩子：想看更准的 */}
                <div className="flex w-full max-w-[300px] flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => setView("pillar")}
                    className="press w-full rounded-md bg-cinnabar-600 py-3 text-[13px] font-medium tracking-wider text-white"
                  >
                    想看得更准？给我生日
                  </button>
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setView("gua")}
                      className="press flex-1 rounded-md border border-ink-700 py-2.5 text-[12px] text-ink-300"
                    >
                      问一件事
                    </button>
                    <button
                      type="button"
                      onClick={() => setPicked(null)}
                      className="press flex-1 rounded-md border border-ink-700 py-2.5 text-[12px] text-ink-300"
                    >
                      换一张
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 底部入口 */}
          <div className="mt-auto flex flex-col gap-3 pt-10">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setView("draw")}
                className="press flex flex-col items-start gap-1 rounded-lg border border-ink-800 bg-ink-900/50 p-3.5 text-left"
              >
                <span className="text-[11px] tracking-widest text-ink-500">每天</span>
                <span className="font-serif text-[13px] text-ink-200">今天怎么过</span>
              </button>
              <button
                type="button"
                onClick={() => setView("pillar")}
                className="press flex flex-col items-start gap-1 rounded-lg border border-ink-800 bg-ink-900/50 p-3.5 text-left"
              >
                <span className="text-[11px] tracking-widest text-ink-500">一次</span>
                <span className="font-serif text-[13px] text-ink-200">我是什么人</span>
              </button>
            </div>
            <p className="text-center text-[10px] leading-relaxed text-ink-600">
              娱乐向性格参考 · 不构成任何决策建议 · 生日只在你的手机里算
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* ---------------- 二级页 ---------------- */
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col px-5 pb-16 pt-6">
      <button
        type="button"
        onClick={() => setView("home")}
        className="press mb-6 flex items-center gap-1.5 self-start text-[12px] text-ink-400"
      >
        <span className="text-[14px]">←</span> 回去
      </button>

      <section className="animate-fade">
        {view === "pillar" && <PillarCard />}
        {view === "gua" && <GuaCast />}
        {view === "draw" && <DailyDraw />}
      </section>

      <footer className="mt-auto pt-12">
        <div className="h-px w-full bg-ink-800" />
        <p className="mt-5 text-[10.5px] leading-relaxed text-ink-600">
          本站内容为娱乐向性格参考，不构成任何医疗、投资、法律或人生决策建议。
          命理无法预测未来，请理性看待。生日等个人信息仅用于本地计算，不会上传。
        </p>
      </footer>
    </main>
  );
}
