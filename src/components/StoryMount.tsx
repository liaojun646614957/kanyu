"use client";

import { useEffect, useState } from "react";
import StoryPlayer from "@/components/StoryPlayer";
import type { StoryScript } from "@/lib/story";

declare global {
  interface Window {
    __beat?: number;
    __storyReady?: boolean;
  }
}

/**
 * 第一页的句子由 OpeningShell 先画出来。这里等客户端挂上之后再接管，
 * 服务端不渲染播放器，避免和第一页的字对不上。
 */
export default function StoryMount({ story }: { story: StoryScript }) {
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    window.__storyReady = true;
    const start = window.__beat ?? 0;
    document.getElementById("opening")?.remove();
    setIndex(start);
  }, []);

  if (index === null) return null;
  return <StoryPlayer story={story} initialIndex={index} />;
}
