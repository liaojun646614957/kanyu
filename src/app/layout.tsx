import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "看余 · 读一读你的出厂设置",
  description:
    "输入生日，看看你这一柱是什么人。八字日柱、六爻摇卦、每日一抽。娱乐向性格参考，不构成任何决策建议。",
  keywords: ["日柱", "八字", "摇卦", "六爻", "每日运势", "性格测试"],
  openGraph: {
    title: "看余 · 读一读你的出厂设置",
    description: "输入生日，看看你这一柱是什么人。",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0a09",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="relative min-h-dvh">
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
