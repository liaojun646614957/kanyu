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
 * 大包脚本到了再接管。
 * 在这之前第一页由 OpeningShell 显示，点击也由它的小脚本处理，不白等水合。
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
