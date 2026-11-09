/**
 * Teaser 分镜。
 *
 * 抄 mzpian 的 teaser 结构（27 页连续漫画，第一人称独白）：
 *   - 每页一张图 + 一句台词
 *   - 顶部白字压在黑底上，或底部白色气泡
 *   - 用「我 / 你」对话，有过程：原本→但是→看了→看见
 *   - 每 3-4 页换一次视觉焦点（脸 → 手 → 镜片 → 背影）
 *
 * 我们做 12 页，短但完整：开口 → 引你进来 → 给悬念 → 揭一半 → 收。
 */

export type Beat = {
  /** 立绘 */
  art: string;
  /** 台词（第一人称，可用 \n 断行） */
  text: string;
  /** 需要强调的字（会渲染成红色） */
  accent?: string;
  /** 文字样式 */
  style: "top" | "bubble" | "center" | "bottom";
  /** 气泡位置 */
  pos?: "left" | "right";
  /** 是否整页只有字（分隔/停顿页） */
  quiet?: boolean;
};

const A = {
  face: "/img/c1-cover.jpg",
  hand: "/img/c5-hand.jpg",
  gaze: "/img/c4-gaze.jpg",
  coins: "/img/c2-coins.jpg",
  reading: "/img/c3-reading.jpg",
  turned: "/img/c6-turned.jpg",
};

export const TEASER: Beat[] = [
  // 1. 开口：她注意到你
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

  // 2. 自我介绍 + 建立权威
  {
    art: A.gaze,
    text: "我是朱砂。",
    style: "top",
  },
  {
    art: A.gaze,
    text: "替人看命这件事，我做了很久。\n大多數人進來的時候，\n都說自己只是好奇。",
    style: "bubble",
    pos: "right",
  },
  {
    art: A.turned,
    text: "但沒有一個是真的只是好奇。",
    style: "top",
  },

  // 3. 转折：点破你来意
  {
    art: A.hand,
    text: "你也是。",
    style: "center",
  },
  {
    art: A.hand,
    text: "你心裡有一個人的名字。\n你沒說，但你從進門就在想。",
    style: "bubble",
    pos: "left",
    accent: "名字",
  },

  // 4. 悬念：她看见了什么
  {
    art: A.reading,
    text: "原本不該這樣做的。",
    style: "top",
  },
  {
    art: A.reading,
    text: "但我剛才順著你的姻緣線，\n看了一下。\n到很遠很遠。",
    style: "bubble",
    pos: "right",
    accent: "姻緣線",
  },
  {
    art: A.turned,
    text: "在那裡，\n我看見了一件\n連你自己都不知道的事。",
    style: "top",
    accent: "連你自己都不知道",
  },

  // 5. 钩子：只给一半
  {
    art: A.coins,
    text: "要我說嗎？",
    style: "center",
  },
  {
    art: A.gaze,
    text: "先告訴我你生在哪一天。\n剩下的，\n我慢慢講給你聽。",
    style: "bubble",
    pos: "left",
  },
];
