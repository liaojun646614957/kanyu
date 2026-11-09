"use client";

import { useState } from "react";
import { castLine, guaOf, changedLines, GUA_READING, GUA_READING_FALLBACK, TRIGRAM, type Line } from "@/lib/gua";

const YAO_NAMES = ["初", "二", "三", "四", "五", "上"];

/** 一枚铜钱：正面（字）/ 反面（背） */
function Coin({ face, flipping }: { face: 2 | 3; flipping: boolean }) {
  return (
    <div
      className={`relative flex h-14 w-14 items-center justify-center rounded-full border transition-colors ${
        flipping ? "anim-coin" : ""
      } ${
        face === 3
          ? "border-gold-500/60 bg-gradient-to-br from-ink-700 to-ink-850"
          : "border-ink-600 bg-ink-850"
      }`}
      style={{ perspective: 400 }}
    >
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-sm border ${
          face === 3 ? "border-gold-500/50" : "border-ink-600"
        }`}
      >
        <span className={`font-serif text-[10px] ${face === 3 ? "text-gold-400" : "text-ink-500"}`}>
          {face === 3 ? "字" : "背"}
        </span>
      </div>
    </div>
  );
}

/** 一爻的横线 */
function YaoLine({ line, index }: { line: Line | undefined; index: number }) {
  if (!line) {
    return (
      <div className="flex items-center gap-2.5">
        <span className="w-8 text-[10px] tracking-wider text-ink-600">{YAO_NAMES[index]}</span>
        <div className="h-[7px] w-[88px] rounded-sm bg-ink-800/70" />
      </div>
    );
  }
  return (
    <div className="animate-fade flex items-center gap-2.5">
      <span className="w-8 text-[10px] tracking-wider text-ink-500">{YAO_NAMES[index]}</span>
      <div className="flex w-[88px] gap-[7px]">
        {line.yang ? (
          <div className="h-[7px] w-full rounded-sm bg-ink-100" />
        ) : (
          <>
            <div className="h-[7px] w-[40px] rounded-sm bg-ink-100" />
            <div className="h-[7px] w-[40px] rounded-sm bg-ink-100" />
          </>
        )}
      </div>
      <span className="w-12 text-[10px] text-ink-500">
        {line.changing ? (
          <span className="text-cinnabar-400">{line.kind}</span>
        ) : (
          line.kind
        )}
      </span>
    </div>
  );
}

export default function GuaCast() {
  const [lines, setLines] = useState<Line[]>([]);
  const [casting, setCasting] = useState(false);
  const [faces, setFaces] = useState<[2 | 3, 2 | 3, 2 | 3]>([3, 2, 3]);
  const [question, setQuestion] = useState("");

  const done = lines.length === 6;
  const gua = done ? guaOf(lines) : null;
  const reading = gua ? GUA_READING[gua.name] ?? GUA_READING_FALLBACK : null;
  const moving = lines.filter((l) => l.changing).length;
  const changed = moving > 0 ? guaOf(changedLines(lines)) : null;

  const throwOnce = () => {
    if (casting || done) return;
    const next = castLine();
    // 用真实和值反推三枚铜钱的面，保证动画与结果一致
    const rest = next.sum - 6; // 0..3 表示「几枚是 3」
    const coins: (2 | 3)[] = [0, 1, 2].map((i) => (i < rest ? 3 : 2));
    // 打乱位置，避免总是「背背字」这种固定形态
    for (let i = coins.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [coins[i], coins[j]] = [coins[j], coins[i]];
    }
    setFaces(coins as [2 | 3, 2 | 3, 2 | 3]);
    setCasting(true);
    window.setTimeout(() => {
      setLines((prev) => [...prev, next]);
      setCasting(false);
    }, 640);
  };

  const reset = () => {
    setLines([]);
    setCasting(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {lines.length === 0 && (
        <div className="animate-rise flex flex-col gap-2">
          <label className="text-xs tracking-widest text-ink-400">
            要问的事 <span className="text-ink-600">越具体越好</span>
          </label>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="例：这个 offer 我要不要接"
            className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2.5 text-sm text-ink-100 outline-none placeholder:text-ink-500 focus:border-cinnabar-600"
          />
          <p className="text-[11px] leading-relaxed text-ink-500">
            一件事只问一次。同一个问题反复摇，答案就不作数了——这是规矩，不是产品限制。
          </p>
        </div>
      )}

      {/* 铜钱 */}
      <div className="flex items-center justify-center gap-4 py-2">
        {faces.map((f, i) => (
          <Coin key={i} face={f} flipping={casting} />
        ))}
      </div>

      <button
        type="button"
        onClick={throwOnce}
        disabled={casting || done}
        className="press w-full rounded-md bg-cinnabar-600 py-3 text-sm font-medium tracking-widest text-white disabled:opacity-40"
      >
        {done ? "六爻已成" : casting ? "…" : `投第 ${lines.length + 1} 爻`}
      </button>

      {/* 爻 */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col-reverse gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <YaoLine key={i} line={lines[i]} index={i} />
          ))}
        </div>
      </div>

      {/* 卦解 */}
      {gua && reading && (
        <div className="animate-rise flex flex-col gap-5 border-t border-ink-800 pt-5">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-3xl text-ink-100">
              {TRIGRAM[gua.upper].symbol}
              {TRIGRAM[gua.lower].symbol}
            </span>
            <div className="flex flex-col">
              <span className="font-serif text-lg text-ink-100">
                第{gua.order}卦 · {gua.name}
              </span>
              <span className="text-[11px] text-ink-500">
                上{TRIGRAM[gua.upper].name}
                {TRIGRAM[gua.upper].nature} / 下{TRIGRAM[gua.lower].name}
                {TRIGRAM[gua.lower].nature}
                {moving > 0 && changed ? ` · ${moving} 变爻 → ${changed.name}` : " · 六爻皆静"}
              </span>
            </div>
          </div>

          <p className="font-serif text-xl leading-relaxed text-ink-100">{reading.verdict}</p>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] tracking-widest text-ink-400">现在的处境</span>
              <p className="text-sm leading-7 text-ink-200">{reading.now}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] tracking-widest text-gold-500">该怎么做</span>
              <p className="text-sm leading-7 text-ink-200">{reading.act}</p>
            </div>
            <div className="rounded-md border border-cinnabar-600/30 bg-cinnabar-600/[0.06] p-4">
              <span className="text-[11px] tracking-widest text-cinnabar-400">一句提醒</span>
              <p className="mt-1.5 text-sm leading-6 text-ink-100">{reading.warn}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={reset}
            className="press w-full rounded-md border border-ink-700 py-2.5 text-sm text-ink-200"
          >
            重新摇
          </button>
        </div>
      )}
    </div>
  );
}
