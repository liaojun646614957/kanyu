"use client";

import { useState } from "react";
import ScriptPlayer from "@/components/ScriptPlayer";
import { CATEGORIES, SCRIPTS } from "@/lib/script";

/**
 * 首页：按类目分，第一屏就能挑着点。
 *
 * 布局思路：
 *   - 顶部一句主张，不做轮播广告（用户要的是「玩什么」，不是「看广告」）
 *   - 主推一个「今日推荐」大卡（有剧本的，点了直接进）
 *   - 下面是类目网格，每个类目自己的封面 + 一句钩子 + 剧本数
 *   - 未开放的类目明确标「即将开放」，不假装可用
 */

const CATEGORY_ART: Record<string, string> = {
  love: "/img/c1-cover.jpg",
  all: "/img/c3-reading.jpg",
  match: "/img/c5-hand.jpg",
  money: "/img/c6-turned.jpg",
  self: "/img/c2-coins.jpg",
  family: "/img/c4-gaze.jpg",
};

export default function Page() {
  const [playing, setPlaying] = useState<string | null>(null);

  if (playing && SCRIPTS[playing]) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setPlaying(null)}
          className="press fixed left-4 top-4 z-40 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-[15px] text-white/70 backdrop-blur-md"
          aria-label="退出剧本"
        >
          ✕
        </button>
        <ScriptPlayer key={playing} script={SCRIPTS[playing]} />
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-ink-950 pb-10">
      <header className="px-5 pt-11">
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-[21px] tracking-[0.16em] text-ink-100">看余</span>
          <span className="text-[10px] tracking-[0.3em] text-ink-600">KANYU</span>
        </div>
        <p className="mt-2 text-[12.5px] leading-6 text-ink-400">
          六个说法，看你今天想听哪个。
        </p>
      </header>

      <section className="mt-6 px-5">
        <button
          type="button"
          onClick={() => setPlaying("love")}
          className="press group relative block w-full overflow-hidden rounded-2xl text-left"
          style={{ aspectRatio: "4 / 5" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={CATEGORY_ART.love}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.04]"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.82) 72%, rgba(0,0,0,0.97) 100%)",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2.5 p-5">
            <span className="w-fit rounded-full bg-cinnabar-500 px-2.5 py-1 text-[9.5px] font-medium tracking-widest text-white">
              今日推荐
            </span>
            <h2 className="font-serif text-[25px] leading-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.9)]">
              {SCRIPTS.love.title}
            </h2>
            <p className="text-[12px] leading-6 text-white/65">{SCRIPTS.love.hook}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[10.5px] tracking-[0.2em] text-cinnabar-300">
                {SCRIPTS.love.master.name} · {SCRIPTS.love.master.title}
              </span>
              <span className="h-px flex-1 bg-white/15" />
              <span className="text-[10.5px] text-white/50">9 幕</span>
            </div>
          </div>
        </button>
      </section>

      <section className="mt-8 px-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="font-serif text-[14px] tracking-[0.16em] text-ink-200">按种类</h3>
          <span className="text-[10.5px] text-ink-600">每个类目一位不同的先生</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.filter((c) => c.id !== "love").map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={!c.ready}
              onClick={() => c.ready && setPlaying(c.id)}
              className="press relative aspect-[3/4] overflow-hidden rounded-xl text-left disabled:cursor-default"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={CATEGORY_ART[c.id]}
                alt=""
                className={`absolute inset-0 h-full w-full object-cover ${
                  c.ready ? "" : "opacity-35 grayscale-[0.55]"
                }`}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.94) 100%)",
                }}
              />
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-3.5">
                <span className="font-serif text-[15px] text-white/95">{c.label}</span>
                <span className="text-[10.5px] leading-4 text-white/50">{c.desc}</span>
                <span
                  className={`mt-1 text-[9px] tracking-widest ${
                    c.ready ? "text-cinnabar-300" : "text-white/25"
                  }`}
                >
                  {c.ready ? c.count : "即将开放"}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <footer className="mt-9 px-5">
        <div className="rounded-xl border border-ink-800 bg-ink-900/40 p-4">
          <p className="text-[10.5px] leading-relaxed text-ink-500">
            每个类目由不同的先生坐镇，说话方式、关注点、问你的问题都不一样。
            盘由生日算出，剧本只决定他从哪个角度跟你讲。
          </p>
        </div>
        <p className="mt-4 text-center text-[9.5px] leading-relaxed text-ink-700">
          内容仅供娱乐参考，不构成任何医疗、投资、法律或人生决策建议。
          <br />
          生日等资料仅在你自己的设备上计算，不会上传。
        </p>
      </footer>
    </main>
  );
}
