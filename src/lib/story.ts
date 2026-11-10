/**
 * 剧本杀式叙事设计。
 *
 * 上一版失败的原因（记录在此，避免重犯）：
 *   - 没有「身份」：用户只是「一个来算命的人」，没有角色可代入
 *   - 没有「悬念」：一上来就知道结局是「看我的盘」
 *   - 选择没有「代价」：选什么都一样，只是换个开场句
 *   - 图是背景板，不是叙事载体：换图只是换壁纸
 *
 * 剧本杀有效的原因（要搬过来的四件事）：
 *   1. 你有一个身份，而且这个身份有秘密
 *   2. 有一个具体的悬案/疑问，不是抽象的「运势」
 *   3. 你在收集证据（物件、证词、时辰），每拿到一个就更接近真相
 *   4. 你在做选择，而且选择会排除掉别的可能 —— 有代价
 *
 * 本剧本：《她的第七个客人》
 *
 * 结构（5 幕 + 3 次抉择）：
 *   幕一 卷入：她认得你，但你从没见过她 —— 悬念建立
 *   幕二 你的身份：选择「你为什么来」→ 决定你在这件事里的位置
 *   幕三 证据：给出三个物件，选一个查看 → 只看得到一个，有代价
 *   幕四 对质：她逼你承认一件事 → 决定结局走向
 *   幕五 揭晓：她的真实身份，与你的关系
 */

/* ------------------------------------------------------------------ *
 * 类型
 * ------------------------------------------------------------------ */

export type Beat = {
  id: string;
  /** 视频文件；没有则回退静态图 */
  video?: string;
  /** 静态图兜底（视频未加载时） */
  art: string;
  /** 说话人：她 / 旁白 */
  who: "her" | "narrator" | "you";
  /** 台词。旁白用小字，台词用大字 */
  text: string;
  /** 这一拍停多久（毫秒），到时间自动进下一拍；有 choices 则不自动进 */
  hold?: number;
  /** 若有选项，等用户选 */
  choices?: Choice[];
  /** 需要用户输入 */
  input?: {
    field: "birth" | "hour" | "gender" | "name";
    label: string;
    skip?: string;
  };
  /** 这一拍属于填表屏，不放进沉浸故事里 */
  form?: boolean;
};

export type Choice = {
  label: string;
  /** 选中后追加的标记，用于后续分支与报告侧重 */
  tag: string;
  /** 选完后她立刻回一句 */
  reply: string;
  /** 这个选择排除掉了什么（让选择有代价） */
  cost?: string;
};

export type Chapter = {
  id: string;
  title: string;
  beats: Beat[];
};

export type StoryScript = {
  id: string;
  category: string;
  title: string;
  logline: string;
  master: { name: string; title: string; voice: string };
  chapters: Chapter[];
  /** 结局：按 tag 组合匹配 */
  endings: {
    when: string[];
    title: string;
    body: string;
  }[];
};

/* ------------------------------------------------------------------ *
 * 素材清单（生成后替换）
 * ------------------------------------------------------------------ */

const V = {
  arrive: "/video/01-arrive.mp4",
  bell: "/video/02-bell.mp4",
  handOpen: "/video/03-hand-open.mp4",
  threeObjects: "/video/04-three-objects.mp4",
  candles: "/video/05-candles.mp4",
  closeEyes: "/video/06-close-eyes.mp4",
  reveal: "/video/07-reveal.mp4",
  fade: "/video/08-fade.mp4",
  face: "/video/09-face.mp4",
  gaze: "/video/10-gaze-slow.mp4",
  reading: "/video/11-reading.mp4",
};

const A = {
  arrive: "/img/c1-cover.jpg",
  hand: "/img/c5-hand.jpg",
  objects: "/img/c2-coins.jpg",
  reading: "/img/c3-reading.jpg",
  gaze: "/img/c4-gaze.jpg",
  turned: "/img/c6-turned.jpg",
  coins: "/img/c2-coins.jpg",
};

/* ------------------------------------------------------------------ *
 * 《她的第七个客人》
 * ------------------------------------------------------------------ */

