"use client";

/**
 * 付费说服页。
 *
 * 抄自 mzpian 的 mzpian_teaser_26_v2.png（750×3730 长图）：
 *   - 角色站在画面里，用第一人称跟你说话（两个对话气泡）
 *   - 底部给硬指标：「3 万字的报告」「20 页篇幅」
 *
 * 关键：不是"请付费"，是角色在问你「你确定要走？」。
 */

type Props = {
  /** 大师名 */
  masterName: string;
  /** 用户名字，用于气泡个性化 */
  userName?: string;
  /** 报告体量，用于底部硬指标 */
  chars?: string;
  pages?: number;
  onUnlock: () => void;
  onClose: () => void;
};

export default function PersuasionPage({
  masterName,
  userName,
  chars = "约 2 万字",
  pages = 20,
  onUnlock,
  onClose,
}: Props) {
  const who = userName?.trim() || "你";

  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-hidden bg-[#0b0809]">
      {/* 角色层 */}
      <div className="relative h-[62vh] w-full shrink-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/img/c4-gaze.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-35"
          style={{
            background:
              "radial-gradient(ellipse 34% 22% at 50% 18%, rgba(180,30,30,0.55) 0%, rgba(11,8,9,0) 72%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[52%]"
          style={{
            background:
              "linear-gradient(180deg, rgba(11,8,9,0) 0%, rgba(11,8,9,0.55) 42%, rgba(11,8,9,0.96) 82%, #0b0809 100%)",
          }}
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="关闭"
          className="press absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-[13px] text-white/70 backdrop-blur-md"
        >
          ✕
        </button>

        {/* 气泡 1 */}
        <div className="animate-rise absolute right-4 top-[15%] max-w-[56%]">
          <div className="rounded-2xl border border-white/25 bg-white/80 px-3.5 py-2.5 backdrop-blur-[3px]">
            <p className="font-serif text-[13px] leading-[1.55] text-[#2c0d0d]">
              嗯……这么有趣的东西，
              <br />
              你就打算这么划过去？
            </p>
          </div>
        </div>

        {/* 气泡 2 */}
        <div
          className="animate-rise absolute left-4 top-[52%] max-w-[58%]"
          style={{ animationDelay: "0.45s" }}
        >
          <div className="rounded-2xl border border-white/25 bg-white/80 px-3.5 py-2.5 backdrop-blur-[3px]">
            <p className="font-serif text-[13px] leading-[1.55] text-[#2c0d0d]">
              {who}的下一段感情，
              <br />
              我可以从头到尾，给你看穿。
            </p>
          </div>
        </div>
      </div>

      {/* 文案层 */}
      <div className="relative z-10 -mt-10 flex flex-1 flex-col px-7 pb-9">
        <p className="text-center font-serif text-[20px] font-bold leading-[1.5] text-[#efe6e6]">
          把命运里那个人，
          <br />
          不加修饰地讲给你听
        </p>

        <div className="mt-6 flex items-stretch justify-center gap-3">
          <div className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-[#a02c2c]/30 bg-[#1a0d0e] py-3.5">
            <span className="font-serif text-[19px] font-bold text-[#d94b4b]">{chars}</span>
            <span className="text-[10px] tracking-[0.14em] text-[#9c8484]">报告体量</span>
          </div>
          <div className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-[#a02c2c]/30 bg-[#1a0d0e] py-3.5">
            <span className="font-serif text-[19px] font-bold text-[#d94b4b]">{pages} 页</span>
            <span className="text-[10px] tracking-[0.14em] text-[#9c8484]">阅读篇幅</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          {[
            "不只说好话，也会告诉你哪里会出问题",
            "具体到长相、性格、职业、相遇场合",
            "基于你自己的盘算出来，不是通用模板",
          ].map((t) => (
            <div key={t} className="flex items-start gap-2">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#d94b4b]" />
              <p className="text-[12px] leading-[1.65] text-[#b9a6a6]">{t}</p>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-8">
          <button
            type="button"
            onClick={onUnlock}
            className="press w-full rounded-full bg-[#c0392b] py-4 text-[14.5px] font-medium tracking-wide text-white shadow-[0_14px_40px_-10px_rgba(192,57,43,0.9)]"
          >
            看我的完整报告
          </button>
          <p className="mt-3 text-center text-[9.5px] text-white/25">
            {masterName} · 仅供娱乐参考
          </p>
        </div>
      </div>
    </div>
  );
}
