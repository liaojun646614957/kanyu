"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { buildFourPillars, elementCount, dayMasterStrength, WUXING } from "@/lib/ganzhi";
import { castLine, guaOf, GUA_READING, GUA_READING_FALLBACK, TRIGRAM, type Line } from "@/lib/gua";
import { PERSONA, PERSONA_FALLBACK } from "@/lib/persona";
import { downloadPoster } from "@/lib/poster";
import type { Beat, StoryScript } from "@/lib/story";
import StoryBook from "@/components/StoryBook";
import StoryHero from "@/components/StoryHero";
import Teaser from "@/components/Teaser";
import { buildReport } from "@/lib/report";
import { TEASER } from "@/lib/teaser";

const TEASER_LEN = TEASER.length;

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
  name: string;
  birth: string;
  hour: string;
  tags: string[];
  lines: Line[];
  costs: string[];
};

type Phase = "play" | "loadingFree" | "teaser" | "transition" | "ending";

type Loc = { phase: Phase; i: number; teaser: number };

type Answer = { tag: string; cost?: string };

function readHistoryLoc(storyId: string): Loc | null {
  if (typeof window === "undefined") return null;
  const st = history.state as { kanyu?: string; id?: string; loc?: Loc } | null;
  if (st?.kanyu === "story" && st.id === storyId && st.loc) return st.loc;
  return null;
}

