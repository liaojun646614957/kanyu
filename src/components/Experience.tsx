"use client";

import { useEffect, useMemo, useState } from "react";
import { buildFourPillars, elementCount, dayMasterStrength, WUXING } from "@/lib/ganzhi";
import { castLine } from "@/lib/gua";
import { PERSONA, PERSONA_FALLBACK } from "@/lib/persona";
import { downloadPoster } from "@/lib/poster";

/**
 * 沉浸式流程：一次只问一件事。
 *
 * 之前的版本是一整页表单（日期 + 时间 + 性别 + 提交），像登记表。
 * 改成 sajutight 那种步子：
 *   cover → gender → date → hour(可跳) → loading → result
 * 每一步：一句问话 + 一个操作区 + 大面积留白/插画。
 */

type Step = "cover" | "gender" | "date" | "hour" | "cast" | "loading" | "result";

const STEPS_ORDER: Step[] = ["cover", "gender", "date", "hour", "cast", "loading", "result"];

export default function Experience() {
  const [step, setStep] = useState<Step>("cover");
  const [gender, setGender] = useState<"female" | "male" | null>(null);
  const [birth, setBirth] = useState("1995-03-15");
  const [hour, setHour] = useState("");
  const [share, setShare] = useState(false);

  const stepIndex = STEPS_ORDER.indexOf(step);

  /* ---------- 结果计算 ---------- */
  const parsed = useMemo(() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birth);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return null;
    const dt = new Date(Date.UTC(y, mo - 1, d));
    if (dt.getUTCMonth() + 1 !== mo || dt.getUTCDate() !== d) return null;
    return { y, mo, d };
  }, [birth]);

  const result = useMemo(() => {
    if (!parsed) return null;
    let h: number | undefined;
    let mi = 0;
    if (hour) {
      const [hh, mm] = hour.split(":").map(Number);
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
  }, [parsed, hour]);

  /* ---------- loading 自动推进 ---------- */
  useEffect(() => {
    if (step !== "loading") return;
    const t = window.setTimeout(() => setStep("result"), 2600);
    return () => window.clearTimeout(t);
  }, [step]);

  const back = () => {
    const i = stepIndex - 1;
    if (i >= 0) setStep(STEPS_ORDER[i]);
  };

  /* ================= 封面 ================= */
  if (step === "cover") {
    return (
      <Shell bg="/img/cover.jpg">
        <div className="flex flex-1 flex-col justify-end pb-10">
          <div className="flex flex-col gap-3">
            <span className="text-[11px] tracking-[0.4em] text-cinnabar-400">KANYU · 看余</span>
            <h1 className="font-serif text-[38px] leading-[1.18] text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.85)]">
              你这一生
              <br />
              是什么调子
            </h1>
            <p className="text-[13px] leading-6 text-white/70">
              不用注册。三十秒。
              <br />
              先看你是哪一柱人。
            </p>
          </div>

          <div className="mt-9 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setStep("gender")}
              className="press flex w-full items-center justify-center gap-2 rounded-full bg-cinnabar-500 py-4 text-[14.5px] font-medium tracking-wide text-white shadow-[0_10px_40px_-8px_rgba(207,74,52,0.75)]"
            >
              <span className="text-[11px]">▶</span>
              开始
            </button>
            <p className="text-center text-[11px] text-white/40">
              已有 12,847 人看过自己
            </p>
          </div>
        </div>
      </Shell>
    );
  }

  /* ================= 性别 ================= */
  if (step === "gender") {
    return (
      <Shell bg="/img/cover.jpg" dim={0.66}>
        <TopBar onBack={back} progress={stepIndex / 4} />
        <div className="flex flex-1 flex-col pt-10">
          <Ask
            kicker="先认识一下你"
            title="你是"
            accent="男生还是女生"
            sub="这会影响我怎么读你的盘"
          />
          <div className="mt-auto flex flex-col gap-3 pb-10">
            {(
              [
                ["female", "女生"],
                ["male", "男生"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setGender(v);
                  setStep("date");
                }}
                className={`press rounded-full border py-4 text-[15px] tracking-wide backdrop-blur-md transition-colors ${
                  gender === v
                    ? "border-cinnabar-400/70 bg-cinnabar-500/25 text-white"
                    : "border-white/20 bg-black/35 text-white/90"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </Shell>
    );
  }

  /* ================= 生日 ================= */
  if (step === "date") {
    const ok = Boolean(parsed);
    return (
      <Shell bg="/img/cover.jpg" dim={0.74}>
        <TopBar onBack={back} progress={stepIndex / 4} />
        <div className="flex flex-1 flex-col pt-10">
          <Ask
            kicker="六十年一个循环，一天一格"
            title="你出生在"
            accent="哪一天"
            sub="公历就行，我会自己换算"
            light
          />

          <div className="mt-12 rounded-3xl border border-white/12 bg-black/40 p-7 backdrop-blur-md">
            <input
              type="date"
              value={birth}
              min="1900-01-01"
              max="2100-12-31"
              onChange={(e) => setBirth(e.target.value)}
              className="w-full bg-transparent text-center font-serif text-[28px] tabular-nums tracking-wider text-white outline-none [color-scheme:dark]"
            />
            {parsed && (
              <p className="mt-3 text-center text-[11px] tracking-widest text-white/40">
                干支历第 {(() => {
                  const fp = buildFourPillars(parsed.y, parsed.mo, parsed.d);
                  return fp.day.text;
                })()} 格
              </p>
            )}
          </div>

          <div className="mt-auto pb-10">
            <button
              type="button"
              disabled={!ok}
              onClick={() => setStep("hour")}
              className="press w-full rounded-full bg-cinnabar-500 py-4 text-[14.5px] font-medium tracking-wide text-white shadow-[0_14px_44px_-10px_rgba(207,74,52,0.9)] disabled:opacity-30 disabled:shadow-none"
            >
              下一步
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  /* ================= 时辰（可跳） ================= */
  if (step === "hour") {
    return (
      <Shell bg="/img/cover.jpg" dim={0.74}>
        <TopBar onBack={back} progress={stepIndex / 4} />
        <div className="flex flex-1 flex-col pt-10">
          <Ask
            kicker="知道就填，不知道也能算"
            title="大概"
            accent="几点出生"
            sub="不确定的话，跳过也可以"
            light
          />

          <div className="mt-12 rounded-3xl border border-white/12 bg-black/40 p-7 backdrop-blur-md">
            <input
              type="time"
              value={hour}
              onChange={(e) => setHour(e.target.value)}
              className="w-full bg-transparent text-center font-serif text-[28px] tabular-nums tracking-wider text-white outline-none [color-scheme:dark]"
            />
          </div>

          <div className="mt-auto flex flex-col gap-3 pb-10">
            <button
              type="button"
              onClick={() => setStep("cast")}
              className="press w-full rounded-full bg-cinnabar-500 py-4 text-[14.5px] font-medium tracking-wide text-white shadow-[0_14px_44px_-10px_rgba(207,74,52,0.9)]"
            >
              下一步：摇一卦
            </button>
            <button
              type="button"
              onClick={() => {
                setHour("");
                setStep("cast");
              }}
              className="press py-2 text-[12.5px] text-white/45"
            >
              想不起来了，跳过
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  /* ================= loading ================= */
  if (step === "loading") {
    return (
      <Shell bg="/img/cover.jpg" dim={0.72}>
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <Spinner />
          <div className="flex flex-col items-center gap-2">
            <p className="font-serif text-[17px] tracking-wider text-white">正在排你的盘…</p>
            <p className="text-[12px] text-white/50">六十甲子，找到你那一格</p>
          </div>
        </div>
      </Shell>
    );
  }

  /* ================= 摇卦（动手环节） ================= */
  if (step === "cast") {
    return <CastStep onDone={() => setStep("loading")} />;
  }

  /* ------------------------------------------------------------------ *
 * 摇卦：按住蓄力，松手掷出。六次成卦。
 * ------------------------------------------------------------------ */

function CastStep({ onDone }: { onDone: () => void }) {
  const [lines, setLines] = useState<{ yang: boolean; changing: boolean }[]>([]);
  const [charging, setCharging] = useState(false);
  const [charge, setCharge] = useState(0);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (!charging) return;
    let raf = 0;
    const tick = () => {
      setCharge((c) => Math.min(1, c + 0.028));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [charging]);

  const release = () => {
    if (!charging || flipping) return;
    setCharging(false);
    setFlipping(true);
    window.setTimeout(() => {
      const l = castLine();
      setLines((prev) => [...prev, { yang: l.yang, changing: l.changing }]);
      setCharge(0);
      setFlipping(false);
    }, 620);
  };

  const done = lines.length === 6;

  return (
    <Shell bg="/img/jiaobei.jpg" dim={0.55}>
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between pt-2">
          <span className="w-4" />
          <span className="font-serif text-[10.5px] tracking-[0.32em] text-white/50">
            第 {Math.min(lines.length + 1, 6)} / 6 爻
          </span>
          <span className="w-4" />
        </div>

        {/* 已成的爻 */}
        <div className="mt-8 flex flex-col-reverse items-center gap-2">
          {Array.from({ length: 6 }).map((_, i) => {
            const l = lines[i];
            return (
              <div key={i} className="flex h-[9px] items-center gap-1.5">
                {l ? (
                  <div className="flex w-[92px] gap-[8px]">
                    {l.yang ? (
                      <div className="h-[7px] w-full rounded-sm bg-white/85" />
                    ) : (
                      <>
                        <div className="h-[7px] w-[42px] rounded-sm bg-white/85" />
                        <div className="h-[7px] w-[42px] rounded-sm bg-white/85" />
                      </>
                    )}
                  </div>
                ) : (
                  <div className="h-[7px] w-[92px] rounded-sm bg-white/12" />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-auto flex flex-col items-center gap-5 pb-8">
          <p className="text-center text-[12.5px] leading-6 text-white/60">
            {done ? "六爻已成" : "按住，默念你要问的事，松手掷出"}
          </p>

          {!done && (
            <button
              type="button"
              onPointerDown={() => !flipping && setCharging(true)}
              onPointerUp={release}
              onPointerLeave={() => charging && release()}
              onKeyDown={(e) => {
                if (e.code === "Space" && !e.repeat && !flipping) {
                  e.preventDefault();
                  setCharging(true);
                }
              }}
              onKeyUp={(e) => e.code === "Space" && release()}
              className="press relative flex h-[76px] w-[76px] items-center justify-center rounded-full border border-white/25 bg-black/40 backdrop-blur-md"
            >
              <span
                className={`absolute inset-[3px] rounded-full border-2 border-cinnabar-400/70 transition-transform ${
                  charging ? "" : "scale-0 opacity-0"
                }`}
                style={{ transform: `scale(${0.3 + charge * 0.7})`, opacity: 0.3 + charge * 0.7 }}
              />
              <span
                className={`relative font-serif text-[19px] text-white transition-transform ${
                  flipping ? "anim-coin" : ""
                }`}
              >
                {flipping ? "" : "掷"}
              </span>
            </button>
          )}

          {done && (
            <button
              type="button"
              onClick={onDone}
              className="press w-full rounded-full bg-cinnabar-500 py-4 text-[14.5px] font-medium tracking-wide text-white shadow-[0_14px_44px_-10px_rgba(207,74,52,0.9)]"
            >
              看卦
            </button>
          )}
        </div>
      </div>
    </Shell>
  );
}

/* ================= 结果 ================= */
  if (!result) {
    return (
      <Shell>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-ink-400">日期有误，请返回重填</p>
        </div>
      </Shell>
    );
  }
  if (false) {
    return null;
  }

  const wxData = WUXING.map((el) => ({ el, v: result.counts[el] }));

  return (
    <Shell bg="/img/portrait.jpg" dim={0.62}>
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between pt-2">
          <button type="button" onClick={() => setStep("cover")} className="press text-[18px] text-white/70">
            ←
          </button>
          <span className="font-serif text-[11px] tracking-[0.3em] text-white/50">
            {result.fp.day.text}
          </span>
          <span className="w-4" />
        </div>

        <div className="mt-16 flex flex-1 flex-col">
          <div className="animate-rise flex flex-col gap-4">
            <span className="text-[10.5px] tracking-[0.3em] text-cinnabar-300">
              {result.strength.label === "身强"
                ? "能量偏足"
                : result.strength.label === "身弱"
                  ? "感受力强"
                  : "不偏不倚"}
            </span>
            <h1 className="font-serif text-[32px] leading-[1.22] text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.9)]">
              {result.persona.tag}
            </h1>
            <p className="text-[13.5px] leading-7 text-white/80">{result.persona.core}</p>
          </div>

          <div className="mt-auto flex flex-col gap-4 pb-8">
            <div className="rounded-2xl border border-white/10 bg-black/45 p-4 backdrop-blur-md">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-[10px] tracking-widest text-gold-400">优势</span>
                <p className="flex-1 text-[12.5px] leading-6 text-white/85">{result.persona.gift}</p>
              </div>
              <div className="my-3 h-px bg-white/10" />
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-[10px] tracking-widest text-cinnabar-300">会栽在</span>
                <p className="flex-1 text-[12.5px] leading-6 text-white/85">{result.persona.trap}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShare(true)}
              className="press w-full rounded-full bg-cinnabar-500 py-3.5 text-[14px] font-medium tracking-wide text-white shadow-[0_10px_40px_-8px_rgba(207,74,52,0.75)]"
            >
              往下看我的盘
            </button>
          </div>
        </div>
      </div>

      {share && (
        <DetailSheet
          result={result}
          wxData={wxData}
          onClose={() => setShare(false)}
        />
      )}
    </Shell>
  );
}

/* ------------------------------------------------------------------ *
 * 基础组件
 * ------------------------------------------------------------------ */

function Shell({
  children,
  bg,
  dim = 0.5,
}: {
  children: React.ReactNode;
  bg?: string;
  dim?: number;
}) {
  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-ink-950 px-6">
      {bg && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bg}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `linear-gradient(180deg, rgba(11,10,9,${dim}) 0%, rgba(11,10,9,${Math.min(
                0.92,
                dim + 0.18,
              )}) 52%, rgba(11,10,9,0.98) 100%)`,
            }}
          />
        </>
      )}
      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </main>
  );
}

function TopBar({ onBack, progress }: { onBack: () => void; progress: number }) {
  return (
    <div className="flex flex-col gap-3 pt-2">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="press text-[18px] text-ink-400">
          ‹
        </button>
        <span className="font-serif text-[10.5px] tracking-[0.32em] text-ink-600">KANYU</span>
        <span className="w-4" />
      </div>
      <div className="h-[2px] w-full overflow-hidden rounded-full bg-ink-800">
        <div
          className="h-full rounded-full bg-cinnabar-500 transition-[width] duration-500"
          style={{ width: `${Math.max(6, progress * 100)}%` }}
        />
      </div>
    </div>
  );
}

function Ask({
  kicker,
  title,
  accent,
  sub,
  light = false,
}: {
  kicker: string;
  title: string;
  accent: string;
  sub: string;
  light?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span
        className={`text-[11px] tracking-[0.16em] ${light ? "text-white/45" : "text-ink-500"}`}
      >
        {kicker}
      </span>
      <h2
        className={`font-serif text-[30px] leading-[1.3] ${
          light ? "text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.9)]" : "text-ink-100"
        }`}
      >
        {title}
        <span className="text-cinnabar-400">{accent}</span>
      </h2>
      <p className={`text-[12.5px] leading-6 ${light ? "text-white/55" : "text-ink-400"}`}>{sub}</p>
    </div>
  );
}

function Spinner() {
  return (
    <div className="relative h-24 w-24">
      <svg viewBox="0 0 100 100" className="absolute inset-0 animate-[spin-slow_8s_linear_infinite]">
        <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(232,225,214,0.12)" strokeWidth="1" />
        {Array.from({ length: 60 }).map((_, i) => {
          const a = ((360 / 60) * i * Math.PI) / 180;
          const inner = i % 5 === 0 ? 34 : 38;
          return (
            <line
              key={i}
              x1={50 + Math.sin(a) * inner}
              y1={50 - Math.cos(a) * inner}
              x2={50 + Math.sin(a) * 44}
              y2={50 - Math.cos(a) * 44}
              stroke={i % 5 === 0 ? "rgba(226,96,74,0.75)" : "rgba(232,225,214,0.22)"}
              strokeWidth="1"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-serif text-[22px] text-white/80">余</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 详情面板
 * ------------------------------------------------------------------ */

function DetailSheet({
  result,
  wxData,
  onClose,
}: {
  result: {
    fp: {
      year: { text: string };
      month: { text: string };
      day: { text: string };
      hour: { text: string } | null;
    };
    strength: { ratio: number; label: string };
    persona: { tag: string; core: string; gift: string; trap: string; doThis: string };
  };
  wxData: { el: string; v: number }[];
  onClose: () => void;
}) {
  const [sharing, setSharing] = useState(false);
  const maxV = Math.max(...wxData.map((x) => x.v), 1);

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end">
      <button
        type="button"
        aria-label="关闭"
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
      />
      <div className="animate-rise relative max-h-[86vh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-ink-900/95 px-6 pb-8 pt-3 backdrop-blur-xl">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" />

        <div className="flex flex-col gap-5">
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[10.5px] tracking-[0.24em] text-ink-500">你的盘</span>
              <span className="font-serif text-[22px] text-ink-100">{result.fp.day.text}</span>
            </div>
            <span className="text-[11px] text-ink-500">能量 {result.strength.ratio}%</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              ["年", result.fp.year.text],
              ["月", result.fp.month.text],
              ["日", result.fp.day.text],
              ["时", result.fp.hour?.text ?? "—"],
            ].map(([l, t]) => (
              <div
                key={l}
                className="flex flex-col items-center gap-1 rounded-lg border border-ink-700 bg-ink-850/80 py-3"
              >
                <span className="text-[9.5px] tracking-widest text-ink-500">{l}</span>
                <span className="font-serif text-[17px] text-ink-100">{t}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-1.5">
            {wxData.map((d) => (
              <div key={d.el} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex h-20 w-full items-end justify-center">
                  <div
                    className="w-full rounded-t bg-cinnabar-600/70 transition-[height] duration-700"
                    style={{ height: `${Math.max(8, (d.v / maxV) * 100)}%` }}
                  />
                </div>
                <span className="font-serif text-[11px] text-ink-300">{d.el}</span>
                <span className="text-[9.5px] tabular-nums text-ink-500">{d.v}</span>
              </div>
            ))}
          </div>

          <p className="text-[10.5px] leading-relaxed text-ink-500">
            五行 = 你性格里五种倾向的配比。木：生长/想法，火：表达/热度，土：稳定/承担，
            金：规则/边界，水：感知/流动。
          </p>

          <div className="rounded-xl border border-ink-700 bg-ink-850/70 p-4">
            <span className="text-[10px] tracking-[0.2em] text-ink-500">今天就试一下</span>
            <p className="mt-1.5 text-[13px] leading-6 text-ink-100">{result.persona.doThis}</p>
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="press flex-1 rounded-full border border-ink-700 py-3 text-[13px] text-ink-300"
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
              className="press flex-1 rounded-full bg-cinnabar-500 py-3 text-[13px] font-medium text-white disabled:opacity-60"
            >
              {sharing ? "生成中…" : "存成图片"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
