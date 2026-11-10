import type { StoryScript } from "@/lib/story";

type Row = { art: string; text: string; who: string; title: string };

/** 选项出现之前的第一屏。全文直接写在 HTML 里，不放 script，避免水合报错。 */
export function openingRows(story: StoryScript): Row[] {
  const out: Row[] = [];
  for (const ch of story.chapters) {
    for (const b of ch.beats) {
      if (b.choices || b.input) return out;
      out.push({ art: b.art, text: b.text, who: b.who, title: ch.title });
    }
  }
  return out;
}

export default function OpeningShell({ story }: { story: StoryScript }) {
  const rows = openingRows(story);
  const first = rows[0];
  if (!first) return null;
  const chapters = story.chapters.length || 1;

  return (
    <div id="opening" className="relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        id="opening-art"
        src={first.art}
        alt=""
        suppressHydrationWarning
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.06) 26%, rgba(0,0,0,0.55) 62%, rgba(0,0,0,0.96) 100%)",
        }}
      />
      <a
        id="opening-back"
        data-back=""
        href="/"
        aria-label="返回"
        className="absolute left-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white"
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
      </a>
      <div className="relative z-10 px-5 pt-14">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: chapters }).map((_, n) => (
            <div key={n} className="flex-1">
              <div className={`h-[2px] rounded-full ${n === 0 ? "bg-cinnabar-400/60" : "bg-white/12"}`} />
            </div>
          ))}
        </div>
        <p id="opening-title" suppressHydrationWarning className="mt-2.5 font-serif text-[9.5px] tracking-[0.22em] text-white/35">{first.title}</p>
      </div>
      <div className="relative z-10 mt-auto px-5 pb-8">
        <p
          id="opening-line"
          suppressHydrationWarning
          className={
            first.who === "narrator"
              ? "text-[12.5px] leading-7 text-white/55"
              : "font-serif text-[21px] leading-[1.6] text-white"
          }
        >{first.text}</p>
        <div className="mt-4 w-full rounded-full border border-white/15 bg-white/[0.07] py-3 text-center text-[13.5px] text-white">继续</div>
      </div>
    </div>
  );
}
