"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildFourPillars, elementCount, dayMasterStrength, WUXING } from "@/lib/ganzhi";
import { castLine, guaOf, GUA_READING, GUA_READING_FALLBACK, TRIGRAM, type Line } from "@/lib/gua";
import { PERSONA, PERSONA_FALLBACK } from "@/lib/persona";
import { downloadPoster } from "@/lib/poster";
import type { Beat, StoryScript } from "@/lib/story";
import ReportReader from "@/components/ReportReader";
import { buildReport } from "@/lib/report";

/**
 * 剧本播放器（视频版）。
 *
 * 关键设计：
 *   1. 每拍是一个 VideoBeat —— 视频在后台预加载，切换时不黑屏
 *   2. 旁白/台词用打字机逐字出现，读完才出按钮（制造节奏）
 *   3. 有选项时视频循环播放，等用户选（不催）
 *   4. 选择立刻回一句，并记录 cost —— 让选择有代价
 *   5. 摇卦是真正的手势：按住蓄力，松手落爻
 */

type Collected = {
  birth: string;
  hour: string;
  tags: string[];
  lines: Line[];
  costs: string[];
};

type Phase = "play" | "ending";

export default function StoryPlayer({ story }: { story: StoryScript }) {
  // 把 chapters 摊平成线性 beats，并记住每个 beat 属于哪一章
  const flat = useMemo(() => {
    const out: { beat: Beat; chapterTitle: string; chapterIndex: number }[] = [];
    story.chapters.forEach((ch, ci) => {
      ch.beats.forEach((b) => out.push({ beat: b, chapterTitle: ch.title, chapterIndex: ci }));
    });
    return out;
  }, [story]);

  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<Phase>("play");
  const [tags, setTags] = useState<string[]>([]);
  const [costs, setCosts] = useState<string[]>([]);
  const [birth, setBirth] = useState("1995-03-15");
  const [hour, setHour] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [picked, setPicked] = useState<number | null>(null);

  const cur = flat[i];
  const beat = cur?.beat;

  const advance = useCallback(() => {
    setPicked(null);
    if (i < flat.length - 1) setI((x) => x + 1);
    else setPhase("ending");
  }, [i, flat.length]);

  if (phase === "ending") {
    return <Ending story={story} data={{ birth, hour, tags, lines, costs }} />;
  }

  if (!beat) return null;

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-black">
      <VideoLayer beat={beat} beatId={beat.id} holdMs={beat.hold} paused={Boolean(beat.choices)} />

      {/* 压暗层 */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.06) 26%, rgba(0,0,0,0.55) 62%, rgba(0,0,0,0.96) 100%)",
        }}
      />

      {/* 章节进度 */}
      <div className="relative z-20 px-5 pt-4">
        <div className="flex items-center gap-1.5">
          {story.chapters.map((ch, ci) => (
            <div key={ch.id} className="flex-1">
              <div
                className={`h-[2px] rounded-full transition-colors duration-500 ${
                  ci < (cur?.chapterIndex ?? 0)
                    ? "bg-cinnabar-400"
                    : ci === (cur?.chapterIndex ?? 0)
                      ? "bg-cinnabar-400/60"
                      : "bg-white/12"
                }`}
              />
            </div>
          ))}
        </div>
        <p className="mt-2.5 font-serif text-[9.5px] tracking-[0.22em] text-white/35">
          {cur?.chapterTitle}
        </p>
      </div>

      {/* 台词 */}
      <div className="relative z-20 mt-auto px-5 pb-8">
        <div key={beat.id} className="flex flex-col gap-4">
          {beat.who === "her" && (
            <div className="flex items-center gap-2">
              <span className="h-px w-5 bg-cinnabar-400/70" />
              <span className="font-serif text-[10px] tracking-[0.24em] text-cinnabar-300">
                {story.master.name}
              </span>
            </div>
          )}

          <TypeLine
            key={`${beat.id}-text`}
            text={beat.text}
            narrator={beat.who === "narrator"}
            you={beat.who === "you"}
          />

          {/* 选择 */}
          {beat.choices && (
            <div className="animate-fade flex flex-col gap-2">
              {beat.choices.map((c, ci) => {
                const on = picked === ci;
                return (
                  <button
                    key={c.tag}
                    type="button"
                    onClick={() => {
                      setPicked(ci);
                      setTags((t) => [...t, c.tag]);
                      if (c.cost) setCosts((x) => [...x, c.cost!]);
                    }}
                    className={`press rounded-xl border px-4 py-3 text-left text-[13px] leading-6 backdrop-blur-md transition-colors ${
                      on
                        ? "border-cinnabar-400/70 bg-cinnabar-500/25 text-white"
                        : picked !== null
                          ? "border-white/8 bg-black/30 text-white/30"
                          : "border-white/15 bg-black/40 text-white/90"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}

              {picked !== null && (
                <div className="animate-rise mt-1 flex flex-col gap-2">
                  <p className="font-serif text-[15px] leading-7 text-cinnabar-100">
                    {beat.choices[picked].reply}
                  </p>
                  {beat.choices[picked].cost && (
                    <p className="text-[10.5px] leading-5 text-white/30">
                      {beat.choices[picked].cost}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={advance}
                    className="press mt-1 w-full rounded-full bg-cinnabar-500 py-3.5 text-[14px] font-medium text-white shadow-[0_12px_40px_-10px_rgba(207,74,52,0.95)]"
                  >
                    继续
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 输入 */}
          {beat.input && (
            <InputBlock
              beat={beat}
              birth={birth}
              hour={hour}
              setBirth={setBirth}
              setHour={setHour}
              onNext={advance}
            />
          )}

          {/* 摇卦 */}
          {beat.id === "d4" && (
            <CastBlock
              lines={lines}
              onCast={(l) => setLines((p) => [...p, l])}
              onDone={advance}
            />
          )}

          {/* 普通推进：自动走 + 也永远给一个按钮，避免任何情况下卡住 */}
          {!beat.choices && !beat.input && beat.id !== "d4" && (
            <div className="flex flex-col gap-2">
              {beat.hold ? (
                <AutoAdvance hold={beat.hold} onDone={advance} />
              ) : null}
              <button
                type="button"
                onClick={advance}
                className="press w-full rounded-full border border-white/15 bg-white/[0.07] py-3 text-[13.5px] text-white backdrop-blur-md"
              >
                {beat.who === "her" ? "……" : "继续"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 视频层：预加载 + 无缝切换
 * ------------------------------------------------------------------ */

function VideoLayer({
  beat,
  beatId,
  holdMs,
  paused,
}: {
  beat: Beat;
  beatId: string;
  holdMs?: number;
  paused: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.currentTime = 0;
    const p = el.play();
    if (p) p.catch(() => {});
  }, [beatId]);

  return (
    <div className="absolute inset-0">
      {/* 静态图兜底，视频就绪后淡出 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={beat.art}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
          ready ? "opacity-0" : "opacity-100"
        }`}
      />
      {beat.video && (
        <video
          ref={ref}
          src={beat.video}
          muted
          playsInline
          autoPlay
          loop={paused || Boolean(holdMs)}
          preload="auto"
          onCanPlay={() => setReady(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            ready ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 打字机
 * ------------------------------------------------------------------ */

function TypeLine({ text, narrator, you }: { text: string; narrator: boolean; you: boolean }) {
  const [n, setN] = useState(0);
  const chars = Array.from(text);

  useEffect(() => {
    setN(0);
    let id = 0;
    const tick = () => {
      setN((v) => {
        if (v >= chars.length) return v;
        id = window.setTimeout(tick, 26);
        return v + 1;
      });
    };
    id = window.setTimeout(tick, 60);
    return () => window.clearTimeout(id);
  }, [text, chars.length]);

  const shown = chars.slice(0, n).join("");
  const done = n >= chars.length;

  if (narrator) {
    return (
      <p className="text-[12.5px] leading-7 text-white/55">
        {shown}
        {!done && <span className="animate-pulse text-cinnabar-400">▍</span>}
      </p>
    );
  }

  return (
    <p
      className={`font-serif leading-[1.6] ${
        you ? "text-[17px] text-white/60" : "text-[21px] text-white"
      } drop-shadow-[0_2px_18px_rgba(0,0,0,0.95)]`}
    >
      {shown}
      {!done && <span className="animate-pulse text-cinnabar-400">▍</span>}
    </p>
  );
}

function AutoAdvance({ hold, onDone }: { hold: number; onDone: () => void }) {
  const [p, setP] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    setP(0);
    const started = Date.now();
    const id = window.setInterval(() => {
      const el = Date.now() - started;
      setP(Math.min(1, el / hold));
      if (el >= hold && !doneRef.current) {
        doneRef.current = true;
        window.clearInterval(id);
        onDone();
      }
    }, 50);
    return () => window.clearInterval(id);
  }, [hold, onDone]);

  // 点击任意位置立刻跳过（避开按钮/输入，让它们自己处理点击）
  useEffect(() => {
    const skip = (e: PointerEvent) => {
      if (doneRef.current) return;
      const t = e.target;
      if (t instanceof Element && t.closest("button, input, a, select, textarea, summary")) {
        return;
      }
      doneRef.current = true;
      onDone();
    };
    window.addEventListener("pointerdown", skip);
    return () => window.removeEventListener("pointerdown", skip);
  }, [onDone]);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onDone}
        className="press shrink-0 text-[10px] tracking-widest text-white/40"
      >
        跳过
      </button>
      <div className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-cinnabar-400/70" style={{ width: `${p * 100}%` }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 输入
 * ------------------------------------------------------------------ */

function InputBlock({
  beat,
  birth,
  hour,
  setBirth,
  setHour,
  onNext,
}: {
  beat: Beat;
  birth: string;
  hour: string;
  setBirth: (v: string) => void;
  setHour: (v: string) => void;
  onNext: () => void;
}) {
  const isBirth = beat.input!.field === "birth";
  const val = isBirth ? birth : hour;
  const set = isBirth ? setBirth : setHour;
  const valid = isBirth ? /^\d{4}-\d{2}-\d{2}$/.test(birth) : true;

  return (
    <div className="animate-fade flex flex-col gap-2.5">
      <div className="rounded-2xl border border-white/15 bg-black/50 px-4 py-3.5 backdrop-blur-md">
        <input
          type={isBirth ? "date" : "time"}
          value={val}
          onChange={(e) => set(e.target.value)}
          className="w-full bg-transparent text-center font-serif text-[21px] tabular-nums tracking-wider text-white outline-none [color-scheme:dark]"
        />
      </div>
      <button
        type="button"
        onClick={onNext}
        disabled={!valid}
        className="press w-full rounded-full bg-cinnabar-500 py-3.5 text-[14px] font-medium text-white shadow-[0_12px_40px_-10px_rgba(207,74,52,0.9)] disabled:opacity-30 disabled:shadow-none"
      >
        说完了
      </button>
      {beat.input!.skip && (
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            setHour("");
            onNext();
          }}
          className="press py-2 text-[12px] text-white/45"
        >
          {beat.input!.skip}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 摇卦
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
  const [busy, setBusy] = useState(false);
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
    if (!charging || busy) return;
    setCharging(false);
    setBusy(true);
    window.setTimeout(() => {
      onCast(castLine());
      setCharge(0);
      setBusy(false);
    }, 560);
  };

  const done = lines.length === 6;

  return (
    <div className="animate-fade flex flex-col items-center gap-3.5">
      <div className="flex flex-col-reverse gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => {
          const l = lines[i];
          return (
            <div key={i} className="flex h-[7px] w-[100px] gap-[7px]">
              {l ? (
                l.yang ? (
                  <div className="animate-fade h-full w-full rounded-sm bg-white/85" />
                ) : (
                  <>
                    <div className="animate-fade h-full w-[46px] rounded-sm bg-white/85" />
                    <div className="animate-fade h-full w-[46px] rounded-sm bg-white/85" />
                  </>
                )
              ) : (
                <div className="h-full w-full rounded-sm bg-white/10" />
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[10.5px] text-white/40">
        {done ? "六爻已成" : `第 ${lines.length + 1} / 6 爻 · 按住，松手`}
      </p>

      {!done ? (
        <button
          type="button"
          onPointerDown={() => !busy && setCharging(true)}
          onPointerUp={release}
          onPointerLeave={() => charging && release()}
          aria-label="按住摇卦"
          className="press relative flex h-[70px] w-[70px] items-center justify-center rounded-full border border-white/25 bg-black/45 backdrop-blur-md"
        >
          <span
            className="absolute inset-[3px] rounded-full border-2 border-cinnabar-400/80"
            style={{
              transform: `scale(${0.35 + charge * 0.65})`,
              opacity: charging ? 0.3 + charge * 0.7 : 0,
            }}
          />
          <span className="relative font-serif text-[17px] text-white">{busy ? "" : "掷"}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onDone}
          className="press w-full rounded-full bg-cinnabar-500 py-3.5 text-[14px] font-medium text-white shadow-[0_12px_40px_-10px_rgba(207,74,52,0.9)]"
        >
          继续
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 结局
 * ------------------------------------------------------------------ */

function Ending({ story, data }: { story: StoryScript; data: Collected }) {
  const [reportOpen, setReportOpen] = useState(false);
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

  const ending =
    story.endings.find((e) => e.when.every((w) => data.tags.includes(w))) ??
    story.endings.find((e) => e.when.some((w) => data.tags.includes(w))) ??
    story.endings[0];

  const wxData = result ? WUXING.map((el) => ({ el, v: result.counts[el] })) : [];

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-black">
      <video
        src="/video/07-reveal.mp4"
        muted
        playsInline
        autoPlay
        loop
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.3) 26%, rgba(0,0,0,0.9) 62%, #000 100%)",
        }}
      />

      <div className="relative z-10 flex flex-1 flex-col px-5 pb-8 pt-12">
        <span className="font-serif text-[9.5px] tracking-[0.3em] text-cinnabar-300">
          结局
        </span>

        <h1 className="animate-rise mt-3 font-serif text-[28px] leading-[1.3] text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.95)]">
          {ending?.title}
        </h1>

        <p className="animate-fade mt-4 text-[13px] leading-7 text-white/72">{ending?.body}</p>

        {data.costs.length > 0 && (
          <div className="mt-5 flex flex-col gap-1.5 rounded-xl border border-white/10 bg-black/40 p-3.5 backdrop-blur-md">
            <span className="text-[9px] tracking-[0.2em] text-white/30">你放弃的</span>
            {data.costs.map((c, i) => (
              <p key={i} className="text-[11px] leading-5 text-white/45">
                · {c}
              </p>
            ))}
          </div>
        )}

        {reading && (
          <div className="mt-5 rounded-2xl border border-white/12 bg-black/45 p-4 backdrop-blur-md">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-[16px] text-white/85">
                {TRIGRAM[gua!.upper].symbol}
                {TRIGRAM[gua!.lower].symbol}
              </span>
              <span className="font-serif text-[12px] text-white/65">
                第{gua!.order}卦 · {gua!.name}
              </span>
            </div>
            <p className="mt-2 font-serif text-[14px] leading-7 text-white/88">{reading.verdict}</p>
            <p className="mt-1.5 text-[11.5px] leading-6 text-white/50">{reading.warn}</p>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-3 pt-6">
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="press w-full rounded-full bg-cinnabar-500 py-3.5 text-[14px] font-medium tracking-wide text-white shadow-[0_14px_44px_-10px_rgba(207,74,52,0.95)]"
          >
            看我的盘
          </button>
          <p className="text-center text-[9.5px] text-white/25">仅供娱乐参考</p>
        </div>
      </div>

      {reportOpen && result && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
          <ReportReader
            report={buildReport(
              result.fp,
              result.counts,
              {
                tag: result.persona.tag,
                core: result.persona.core,
                gift: result.persona.gift,
                trap: result.persona.trap,
                doThis: result.persona.doThis,
              },
            )}
            onClose={() => setReportOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
