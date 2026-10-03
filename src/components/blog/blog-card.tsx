import Link from "next/link";
import { BlogCover } from "@/components/blog/blog-cover";
import type { PostMeta } from "@/lib/blog";
import { formatDate } from "@/lib/format";

export function BlogCard({ post }: { post: PostMeta }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group flex flex-col gap-5 lg:gap-6">
      <BlogCover post={post} />
      <div className="flex flex-col gap-3">
        <h3 className="line-clamp-2 text-xl leading-snug font-medium group-hover:text-primary lg:text-2xl lg:leading-[1.2]">
          {post.title}
        </h3>
        <PostByline post={post} />
      </div>
    </Link>
  );
}

export function PostByline({ post }: { post: PostMeta }) {
  return (
    <p className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm uppercase md:text-base">
      <span>{post.author}</span>
      <span className="size-1 rounded-full bg-current" aria-hidden />
      <time dateTime={post.date}>{formatDate(post.date)}</time>
    </p>
  );
}
