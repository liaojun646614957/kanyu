"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildFourPillars, elementCount, dayMasterStrength, WUXING } from "@/lib/ganzhi";
import { PERSONA, PERSONA_FALLBACK } from "@/lib/persona";
import { downloadPoster } from "@/lib/poster";

/* ------------------------------------------------------------------ *
 * 五行雷达
 * ------------------------------------------------------------------ */

function Radar({ data }: { data: { el: string; v: number }[] }) {
  const size = 200;
  const c = size / 2;
  const rMax = 70;
  const max = Math.max(...data.map((d) => d.v), 1);
  const pt = (i: number, ratio: number): [number, number] => {
    const ang = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    return [c + Math.cos(ang) * rMax * ratio, c + Math.sin(ang) * rMax * ratio];
  };
  const poly = data.map((d, i) => pt(i, 0.12 + (d.v / max) * 0.88).join(",")).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="五行分布">
      {[0.25, 0.5, 0.75, 1].map((lv) => (
        <polygon
          key={lv}
          points={data.map((_, i) => pt(i, lv).join(",")).join(" ")}
          fill="none"
          stroke="var(--color-ink-700)"
          strokeWidth={1}
        />
      ))}
      {data.map((_, i) => {
        const [x, y] = pt(i, 1);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="var(--color-ink-700)" strokeWidth={1} />;
      })}
      <polygon
        points={poly}
        fill="var(--color-cinnabar-600)"
        fillOpacity={0.22}
        stroke="var(--color-cinnabar-400)"
        strokeWidth={1.5}
      />
      {data.map((d, i) => {
        const [x, y] = pt(i, 0.12 + (d.v / max) * 0.88);
        return <circle key={d.el} cx={x} cy={y} r={2.4} fill="var(--color-cinnabar-300)" />;
      })}
      {data.map((d, i) => {
        const [x, y] = pt(i, 1.2);
        return (
          <text
            key={d.el}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={12}
            fill="var(--color-ink-300)"
          >
            {d.el}
          </text>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * 四柱盘
 * ------------------------------------------------------------------ */

function PillarGrid({
  pillars,
}: {
  pillars: { label: string; text: string | null; sub?: string }[];
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {pillars.map((p) => (
        <div
          key={p.label}
          className="flex flex-col items-center gap-1 rounded-md border border-ink-700 bg-ink-850/60 py-3"
        >
          <span className="text-[10px] tracking-widest text-ink-400">{p.label}</span>
          {p.text ? (
            <span className="font-serif text-2xl leading-none text-ink-100">{p.text}</span>
          ) : (
            <span className="font-serif text-2xl leading-none text-ink-600">—</span>
          )}
          <span className="text-[10px] text-ink-500">{p.sub ?? "\u00A0"}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 主组件
 * ------------------------------------------------------------------ */

export default function PillarCard() {
  const [birth, setBirth] = useState("1995-03-15");
  const [hour, setHour] = useState("");
  const [gender, setGender] = useState<"female" | "male">("female");
  const [stage, setStage] = useState<"form" | "reading" | "done">("form");
  const [revealStep, setRevealStep] = useState(0);
  const [sharing, setSharing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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

  const hourNum = useMemo(() => {
    if (!hour) return undefined;
    const [h, mi] = hour.split(":").map(Number);
    if (Number.isNaN(h) || h < 0 || h > 23) return undefined;
    return { h, mi: Number.isNaN(mi) ? 0 : mi };
  }, [hour]);

  const result = useMemo(() => {
    if (!parsed) return null;
    const fp = buildFourPillars(
      parsed.y,
      parsed.mo,
      parsed.d,
      hourNum?.h,
      hourNum?.mi,
    );
    const counts = elementCount([fp.year, fp.month, fp.day, fp.hour]);
    const strength = dayMasterStrength(fp.day.gan, counts);
    const persona = PERSONA[fp.day.text] ?? PERSONA_FALLBACK;
    return { fp, counts, strength, persona };
  }, [parsed, hourNum]);

  // 分段揭示：先给人设，再给四柱，再给细节
  useEffect(() => {
    if (stage !== "reading") return;
    if (revealStep >= 4) {
      setStage("done");
      return;
    }
    const t = window.setTimeout(() => setRevealStep((s) => s + 1), 420);
    return () => window.clearTimeout(t);
  }, [stage, revealStep]);

  const start = () => {
    if (!parsed) return;
    setRevealStep(0);
    setStage("reading");
  };

  const reset = () => {
    setStage("form");
    setRevealStep(0);
  };

  const wxData = result
    ? WUXING.map((el) => ({ el, v: result.counts[el] }))
    : [];

  const field =
    "w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2.5 text-sm text-ink-100 outline-none transition-colors placeholder:text-ink-500 focus:border-cinnabar-600";

  return (
    <div className="flex flex-col gap-6">
      {/* 表单 */}
      {stage === "form" && (
        <div className="animate-rise flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs tracking-widest text-ink-400">出生日期（公历）</label>
            <input
              type="date"
              value={birth}
              min="1900-01-01"
              max="2100-12-31"
              onChange={(e) => setBirth(e.target.value)}
              className={field}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs tracking-widest text-ink-400">
                出生时辰 <span className="text-ink-600">选填</span>
              </label>
              <input
                type="time"
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                className={field}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs tracking-widest text-ink-400">性别</label>
              <div className="flex gap-2">
                {(["female", "male"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`press flex-1 rounded-md border py-2.5 text-sm ${
                      gender === g
                        ? "border-cinnabar-600 bg-cinnabar-600/12 text-cinnabar-300"
                        : "border-ink-700 bg-ink-900 text-ink-300"
                    }`}
                  >
                    {g === "female" ? "女" : "男"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={start}
            disabled={!parsed}
            className="press mt-1 w-full rounded-md bg-cinnabar-600 py-3 text-sm font-medium tracking-widest text-white disabled:opacity-40"
          >
            只输入生日，先出一张卡
          </button>

          <p className="text-center text-xs leading-relaxed text-ink-500">
            不填时辰也能看。填了会多一个维度。
            <br />
            内容仅供娱乐参考，不构成任何决策建议。
          </p>
        </div>
      )}

      {/* 结果 */}
      {stage !== "form" && result && (
        <div ref={cardRef} className="flex flex-col gap-6">
          {/* 人格 —— 先说结论，术语全部往后放 */}
          <div
            className={`flex flex-col gap-4 transition-opacity duration-500 ${
              revealStep >= 1 ? "opacity-100" : "opacity-0"
            }`}
          >
            <h2 className="font-serif text-[27px] leading-tight tracking-wide text-ink-100">
              {result.persona.tag}
            </h2>

            <p className="text-[15px] leading-7 text-ink-200">{result.persona.core}</p>
          </div>

          {/* 证据 —— 可折叠，默认收起 */}
          <details
            className={`group border-t border-ink-800 pt-4 transition-opacity duration-500 ${
              revealStep >= 2 ? "opacity-100" : "opacity-0"
            }`}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] text-ink-500">
              <span>凭什么这么说？</span>
              <span className="flex items-center gap-1.5">
                <span className="font-serif text-ink-400">{result.fp.day.text}</span>
                <span className="transition-transform group-open:rotate-180">▾</span>
              </span>
            </summary>

            <div className="mt-4 flex flex-col gap-4">
              <p className="text-[11px] leading-relaxed text-ink-500">
                你的生日在干支历里落在「{result.fp.day.text}」这一格。六十天一个循环，
                这一格的人有共同的底色。下面是你这张盘的构成。
              </p>

              <PillarGrid
                pillars={[
                  { label: "年", text: result.fp.year.text },
                  { label: "月", text: result.fp.month.text },
                  { label: "日", text: result.fp.day.text, sub: "你自己" },
                  {
                    label: "时",
                    text: result.fp.hour?.text ?? null,
                    sub: result.fp.hour ? "" : "没填",
                  },
                ]}
              />

              {/* 把「身强/同党」翻译成人话 */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px] text-ink-500">
                  <span>自身能量</span>
                  <span className="tabular-nums">{result.strength.ratio}%</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-ink-800">
                  <div
                    className="h-full rounded-full bg-gold-500 transition-[width] duration-700"
                    style={{ width: `${result.strength.ratio}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
                  {result.strength.label === "身强"
                    ? "你的能量偏足——所以不容易被带跑，但也容易不服软。"
                    : result.strength.label === "身弱"
                      ? "你的能量偏弱——所以容易受影响，但你的感受力也更细。"
                      : "你的能量偏中间——不太极端，能进能退。"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Radar data={wxData} />
                <div className="flex flex-1 flex-col gap-2">
                  {wxData.map((d) => (
                    <div key={d.el} className="flex items-center gap-3">
                      <span className="w-4 font-serif text-sm text-ink-300">{d.el}</span>
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-ink-800">
                        <div
                          className="h-full rounded-full bg-cinnabar-600 transition-[width] duration-700"
                          style={{
                            width: `${Math.min(
                              100,
                              (d.v / Math.max(...wxData.map((x) => x.v), 1)) * 100,
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="w-8 text-right text-[11px] tabular-nums text-ink-400">
                        {d.v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[10.5px] leading-relaxed text-ink-600">
                五行 = 你性格里五种倾向的配比（木：生长/想法，火：表达/热度，土：稳定/承担，
                金：规则/边界，水：感知/流动）。数字越大，这个倾向越明显。
              </p>

              {result.fp.notes.length > 0 && (
                <p className="text-[10.5px] text-ink-600">{result.fp.notes.join(" · ")}</p>
              )}
            </div>
          </details>

          {/* 细节 */}
          <div
            className={`flex flex-col gap-4 border-t border-ink-800 pt-5 transition-opacity duration-500 ${
              revealStep >= 3 ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] tracking-widest text-gold-500">这件事你做得很好</span>
              <p className="text-sm leading-6 text-ink-200">{result.persona.gift}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] tracking-widest text-cinnabar-400">你会栽在这上面</span>
              <p className="text-sm leading-6 text-ink-200">{result.persona.trap}</p>
            </div>
            <div className="rounded-md border border-ink-700 bg-ink-900/70 p-4">
              <span className="text-[11px] tracking-widest text-ink-400">今天就试一下</span>
              <p className="mt-1.5 text-sm leading-6 text-ink-100">{result.persona.doThis}</p>
            </div>
          </div>

          {/* 操作 */}
          <div
            className={`flex gap-3 transition-opacity duration-500 ${
              revealStep >= 4 ? "opacity-100" : "opacity-0"
            }`}
          >
            <button
              type="button"
              onClick={reset}
              className="press flex-1 rounded-md border border-ink-700 py-2.5 text-sm text-ink-200"
            >
              换一个生日
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!result) return;
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
              disabled={sharing}
              className="press flex-1 rounded-md bg-cinnabar-600 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {sharing ? "生成中…" : "分享这张卡"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
