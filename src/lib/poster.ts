/**
 * 分享海报：纯 Canvas 2D 绘制，不依赖 html2canvas。
 *
 * 为什么不截图 DOM：
 *   - html2canvas 要 40KB+，且对现代 CSS（oklch、渐变、字体）支持不稳
 *   - 手绘一张 1080×1440 的海报更可控，且能保证分享出去的样子是「设计过的」
 *
 * 设计约束：
 *   - 3:4 竖版，小红书/朋友圈都能直接发
 *   - 信息量控制在「一眼看完」：干支 + 人设 + 一句话，不放四柱细节
 *   - 深色底 + 朱砂红，和站内视觉一致
 */

export type PosterInput = {
  dayGanZhi: string;
  tag: string;
  core: string;
  gift: string;
  brand?: string;
};

const W = 1080;
const H = 1440;

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  let cur = "";
  for (const ch of text) {
    const test = cur + ch;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = ch;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export function renderPoster(input: PosterInput): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const serif = '"Songti SC","STSong","Noto Serif CJK SC",serif';
  const sans = 'system-ui,"PingFang SC","Microsoft YaHei",sans-serif';

  // 底
  ctx.fillStyle = "#0b0a09";
  ctx.fillRect(0, 0, W, H);

  // 极淡的径向光，避免大面积死黑
  const g = ctx.createRadialGradient(W / 2, H * 0.3, 0, W / 2, H * 0.3, W * 0.95);
  g.addColorStop(0, "rgba(178,58,42,0.10)");
  g.addColorStop(1, "rgba(178,58,42,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // 外框
  ctx.strokeStyle = "rgba(200,191,178,0.16)";
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 48, W - 96, H - 96);

  // 顶部品牌
  ctx.fillStyle = "#a2978a";
  ctx.font = `500 26px ${sans}`;
  ctx.textAlign = "left";
  ctx.fillText("看余 KANYU", 96, 132);

  ctx.fillStyle = "#554d44";
  ctx.font = `400 22px ${sans}`;
  ctx.textAlign = "right";
  ctx.fillText("读一读你的出厂设置", W - 96, 132);

  // 分隔线
  ctx.strokeStyle = "rgba(200,191,178,0.14)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(96, 172);
  ctx.lineTo(W - 96, 172);
  ctx.stroke();

  // 干支大字
  ctx.textAlign = "center";
  ctx.fillStyle = "#e2604a";
  ctx.font = `400 40px ${serif}`;
  ctx.fillText(`${input.dayGanZhi}日柱`, W / 2, 300);

  // 人设标题
  ctx.fillStyle = "#e8e1d6";
  ctx.font = `500 76px ${serif}`;
  const tagLines = wrap(ctx, input.tag, W - 240);
  let y = 430;
  for (const line of tagLines) {
    ctx.fillText(line, W / 2, y);
    y += 96;
  }

  // 朱砂短线
  y += 24;
  ctx.strokeStyle = "#b23a2a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 40, y);
  ctx.lineTo(W / 2 + 40, y);
  ctx.stroke();

  // 正文
  y += 86;
  ctx.fillStyle = "#c8bfb2";
  ctx.font = `400 34px ${sans}`;
  ctx.textAlign = "center";
  const bodyLines = wrap(ctx, input.core, W - 260).slice(0, 6);
  for (const line of bodyLines) {
    ctx.fillText(line, W / 2, y);
    y += 58;
  }

  // 优势
  y += 40;
  ctx.fillStyle = "#c9a227";
  ctx.font = `400 24px ${sans}`;
  ctx.fillText("你的隐藏优势", W / 2, y);
  y += 46;
  ctx.fillStyle = "#e8e1d6";
  ctx.font = `400 32px ${sans}`;
  const giftLines = wrap(ctx, input.gift, W - 260).slice(0, 3);
  for (const line of giftLines) {
    ctx.fillText(line, W / 2, y);
    y += 52;
  }

  // 底部
  ctx.strokeStyle = "rgba(200,191,178,0.14)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(96, H - 190);
  ctx.lineTo(W - 96, H - 190);
  ctx.stroke();

  ctx.fillStyle = "#7a6f63";
  ctx.font = `400 26px ${sans}`;
  ctx.fillText(input.brand ?? "输入你的生日，看看你这一柱是什么人", W / 2, H - 130);

  ctx.fillStyle = "#3a352f";
  ctx.font = `400 20px ${sans}`;
  ctx.fillText("内容仅供娱乐参考，不构成任何决策建议", W / 2, H - 92);

  return canvas;
}

export async function downloadPoster(input: PosterInput, fileName = "kanyu-card.png") {
  const canvas = renderPoster(input);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png", 0.95),
  );
  if (!blob) return false;

  // 移动端优先用系统分享（可以直接发到微信/小红书）
  const file = new File([blob], fileName, { type: "image/png" });
  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
  };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "看余" });
      return true;
    } catch {
      // 用户取消，继续走下载
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  return true;
}
