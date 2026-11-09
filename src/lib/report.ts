/**
 * 报告内容层。
 *
 * 设计原则（从 sajutight 报告页结构反推 + 我们的差异化）：
 *
 *   1. 每节三段式：标题（钩子） / 副标题（更具体的钩子） / 正文
 *   2. 每节可选 subTitles —— 预先写死的 3-5 行金句，渲染成卡片列表。
 *      这是「可截图」的来源，也是 AI 输出平庸时的兜底。
 *   3. 正文可以由 AI 填，但标题层必须人工写死，否则结构会散。
 *   4. 五行/十神这些数据在后台算，前台只出现人话。
 *
 * 本文件只放「结构 + 人工写死的层」，AI 展开的段落单独留接口。
 */

import type { FourPillars, WuXing } from "./ganzhi";
import { GAN_ELEMENT, WUXING } from "./ganzhi";
import { readPartner, mbtiHint } from "./partner";

/* ------------------------------------------------------------------ *
 * 类型
 * ------------------------------------------------------------------ */

export type Section = {
  /** 小节标题：必须是钩子，不能是「第一章」 */
  title: string;
  /** 副标题：把钩子再说具体一点 */
  subtitle?: string;
  /** 徽章组：把术语做成胶囊 */
  tags?: { emoji: string; label: string }[];
  /** 金句列表：预写死，可截图 */
  quotes?: string[];
  /** 正文。AI 填这一层。 */
  body?: string;
  /** 视觉元素 */
  visual?:
    | { kind: "bars"; data: { label: string; value: number }[] }
    | { kind: "radar"; data: { label: string; value: number }[] }
    | { kind: "pillars"; pillars: { label: string; text: string }[] }
    | { kind: "quote"; text: string }
    | null;
};

export type Chapter = {
  id: string;
  /** 章序号，渲染成 CHAPTER 01 */
  no: number;
  title: string;
  subtitle: string;
  /** 封面图 */
  cover: string;
  /** 封面裁剪偏移 px */
  coverOffsetY?: number;
  /** 是否付费章节 */
  paid: boolean;
  /**
   * 章节目录：3 组要点，渲染成「编号 + 主标题 + ♦/♦♦/♦♦♦ 递增子项」。
   * 抄自 mzpian 的 chapter_n.png —— 在正文之前先给目录，制造"后面还有很多"的预期。
   */
  toc?: {
    heading: string;
    items: string[];
  }[];
  sections: Section[];
};

export type Report = {
  product: string;
  chapters: Chapter[];
};

/* ------------------------------------------------------------------ *
 * 术语 → 人话
 * ------------------------------------------------------------------ */

const ELEMENT_MEANING: Record<WuXing, string> = {
  木: "往上长的劲",
  火: "热度和表达",
  土: "稳定和承接",
  金: "边界和规矩",
  水: "感受和流动",
};

/** 把五行计数转成人话描述 */
export function describeElements(counts: Record<WuXing, number>) {
  const sorted = [...WUXING].sort((a, b) => counts[b] - counts[a]);
  const top = sorted[0];
  const top2 = sorted[1];
  const bottom = sorted[sorted.length - 1];
  return {
    top,
    topText: `${ELEMENT_MEANING[top]}最足`,
    second: top2,
    low: bottom,
    lowText: `${ELEMENT_MEANING[bottom]}偏少`,
    detail: `你身上${ELEMENT_MEANING[top]}最明显，其次是${ELEMENT_MEANING[top2]}。最少的是${ELEMENT_MEANING[bottom]}——不是没有，是不太用得上。`,
  };
}

