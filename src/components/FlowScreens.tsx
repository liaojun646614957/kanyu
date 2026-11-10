"use client";

import { useEffect, useRef, useState } from "react";

/** 开场：点一下打开声音，然后是全屏人物、一句钩子、底部胶囊按钮。 */
export function Onboarding({ onEnter }: { onEnter: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [armed, setArmed] = useState(false);

  const arm = () => {
    const el = videoRef.current;
    if (el) {
      el.muted = false;
      const pending = el.play();
      if (pending) pending.catch(() => {});
    }
    setArmed(true);
  };

  return (
    <div data-step="onboarding" className="relative mx-auto min-h-dvh w-full max-w-[440px] overflow-hidden bg-black">
      <video
        ref={videoRef}
        src="/video/09-face.mp4"
        poster="/img/c1-cover.jpg"
        muted
        playsInline
        autoPlay
        loop
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.72) 100%)",
        }}
      />
      {!armed ? (
        <button type="button" onClick={arm} className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
          <span className="font-serif text-[18px] tracking-[0.2em]">点一下</span>
          <span className="text-[13px] tracking-[0.28em] text-white/70">打开声音</span>
        </button>
      ) : (
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-5 pb-8">
          <p className="w-full rounded-full border border-white/20 bg-white/12 px-4 py-3 text-center text-[14px] leading-6 text-white backdrop-blur-md">
            雨夜。巷子尽头有一家没挂牌的铺子，门是虚掩的。
          </p>
          <button
            type="button"
            onClick={onEnter}
            className="press w-full rounded-full border border-white/20 bg-black/70 py-3.5 text-[15px] text-white"
          >
            推门进去
          </button>
        </div>
      )}
    </div>
  );
}

/** 填表：姓名、性别、公历/农历、八位生日、时辰可跳过。农历只记下，还没有换算成公历。 */
export function InputStep({
  name,
  birth,
  hour,
  gender,
  lunar,
  onName,
  onBirth,
  onHour,
  onGender,
  onLunar,
  onDone,
}: {
  name: string;
  birth: string;
  hour: string;
  gender: "female" | "male" | "";
  lunar: boolean;
  onName: (v: string) => void;
  onBirth: (v: string) => void;
  onHour: (v: string) => void;
  onGender: (v: "female" | "male") => void;
  onLunar: (v: boolean) => void;
  onDone: () => void;
}) {
  const digits = birth.replace(/\D/g, "").slice(0, 8);
  const [warn, setWarn] = useState("");

  const submit = (skipHour: boolean) => {
    if (name.trim().length < 1) {
      setWarn("先写下名字");
      return;
    }
    if (!gender) {
      setWarn("先选女或男");
      return;
    }
    if (!/^\d{8}$/.test(digits) || !validYmd(digits)) {
      setWarn("生日要八位数字，例如 19950315");
      return;
    }
    onBirth(`${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`);
    if (skipHour) onHour("");
    onDone();
  };

  return (
    <div data-step="input" className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col gap-4 bg-[#0b0809] px-5 pb-10 pt-16 text-white">
      <p className="font-serif text-[13px] tracking-[0.18em] text-white/45">她要记下你</p>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] text-white/40">姓名</span>
        <input
          value={name}
          maxLength={12}
          onChange={(e) => onName(e.target.value)}
          className="rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-center font-serif text-[20px] outline-none"
        />
      </label>
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] text-white/40">性别</span>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["female", "女"],
              ["male", "男"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => onGender(id)}
              className={`rounded-full border py-3 text-[14px] ${
                gender === id ? "border-cinnabar-400 bg-cinnabar-500/30" : "border-white/15 bg-black/40"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] text-white/40">历法</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onLunar(false)}
            className={`rounded-full border py-3 text-[14px] ${!lunar ? "border-cinnabar-400 bg-cinnabar-500/30" : "border-white/15 bg-black/40"}`}
          >
            公历
          </button>
          <button
            type="button"
            onClick={() => onLunar(true)}
            className={`rounded-full border py-3 text-[14px] ${lunar ? "border-cinnabar-400 bg-cinnabar-500/30" : "border-white/15 bg-black/40"}`}
          >
            农历
          </button>
        </div>
        {lunar && <p className="text-[11px] leading-5 text-white/35">农历先按这八位数字入盘，还没有换成公历。</p>}
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] text-white/40">生日，八位数字</span>
        <input
          inputMode="numeric"
          value={digits}
          maxLength={8}
          placeholder="19950315"
          onChange={(e) => onBirth(e.target.value.replace(/\D/g, "").slice(0, 8))}
          className="rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-center font-serif text-[22px] tracking-[0.2em] outline-none placeholder:text-white/20"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] text-white/40">时辰</span>
        <input
          type="time"
          value={hour}
          onChange={(e) => onHour(e.target.value)}
          className="rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-center font-serif text-[20px] outline-none [color-scheme:dark]"
        />
      </label>
      {warn && <p className="text-center text-[12px] text-cinnabar-300">{warn}</p>}
      <button type="button" onClick={() => submit(false)} className="press mt-2 rounded-full bg-cinnabar-500 py-3.5 text-[15px]">
        交给她
      </button>
      <button type="button" onClick={() => submit(true)} className="py-2 text-[13px] text-white/45">
        时辰不记得了
      </button>
    </div>
  );
}

/** 付费之后的等待。这里没有付款，只留这一屏的位置。 */
export function PaidLoading({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const id = window.setTimeout(onDone, 4200);
    return () => window.clearTimeout(id);
  }, [onDone]);

  return (
    <div data-step="loading:paid" className="relative mx-auto min-h-dvh w-full max-w-[440px] overflow-hidden bg-black">
      <video
        src="/video/07-reveal.mp4"
        poster="/img/c4-gaze.jpg"
        muted
        playsInline
        autoPlay
        loop
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-end px-6 pb-16 text-center">
        <p className="font-serif text-[18px] leading-8 text-white">她在把这一页写完。</p>
        <button type="button" onClick={onDone} className="press mt-6 rounded-full border border-white/20 px-6 py-3 text-[13px] text-white/80">
          看结果
        </button>
      </div>
    </div>
  );
}

function validYmd(digits: string) {
  const y = Number(digits.slice(0, 4));
  const m = Number(digits.slice(4, 6));
  const d = Number(digits.slice(6, 8));
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() + 1 === m && dt.getUTCDate() === d;
}
