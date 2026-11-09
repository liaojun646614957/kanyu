/**
 * 真图文渲染器。
 *
 * 目标：把每一「页」直接渲染成位图，文字成为像素的一部分。
 * 这样手机上永远不会有字号/换行/排版塌掉的问题，因为设计已经烧进图里。
 *
 * 参照 mzpian 的 report_preview_poster@2x.webp：
 *   - 750px 宽（@2x 即 1500px）
 *   - 深色底 + 立绘，文字直接压在图上的暗部
 *   - 中文用衬线，标题粗、正文细
 *
 * 每页高度按内容长短算，不是固定比例——允许长短不一，
 * 因为前端是按顺序排列的图，不需要统一高度。
 */

export type PageText = {
  /** 小标签，如 CHAPTER 01 */
  kicker?: string;
  /** 主标题（大字） */
  title: string;
  /** 副标题 */
  subtitle?: string;
  /** 金句（带引号感的短句），每行一条 */
  quotes?: string[];
  /** 正文段落 */
  paragraphs?: string[];
  /** 页脚小字 */
  footnote?: string;
};

export type PageStyle = {
  /** 背景图路径；不传则纯色 */
  bg?: string;
  /** 背景图透明度 */
  bgOpacity?: number;
  /** 背景图 object-position，默认 center */
  bgPos?: string;
  /** 底色 */
  base?: string;
  /** 主色（标题、强调） */
  accent?: string;
  /** 文字色 */
  text?: string;
  /** 是否叠加噪点纹理 */
  grain?: boolean;
};

const W = 750;
const DPR = 2;

const CJK_FONT =
  '"Songti SC","STSong","Noto Serif CJK SC","Source Han Serif SC","Noto Serif SC",serif';
const SANS_FONT =
  '"PingFang SC","Hiragino Sans GB","Noto Sans CJK SC","Microsoft YaHei",sans-serif';

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** 逐字断行（中文没有空格，必须按字符量宽） */
function wrapCJK(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
): string[] {
  const out: string[] = [];
  for (const rawLine of text.split("\n")) {
    if (!rawLine) {
      out.push("");
      continue;
    }
    let cur = "";
    for (const ch of rawLine) {
      const test = cur + ch;
      if (ctx.measureText(test).width > maxW && cur) {
        out.push(cur);
        cur = ch;
      } else {
        cur = test;
      }
    }
    if (cur) out.push(cur);
  }
  return out;
}

