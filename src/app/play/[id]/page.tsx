import { notFound } from "next/navigation";
import StoryPlayer from "@/components/StoryPlayer";
import { STORIES } from "@/lib/story";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ b?: string }>;
}) {
  const { id } = await params;
  const { b } = await searchParams;
  const story = STORIES[id];
  if (!story) notFound();
  const parsed = Number(b);
  const initialIndex = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
  return <StoryPlayer story={story} initialIndex={initialIndex} />;
}
