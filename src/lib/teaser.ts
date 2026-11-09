/**
 * Teaser 分镜。
 *
 * 抄 mzpian 的 teaser 结构（27 页连续漫画，第一人称独白）：
 *   - 每页一张图 + 一句台词
 *   - 顶部白字压在黑底上，或底部白色气泡
 *   - 用「我 / 你」对话，有过程：原本→但是→看了→看见
 *
 * 视觉节奏（重要）：每 2-3 页换一次焦点，不让同一张脸重复。
 *   人 → 物 → 人 → 物 → 人
 * 这是 mzpian 那 27 页的做法：脸、手、镜片、香灰、铜钱交替出现。
 */

export type Beat = {
  /** 立绘 */
  art: string;
  /** 台词（第一人称，可用 \n 断行） */
  text: string;
  /** 需要强调的字（渲染成红色） */
  accent?: string;
  /** 文字样式 */
  style: "top" | "bubble" | "center" | "bottom";
  /** 气泡位置 */
  pos?: "left" | "right";
};

const A = {
  /** 人物 */
  face: "/img/c1-cover.jpg",
  gaze: "/img/c4-gaze.jpg",
  turned: "/img/c6-turned.jpg",
  hand: "/img/c5-hand.jpg",
  shush: "/img/te-shush.jpg",
  /** 物件特写 */
  mirror: "/img/te-mirror.jpg",
  thread: "/img/te-thread.jpg",
  smoke: "/img/te-smoke.jpg",
  coins: "/img/te-coins-spin.jpg",
  reading: "/img/c3-reading.jpg",
};

export const TEASER: Beat[] = [
  // ── 1. 开口（人）──
  {
    art: A.face,
    text: "過來。",
    style: "center",
  },
  {
    art: A.face,
    text: "別站在門口。\n進來，把門帶上。",
    style: "bubble",
    pos: "left",
  },

  // ── 2. 身份（物：镜片，暗示她能看穿）──
  {
    art: A.mirror,
    text: "我是朱砂。",
    style: "top",
  },
  {
    art: A.mirror,
    text: "替人看命這件事，我做了很久。\n我用這面鏡子看。",
    style: "bubble",
    pos: "right",
  },
  {
    art: A.gaze,
    text: "大多數人進來的時候，\n都說自己只是好奇。",
    style: "top",
  },
  {
    art: A.turned,
    text: "但沒有一個是真的只是好奇。",
    style: "center",
  },

  // ── 3. 点破（物：姻缘线）──
  {
    art: A.thread,
    text: "你也是。",
    style: "center",
  },
  {
    art: A.thread,
    text: "你心裡有一個人的名字。\n你沒說，但從進門就在想。",
    style: "bubble",
    pos: "left",
    accent: "名字",
  },
  {
    art: A.hand,
    text: "原本不該這樣做的。",
    style: "top",
  },

  // ── 4. 施法（物：烟，她真的在做事）──
  {
    art: A.smoke,
    text: "但我剛才順著你的姻緣線，\n看了一下。",
    style: "top",
    accent: "姻緣線",
  },
  {
    art: A.smoke,
    text: "到很遠很遠。",
    style: "bubble",
    pos: "right",
  },
  {
    art: A.reading,
    text: "在那裡，\n我看見了一件\n連你自己都不知道的事。",
    style: "top",
    accent: "連你自己都不知道",
  },

  // ── 5. 收（物：铜钱，仪式感；最后用噤声收尾）──
  {
    art: A.coins,
    text: "要我說嗎？",
    style: "center",
  },
  {
    art: A.shush,
    text: "先告訴我你生在哪一天。",
    style: "bubble",
    pos: "left",
  },
  {
    art: A.shush,
    text: "剩下的，\n我慢慢講給你聽。",
    style: "bottom",
  },
];
