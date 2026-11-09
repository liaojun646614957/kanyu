/**
 * 章节目录图。
 *
 * 抄自 mzpian 的 mzpian_teaser_chapter_n.png（750px 宽）：
 *   - 深红/黑底 + 四角彼岸花
 *   - Chapter N + 手写体章节名
 *   - 三组「大编号 + 主标题 + ♦/♦♦/♦♦♦ 递增子项」
 *
 * ♦ 的数量递增是刻意的视觉暗示：越往后越私密、越具体。
 */

type Props = {
  no: number;
  title: string;
  toc: { heading: string; items: string[] }[];
  /** 顶部插画：用 emoji 或简单 SVG 占位 */
  motif?: "heart" | "spider" | "eye" | "book" | "hand";
};

const MOTIFS: Record<string, React.ReactNode> = {
  heart: (
    <svg viewBox="0 0 100 120" className="h-full w-full">
      <defs>
        <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c0392b" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#4a0d0d" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      {/* 树枝状血管 */}
      {[
        "M50 95 L50 40 M50 55 L32 28 M50 55 L68 28 M50 40 L40 14 M50 40 L62 12",
        "M32 28 L24 12 M68 28 L78 10",
      ].map((d, i) => (
        <path key={i} d={d} stroke="#8b1a1a" strokeWidth="1.6" fill="none" opacity="0.65" />
      ))}
      {/* 心形 */}
      <path
        d="M50 100 C22 78 12 60 12 46 C12 32 22 24 32 24 C40 24 46 29 50 36 C54 29 60 24 68 24 C78 24 88 32 88 46 C88 60 78 78 50 100 Z"
        fill="url(#hg)"
        stroke="#a02c2c"
        strokeWidth="1"
      />
      {/* 内部纹路 */}
      <path d="M50 36 L50 92 M50 60 L38 52 M50 70 L63 61" stroke="#2a0505" strokeWidth="1.2" opacity="0.6" fill="none" />
    </svg>
  ),
  spider: (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <g key={a} transform={`rotate(${a} 50 50)`}>
          <path d="M50 50 Q56 30 40 14" stroke="#a02c2c" strokeWidth="1.6" fill="none" opacity="0.75" />
          <path d="M40 14 Q46 8 52 12" stroke="#a02c2c" strokeWidth="1.2" fill="none" opacity="0.6" />
        </g>
      ))}
      <circle cx="50" cy="50" r="5" fill="#c0392b" opacity="0.85" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 120 80" className="h-full w-full">
      <ellipse cx="60" cy="40" rx="46" ry="26" fill="none" stroke="#a02c2c" strokeWidth="1.6" opacity="0.7" />
      <circle cx="60" cy="40" r="15" fill="#8b1a1a" opacity="0.75" />
      <circle cx="60" cy="40" r="6" fill="#1a0303" />
      <circle cx="65" cy="35" r="2.5" fill="#e8b4b4" opacity="0.8" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <rect x="22" y="18" width="56" height="68" rx="3" fill="#5a0f0f" stroke="#a02c2c" strokeWidth="1.4" />
      <rect x="30" y="30" width="40" height="2" fill="#c0392b" opacity="0.7" />
      <rect x="30" y="42" width="40" height="2" fill="#c0392b" opacity="0.5" />
      <rect x="30" y="54" width="28" height="2" fill="#c0392b" opacity="0.35" />
    </svg>
  ),
  hand: (
    <svg viewBox="0 0 100 110" className="h-full w-full">
      <path
        d="M40 102 L36 58 M50 102 L48 48 M60 102 L60 52 M70 102 L70 60"
        stroke="#a02c2c"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path d="M34 66 Q34 96 50 104 Q66 96 68 66" stroke="#8b1a1a" strokeWidth="1.4" fill="none" opacity="0.6" />
    </svg>
  ),
};

export default function ChapterToc({ no, title, toc, motif = "heart" }: Props) {
  return (
    <section className="relative overflow-hidden bg-[#160a0b] px-7 py-11">
      {/* 底纹 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 8%, rgba(160,44,44,0.28) 0%, rgba(22,10,11,0) 70%)",
        }}
      />

      {/* 四角彼岸花 */}
      {[
        "left-2 top-2",
        "right-2 top-2 -scale-x-100",
        "left-2 bottom-2 -scale-y-100",
        "right-2 bottom-2 -scale-x-100 -scale-y-100",
      ].map((pos) => (
        <div key={pos} className={`pointer-events-none absolute ${pos} h-10 w-10 opacity-45`}>
          <svg viewBox="0 0 100 100" className="h-full w-full">
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <g key={a} transform={`rotate(${a} 50 50)`}>
                <path d="M50 50 Q58 32 42 12" stroke="#8b1a1a" strokeWidth="1.5" fill="none" />
                <path d="M42 12 Q48 6 54 11" stroke="#a02c2c" strokeWidth="1.1" fill="none" />
              </g>
            ))}
          </svg>
        </div>
      ))}

      <div className="relative flex flex-col items-center">
        {/* 顶部插画 */}
        <div className="h-[86px] w-[72px] opacity-90">{MOTIFS[motif]}</div>

        {/* Chapter N */}
        <p className="mt-5 font-serif text-[11px] tracking-[0.42em] text-white/45">
          CHAPTER {String(no).padStart(2, "0")}
        </p>

        {/* 章节名（手写感） */}
        <h3 className="mt-2.5 text-center font-serif text-[23px] font-bold leading-[1.4] tracking-[0.02em] text-[#d94b4b]">
          {title}
        </h3>

        <div className="mt-6 h-px w-14 bg-[#a02c2c]/50" />

        {/* 目录条目 */}
        <div className="mt-8 flex w-full flex-col gap-7">
          {toc.map((g, gi) => (
            <div key={gi} className="flex gap-3.5">
              {/* 大编号 */}
              <span
                className="font-serif text-[34px] leading-none text-[#7a2020]/70"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {gi + 1}
              </span>
              <div className="flex flex-1 flex-col gap-2 pt-0.5">
                <p className="text-[14.5px] font-semibold leading-[1.5] text-[#e8dede]">
                  {g.heading}
                </p>
                {g.items.map((it, ii) => (
                  <p
                    key={ii}
                    className="flex items-start gap-1.5 text-[12px] leading-[1.65] text-[#b9a6a6]"
                  >
                    {/* ♦ 递增：第 ii 项显示 ii+1 个 */}
                    <span className="mt-[3px] shrink-0 text-[8.5px] tracking-[-1px] text-[#a02c2c]">
                      {"♦".repeat(ii + 1)}
                    </span>
                    <span>{it}</span>
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
