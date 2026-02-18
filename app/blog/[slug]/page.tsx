import { notFound } from "next/navigation";

export default function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  // Blog posts not yet available
  notFound();
}
