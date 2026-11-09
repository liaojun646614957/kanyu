/**
 * 剧本引擎。
 *
 * 设计目标：一条剧本骨架，7 个类目各自填自己的「大师、立绘、台词、分支」。
 *
 * 每个剧本 = 一串 Scene：
 *   - line    : 大师说一句话（配一张立绘）
 *   - choice  : 用户选一个（选项只影响「叙述侧重」，不影响命盘计算）
 *   - input   : 收一个数据（生日 / 时辰）
 *   - cast    : 摇卦（按住蓄力，六爻）
 * 最后进入 reveal -> 报告。
 *
 * 「只影响叙述侧重」的具体做法：choice 累加 tags（如 "urgent" / "skeptic"），
 * 报告阶段用 tags 去挑不同的开场句与不同的章节顺序。盘本身永远由生日算。
 */

export type Scene =
  | {
      kind: "line";
      /** 立绘文件 */
      art: string;
      /** 大师台词 */
      text: string;
      /** 小字旁白，可为空 */
      aside?: string;
      /** 按钮文案 */
      cta?: string;
    }
  | {
      kind: "choice";
      art: string;
      text: string;
      aside?: string;
      options: { label: string; tag: string }[];
    }
  | {
      kind: "input";
      art: string;
      text: string;
      aside?: string;
      field: "birth" | "hour";
      /** 跳过按钮文案；不填则不显示跳过 */
      skip?: string;
    }
  | {
      kind: "cast";
      art: string;
      text: string;
      aside?: string;
    };

export type Script = {
  id: string;
  /** 类目名，首页用 */
  category: string;
  /** 剧本标题，首页卡片用 */
  title: string;
  /** 一句话卖点 */
  hook: string;
  /** 大师 */
  master: {
    name: string;
    /** 称号，如「彼岸的女巫」 */
    title: string;
    /** 大师的口头禅/语气说明，仅内部用 */
    voice: string;
  };
  /** 首页封面图 */
  cover: string;
  scenes: Scene[];
  /** 报告阶段：按 tag 挑开场 */
  openings: { when: string[]; text: string }[];
};

const ART = {
  face: "/img/c1-cover.jpg",
  hand: "/img/c5-hand.jpg",
  coins: "/img/c2-coins.jpg",
  reading: "/img/c3-reading.jpg",
  gaze: "/img/c4-gaze.jpg",
  turned: "/img/c6-turned.jpg",
};

/* ------------------------------------------------------------------ *
 * 剧本一：恋爱（第一个做，跑通再复制）
 * ------------------------------------------------------------------ */

export const LOVE_SCRIPT: Script = {
  id: "love",
  category: "恋爱",
  title: "她只看了你一眼",
  hook: "关于你一直在想的那个人",
  master: {
    name: "朱砂",
    title: "彼岸的女巫",
    voice: "不劝你，只把看到的说出来。句子短，偶尔刻薄，但不说废话。",
  },
  cover: ART.face,
  scenes: [
    {
      kind: "line",
      art: ART.face,
      text: "你来了。",
      aside: "她没有抬头，先开口的是她。",
      cta: "走近一点",
    },
    {
      kind: "line",
      art: ART.hand,
      text: "把手给我。",
      aside: "她伸出手。掌心朝上，在等。",
      cta: "把手放上去",
    },
    {
      kind: "choice",
      art: ART.gaze,
      text: "先说清楚——你今天来，是因为谁？",
      aside: "她的眼睛终于抬起来。",
      options: [
        { label: "一个还没开始的人", tag: "before" },
        { label: "一个已经结束的人", tag: "after" },
        { label: "我自己", tag: "self" },
      ],
    },
    {
      kind: "choice",
      art: ART.turned,
      text: "……嗯。",
      aside: "她低下头，翻了翻什么。你能感觉到她在斟酌要不要说。",
      options: [
        { label: "我很急，直接说", tag: "urgent" },
        { label: "我不太信这些", tag: "skeptic" },
        { label: "你说吧，我扛得住", tag: "tough" },
      ],
    },
    {
      kind: "input",
      art: ART.reading,
      text: "生辰。",
      aside: "她把一张纸推到你面前。",
      field: "birth",
    },
    {
      kind: "input",
      art: ART.reading,
      text: "几点？不记得也行。",
      aside: "笔停在半空。",
      field: "hour",
      skip: "不记得了",
    },
    {
      kind: "line",
      art: ART.coins,
      text: "最后一步。",
      aside: "她把三枚铜钱推到你面前。「心里想着那个人，摇六次。」",
      cta: "伸手",
    },
    {
      kind: "cast",
      art: ART.coins,
      text: "按住，别松手，直到你觉得可以了。",
    },
    {
      kind: "line",
      art: ART.gaze,
      text: "……有意思。",
      aside: "她看着卦象，很久没说话。",
      cta: "然后呢",
    },
  ],
  openings: [
    {
      when: ["urgent"],
      text: "你太急了。急到会把「他今天回我消息了」当成信号。所以先说最难听的那一句——",
    },
    {
      when: ["skeptic"],
      text: "你不信，这很好。那我只说你能自己验证的部分，剩下的你当我没说。",
    },
    {
      when: ["tough"],
      text: "你说你扛得住。那我就不绕了。",
    },
    {
      when: ["before"],
      text: "你还没开始，就已经在心里演完了全部。这是你最耗人的地方。",
    },
    {
      when: ["after"],
      text: "结束的是关系，不是你。你把这两件事混在一起了。",
    },
    {
      when: ["self"],
      text: "你说你是为自己来的。那我们先不谈别人。",
    },
  ],
};

/** 7 个类目的入口（首页用）。目前只有 love 有完整剧本，其余先占位。 */
export const CATEGORIES = [
  { id: "love", label: "恋爱", desc: "那个人到底怎么想", count: "12 个剧本", ready: true },
  { id: "all", label: "综合", desc: "看一整张命盘", count: "6 个剧本", ready: false },
  { id: "match", label: "合盘", desc: "两个人合不合", count: "3 个剧本", ready: false },
  { id: "money", label: "财物", desc: "钱和事业的方向", count: "2 个剧本", ready: false },
  { id: "self", label: "自己", desc: "我是什么人", count: "3 个剧本", ready: false },
  { id: "family", label: "家庭", desc: "父母与子女", count: "2 个剧本", ready: false },
] as const;

export const SCRIPTS: Record<string, Script> = {
  love: LOVE_SCRIPT,
};