export const STORY_SEVEN: StoryScript = {
  id: "seven",
  category: "恋爱",
  title: "她的第七个客人",
  logline: "你推门进去，她说：你终于来了。—— 可你从没见过她。",
  master: {
    name: "朱砂",
    title: "彼岸的女巫",
    voice: "不解释，只陈述。她知道一些你不知道的事，而且不打算一次说完。",
  },
  chapters: [
    {
      id: "ch1",
      title: "第一幕 · 她认得你",
      beats: [
        {
          id: "b1",
          video: V.arrive,
          art: A.arrive,
          who: "narrator",
          text: "雨夜。巷子尽头有一家没挂牌的铺子，门是虚掩的。",
          hold: 1430,
        },
        {
          id: "b2",
          video: V.bell,
          art: A.arrive,
          who: "narrator",
          text: "你推门。檐下的铜铃响了一声。",
          hold: 1400,
        },
        {
          id: "b3",
          art: A.arrive,
          video: V.arrive,
          who: "her",
          text: "「你终于来了。」",
          hold: 1400,
        },
        {
          id: "b4",
          art: A.gaze,
          video: V.gaze,
          who: "you",
          text: "……我们见过？",
          hold: 1400,
        },
        {
          id: "b5",
          art: A.gaze,
          video: V.gaze,
          who: "her",
          text: "「没有。但你的名字，我写了七遍。」",
          hold: 1540,
        },
        {
          id: "b6",
          art: A.turned,
          video: V.closeEyes,
          who: "narrator",
          text: "她转身，从柜子里取出一本很旧的名册。翻开，停在一页。",
          hold: 1430,
        },
        {
          id: "b7",
          art: A.reading,
          video: V.reading,
          who: "her",
          text: "「前六个，都没能坐到天亮。」",
          hold: 1430,
        },
        {
          id: "b8",
          art: A.gaze,
          video: V.gaze,
          who: "her",
          text: "「你要留下吗？」",
          choices: [
            {
              label: "留下。我想知道为什么是我",
              tag: "stay",
              reply: "「好。」她合上册子，「那就从头说起。」",
            },
            {
              label: "我要走",
              tag: "leave",
              reply: "「门在你身后。」她没抬头，「但你已经进来了。」",
              cost: "你选了走，但故事不会因此停下。",
            },
          ],
        },
      ],
    },
    {
      id: "ch2",
      title: "第二幕 · 你的身份",
      beats: [
        {
          id: "c1",
          art: A.gaze,
          video: V.gaze,
          who: "her",
          text: "「坐。把手放在桌上。」",
          hold: 1400,
        },
        {
          id: "c2",
          video: V.handOpen,
          art: A.hand,
          who: "narrator",
          text: "她伸出自己的手，掌心朝上。你在她的掌纹里看到了一个很熟悉的形状。",
          hold: 1650,
        },
        {
          id: "c3",
          art: A.gaze,
          video: V.gaze,
          who: "her",
          text: "「你今天来，不是为了算命。」",
          hold: 1400,
        },
        {
          id: "c4",
          art: A.gaze,
          video: V.gaze,
          who: "her",
          text: "「你是来确认一件事的。」",
          choices: [
            {
              label: "确认他还在不在乎我",
              tag: "love",
              reply: "「在乎。」她答得太快了，「快到你不会信。」",
            },
            {
              label: "确认我还能不能重新开始",
              tag: "restart",
              reply: "「可以。」她看着你，「但不是和他。」",
              cost: "你问了重新开始，答案里就没有「他」。",
            },
          ],
        },
        {
          id: "c5",
          art: A.reading,
          video: V.reading,
          who: "her",
          text: "「要往下走，我得先知道你叫什么。」",
          input: { field: "name", label: "你的名字" },
          form: true,
        },
        {
          id: "c5b",
          art: A.gaze,
          video: V.gaze,
          who: "her",
          text: "「还有，你是男是女。」",
          form: true,
          choices: [
            { label: "女", tag: "female", reply: "「嗯。」她点了点头。" },
            { label: "男", tag: "male", reply: "「嗯。」她点了点头。" },
          ],
        },
        {
          id: "c6",
          art: A.reading,
          video: V.reading,
          who: "her",
          text: "「生辰。」",
          input: { field: "birth", label: "出生日期（公历）" },
          form: true,
        },
        {
          id: "c7",
          art: A.reading,
          video: V.reading,
          who: "her",
          text: "「几点？不记得也行——只是会少看一层。」",
          input: { field: "hour", label: "出生时间", skip: "不记得了" },
          form: true,
        },
      ],
    },
    {
      id: "ch3",
      title: "第三幕 · 三件东西",
      beats: [
        {
          id: "d1",
          video: V.threeObjects,
          art: A.objects,
          who: "narrator",
          text: "她推来三样东西。只看一件——看多了，人就乱了。",
          hold: 1540,
        },
        {
          id: "d2",
          art: A.objects,
          video: V.threeObjects,
          who: "her",
          text: "「选一件。」",
          choices: [
            {
              label: "一枚被摸得很旧的铜钱",
              tag: "coin",
              reply: "「这枚跟了六个人。」她把它推到你手边，「现在归你。」",
              cost: "你选了铜钱，就看不到另外两件。",
            },
            {
              label: "一张缺了角的照片",
              tag: "photo",
              reply: "「缺的那一角，是你。」她没有解释。",
              cost: "你选了照片，就看不到另外两件。",
            },
            {
              label: "一小撮烧过的灰",
              tag: "ash",
              reply: "「这是第三个客人留下的。」她的声音低下去。",
              cost: "你选了灰，就看不到另外两件。",
            },
          ],
        },
        {
          id: "d3",
          art: A.coins,
          video: V.threeObjects,
          who: "her",
          text: "「现在，把你想问的那件事，摇出来。」",
          hold: 1400,
        },
        {
          id: "d4",
          art: A.coins,
          video: V.threeObjects,
          who: "narrator",
          text: "三枚铜钱落在桌上。六次。",
        },
      ],
    },
    {
      id: "ch4",
      title: "第四幕 · 对质",
      beats: [
        {
          id: "e1",
          video: V.candles,
          art: A.gaze,
          who: "narrator",
          text: "烛火晃了一下。她第一次正眼看你。",
          hold: 1430,
        },
        {
          id: "e2",
          art: A.gaze,
          video: V.gaze,
          who: "her",
          text: "「我问你一句，你要说实话。」",
          hold: 1400,
        },
        {
          id: "e3",
          art: A.gaze,
          video: V.gaze,
          who: "her",
          text: "「你是不是，早就知道答案了？」",
          choices: [
            {
              label: "是。我只是不敢承认",
              tag: "honest",
              reply: "「很好。」她点头，「至少你没骗自己。」",
            },
            {
              label: "不是。我真的不知道",
              tag: "lost",
              reply: "「不。」她摇头，「你知道。你只是希望我说出不一样的。」",
            },
          ],
        },
      ],
    },
    {
      id: "ch5",
      title: "第五幕 · 她是谁",
      beats: [
        {
          id: "f1",
          video: V.closeEyes,
          art: A.turned,
          who: "narrator",
          text: "她闭上眼。铺子里所有的灯，同时暗了一瞬。",
          hold: 1540,
        },
        {
          id: "f2",
          art: A.gaze,
          video: V.gaze,
          who: "her",
          text: "「我不是在给你算命。」",
          hold: 1400,
        },
        {
          id: "f3",
          video: V.reveal,
          art: A.gaze,
          who: "her",
          text: "「我是那个，替你把话说完的人。」",
          hold: 1650,
        },
        {
          id: "f4",
          art: A.gaze,
          video: V.gaze,
          who: "her",
          text: "「天快亮了。你要不要听？」",
        },
      ],
    },
  ],
  endings: [
    {
      when: ["honest", "love"],
      title: "你早就知道了",
      body: "你问他在不在乎，其实你心里有数。你来这儿不是找答案，是找一个允许——允许你继续等，或者允许你放手。她给了你后者，虽然你没问。",
    },
    {
      when: ["honest", "restart"],
      title: "重新开始，但不是和他",
      body: "你说想要重新开始。她没骗你：可以。只是你听到这句话时，脑子里想的还是他——这就是你要跨过去的那一步。",
    },
    {
      when: ["lost"],
      title: "你在等她替你说出口",
      body: "你说你不知道。可你从进门到现在，一直在等一个人替你把那句话说出来。她说了。你不喜欢那个答案，但你知道它是真的。",
    },
    {
      when: ["guilt"],
      title: "你没有做错，只是太晚承认",
      body: "你一直在算自己欠了多少。她告诉你：不是欠，是你一直不肯承认自己想要。承认了，账就清了。",
    },
    {
      when: ["leave"],
      title: "门在你身后",
      body: "你说要走。她没拦。可你走出巷子的时候，天已经亮了——你在里面待了整夜，而且你不记得自己坐下过。",
    },
  ],
};

export const STORIES: Record<string, StoryScript> = {
  seven: STORY_SEVEN,
};
