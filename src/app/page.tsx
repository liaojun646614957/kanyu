"use client";

import { useState } from "react";
import StoryPlayer from "@/components/StoryPlayer";
import { STORIES } from "@/lib/story";

/**
 * 首页：每个类目一出戏。
 *
 * 改版理由（记下来）：
 *   上一版是「类目网格 + 商品卡」，像货架。
 *   这一版做成「今日放映」——像剧本杀店的剧目墙：
 *   每部戏有标题、一句话钩子、时长、先生的名字。
 *   用户挑的不是「服务」，是「今晚想进哪个故事」。
 */

type Slot = {
  id: string;
  category: string;
  title: string;
  logline: string;
  master: string;
  acts: string;
  art: string;
  ready: boolean;
  badge?: string;
};

const SLOTS: Slot[] = [
  {
    id: "seven",
    category: "恋爱",
    title: "她的第七个客人",
    logline: "你推门进去，她说：你终于来了。—— 可你从没见过她。",
    master: "朱砂 · 彼岸的女巫",
    acts: "5 幕",
    art: "/img/c1-cover.jpg",
    ready: true,
    badge: "今晚开场",
  },
  {
    id: "money",
    category: "财物",
    title: "第七张牌没翻",
    logline: "他算过所有人，唯独算不出自己什么时候收手。",
    master: "老陆 · 收账的",
    acts: "筹备中",
    art: "/img/c6-turned.jpg",
    ready: false,
  },
  {
    id: "match",
    category: "合盘",
    title: "两个人的同一道疤",
    logline: "你们的盘有一处一模一样，那不是巧合。",
    master: "双生 · 说合的",
    acts: "筹备中",
    art: "/img/c5-hand.jpg",
    ready: false,
  },
  {
    id: "all",
    category: "综合",
    title: "一整本名册",
    logline: "他翻到你的名字，然后合上了册子。",
    master: "宋先生 · 掌册的",
    acts: "筹备中",
    art: "/img/c3-reading.jpg",
    ready: false,
  },
  {
    id: "self",
    category: "自己",
    title: "你身上有三处旧伤",
    logline: "她说得出在哪，也说得出什么时候好的。",
    master: "阿蛮 · 摸骨的",
    acts: "筹备中",
    art: "/img/c2-coins.jpg",
    ready: false,
  },
  {
    id: "family",
    category: "家庭",
    title: "母亲没说完的那句",
    logline: "她替你母亲，把那句话说完。",
    master: "三姑 · 守屋的",
    acts: "筹备中",
    art: "/img/c4-gaze.jpg",
    ready: false,
  },
];

export default function Page() {
  const [playing, setPlaying] = useState<string | null>(null);

  if (playing && STORIES[playing]) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setPlaying(null)}
          className="press fixed left-4 top-4 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-[14px] text-white/70 backdrop-blur-md"
          aria-label="退出剧本"
        >
          ✕
        </button>
        <StoryPlayer key={playing} story={STORIES[playing]} />
      </div>
    );
  }

  const featured = SLOTS[0];
  const rest = SLOTS.slice(1);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-ink-950 pb-10">
      <header className="px-5 pt-11">
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-[21px] tracking-[0.16em] text-ink-100">看余</span>
          <span className="text-[10px] tracking-[0.3em] text-ink-600">KANYU</span>
        </div>
        <p className="mt-2 font-serif text-[13px] leading-6 text-ink-400">
          今晚有戏。挑一出，坐下听。
        </p>
      </header>

      {/* 今日开场 */}
      <section className="mt-6 px-5">
        <button
          type="button"
          onClick={() => setPlaying(featured.id)}
          className="press group relative block w-full overflow-hidden rounded-2xl text-left"
          style={{ aspectRatio: "3 / 4" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={featured.art}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.05]"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.86) 68%, rgba(0,0,0,0.99) 100%)",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2.5 p-5">
            <span className="w-fit rounded-full bg-cinnabar-500 px-2.5 py-1 text-[9px] font-medium tracking-[0.16em] text-white">
              {featured.badge}
            </span>
            <h2 className="font-serif text-[27px] leading-tight text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.95)]">
              {featured.title}
            </h2>
            <p className="text-[12px] leading-6 text-white/60">{featured.logline}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-[10px] tracking-[0.18em] text-cinnabar-300">{featured.master}</span>
              <span className="h-px flex-1 bg-white/15" />
              <span className="text-[10px] text-white/45">{featured.acts}</span>
            </div>
          </div>
        </button>
      </section>

      {/* 其他剧目 */}
      <section className="mt-8 px-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="font-serif text-[13.5px] tracking-[0.16em] text-ink-200">其他剧目</h3>
          <span className="text-[10px] text-ink-600">每出戏一位不同的先生</span>
        </div>

        <div className="flex flex-col gap-2.5">
          {rest.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={!s.ready}
              onClick={() => s.ready && setPlaying(s.id)}
              className="press relative flex items-stretch gap-3.5 overflow-hidden rounded-xl border border-ink-800 bg-ink-900/50 p-2.5 text-left disabled:cursor-default"
            >
              <div className="relative h-[86px] w-[66px] shrink-0 overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.art}
                  alt=""
                  className={`h-full w-full object-cover ${
                    s.ready ? "" : "opacity-40 grayscale-[0.6]"
                  }`}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] tracking-[0.18em] text-cinnabar-400/80">
                    {s.category}
                  </span>
                  {!s.ready && (
                    <span className="rounded-sm bg-ink-800 px-1.5 py-0.5 text-[8.5px] text-ink-500">
                      筹备中
                    </span>
                  )}
                </div>
                <span className="truncate font-serif text-[14.5px] text-ink-100">{s.title}</span>
                <span className="line-clamp-2 text-[10.5px] leading-4 text-ink-500">{s.logline}</span>
                <span className="mt-0.5 text-[9px] tracking-[0.14em] text-ink-600">{s.master}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 说明 */}
      <footer className="mt-8 px-5">
        <div className="rounded-xl border border-ink-800 bg-ink-900/40 p-4">
          <p className="text-[10.5px] leading-relaxed text-ink-500">
            每出戏由不同的先生坐镇，问你的问题、说话的方式都不一样。
            你的选择会被记住，并决定他从哪个角度跟你讲——但盘本身，永远由你的生日算出来。
          </p>
        </div>
        <p className="mt-4 text-center text-[9px] leading-relaxed text-ink-700">
          内容仅供娱乐参考，不构成任何医疗、投资、法律或人生决策建议。
          <br />
          生日等资料仅在你自己的设备上计算，不会上传。
        </p>
      </footer>
    </main>
  );
}
