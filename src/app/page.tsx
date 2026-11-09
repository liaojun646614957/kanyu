"use client";

import { useState } from "react";
import PillarCard from "@/components/PillarCard";
import GuaCast from "@/components/GuaCast";
import DailyDraw from "@/components/DailyDraw";

const TABS = [
  { id: "pillar", label: "日柱", sub: "你是什么人" },
  { id: "gua", label: "摇卦", sub: "问一件事" },
  { id: "draw", label: "今日一抽", sub: "今天怎么过" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Home() {
  const [tab, setTab] = useState<TabId>("pillar");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col px-5 pb-16 pt-10">
      {/* 头部 */}
      <header className="flex flex-col gap-1.5">
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-[22px] tracking-[0.18em] text-ink-100">看余</span>
          <span className="text-[11px] tracking-widest text-ink-500">KANYU</span>
        </div>
        <p className="text-[12px] leading-relaxed text-ink-400">
          读一读你的出厂设置。三分钟，不用注册。
        </p>
      </header>

      {/* Tab */}
      <nav className="mt-7 grid grid-cols-3 gap-1 rounded-lg border border-ink-800 bg-ink-900/60 p-1">
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`press flex flex-col items-center gap-0.5 rounded-md py-2.5 transition-colors ${
                on ? "bg-ink-800 text-ink-100" : "text-ink-400 hover:text-ink-200"
              }`}
            >
              <span className="font-serif text-[13px] tracking-wide">{t.label}</span>
              <span className={`text-[10px] ${on ? "text-ink-400" : "text-ink-600"}`}>{t.sub}</span>
            </button>
          );
        })}
      </nav>

      {/* 内容 */}
      <section key={tab} className="mt-7 animate-fade">
        {tab === "pillar" && <PillarCard />}
        {tab === "gua" && <GuaCast />}
        {tab === "draw" && <DailyDraw />}
      </section>

      {/* 页脚 */}
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
