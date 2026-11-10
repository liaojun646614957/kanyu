import type { CSSProperties, ReactNode } from "react";

/**
 * 普通链接，不挂客户端点击。
 * 首页卡片如果靠 onClick，得点到整包脚本水合完才进得去。
 */
export default function LinkCard({
  href,
  className,
  style,
  children,
}: {
  href: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className={`press group relative cursor-pointer overflow-hidden rounded-2xl text-left no-underline ${className ?? ""}`}
      style={style}
    >
      {children}
    </a>
  );
}
