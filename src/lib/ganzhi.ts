/**
 * 干支历核心。
 *
 * 只做「能算准」的那部分：日柱、节气边界、四柱、十神、五行计数。
 * 不做真太阳时修正（需要经度 + 均时差，留作后续）。
 *
 * 校验基准（均为公认值）：
 *   2024-01-01 → 甲子日
 *   2000-01-01 → 戊午日
 *   1900-01-01 → 甲戌日
 */

export const GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export const ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

export type Gan = (typeof GAN)[number];
export type Zhi = (typeof ZHI)[number];

export const GAN_ELEMENT: Record<Gan, WuXing> = {
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土",
  己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水",
};

export const GAN_YINYANG: Record<Gan, "阳" | "阴"> = {
  甲: "阳", 乙: "阴", 丙: "阳", 丁: "阴", 戊: "阳",
  己: "阴", 庚: "阳", 辛: "阴", 壬: "阳", 癸: "阴",
};

export type WuXing = "木" | "火" | "土" | "金" | "水";
export const WUXING: WuXing[] = ["木", "火", "土", "金", "水"];

/** 地支藏干（本气 + 中气 + 余气），用于五行加权计数。 */
export const ZHI_HIDDEN: Record<Zhi, Gan[]> = {
  子: ["癸"],
  丑: ["己", "癸", "辛"],
  寅: ["甲", "丙", "戊"],
  卯: ["乙"],
  辰: ["戊", "乙", "癸"],
  巳: ["丙", "庚", "戊"],
  午: ["丁", "己"],
  未: ["己", "丁", "乙"],
  申: ["庚", "壬", "戊"],
  酉: ["辛"],
  戌: ["戊", "辛", "丁"],
  亥: ["壬", "甲"],
};

/** 儒略日序数（Gregorian）。 */
export function julianDay(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * m2 + 2) / 5) +
    365 * y2 +
    Math.floor(y2 / 4) -
    Math.floor(y2 / 100) +
    Math.floor(y2 / 400) -
    32045
  );
}

/** 日柱索引 0..59（甲子=0）。2024-01-01 为甲子。 */
export function dayGanZhiIndex(y: number, m: number, d: number): number {
  return (((julianDay(y, m, d) + 49) % 60) + 60) % 60;
}

export function ganZhi(index: number): { gan: Gan; zhi: Zhi; text: string } {
  const i = ((index % 60) + 60) % 60;
  const gan = GAN[i % 10];
  const zhi = ZHI[i % 12];
  return { gan, zhi, text: gan + zhi };
}

/** 60 甲子，从甲子开始，用于查表。 */
export const JIAZI: { gan: Gan; zhi: Zhi; text: string }[] = Array.from(
  { length: 60 },
  (_, i) => ganZhi(i),
);

/* ------------------------------------------------------------------ *
 * 节气（太阳视黄经 15° 的整数倍）
 *
 * 用低精度太阳位置公式（误差 < 1 分钟量级），对「判月柱」足够。
 * 返回 UTC 毫秒时间戳。
 * ------------------------------------------------------------------ */

const RAD = Math.PI / 180;

/** 由「儒略日数」求太阳视黄经（度）。 */
function solarLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * RAD) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * M * RAD) +
    0.000289 * Math.sin(3 * M * RAD);
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  // 视黄经 = 真黄经 - 章动 + 光行差
  return trueLong - 0.00569 - 0.00478 * Math.sin(omega * RAD);
}

function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}

/**
 * 求某年某「目标黄经」对应的 UTC 时间。
 * 用二分法在给定时间窗内搜索，窗口默认 ±5 天。
 */
