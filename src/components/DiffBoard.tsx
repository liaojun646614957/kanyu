"use client";

import { useState } from "react";

/**
 * 本地对照。左边只嵌原站页面，不把他们的文件放进仓库。
 * 原站响应头拒绝被嵌入，左边经常是空白；同一屏可以新标签打开。
 */
const STEPS: { id: string; theirs: string; ours: string }[] = [
  { id: "onboarding", theirs: "onboarding", ours: "onboarding" },
  { id: "story", theirs: "immersion", ours: "story" },
  { id: "input", theirs: "input", ours: "input" },
  { id: "loading:free", theirs: "loading:free", ours: "loading:free" },
  { id: "teaser", theirs: "teaser", ours: "teaser" },
  { id: "loading:paid", theirs: "loading:paid", ours: "loading:paid" },
  { id: "result", theirs: "result", ours: "result" },
];

export default function DiffBoard() {
  const [id, setId] = useState(STEPS[0].id);
  const step = STEPS.find((s) => s.id === id) ?? STEPS[0];
  const left = `https://www.sajutight.me/products/mzpian-tw?step=${encodeURIComponent(step.theirs)}`;
  const right = `/play/seven?step=${encodeURIComponent(step.ours)}`;

  return (
    <div className="flex h-dvh flex-col bg-ink-950 text-ink-100">
      <div className="flex gap-1.5 overflow-x-auto px-3 pt-3">
        {STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setId(s.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] ${
              s.id === id ? "bg-cinnabar-500 text-white" : "bg-white/10 text-white/70"
            }`}
          >
            {s.id}
          </button>
        ))}
      </div>
      <p className="px-3 py-2 text-[11px] leading-5 text-ink-400">
        左边是原站这一屏，右边是我们的同一屏。两栏各自滚动。原站不允许被嵌进别的网页，左边空白时用新标签打开。
        {step.id === "story" ? " 故事这一屏，原站的地址参数是 immersion。" : ""}
      </p>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 px-3 pb-3">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/10">
          <a href={left} target="_blank" rel="noreferrer" className="shrink-0 px-3 py-2 text-[11px] text-cinnabar-300">
            原站 · 新标签打开
          </a>
          <iframe title="原站对照" src={left} className="min-h-0 w-full flex-1 bg-black" />
        </section>
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/10">
          <p className="shrink-0 px-3 py-2 text-[11px] text-white/45">看余 · {step.ours}</p>
          <iframe title="看余对照" src={right} className="min-h-0 w-full flex-1 bg-black" />
        </section>
      </div>
    </div>
  );
}