export default function StoryPlayer({
  story,
  initialIndex = 0,
}: {
  story: StoryScript;
  initialIndex?: number;
}) {
  // 把 chapters 摊平成线性 beats，并记住每个 beat 属于哪一章
  const flat = useMemo(() => {
    const out: { beat: Beat; chapterTitle: string; chapterIndex: number }[] = [];
    story.chapters.forEach((ch, ci) => {
      ch.beats.forEach((b) => out.push({ beat: b, chapterTitle: ch.title, chapterIndex: ci }));
    });
    return out;
  }, [story]);

  const [boot] = useState<Loc | null>(() => readHistoryLoc(story.id));
  const startAt = boot?.i ?? initialIndex;
  const [phase, setPhase] = useState<Phase>(boot?.phase ?? "play");
  const [i, setI] = useState(startAt);
  const [teaserI, setTeaserI] = useState(boot?.teaser ?? 0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("1995-03-15");
  const [hour, setHour] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  // 第一句已经全文在屏幕上，点「继续」就是下一拍，不要再空点一次。
  const [lineReady, setLineReady] = useState(true);
  const [forceFull, setForceFull] = useState(true);

  const locRef = useRef<Loc>({
    phase: boot?.phase ?? "play",
    i: startAt,
    teaser: boot?.teaser ?? 0,
  });

  const tags = useMemo(
    () => flat.flatMap((f) => (answers[f.beat.id] ? [answers[f.beat.id].tag] : [])),
    [flat, answers],
  );
  const costs = useMemo(
    () => flat.flatMap((f) => (answers[f.beat.id]?.cost ? [answers[f.beat.id].cost as string] : [])),
    [flat, answers],
  );

  const apply = useCallback((loc: Loc) => {
    locRef.current = loc;
    setPhase(loc.phase);
    setI(loc.i);
    setTeaserI(loc.teaser);
    setLineReady(false);
  }, []);

  const lastGo = useRef(0);
  const go = useCallback(
    (loc: Loc) => {
      // 同一次手指会先 pointerup 再 click，两下都进到这里。只挡这一下，不挡连点。
      const now = performance.now();
      if (now - lastGo.current < 32) return;
      lastGo.current = now;
      history.pushState({ kanyu: "story", id: story.id, loc }, "");
      apply(loc);
    },
    [apply, story.id],
  );

  // 浏览器后退：弹出的是上一条 loc，页内返回按钮也走 history.back()
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const st = e.state as { kanyu?: string; id?: string; loc?: Loc } | null;
      if (st?.kanyu === "story" && st.id === story.id && st.loc) apply(st.loc);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [apply, story.id]);

  // 小脚本里点过的拍子没有历史记录。补上，返回才能一拍一拍退，而不是直接跳出剧本。
  useEffect(() => {
    if (startAt <= 0) return;
    const st = history.state as { kanyu?: string; id?: string; loc?: Loc } | null;
    if (st?.kanyu === "story" && st.id === story.id && st.loc?.i === startAt) return;
    const base = { kanyu: "story", id: story.id };
    history.replaceState({ ...base, loc: { phase: "play", i: 0, teaser: 0 } }, "");
    for (let n = 1; n <= startAt; n++) {
      history.pushState({ ...base, loc: { phase: "play", i: n, teaser: 0 } }, "");
    }
  }, [story.id, startAt]);

  const advance = useCallback(() => {
    if (locRef.current.phase !== "play") return;
    const curI = locRef.current.i;
    if (curI < flat.length - 1) go({ phase: "play", i: curI + 1, teaser: 0 });
    else go({ phase: "loadingFree", i: curI, teaser: 0 });
  }, [flat.length, go]);

  const onAuto = useCallback(() => {
    setForceFull(false);
    advance();
  }, [advance]);

  const onStage = useCallback(() => {
    // 还在逐字出现时，第一下先把这句补全。句子已经完整就直接下一拍。
    if (!lineReady && !forceFull) {
      setForceFull(true);
      setLineReady(true);
      return;
    }
    // 下一句直接给全文。apply 里会把 lineReady 清掉，这里再写回 true，同一次事件里以后者为准。
    setForceFull(true);
    advance();
    setLineReady(true);
  }, [advance, lineReady, forceFull]);

  const settleToTeaser = useCallback(() => {
    go({ phase: "teaser", i: locRef.current.i, teaser: 0 });
  }, [go]);

  const cur = flat[i];
  const beat = cur?.beat;
  const picked =
    beat?.choices?.findIndex((c) => c.tag === answers[beat.id]?.tag) ?? -1;
  const pickedIdx = picked >= 0 ? picked : null;

  // 真实顺序（sajutight 的 ec 数组）：
  //   onboarding → input → loading:free → teaser → payment → loading:paid → result
  //
  // 对应到我们：
  //   play（剧本+摇卦）→ loadingFree（带名字气泡的视频）→ teaser（15 页图文）
  //   → loadingPaid（等待/付费）→ result（长图文报告）
  if (phase === "loadingFree") {
    return (
      <>
        <BackBar />
        <StoryHero
          name={name}
          video="/video/07-reveal.mp4"
          poster="/img/c4-gaze.jpg"
          loadingOnly
          onSettled={settleToTeaser}
        />
      </>
    );
  }

  if (phase === "teaser") {
    return (
      <>
        <BackBar />
        <Teaser
          index={teaserI}
          onNext={() => {
            if (teaserI < TEASER_LEN - 1) go({ phase: "teaser", i, teaser: teaserI + 1 });
            else go({ phase: "transition", i, teaser: teaserI });
          }}
        />
      </>
    );
  }

  if (phase === "transition") {
    return (
      <>
        <BackBar />
        <div className="mx-auto w-full max-w-[440px] bg-[#0b0809]">
          <Ending story={story} data={{ name, birth, hour, tags, lines, costs }} inline />
        </div>
      </>
    );
  }

  if (phase === "ending") {
    return (
      <>
        <BackBar />
        <Ending story={story} data={{ name, birth, hour, tags, lines, costs }} />
      </>
    );
  }

  if (!beat) return null;

  const canTapThrough = !beat.choices && !beat.input && beat.id !== "d4";
  const dwell = readPause(beat.who, cur?.chapterIndex ?? 0);

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-black">
      <BackBar />
      <VideoLayer beat={beat} beatId={beat.id} holdMs={beat.hold} paused={Boolean(beat.choices)} />

      {canTapThrough && (
        <div
          className="absolute inset-0 z-30"
          style={{ transform: "translateZ(0)" }}
          onPointerDown={(e) => {
            if (e.button > 0) return;
            onStage();
          }}
        />
      )}

      {/* 压暗层 */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.06) 26%, rgba(0,0,0,0.55) 62%, rgba(0,0,0,0.96) 100%)",
        }}
      />

      {/* 这一拍的进度：从左往右填满，换拍就重来 */}
      {canTapThrough && beat.hold ? (
        <div className="pointer-events-none absolute left-16 right-4 top-[22px] z-[90] h-1 overflow-hidden rounded-full bg-white/35">
          <div
            key={beat.id}
            className="beat-fill h-full w-full bg-cinnabar-400"
            style={{ animationDuration: `${dwell}ms` }}
          />
        </div>
      ) : null}

      <div className="relative z-20 px-5 pt-14">
        <p className="font-serif text-[9.5px] tracking-[0.22em] text-white/35">
          {cur?.chapterTitle}
        </p>
      </div>

      {/* 台词。可点穿的拍子上，字本身不接点击，点在句子上等于点在画面上 */}
      <div className={`relative z-50 mt-auto px-5 pb-8 ${canTapThrough ? "pointer-events-none" : ""}`}>
        <div key={beat.id} className="animate-fade flex flex-col gap-4">
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
            lead={cur?.chapterIndex === 0 ? 160 : 70}
            forceFull={forceFull}
            onTyped={() => setLineReady(true)}
          />

          {/* 选择 */}
          {beat.choices && (
            <div className="animate-fade flex flex-col gap-2">
              {beat.choices.map((c, ci) => {
                const on = pickedIdx === ci;
                return (
                  <TapButton
                    key={c.tag}
                    onTap={() => {
                      setAnswers((a) => ({ ...a, [beat.id]: { tag: c.tag, cost: c.cost } }));
                    }}
                    className={`press rounded-xl border px-4 py-3 text-left text-[13px] leading-6 backdrop-blur-md transition-colors ${
                      on
                        ? "border-cinnabar-400/70 bg-cinnabar-500/25 text-white"
                        : pickedIdx !== null
                          ? "border-white/8 bg-black/30 text-white/30"
                          : "border-white/15 bg-black/40 text-white/90"
                    }`}
                  >
                    {c.label}
                  </TapButton>
                );
              })}

              {pickedIdx !== null && (
                <div className="animate-rise mt-1 flex flex-col gap-2">
                  <p className="font-serif text-[15px] leading-7 text-cinnabar-100">
                    {beat.choices[pickedIdx].reply}
                  </p>
                  {beat.choices[pickedIdx].cost && (
                    <p className="text-[10.5px] leading-5 text-white/30">
                      {beat.choices[pickedIdx].cost}
                    </p>
                  )}
                  <TapButton
                    onTap={advance}
                    className="press mt-1 w-full rounded-full bg-cinnabar-500 py-3.5 text-[14px] font-medium text-white shadow-[0_12px_40px_-10px_rgba(207,74,52,0.95)]"
                  >
                    继续
                  </TapButton>
                </div>
              )}
            </div>
          )}

          {/* 输入 */}
          {beat.input && (
            <InputBlock
              beat={beat}
              name={name}
              birth={birth}
              hour={hour}
              setName={setName}
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
            <div className="pointer-events-auto flex flex-col gap-2">
              {beat.hold && lineReady ? (
                <AutoAdvance key={beat.id} hold={dwell} onDone={onAuto} />
              ) : null}
              <TapButton
                onTap={onStage}
                className="press w-full rounded-full border border-white/15 bg-white/[0.07] py-3 text-[13.5px] text-white backdrop-blur-md"
              >
                {beat.who === "her" ? "……" : "继续"}
              </TapButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** 打完字之后再留的阅读时间。开场旁白特意放慢。 */
function readPause(who: Beat["who"], chapterIndex: number) {
  const opening = chapterIndex === 0;
  if (who === "narrator") return opening ? 1800 : 1250;
  return opening ? 1500 : 1050;
}

/**
 * 用 pointerup 而不是 click。
 * 手指按下后挪了几像素，浏览器会取消 click；这里抓住指针，挪动不超过 48px 仍算一次点按。
 * 同一次手势随后到来的 click 在 50ms 内被丢掉，避免走两次。
 */
function useTap(run: () => void) {
  const last = useRef(0);
  const runRef = useRef(run);
  runRef.current = run;
  return {
    onClick: (e: MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      const now = performance.now();
      if (now - last.current < 40) return;
      last.current = now;
      runRef.current();
    },
  };
}

function TapButton({
  onTap,
  className,
  children,
  label,
  hidden,
}: {
  onTap: () => void;
  className?: string;
  children?: React.ReactNode;
  label?: string;
  hidden?: boolean;
}) {
  const tap = useTap(onTap);
  return (
    <button
      type="button"
      aria-label={label}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      className={className}
      {...tap}
    >
      {children}
    </button>
  );
}

function BackBar() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const tap = useTap(() => history.back());
  if (!mounted) return null;
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex justify-center">
      <div className="relative h-0 w-full max-w-[440px]">
        <button
          type="button"
          aria-label="返回"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            tap.onClick(e);
          }}
          className="press pointer-events-auto absolute left-3 top-3 z-[80] flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 5 8 12l7 7"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>,
    document.body,
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
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div key={beatId} className="scene-drift absolute inset-0">
        {/* 静态图兜底，视频就绪后淡出。外层一直在缓慢推近，视频没起来画面也会动。 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beat.art}
          alt=""
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
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
            disablePictureInPicture
            controls={false}
            onCanPlay={() => setReady(true)}
            className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              ready ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 打字机
 * ------------------------------------------------------------------ */

function TypeLine({
  text,
  narrator,
  you,
  lead,
  forceFull,
  onTyped,
}: {
  text: string;
  narrator: boolean;
  you: boolean;
  lead: number;
  forceFull: boolean;
  onTyped: () => void;
}) {
  const [n, setN] = useState(0);
  const chars = Array.from(text);
  const len = chars.length;
  const onTypedRef = useRef(onTyped);
  onTypedRef.current = onTyped;
  const delay = narrator ? 40 : 32;

  // 用 effect 推进，而不是在 setState 里预约下一次。
  // 开发模式会把 setState 回调跑两遍，副作用写在里面会让打字变成双倍速。
  useEffect(() => {
    if (forceFull || n >= len) return;
    const id = window.setTimeout(() => setN(n + 1), n === 0 ? lead : delay);
    return () => window.clearTimeout(id);
  }, [n, len, lead, delay, forceFull]);

  useEffect(() => {
    if (forceFull || (len > 0 && n >= len)) onTypedRef.current();
  }, [forceFull, n, len]);

  const shown = forceFull ? text : chars.slice(0, n).join("");
  const done = forceFull || n >= chars.length;

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

  return (
    <div className="flex items-center gap-2">
      <TapButton onTap={onDone} className="press shrink-0 text-[10px] tracking-widest text-white/40">
        跳过
      </TapButton>
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
  name,
  birth,
  hour,
  setName,
  setBirth,
  setHour,
  onNext,
}: {
  beat: Beat;
  name: string;
  birth: string;
  hour: string;
  setName: (v: string) => void;
  setBirth: (v: string) => void;
  setHour: (v: string) => void;
  onNext: () => void;
}) {
  const field = beat.input!.field;
  const isName = field === "name";
  const isBirth = field === "birth";
  const val = isName ? name : isBirth ? birth : hour;
  const set = isName ? setName : isBirth ? setBirth : setHour;
  const [warn, setWarn] = useState(false);
  const valid = isName
    ? name.trim().length >= 1
    : isBirth
      ? /^\d{4}-\d{2}-\d{2}$/.test(birth)
      : true;

  const inputType = isName ? "text" : isBirth ? "date" : "time";

  return (
    <div className="animate-fade flex flex-col gap-2.5">
      <div className="rounded-2xl border border-white/15 bg-black/50 px-4 py-3.5 backdrop-blur-md">
        <input
          type={inputType}
          value={val}
          maxLength={isName ? 12 : undefined}
          placeholder={isName ? "写下来，她记得住" : undefined}
          onChange={(e) => set(e.target.value)}
          className={`w-full bg-transparent text-center font-serif text-white outline-none placeholder:text-white/25 [color-scheme:dark] ${
            isName ? "text-[22px] tracking-[0.1em]" : "text-[21px] tabular-nums tracking-wider"
          }`}
        />
      </div>
      <TapButton
        onTap={() => {
          if (!valid) {
            setWarn(true);
            return;
          }
          onNext();
        }}
        className={`press w-full rounded-full py-3.5 text-[14px] font-medium text-white ${
          valid
            ? "bg-cinnabar-500 shadow-[0_12px_40px_-10px_rgba(207,74,52,0.9)]"
            : "bg-cinnabar-500/45"
        }`}
      >
        说完了
      </TapButton>
      {warn && !valid && (
        <p className="text-center text-[11px] text-cinnabar-300">
          {isName ? "先把名字写下，她才记得住" : "先选一个出生日期"}
        </p>
      )}
      {beat.input!.skip && (
        <TapButton
          onTap={() => {
            setHour("");
            onNext();
          }}
          className="press py-2 text-[12px] text-white/45"
        >
          {beat.input!.skip}
        </TapButton>
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

function Ending({
  story,
  data,
  inline,
}: {
  story: StoryScript;
  data: Collected;
  inline?: boolean;
}) {
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
    <div className="relative mx-auto w-full max-w-[440px] bg-black">
      {/* 首屏：视频 + 结局文案，占满一屏 */}
      <section className={`relative flex w-full flex-col overflow-hidden ${inline ? "min-h-[70dvh]" : "h-[100dvh]"}`}>
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
              "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.28) 26%, rgba(0,0,0,0.88) 62%, #0b0809 100%)",
          }}
        />

        <div className="relative z-10 flex flex-1 flex-col px-5 pb-7 pt-12">
          <span className="font-serif text-[9.5px] tracking-[0.3em] text-cinnabar-300">
            结局
          </span>

          <h1 className="animate-rise mt-3 font-serif text-[28px] leading-[1.3] text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.95)]">
            {ending?.title}
          </h1>

          <p className="animate-fade mt-4 text-[13px] leading-7 text-white/72">
            {data.name.trim() ? `${data.name.trim()}，` : ""}
            {ending?.body}
          </p>

          {data.costs.length > 0 && (
            <div className="mt-4 flex flex-col gap-1.5 rounded-xl border border-white/10 bg-black/40 p-3.5 backdrop-blur-md">
              <span className="text-[9px] tracking-[0.2em] text-white/30">你放弃的</span>
              {data.costs.map((c, i) => (
                <p key={i} className="text-[11px] leading-5 text-white/45">
                  · {c}
                </p>
              ))}
            </div>
          )}

          {reading && (
            <div className="mt-4 rounded-2xl border border-white/12 bg-black/45 p-4 backdrop-blur-md">
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-[16px] text-white/85">
                  {TRIGRAM[gua!.upper].symbol}
                  {TRIGRAM[gua!.lower].symbol}
                </span>
                <span className="font-serif text-[12px] text-white/65">
                  第{gua!.order}卦 · {gua!.name}
                </span>
              </div>
              <p className="mt-2 font-serif text-[14px] leading-7 text-white/88">
                {reading.verdict}
              </p>
            </div>
          )}

          {!inline && (
            <div className="mt-auto flex flex-col items-center gap-1.5 pt-6">
              <span className="animate-bounce text-[10.5px] tracking-[0.24em] text-white/45">
                往下看你的盘
              </span>
              <span className="animate-bounce text-[15px] text-white/35">↓</span>
            </div>
          )}
        </div>
      </section>

      {/* 紧接着就是图文报告——不需要点击，滚动就是下一页 */}
      {result && (
        <StoryBook
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
            data.name.trim() || undefined,
            data.tags.includes("male") ? "male" : "female",
          )}
        />
      )}
    </div>
  );
}