/** 日主在关系里的倾向。20 条，覆盖 10 天干 × 阴阳。 */
const DAY_MASTER_IN_LOVE: Record<string, { style: string; blind: string; need: string }> = {
  甲: {
    style: "你习惯先给方案，再给情绪。对方说难受，你第一反应是「那怎么办」。",
    blind: "你把「解决问题」当成关心，但对方要的是「你也在难受」。",
    need: "一个不需要你解决的时刻。",
  },
  乙: {
    style: "你不硬碰。你会绕，会等，会用时间把对方的想法慢慢改过来。",
    blind: "你以为自己在体谅，其实你在回避当场表态。",
    need: "一次把话说完的机会。",
  },
  丙: {
    style: "你热得快，也亮得明显。喜欢一个人全场都知道。",
    blind: "你把热烈当成深度，热度一退就以为感情没了。",
    need: "一个能陪你把火调小、而不是加柴的人。",
  },
  丁: {
    style: "你的在意藏在细节里：记得对方说过的话，记得他不吃什么。",
    blind: "你从不明说，然后怪对方没发现。",
    need: "一个会主动看见细节的人。",
  },
  戊: {
    style: "你是那种「有事找我」的人。稳、可靠、不轻易改。",
    blind: "你把人照顾得太好，好到对方忘了你也需要被照顾。",
    need: "有人主动问你一句「你还好吗」。",
  },
  己: {
    style: "你体贴、耐心、会照顾场面，几乎不让人难堪。",
    blind: "你把需求藏得太深，久了自己都找不到。",
    need: "一个会追问你到底想要什么的人。",
  },
  庚: {
    style: "你直接、清楚、不玩猜谜。喜欢就是喜欢，不行就是不行。",
    blind: "你的坦诚在别人那里有时是刀。",
    need: "一个不怕你说实话的人。",
  },
  辛: {
    style: "你对质感有要求，也对关系有要求。将就对你来说很难。",
    blind: "你用挑剔筛选人，也把不少还不错的人筛掉了。",
    need: "一个经得起你看、也愿意让你看的人。",
  },
  壬: {
    style: "你给空间、给自由，不太查、不太管。",
    blind: "你把疏离当成尊重，对方感受到的是「你不在乎」。",
    need: "一个懂你「不黏」不等于「不爱」的人。",
  },
  癸: {
    style: "你感受力极强，一句话的语气变化你都能听出来。",
    blind: "你把猜测当成了事实，然后为事实难过很久。",
    need: "一个愿意把话说清楚、不让你猜的人。",
  },
};

/* ------------------------------------------------------------------ *
 * 第 1 章：你是哪种人（免费）
 * ------------------------------------------------------------------ */

const CH1_COVER = "/img/c1-cover.jpg";

export function buildChapter1(
  pillars: FourPillars,
  counts: Record<WuXing, number>,
  persona: { tag: string; core: string; gift: string; trap: string; doThis: string },
  name?: string,
): Chapter {
  const el = describeElements(counts);
  const dm = DAY_MASTER_IN_LOVE[pillars.day.gan];
  const who = name ? `${name}` : "你";

  return {
    id: "ch1",
    no: 1,
    title: "你是哪种人",
    subtitle: "在关系里，你的本能反应是什么",
    cover: CH1_COVER,
    coverOffsetY: -50,
    paid: false,
    toc: [
      {
        heading: "你的底色：写在生日里的事",
        items: [`${pillars.day.text}这一格的人共同的底色`, "为什么你会先反应，再想清楚"],
      },
      {
        heading: "你身上最足的那股劲",
        items: [`${el.top}最多的意思`, "它让你的第一反应总是比别人快半步"],
      },
      {
        heading: "你在关系里的本能",
        items: [`${pillars.day.gan}日主的人怎么爱人`, dm.style, "你真正需要的是哪一种人"],
      },
    ],
    sections: [
      {
        title: `你的底色：${pillars.day.text}`,
        subtitle: "六十天一个循环，你落在这一格",
        visual: {
          kind: "pillars",
          pillars: [
            { label: "年", text: pillars.year.text },
            { label: "月", text: pillars.month.text },
            { label: "日", text: pillars.day.text },
            { label: "时", text: pillars.hour?.text ?? "—" },
          ],
        },
        body: `${who}在干支历里落在「${pillars.day.text}」这一格，日主是${pillars.day.gan}（${GAN_ELEMENT[pillars.day.gan]}）。\n\n${persona.core}\n\n这一格的人有共同的底色——不是命运，是出厂设置。${persona.tag}这句话，说的就是这个。`,
      },
      {
        title: "你身上最足的那股劲",
        subtitle: `${el.topText}，最少的是${el.lowText}`,
        tags: [
          { emoji: "🔥", label: `${el.top}最足` },
          { emoji: "💧", label: `${el.low}偏少` },
        ],
        visual: {
          kind: "bars",
          data: WUXING.map((e) => ({ label: e, value: counts[e] })),
        },
        body: `${el.detail}\n\n换算成关系里的话：你的${ELEMENT_MEANING[el.top]}会先于理智出现。对方还没开口，你已经开始${el.top === "火" ? "热" : el.top === "水" ? "感受" : el.top === "木" ? "往前推" : el.top === "金" ? "划线" : "承接"}了。\n\n这不是优点也不是缺点，是你的默认档位。`,
      },
      {
        title: "你在关系里的本能",
        subtitle: `${pillars.day.gan}日主的人在感情里通常这样`,
        quotes: [dm.style, dm.blind, `你真正需要的是：${dm.need}`],
        body: `${dm.style}\n\n这件事的好处是，你很少让人觉得敷衍。坏处是——${dm.blind}\n\n所以对你来说，「${dm.need}」比一百次精心安排都重要。`,
      },
      {
        title: "你最容易搞砸的地方",
        subtitle: "不是性格缺陷，是同一个动作做过头",
        quotes: [persona.trap],
        body: `${persona.trap}\n\n注意：这不是让你改性格。你的${persona.gift.split("。")[0]}是真的好用，只是它在某些时刻会变成另一面。\n\n今天可以试一下：${persona.doThis}`,
      },
    ],
  };
}

