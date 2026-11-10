import { notFound } from "next/navigation";
import OpeningShell from "@/components/OpeningShell";
import StoryMount from "@/components/StoryMount";
import { STORIES } from "@/lib/story";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const story = STORIES[id];
  if (!story) notFound();
  return (
    <>
      <OpeningShell story={story} />
      <StoryMount story={story} />
    </>
  );
}
