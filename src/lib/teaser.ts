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
  // ── 1. 开口（人）：盘已算完，她把结果拿在手上 ──
  {
    art: A.face,
    text: "算完了。",
    style: "center",
  },
  {
    art: A.face,
    text: "別急。\n先坐下，我一樣一樣跟你說。",
    style: "bubble",
    pos: "left",
  },

  // ── 2. 身份（物：镜片，她怎么看见的）──
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
    text: "大多數人拿到結果，\n第一件事是問「準不準」。",
    style: "top",
  },
  {
    art: A.turned,
    text: "但準不準，\n你自己心裡最清楚。",
    style: "center",
  },

  // ── 3. 点破（物：姻缘线）──
  {
    art: A.thread,
    text: "你的盤上，\n有一根很清楚的線。",
    style: "top",
    accent: "很清楚的線",
  },
  {
    art: A.thread,
    text: "它從你的日柱出去，\n一直連到一個人身上。",
    style: "bubble",
    pos: "left",
    accent: "一個人",
  },
  {
    art: A.hand,
    text: "那個人，\n不是你想的那個。",
    style: "top",
    accent: "不是你想的那個",
  },

  // ── 4. 施法（物：烟，她真的看到了什么）──
  {
    art: A.smoke,
    text: "我順著那根線看過去。",
    style: "top",
  },
  {
    art: A.smoke,
    text: "看到了很遠的地方。",
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
    text: "你的盤，我已經看完了。",
    style: "bubble",
    pos: "left",
  },
  {
    art: A.shush,
    text: "接下來這些，\n我不會說得太好聽。",
    style: "bottom",
  },
];