/* ------------------------------------------------------------------ *
 * 第 2 章：你现在卡在哪（免费）
 * ------------------------------------------------------------------ */

export function buildChapter2(
  pillars: FourPillars,
  counts: Record<WuXing, number>,
  persona: { tag: string; core: string; gift: string; trap: string },
): Chapter {
  const el = describeElements(counts);
  const dm = DAY_MASTER_IN_LOVE[pillars.day.gan];

  return {
    id: "ch2",
    no: 2,
    title: "你现在卡在哪",
    subtitle: "反复出现的那个模式，是有结构的",
    cover: "/img/c3-reading.jpg",
    coverOffsetY: -30,
    paid: false,
    toc: [
      {
        heading: "你反复遇到的那件事",
        items: ["换个对象、换个城市，剧本几乎一样", "你以为是运气，其实是同一个选择"],
      },
      {
        heading: "这次为什么不一样",
        items: ["你开始问「我是不是也有问题」", "循环的出口就在这句话里"],
      },
      {
        heading: "对方眼里的你",
        items: ["同一件事，他看到的和你看到的不是同一件", "你以为的克制，在他那里是冷淡", "你只需要说一句翻译过来的话"],
      },
    ],
    sections: [
      {
        title: "你反复遇到的那件事",
        subtitle: "换个对象、换个城市，剧本几乎一样",
        quotes: [
          "你以为是运气不好，其实是同一个选择做了很多次。",
          "每次都不一样的人，但每次都是同一种结局。",
        ],
        body: `你身上${el.topText}，这意味着你的第一反应总是比别人快半步。快半步的好处是先看到机会，坏处是——你常常在对方还没表态时就先把结论定了。\n\n所以你会经历同一种循环：你先投入，对方慢半拍，你解读成"不够喜欢"，然后你先退。\n\n这个循环里没有坏人。只有一个人太快，一个人太慢。`,
      },
      {
        title: "这次为什么不一样",
        subtitle: "如果你正在想某件具体的事",
        body: `这次不一样的地方，不是你遇到了更好的人，是你开始问「我是不是也有问题」。\n\n问出这句话，循环就有出口了。因为以前你只会问「他为什么这样」。\n\n${dm.blind}\n\n你现在要做的不是分析他，是承认自己那半步快了。`,
      },
      {
        title: "对方眼里的你",
        subtitle: "同样一件事，他看到的和你看到的不是同一件",
        quotes: [
          "你以为的「克制」，在他那里是「冷淡」。",
          "你以为的「体贴」，在他那里是「疏远」。",
        ],
        body: `你的${el.top}太明显，以至于它会盖住别的东西。\n\n你在意一个人的时候，表现出来往往是「不打扰」。你以为这是尊重，但对方接收到的是：他好像没那么需要我。\n\n这不是误会，是两种语言的差异。你只需要说一句翻译过来的话。`,
      },
      {
        title: "你一直忽略的那一点",
        subtitle: "最明显的线索，通常最容易被自己跳过",
        quotes: [`你真正需要的是：${dm.need}`],
        body: `你花了大量精力在「他怎么想」。但你的盘里，${el.low}是最少的——这意味着你很少花时间问「我要什么」。\n\n${persona.trap}\n\n下一章开始，我们说的就是那个人的事。但先记住这一句：你不缺答案，你缺的是承认自己想要什么。`,
      },
    ],
  };
}

