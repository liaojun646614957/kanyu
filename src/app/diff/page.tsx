import { notFound } from "next/navigation";
import DiffBoard from "@/components/DiffBoard";

/** 只在本地开发时打开。生产构建直接 404，不进首页。 */
export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DiffBoard />;
}
