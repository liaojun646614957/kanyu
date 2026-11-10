import { notFound } from "next/navigation";
import StoryPlayer from "@/components/StoryPlayer";
import { STORIES } from "@/lib/story";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ b?: string; phase?: string; step?: string }>;
}) {
  const { id } = await params;
  const { b, phase, step } = await searchParams;
  const story = STORIES[id];
  if (!story) notFound();
  const parsed = Number(b);
  const initialIndex = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
  const initialPhase = phaseFromQuery(step, phase, b);
  return <StoryPlayer story={story} initialIndex={initialIndex} initialPhase={initialPhase} />;
}

function phaseFromQuery(step: string | undefined, phase: string | undefined, b: string | undefined) {
  if (step === "onboarding") return "onboarding" as const;
  if (step === "story") return "play" as const;
  if (step === "input") return "input" as const;
  if (step === "loading:free" || step === "loadingFree") return "loadingFree" as const;
  if (step === "teaser") return "teaser" as const;
  if (step === "loading:paid" || step === "loadingPaid") return "loadingPaid" as const;
  if (step === "result") return "ending" as const;
  if (phase === "loading") return "loadingFree" as const;
  if (b) return "play" as const;
  return "onboarding" as const;
}
