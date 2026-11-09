"use client";

import { useMemo, useState } from "react";

type DailyCard = {
  hanzi: string;
  name: string;
  keyword: string;
  line: string;
  hint: string;
};

const DECK: DailyCard[] = [
  { hanzi: "禄", name: "天选打工人", keyword: "贵人 / 机会", line: "今天有个请求你会本能拒绝，但它其实是梯子。", hint: "先答应，再想办法。" },
  { hanzi: "柔", name: "嘴硬心软", keyword: "关系 / 示弱", line: "一句「其实我有点在意」比十句解释都管用。", hint: "把解释减到一句。" },
  { hanzi: "蓄", name: "延迟满足", keyword: "财务 / 忍耐", line: "忍住今天这笔冲动消费，本月会有回报。", hint: "加购物车，明天再决定。" },
  { hanzi: "舍", name: "断舍离", keyword: "清理 / 告别", line: "删掉一个不再联系的对话框，运气会变轻。", hint: "清理一个你一直没删的。" },
  { hanzi: "显", name: "高光时刻", keyword: "表达 / 曝光", line: "今天适合把想法说出口，会有人接住。", hint: "在群里发一次你的观点。" },
  { hanzi: "滞", name: "情绪过载", keyword: "休息 / 缓冲", line: "不是所有消息都需要现在回。", hint: "把手机反扣一小时。" },
  { hanzi: "转", name: "柳暗花明", keyword: "转机 / 意外", line: "原计划被打乱的地方，正是新机会入口。", hint: "别急着把被打乱的行程改回去。" },
  { hanzi: "妄", name: "自作多情", keyword: "觉察 / 收手", line: "把猜测当事实，是今天最容易犯的错。", hint: "把一件在猜的事直接问出来。" },
  { hanzi: "积", name: "厚积薄发", keyword: "积累 / 沉默", line: "今天的努力不会立刻被看见，但它记账了。", hint: "记下今天做完的三件事。" },
  { hanzi: "决", name: "破釜沉舟", keyword: "决断 / 冒险", line: "犹豫的成本，已经超过做错的成本。", hint: "给自己一个截止时间。" },
  { hanzi: "静", name: "不必回应", keyword: "边界 / 沉默", line: "今天有一条消息，你不需要回。", hint: "允许自己已读不回。" },
  { hanzi: "遇", name: "意外的重逢", keyword: "人际 / 偶然", line: "一个很久没联系的人会出现，别装作没看见。", hint: "主动打个招呼。" },
];

/** 用日期做种子，保证同一天同一结果（这才是「每日一抽」） */
function dayIndex(dateKey: string, len: number): number {
  let h = 2166136261;
  for (let i = 0; i < dateKey.length; i++) {
    h ^= dateKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % len;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export default function DailyDraw() {
  const [picked, setPicked] = useState<number | null>(null);
  const seed = useMemo(() => dayIndex(todayKey(), DECK.length), []);

  const cards = useMemo(
    () => [0, 1, 2].map((i) => DECK[(seed + i * 4) % DECK.length]),
    [seed],
  );

  const chosen = picked === null ? null : cards[picked];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="font-serif text-[13px] tracking-[0.3em] text-cinnabar-400">今日一抽</span>
          <span className="h-px flex-1 bg-ink-700" />
          <span className="text-[11px] text-ink-500">{todayKey()}</span>
        </div>
        <p className="text-sm leading-6 text-ink-300">
          三张牌，凭直觉点一张。同一天内结果固定——所以别刷，第一眼的就是。
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {cards.map((c, i) => {
          const open = picked === i;
          const dim = picked !== null && !open;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setPicked(picked === i ? null : i)}
              aria-label={open ? c.name : `抽第 ${i + 1} 张`}
              className={`press relative ${dim ? "opacity-30" : "opacity-100"}`}
              style={{ perspective: 900, height: 200 }}
            >
              <div className={`flip relative h-full w-full ${open ? "is-open" : ""}`}>
                {/* 背面 */}
                <div className="face absolute inset-0 flex flex-col items-center justify-between rounded-lg border border-ink-700 bg-gradient-to-b from-ink-850 to-ink-900 p-3">
                  <span className="self-start text-[10px] tracking-widest text-ink-600">
                    牌 {i + 1}
                  </span>
                  <span className="font-serif text-3xl text-ink-700">问</span>
                  <span className="text-[10px] tracking-widest text-ink-600">点击翻开</span>
                </div>
                {/* 正面 */}
                <div className="face face-back absolute inset-0 flex flex-col justify-between rounded-lg border border-cinnabar-600/50 bg-ink-850 p-3 text-left">
                  <div className="flex items-start justify-between">
                    <span className="font-serif text-4xl leading-none text-cinnabar-400">
                      {c.hanzi}
                    </span>
                    <span className="text-[10px] text-ink-500">{c.keyword}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="font-serif text-sm text-ink-100">{c.name}</span>
                    <span className="text-[11px] leading-relaxed text-ink-300">{c.line}</span>
                  </div>
                  <span className="text-[10px] text-gold-500">{c.hint}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {chosen && (
        <div className="animate-rise flex flex-col gap-3 border-t border-ink-800 pt-5">
          <p className="font-serif text-xl leading-relaxed text-ink-100">{chosen.line}</p>
          <div className="rounded-md border border-gold-500/25 bg-gold-500/[0.05] p-4">
            <span className="text-[11px] tracking-widest text-gold-500">今天就做</span>
            <p className="mt-1.5 text-sm leading-6 text-ink-100">{chosen.hint}</p>
          </div>
          <p className="text-[11px] text-ink-500">明天再来，牌会换。</p>
        </div>
      )}
    </div>
  );
}
