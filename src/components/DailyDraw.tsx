"use client";

import { useMemo, useState } from "react";

/**
 * 每日一抽。
 *
 * 文案原则（改过一版，原因见下）：
 *   - 第一版用了「厚积薄发 / 破釜沉舟 / 柳暗花明」这类成语，是公众号鸡汤语，
 *     不是 20-30 岁的人形容自己时用的词。成语只留作大字的「字」，
 *     标题一律换成口语。
 *   - 标题要像朋友在说你，不像长辈在评你。
 */

type DailyCard = {
  /** 卡面大字，只留一个字，做视觉锚点 */
  hanzi: string;
  /** 口语标题：像朋友说的，不像成语 */
  name: string;
  /** 今天的状态标签 */
  keyword: string;
  /** 一句判词 */
  line: string;
  /** 今天具体能做的一件事 */
  hint: string;
};

const DECK: DailyCard[] = [
  {
    hanzi: "梯",
    name: "该答应的先答应",
    keyword: "机会 / 别想太多",
    line: "今天有个请求你会本能想拒，但它其实是梯子。",
    hint: "先回「我试试」，别急着找理由推掉。",
  },
  {
    hanzi: "软",
    name: "别硬撑了",
    keyword: "关系 / 示弱",
    line: "一句「其实我有点在意」比十句解释都管用。",
    hint: "把要解释的话减到一句，剩下的直接说感受。",
  },
  {
    hanzi: "等",
    name: "先别买",
    keyword: "花钱 / 缓一缓",
    line: "今天这单你会在三天后庆幸自己没下单。",
    hint: "扔购物车，明天再看还想要吗。",
  },
  {
    hanzi: "删",
    name: "该清一清了",
    keyword: "清理 / 断掉",
    line: "删掉一个你一直没删的对话框，人会轻一点。",
    hint: "选那个你每次滑到都会顿一下的。",
  },
  {
    hanzi: "说",
    name: "今天适合开口",
    keyword: "表达 / 被看见",
    line: "你憋着的那个想法，说出来会有人接住。",
    hint: "在群里发一次你的真实看法，别加「随便说说」。",
  },
  {
    hanzi: "停",
    name: "你不必每条都回",
    keyword: "边界 / 省电",
    line: "今天的消息里，至少有一条你可以不回。",
    hint: "手机反扣一小时，世界不会塌。",
  },
  {
    hanzi: "转",
    name: "计划乱了是好事",
    keyword: "变化 / 意外",
    line: "被打乱的那件事，可能是在给你腾位置。",
    hint: "别急着把行程改回原样，留半天空白。",
  },
  {
    hanzi: "猜",
    name: "你在自己吓自己",
    keyword: "内耗 / 求证",
    line: "你今天会为一件没发生的事难受很久。",
    hint: "把那件在猜的事，直接问出来。",
  },
  {
    hanzi: "熬",
    name: "没人看见但记着账",
    keyword: "积累 / 沉住",
    line: "今天做的事不会立刻有反馈，但它算数。",
    hint: "睡前写三行：今天做完了什么。",
  },
  {
    hanzi: "断",
    name: "犹豫本身就说明问题",
    keyword: "决断 / 别拖",
    line: "你已经想太久了，成本早就超过做错。",
    hint: "给自己定一个时间，到点就选，不再重想。",
  },
  {
    hanzi: "遇",
    name: "会碰到一个熟人",
    keyword: "重逢 / 别躲",
    line: "一个很久没联系的人会出现，别装没看见。",
    hint: "主动打个招呼，哪怕只是「好久不见」。",
  },
  {
    hanzi: "钝",
    name: "今天别太敏感",
    keyword: "情绪 / 降噪",
    line: "别人那句话没那么多意思，是你想多了。",
    hint: "把今天让你不舒服的那句话写下来，明天再看。",
  },
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
          <span className="font-serif text-[13px] tracking-[0.3em] text-cinnabar-400">今天怎么过</span>
          <span className="h-px flex-1 bg-ink-700" />
          <span className="text-[11px] text-ink-500">{todayKey()}</span>
        </div>
        <p className="text-sm leading-6 text-ink-300">
          三张，闭眼点一张。同一天结果固定，所以别刷——第一眼的那个就是。
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
              style={{ perspective: 900, height: 208 }}
            >
              <div className={`flip relative h-full w-full ${open ? "is-open" : ""}`}>
                {/* 背面 */}
                <div className="face absolute inset-0 flex flex-col items-center justify-between rounded-lg border border-ink-700 bg-gradient-to-b from-ink-850 to-ink-900 p-3">
                  <span className="self-start text-[10px] tracking-widest text-ink-600">
                    牌 {i + 1}
                  </span>
                  <span className="font-serif text-3xl text-ink-700">问</span>
                  <span className="text-[10px] tracking-widest text-ink-600">点我</span>
                </div>
                {/* 正面 */}
                <div className="face face-back absolute inset-0 flex flex-col justify-between rounded-lg border border-cinnabar-600/50 bg-ink-850 p-3 text-left">
                  <div className="flex items-start justify-between">
                    <span className="font-serif text-[38px] leading-none text-cinnabar-400">
                      {c.hanzi}
                    </span>
                    <span className="text-[9.5px] leading-tight text-ink-500">{c.keyword}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="font-serif text-[13.5px] leading-snug text-ink-100">
                      {c.name}
                    </span>
                    <span className="text-[11px] leading-relaxed text-ink-300">{c.line}</span>
                  </div>
                  <span className="text-[10px] leading-snug text-gold-500">{c.hint}</span>
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
            <span className="text-[11px] tracking-widest text-gold-500">今天试一下</span>
            <p className="mt-1.5 text-sm leading-6 text-ink-100">{chosen.hint}</p>
          </div>
          <p className="text-[11px] text-ink-500">明天再来，牌会换。</p>
        </div>
      )}
    </div>
  );
}
