import { notFound } from "next/navigation";
import StoryPlayer from "@/components/StoryPlayer";
import { STORIES } from "@/lib/story";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const story = STORIES[id];
  if (!story) notFound();
  return <StoryPlayer story={story} />;
}