function solveLongitude(targetDeg: number, guessJd: number): number {
  let lo = guessJd - 6;
  let hi = guessJd + 6;
  const f = (jd: number) => {
    // 用有符号最小角差，避免 0/360 跨圈问题
    let d = norm360(solarLongitude(jd) - targetDeg);
    if (d > 180) d -= 360;
    return d;
  };
  // 确保区间两端异号
  for (let i = 0; i < 40 && f(lo) * f(hi) > 0; i++) {
    lo -= 5;
    hi += 5;
  }
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (f(lo) * f(mid) <= 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

/** 节气名，按黄经顺序。立春=315°，惊蛰=345°，清明=15°… */
export const JIEQI_NAMES = [
  "立春", "雨水", "惊蛰", "春分", "清明", "谷雨",
  "立夏", "小满", "芒种", "夏至", "小暑", "大暑",
  "立秋", "处暑", "白露", "秋分", "寒露", "霜降",
  "立冬", "小雪", "大雪", "冬至", "小寒", "大寒",
] as const;

/** 12 个「节」（不是「气」），决定月柱的边界。立春为首。 */
export const JIE_NAMES = [
  "立春", "惊蛰", "清明", "立夏", "芒种", "小暑",
  "立秋", "白露", "寒露", "立冬", "大雪", "小寒",
] as const;

/** 各「节」的太阳黄经（度）。立春 315°，之后每 30° 一个。 */
const JIE_LONGITUDES = [315, 345, 15, 45, 75, 105, 135, 165, 195, 225, 255, 285];

/** 由公历日期反推该年 J2000 儒略日。 */
function toJd(y: number, m: number, d: number, hour = 12): number {
  return julianDay(y, m, d) - 0.5 + hour / 24;
}

/** 求某年某个「节」的时刻（UTC 毫秒）。 */
export function jieTime(year: number, jieIndex: number): number {
  const target = JIE_LONGITUDES[jieIndex];
  // 立春在 2 月，小寒在次年 1 月；用近似月份做初值
  const approxMonth = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1][jieIndex];
  const approxYear = jieIndex === 11 ? year + 1 : year;
  const guess = toJd(approxYear, approxMonth, 6);
  const jd = solveLongitude(target, guess);
  return Math.round((jd - 2440587.5) * 86400000);
}

/**
 * 判定某时刻的「干支月」序号。
 * 干支月以立春为寅月起点，所以返回值 0=寅月，1=卯月…11=丑月。
 *
 * 做法：把前后三年的 12 个「节」摊平成一条时间轴，找 t 所在的区间。
 * 直接按「本年立春起算」会在 1 月（尚未立春）时错判，必须跨年取边界。
 */
export function monthBranchIndex(date: Date): number {
  const y = date.getUTCFullYear();
  const t = date.getTime();

  const marks: { at: number; index: number }[] = [];
  for (const yy of [y - 1, y, y + 1]) {
    for (let i = 0; i < 12; i++) marks.push({ at: jieTime(yy, i), index: i });
  }
  marks.sort((a, b) => a.at - b.at);

  let current = marks[0].index;
  for (const m of marks) {
    if (t >= m.at) current = m.index;
    else break;
  }
  return current;
}

/** 该时刻是否已过本年立春（决定年柱）。 */
export function passedLichun(date: Date): boolean {
  return date.getTime() >= jieTime(date.getUTCFullYear(), 0);
}

/* ------------------------------------------------------------------ *
 * 四柱
 * ------------------------------------------------------------------ */

export type Pillar = { gan: Gan; zhi: Zhi; text: string };

export type FourPillars = {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null;
  /** 用于展示的农历/干支说明 */
  notes: string[];
};

/**
 * 年柱：立春换年。年干 = (年 - 4) % 10，年支 = (年 - 4) % 12。
 */
function yearPillar(date: Date): Pillar {
  let y = date.getUTCFullYear();
  if (!passedLichun(date)) y -= 1;
  const idx = (((y - 4) % 60) + 60) % 60;
  return ganZhi(idx);
}

/**
 * 月柱：月支由节气定（寅月起），月干用「五虎遁」由年干推。
 * 甲己之年丙作首，乙庚之岁戊为头，丙辛必定寻庚起，丁壬壬位顺行流，戊癸何方发，甲寅之上好追求。
 */
function monthPillar(date: Date, yearGan: Gan): Pillar {
  const mb = monthBranchIndex(date); // 0=寅
  const zhi = ZHI[(mb + 2) % 12];
  const startGanIndex: Record<string, number> = {
    甲: 2, 己: 2,
    乙: 4, 庚: 4,
    丙: 6, 辛: 6,
    丁: 8, 壬: 8,
    戊: 0, 癸: 0,
  };
  const ganIdx = (startGanIndex[yearGan] + mb) % 10;
  const gan = GAN[ganIdx];
  return { gan, zhi, text: gan + zhi };
}

/**
 * 时柱：由日干推时干（五鼠遁），子时起。
 * 甲己还加甲，乙庚丙作初，丙辛从戊起，丁壬庚子居，戊癸何方发，壬子是真途。
 */
export function hourPillar(dayGan: Gan, hour: number, minute = 0): Pillar {
  // 23:00-00:59 属次日子时（晚子时），这里按「当天子时」处理，仅在展示层提示
  const zhiIdx = Math.floor(((hour + 1) % 24) / 2) % 12;
  const startGan: Record<string, number> = {
    甲: 0, 己: 0,
    乙: 2, 庚: 2,
    丙: 4, 辛: 4,
    丁: 6, 壬: 6,
    戊: 8, 癸: 8,
  };
  const ganIdx = (startGan[dayGan] + zhiIdx) % 10;
  const gan = GAN[ganIdx];
  const zhi = ZHI[zhiIdx];
  void minute;
  return { gan, zhi, text: gan + zhi };
}

export function buildFourPillars(
  y: number,
  m: number,
  d: number,
  hour?: number,
  minute?: number,
): FourPillars {
  // 以当地 12:00 作为默认时刻（无时辰时不影响年月日柱）
  const date = new Date(Date.UTC(y, m - 1, d, hour ?? 12, minute ?? 0));
  const yp = yearPillar(date);
  const mp = monthPillar(date, yp.gan);
  const dp = ganZhi(dayGanZhiIndex(y, m, d));
  const hp = hour === undefined ? null : hourPillar(dp.gan, hour, minute ?? 0);
  const notes: string[] = [];
  if (hour === undefined) notes.push("未填时辰，仅三柱（时柱从略）");
  return { year: yp, month: mp, day: dp, hour: hp, notes };
}

/* ------------------------------------------------------------------ *
 * 十神
 * ------------------------------------------------------------------ */

export type ShiShen =
  | "比肩" | "劫财" | "食神" | "伤官" | "偏财"
  | "正财" | "七杀" | "正官" | "偏印" | "正印";

const SHENG: Record<WuXing, WuXing> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const KE: Record<WuXing, WuXing> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };

/**
 * 以日干为「我」，判另一干的十神。
 * 同我：比肩(同阴阳) / 劫财(异)
 * 我生：食神(同) / 伤官(异)
 * 我克：偏财(同) / 正财(异)
 * 克我：七杀(同) / 正官(异)
 * 生我：偏印(同) / 正印(异)
 */
export function shiShen(dayGan: Gan, other: Gan): ShiShen {
  const me = GAN_ELEMENT[dayGan];
  const it = GAN_ELEMENT[other];
  const sameYinYang = GAN_YINYANG[dayGan] === GAN_YINYANG[other];
  if (it === me) return sameYinYang ? "比肩" : "劫财";
  if (SHENG[me] === it) return sameYinYang ? "食神" : "伤官";
  if (KE[me] === it) return sameYinYang ? "偏财" : "正财";
  if (KE[it] === me) return sameYinYang ? "七杀" : "正官";
  return sameYinYang ? "偏印" : "正印";
}

/* ------------------------------------------------------------------ *
 * 五行加权计数
 *
 * 天干各计 1.0；地支按藏干权重分配（本气 0.6 / 中气 0.3 / 余气 0.1）。
 * 这是简化的「扶抑法」用量，不追求古法各种流派的口径。
 * ------------------------------------------------------------------ */

const HIDDEN_WEIGHT = [0.6, 0.3, 0.1];

export function elementCount(pillars: (Pillar | null)[]): Record<WuXing, number> {
  const acc: Record<WuXing, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const p of pillars) {
    if (!p) continue;
    acc[GAN_ELEMENT[p.gan]] += 1;
    const hidden = ZHI_HIDDEN[p.zhi];
    hidden.forEach((g, i) => {
      acc[GAN_ELEMENT[g]] += HIDDEN_WEIGHT[i] ?? 0.1;
    });
  }
  for (const k of WUXING) acc[k] = Math.round(acc[k] * 10) / 10;
  return acc;
}

/** 日主强弱：简化为「同党（比劫+印）vs 异党（食伤+财+官杀）」占比。 */
export function dayMasterStrength(dayGan: Gan, counts: Record<WuXing, number>) {
  const me = GAN_ELEMENT[dayGan];
  const shengMe = (Object.keys(SHENG) as WuXing[]).find((k) => SHENG[k] === me)!;
  const ally = counts[me] + counts[shengMe];
  const total = WUXING.reduce((s, k) => s + counts[k], 0) || 1;
  const ratio = ally / total;
  const label = ratio >= 0.55 ? "身强" : ratio <= 0.42 ? "身弱" : "中和";
  return { ratio: Math.round(ratio * 100), label, ally: Math.round(ally * 10) / 10 };
}