/** 渲染一页，返回 canvas */
export async function renderPage(
  page: PageText,
  style: PageStyle = {},
): Promise<HTMLCanvasElement> {
  const cv = document.createElement("canvas");
  const ctx = cv.getContext("2d")!;

  const base = style.base ?? "#0b0809";
  const accent = style.accent ?? "#d94b4b";
  const textColor = style.text ?? "#e8e1d6";

  const padX = 64;
  const contentW = W - padX * 2;

  // ---- 先量一次高度 ----
  const measure = (c: CanvasRenderingContext2D) => {
    let h = 0;
    h += 96; // 顶部留白
    if (page.kicker) h += 34;
    if (page.title) {
      c.font = `bold 54px ${CJK_FONT}`;
      h += wrapCJK(c, page.title, contentW).length * 74 + 20;
    }
    if (page.subtitle) {
      c.font = `400 26px ${SANS_FONT}`;
      h += wrapCJK(c, page.subtitle, contentW).length * 42 + 18;
    }
    if (page.quotes?.length) {
      c.font = `400 30px ${CJK_FONT}`;
      const qh = page.quotes.reduce(
        (s, q) => s + wrapCJK(c, q, contentW - 56).length * 46 + 26,
        0,
      );
      h += qh + 56;
    }
    if (page.paragraphs?.length) {
      c.font = `400 28px ${SANS_FONT}`;
      for (const p of page.paragraphs) {
        h += wrapCJK(c, p, contentW).length * 50 + 30;
      }
    }
    if (page.footnote) {
      c.font = `400 20px ${SANS_FONT}`;
      h += wrapCJK(c, page.footnote, contentW).length * 32 + 20;
    }
    h += 110; // 底部留白
    return h;
  };

  const H = Math.max(900, Math.ceil(measure(ctx)));

  cv.width = W * DPR;
  cv.height = H * DPR;
  cv.style.width = `${W}px`;
  ctx.scale(DPR, DPR);

  // ---- 背景 ----
  if (style.bg) {
    const img = await loadImage(style.bg);
    if (img) {
      const targetH = H;
      const scale = Math.max(W / img.width, targetH / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.save();
      ctx.globalAlpha = style.bgOpacity ?? 1;
      // object-position: 用 bgPos 简化成 top/center
      const dy =
        style.bgPos === "top" ? 0 : style.bgPos === "bottom" ? targetH - dh : (targetH - dh) / 2;
      ctx.drawImage(img, (W - dw) / 2, dy, dw, dh);
      ctx.restore();
    }
  } else {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);
  }

  // 压暗：保证文字可读（从顶部 0.35 → 中部 0.5 → 底部 0.92）
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "rgba(8,5,6,0.55)");
  grad.addColorStop(0.28, "rgba(8,5,6,0.28)");
  grad.addColorStop(0.55, "rgba(8,5,6,0.72)");
  grad.addColorStop(1, "rgba(8,5,6,0.97)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // ---- 内容 ----
  let y = 96;

  if (page.kicker) {
    ctx.font = `500 20px ${SANS_FONT}`;
    ctx.fillStyle = accent;
    ctx.textAlign = "left";
    ctx.letterSpacing = "6px";
    ctx.fillText(page.kicker.toUpperCase(), padX, y);
    ctx.letterSpacing = "0px";
    y += 34;
  }

  if (page.title) {
    ctx.font = `bold 54px ${CJK_FONT}`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    for (const line of wrapCJK(ctx, page.title, contentW)) {
      ctx.fillText(line, padX, y + 52);
      y += 74;
    }
    y += 20;
  }

  if (page.subtitle) {
    ctx.font = `400 26px ${SANS_FONT}`;
    ctx.fillStyle = "rgba(232,225,214,0.55)";
    for (const line of wrapCJK(ctx, page.subtitle, contentW)) {
      ctx.fillText(line, padX, y + 26);
      y += 42;
    }
    y += 18;
  }

  // 金色分隔线
  y += 8;
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.7;
  ctx.fillRect(padX, y, 56, 2);
  ctx.globalAlpha = 1;
  y += 34;

  // 金句卡：半透明底 + 左侧竖线
  if (page.quotes?.length) {
    const boxTop = y;
    ctx.font = `400 30px ${CJK_FONT}`;
    let qy = y + 34;
    const lines: { text: string; y: number }[] = [];
    for (const q of page.quotes) {
      for (const line of wrapCJK(ctx, q, contentW - 56)) {
        lines.push({ text: line, y: qy });
        qy += 46;
      }
      qy += 26;
    }
    const boxH = qy - boxTop;

    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(padX - 12, boxTop, contentW + 24, boxH);
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(padX - 12, boxTop, 3, boxH);
    ctx.globalAlpha = 1;

    ctx.fillStyle = "rgba(240,235,228,0.94)";
    for (const l of lines) ctx.fillText(l.text, padX + 22, l.y);

    y = boxTop + boxH + 48;
  }

  // 正文
  if (page.paragraphs?.length) {
    ctx.font = `400 28px ${SANS_FONT}`;
    ctx.fillStyle = "rgba(220,213,204,0.90)";
    for (const p of page.paragraphs) {
      for (const line of wrapCJK(ctx, p, contentW)) {
        ctx.fillText(line, padX, y + 28);
        y += 50;
      }
      y += 30;
    }
  }

  // 页脚
  if (page.footnote) {
    ctx.font = `400 20px ${SANS_FONT}`;
    ctx.fillStyle = "rgba(232,225,214,0.30)";
    for (const line of wrapCJK(ctx, page.footnote, contentW)) {
      ctx.fillText(line, padX, y + 20);
      y += 32;
    }
  }

  // ---- 噪点（轻微，避免纯色发死）----
  if (style.grain !== false) {
    const g = ctx.createPattern(makeNoise(), "repeat");
    if (g) {
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
  }

  // 边缘暗角
  const vg = ctx.createRadialGradient(W / 2, H / 2, W * 0.35, W / 2, H / 2, W * 0.95);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  return cv;
}

let _noise: HTMLCanvasElement | null = null;
function makeNoise(): HTMLCanvasElement {
  if (_noise) return _noise;
  const c = document.createElement("canvas");
  c.width = c.height = 120;
  const x = c.getContext("2d")!;
  const d = x.createImageData(120, 120);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = Math.random() * 255;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 26;
  }
  x.putImageData(d, 0, 0);
  _noise = c;
  return c;
}