/* ------------------------------------------------------------------ *
 * 第 3 章：下一个出现的人（付费）
 * ------------------------------------------------------------------ */

export function buildChapter3(
  pillars: FourPillars,
  counts: Record<WuXing, number>,
  gender: "female" | "male",
): Chapter {
  const p = readPartner(pillars, gender);
  const el = describeElements(counts);

  return {
    id: "ch3",
    no: 3,
    title: "下一个出现的人",
    subtitle: "不是泛泛的「正缘」，是具体到你会认出来的那种",
    cover: "/img/c5-hand.jpg",
    coverOffsetY: -20,
    paid: true,
    toc: [
      {
        heading: "他会是什么样的人",
        items: [`夫妻宫里透出的${p.starGan}（${p.starTenGod}）`, "你会注意到的那个特征"],
      },
      {
        heading: "你们会怎么开始",
        items: ["他会怎么追你", `这段关系最容易出问题的地方：${p.risk.split("。")[0]}`],
      },
      {
        heading: "你们会在哪里遇到",
        items: ["日支决定的场合", "这段关系会怎么走", "你在这段关系里最该注意的一件事"],
      },
    ],
    sections: [
      {
        title: "他的样子",
        subtitle: "不是长相清单，是你会注意到的那个特征",
        tags: [
          { emoji: "✨", label: p.kind },
          { emoji: "🎯", label: `${p.starGan}日主` },
        ],
        quotes: [p.look.split("\n\n")[0]],
        body: `你的夫妻宫（日支${pillars.day.zhi}）里藏着${p.starGan}，对应的十神是「${p.starTenGod}」。\n\n在命理里，日支是配偶的位置，藏干就是配偶的底色。所以你的盘指向的是——${p.vibe}\n\n具体到你会注意到的地方：\n\n${p.look.split("\n\n")[1] ?? p.look}`,
      },
      {
        title: "他会怎么追你",
        subtitle: "或者说，你们会怎么开始",
        quotes: [p.style],
        body: `这里有个细节值得说：${p.risk}\n\n不是说他不好，是这段关系里最容易出问题的就是这一点。你提前知道，就不会把「他就是这样的人」误读成「他不爱我」。`,
      },
      {
        title: "他会是什么样的人",
        subtitle: "性格与 MBTI 倾向",
        tags: [{ emoji: "🧩", label: mbtiHint(p.starTenGod).split("——")[0] }],
        body: `${mbtiHint(p.starTenGod).split("——")[1] ?? ""}\n\n当然 MBTI 只是个参考框架，真正有意义的是这个：${p.vibe}\n\n他大概从事这些方向：${p.job.join("、")}。\n\n不是说他一定在这些行业，而是「这类工作塑造出来的那种人」——你回想一下身边符合这个描述的人，可能已经有画面了。`,
      },
      {
        title: "你们会在哪里遇到",
        subtitle: "日支决定场合，这个推得比较准",
        quotes: [p.scene],
        body: `这不是玄学。日支代表「配偶所在的位置」，不同的地支对应不同的场景类型。\n\n所以接下来这段时间，你可以在这些场合里稍微留心一点——不是让你主动出击，是别在那种场合里全程低头看手机。`,
      },
      {
        title: "这段关系会怎么走",
        subtitle: "以及你该注意什么",
        quotes: [p.prospect],
        body: `${p.prospect}\n\n最后一件事，也是最重要的一件：\n\n${p.advice}\n\n${el.detail}\n\n你身上${el.lowText}——这意味着在这段关系里，你最容易忽略的是自己那一侧的需求。记住这一点，比记住他的长相有用。`,
      },
    ],
  };
}

/* ------------------------------------------------------------------ *
 * 组装
 * ------------------------------------------------------------------ */

export function buildReport(
  pillars: FourPillars,
  counts: Record<WuXing, number>,
  persona: { tag: string; core: string; gift: string; trap: string; doThis: string },
  name?: string,
  gender: "female" | "male" = "female",
): Report {
  return {
    product: "恋爱八字",
    chapters: [
      buildChapter1(pillars, counts, persona, name),
      buildChapter2(pillars, counts, persona),
      buildChapter3(pillars, counts, gender),
    ],
  };
}
