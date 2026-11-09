"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildFourPillars, elementCount, dayMasterStrength, WUXING } from "@/lib/ganzhi";
import { castLine, guaOf, GUA_READING, GUA_READING_FALLBACK, TRIGRAM, type Line } from "@/lib/gua";
import { PERSONA, PERSONA_FALLBACK } from "@/lib/persona";
import { downloadPoster } from "@/lib/poster";
import type { Script } from "@/lib/script";

/* ================================================================== *
 * 剧本播放器
 *
 * 核心：一个场景一个场景地过，每个场景换一张立绘。
 * 立绘之间用 crossfade + 缓慢推近（kenburns），制造「画面在动」的感觉，
 * 而不是硬切静态图。
 * ================================================================== */

type Collected = { birth: string; hour: string; tags: string[]; lines: Line[] };

export default function ScriptPlayer({ script }: { script: Script }) {
  const [idx, setIdx] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [birth, setBirth] = useState("1995-03-15");
  const [hour, setHour] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [phase, setPhase] = useState<"script" | "thinking" | "report">("script");
  const [artKey, setArtKey] = useState(0);

  const scene = script.scenes[idx];
  const isLast = idx === script.scenes.length - 1;

  const next = useCallback(() => {
    if (idx < script.scenes.length - 1) {
      setIdx((i) => i + 1);
      setArtKey((k) => k + 1);
    } else {
      setPhase("thinking");
    }
  }, [idx, script.scenes.length]);

  useEffect(() => {
    if (phase !== "thinking") return;
    const t = window.setTimeout(() => setPhase("report"), 2400);
    return () => window.clearTimeout(t);
  }, [phase]);

  const collected: Collected = { birth, hour, tags, lines };

  if (phase === "thinking") return <Thinking art={script.scenes[script.scenes.length - 1].art} />;
  if (phase === "report") return <Report script={script} data={collected} />;

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-black">
      {/* 立绘层：key 变化触发 crossfade */}
      <Art art={scene.art} k={artKey} />

      {/* 底部渐暗，保证文字可读 */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 34%, rgba(0,0,0,0.72) 66%, rgba(0,0,0,0.97) 100%)",
        }}
      />

      {/* 顶部进度 */}
      <div className="relative z-20 flex items-center gap-2 px-5 pt-4">
        {script.scenes.map((_, i) => (
          <div
            key={i}
            className={`h-[2px] flex-1 rounded-full transition-colors duration-500 ${
              i <= idx ? "bg-cinnabar-400" : "bg-white/15"
            }`}
          />
        ))}
      </div>

      {/* 内容 */}
      <div className="relative z-20 flex flex-1 flex-col justify-end px-5 pb-9">
        <div key={idx} className="animate-rise flex flex-col gap-4">
          {/* 大师署名 */}
          <div className="flex items-center gap-2">
            <span className="h-px w-5 bg-cinnabar-400/70" />
            <span className="font-serif text-[10.5px] tracking-[0.24em] text-cinnabar-300">
              {script.master.name} · {script.master.title}
            </span>
          </div>

          {scene.aside && (
            <p className="text-[11.5px] leading-6 text-white/40">{scene.aside}</p>
          )}

          <p className="font-serif text-[22px] leading-[1.55] text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.95)]">
            {scene.text}
          </p>

          <div className="mt-2 flex flex-col gap-2.5">
            {scene.kind === "line" && (
              <BigButton onClick={next}>{scene.cta ?? "继续"}</BigButton>
            )}

            {scene.kind === "choice" && (
              <>
                {scene.options.map((o) => (
                  <BigButton
                    key={o.tag}
                    onClick={() => {
                      setTags((t) => [...t, o.tag]);
                      next();
                    }}
                  >
                    {o.label}
                  </BigButton>
                ))}
              </>
            )}

            {scene.kind === "input" && scene.field === "birth" && (
              <InputBlock
                type="date"
                value={birth}
                onChange={setBirth}
                onNext={next}
                valid={/^\d{4}-\d{2}-\d{2}$/.test(birth)}
              />
            )}

            {scene.kind === "input" && scene.field === "hour" && (
              <InputBlock
                type="time"
                value={hour}
                onChange={setHour}
                onNext={next}
                valid
                onSkip={
                  scene.skip
                    ? () => {
                        setHour("");
                        next();
                      }
                    : undefined
                }
                skipLabel={scene.skip}
              />
            )}

            {scene.kind === "cast" && (
              <CastBlock
                lines={lines}
                onCast={(l) => setLines((prev) => [...prev, l])}
                onDone={next}
              />
            )}
          </div>

          {isLast && scene.kind === "line" && (
            <p className="text-center text-[10px] text-white/25">仅供娱乐参考</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 立绘：crossfade + 缓慢推近
 * ------------------------------------------------------------------ */

function Art({ art, k }: { art: string; k: number }) {
  return (
    <div className="absolute inset-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={k}
        src={art}
        alt=""
        aria-hidden="true"
        className="kenburns absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}

function Thinking({ art }: { art: string }) {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col items-center justify-center overflow-hidden bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={art} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-black/55" />
      <div className="relative z-10 flex flex-col items-center gap-7">
        <div className="relative h-24 w-24">
          <svg viewBox="0 0 100 100" className="absolute inset-0 animate-[spin-slow_7s_linear_infinite]">
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            {Array.from({ length: 60 }).map((_, i) => {
              const a = ((360 / 60) * i * Math.PI) / 180;
              const inner = i % 5 === 0 ? 33 : 38;
              return (
                <line
                  key={i}
                  x1={50 + Math.sin(a) * inner}
                  y1={50 - Math.cos(a) * inner}
                  x2={50 + Math.sin(a) * 44}
                  y2={50 - Math.cos(a) * 44}
                  stroke={i % 5 === 0 ? "rgba(226,96,74,0.8)" : "rgba(255,255,255,0.2)"}
                  strokeWidth="1"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-serif text-[20px] text-white/80">余</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="font-serif text-[15px] tracking-wider text-white/85">她在看你的盘</p>
          <p className="text-[11px] text-white/35">六十年一个循环，找到你那一格</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 控件
 * ------------------------------------------------------------------ */

function BigButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press w-full rounded-full border border-white/15 bg-white/[0.07] py-3.5 text-[14px] text-white backdrop-blur-md transition-colors hover:bg-white/[0.12]"
    >
      {children}
    </button>
  );
}

function InputBlock({
  type,
  value,
  onChange,
  onNext,
  valid,
  onSkip,
  skipLabel,
}: {
  type: "date" | "time";
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  valid: boolean;
  onSkip?: () => void;
  skipLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="rounded-2xl border border-white/15 bg-black/45 px-4 py-3.5 backdrop-blur-md">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-center font-serif text-[21px] tabular-nums tracking-wider text-white outline-none [color-scheme:dark]"
        />
      </div>
      <button
        type="button"
        onClick={onNext}
        disabled={!valid}
        className="press w-full rounded-full bg-cinnabar-500 py-3.5 text-[14px] font-medium text-white shadow-[0_12px_40px_-10px_rgba(207,74,52,0.9)] disabled:opacity-30 disabled:shadow-none"
      >
        继续
      </button>
      {onSkip && (
        <button type="button" onClick={onSkip} className="press py-1.5 text-[12px] text-white/40">
          {skipLabel}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 摇卦：按住蓄力，松手落爻
 * ------------------------------------------------------------------ */

function CastBlock({
  lines,
  onCast,
  onDone,
}: {
  lines: Line[];
  onCast: (l: Line) => void;
  onDone: () => void;
}) {
  const [charging, setCharging] = useState(false);
  const [charge, setCharge] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const raf = useRef(0);

  useEffect(() => {
    if (!charging) return;
    const tick = () => {
      setCharge((c) => Math.min(1, c + 0.03));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [charging]);

  const release = () => {
    if (!charging || flipping) return;
    setCharging(false);
    setFlipping(true);
    window.setTimeout(() => {
      onCast(castLine());
      setCharge(0);
      setFlipping(false);
    }, 600);
  };

  const done = lines.length === 6;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 六爻 */}
      <div className="flex flex-col-reverse gap-1.5 py-1">
        {Array.from({ length: 6 }).map((_, i) => {
          const l = lines[i];
          return (
            <div key={i} className="flex h-[8px] w-[96px] gap-[7px]">
              {l ? (
                l.yang ? (
                  <div className="animate-fade h-full w-full rounded-sm bg-white/85" />
                ) : (
                  <>
                    <div className="animate-fade h-full w-[44px] rounded-sm bg-white/85" />
                    <div className="animate-fade h-full w-[44px] rounded-sm bg-white/85" />
                  </>
                )
              ) : (
                <div className="h-full w-full rounded-sm bg-white/10" />
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-white/40">
        {done ? "六爻已成" : `第 ${lines.length + 1} / 6 爻`}
      </p>

      {!done ? (
        <button
          type="button"
          onPointerDown={() => !flipping && setCharging(true)}
          onPointerUp={release}
          onPointerLeave={() => charging && release()}
          className="press relative flex h-[72px] w-[72px] items-center justify-center rounded-full border border-white/25 bg-black/45 backdrop-blur-md"
          aria-label="按住摇卦"
        >
          <span
            className="absolute inset-[3px] rounded-full border-2 border-cinnabar-400/80 transition-opacity"
            style={{
              transform: `scale(${0.35 + charge * 0.65})`,
              opacity: charging ? 0.35 + charge * 0.65 : 0,
            }}
          />
          <span className="relative font-serif text-[18px] text-white">
            {flipping ? "" : "掷"}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onDone}
          className="press w-full rounded-full bg-cinnabar-500 py-3.5 text-[14px] font-medium text-white shadow-[0_12px_40px_-10px_rgba(207,74,52,0.9)]"
        >
          看结果
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 报告
 * ------------------------------------------------------------------ */

function Report({ script, data }: { script: Script; data: Collected }) {
  const [sheet, setSheet] = useState(false);
  const [sharing, setSharing] = useState(false);

  const parsed = useMemo(() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data.birth);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    const dt = new Date(Date.UTC(y, mo - 1, d));
    if (dt.getUTCMonth() + 1 !== mo || dt.getUTCDate() !== d) return null;
    return { y, mo, d };
  }, [data.birth]);

  const result = useMemo(() => {
    if (!parsed) return null;
    let h: number | undefined;
    let mi = 0;
    if (data.hour) {
      const [hh, mm] = data.hour.split(":").map(Number);
      if (!Number.isNaN(hh)) {
        h = hh;
        mi = Number.isNaN(mm) ? 0 : mm;
      }
    }
    const fp = buildFourPillars(parsed.y, parsed.mo, parsed.d, h, mi);
    const counts = elementCount([fp.year, fp.month, fp.day, fp.hour]);
    const strength = dayMasterStrength(fp.day.gan, counts);
    const persona = PERSONA[fp.day.text] ?? PERSONA_FALLBACK;
    return { fp, counts, strength, persona };
  }, [parsed, data.hour]);

  const gua = data.lines.length === 6 ? guaOf(data.lines) : null;
  const reading = gua ? GUA_READING[gua.name] ?? GUA_READING_FALLBACK : null;

  if (!result) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[440px] items-center justify-center bg-black px-6">
        <p className="text-[13px] text-white/50">日期有误，请重新进入剧本。</p>
      </div>
    );
  }

  // 按 tag 挑开场：优先匹配最后一个 tag
  const opening =
    script.openings.find((o) => o.when.some((w) => data.tags.includes(w)))?.text ??
    script.openings[0]?.text ??
    "";

  const wxData = WUXING.map((el) => ({ el, v: result.counts[el] }));

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/img/c4-gaze.jpg"
        alt=""
        aria-hidden="true"
        className="kenburns absolute inset-0 h-full w-full object-cover opacity-80"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.28) 30%, rgba(0,0,0,0.86) 66%, #000 100%)",
        }}
      />

      <div className="relative z-10 flex flex-1 flex-col px-5 pb-8 pt-12">
        <div className="flex items-center gap-2">
          <span className="h-px w-5 bg-cinnabar-400/70" />
          <span className="font-serif text-[10.5px] tracking-[0.24em] text-cinnabar-300">
            {script.master.name} · {script.master.title}
          </span>
        </div>

        <p className="mt-6 font-serif text-[15px] leading-7 text-white/55">{opening}</p>

        <h1 className="mt-5 font-serif text-[31px] leading-[1.28] text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.95)]">
          {result.persona.tag}
        </h1>

        <p className="mt-4 text-[13px] leading-7 text-white/78">{result.persona.core}</p>

        {reading && (
          <div className="mt-6 rounded-2xl border border-white/12 bg-black/45 p-4 backdrop-blur-md">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-[17px] text-white/85">
                {TRIGRAM[gua!.upper].symbol}
                {TRIGRAM[gua!.lower].symbol}
              </span>
              <span className="font-serif text-[13px] text-white/70">
                第{gua!.order}卦 · {gua!.name}
              </span>
            </div>
            <p className="mt-2.5 font-serif text-[15px] leading-7 text-white/90">
              {reading.verdict}
            </p>
            <p className="mt-2 text-[12px] leading-6 text-white/55">{reading.act}</p>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-3 pt-6">
          <div className="rounded-2xl border border-white/10 bg-black/50 p-4 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-[9.5px] tracking-widest text-gold-400">优势</span>
              <p className="flex-1 text-[12px] leading-6 text-white/82">{result.persona.gift}</p>
            </div>
            <div className="my-3 h-px bg-white/10" />
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-[9.5px] tracking-widest text-cinnabar-300">会栽在</span>
              <p className="flex-1 text-[12px] leading-6 text-white/82">{result.persona.trap}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSheet(true)}
            className="press w-full rounded-full bg-cinnabar-500 py-3.5 text-[14px] font-medium tracking-wide text-white shadow-[0_14px_44px_-10px_rgba(207,74,52,0.95)]"
          >
            看我的盘
          </button>
        </div>
      </div>

      {sheet && (
        <div className="absolute inset-0 z-30 flex flex-col justify-end">
          <button
            type="button"
            aria-label="关闭"
            onClick={() => setSheet(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
          />
          <div className="animate-rise relative max-h-[88vh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-ink-900/96 px-5 pb-8 pt-3 backdrop-blur-xl">
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" />

            <div className="flex items-end justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] tracking-[0.24em] text-white/40">你的盘</span>
                <span className="font-serif text-[21px] text-white">{result.fp.day.text}</span>
              </div>
              <span className="text-[11px] text-white/40">能量 {result.strength.ratio}%</span>
            </div>

            <div className="mt-5 grid grid-cols-4 gap-2">
              {[
                ["年", result.fp.year.text],
                ["月", result.fp.month.text],
                ["日", result.fp.day.text],
                ["时", result.fp.hour?.text ?? "—"],
              ].map(([l, t]) => (
                <div
                  key={l}
                  className="flex flex-col items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] py-3"
                >
                  <span className="text-[9px] tracking-widest text-white/35">{l}</span>
                  <span className="font-serif text-[16px] text-white/90">{t}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex gap-1.5">
              {wxData.map((d) => (
                <div key={d.el} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex h-[72px] w-full items-end justify-center">
                    <div
                      className="w-full rounded-t bg-cinnabar-600/75"
                      style={{
                        height: `${Math.max(8, (d.v / Math.max(...wxData.map((x) => x.v), 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="font-serif text-[10.5px] text-white/50">{d.el}</span>
                </div>
              ))}
            </div>

            <p className="mt-3 text-[10px] leading-relaxed text-white/30">
              五行 = 你性格里五种倾向的配比。木：生长，火：表达，土：稳定，金：边界，水：感知。
            </p>

            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <span className="text-[9.5px] tracking-[0.2em] text-white/35">今天就试一下</span>
              <p className="mt-1.5 text-[12.5px] leading-6 text-white/85">{result.persona.doThis}</p>
            </div>

            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setSheet(false)}
                className="press flex-1 rounded-full border border-white/15 py-3 text-[12.5px] text-white/70"
              >
                关闭
              </button>
              <button
                type="button"
                disabled={sharing}
                onClick={async () => {
                  setSharing(true);
                  try {
                    await downloadPoster({
                      dayGanZhi: result.fp.day.text,
                      tag: result.persona.tag,
                      core: result.persona.core,
                      gift: result.persona.gift,
                    });
                  } finally {
                    setSharing(false);
                  }
                }}
                className="press flex-1 rounded-full bg-cinnabar-500 py-3 text-[12.5px] font-medium text-white disabled:opacity-60"
              >
                {sharing ? "生成中…" : "存成图片"}
              </button>
            </div>

            <p className="mt-4 text-center text-[9.5px] text-white/20">
              仅供娱乐参考 · 不构成任何决策建议 · 生日只在你的设备上计算
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
