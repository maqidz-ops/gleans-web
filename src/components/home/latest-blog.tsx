import Link from "next/link";
import { BlogCard } from "@/components/blog/blog-card";
import { SectionHeading } from "@/components/layout/section-heading";
import { Button } from "@/components/ui/button";
import { getAllPosts } from "@/lib/blog";

export function LatestBlog() {
  const posts = getAllPosts().slice(0, 3);
  if (posts.length === 0) return null;

  return (
    <section className="section-y">
      <div className="container-page flex flex-col gap-10 md:gap-14 lg:gap-20">
        <SectionHeading
          title="Artikel terbaru"
          description="Tips menulis, panduan sitasi, dan kabar seputar dunia kampus."
        />
        <div className="flex flex-col items-center gap-12 lg:gap-[60px]">
          <div className="grid w-full gap-10 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {posts.map((post, i) => (
              <div key={post.slug} className={i === 2 ? "md:hidden lg:block" : undefined}>
                <BlogCard post={post} />
              </div>
            ))}
          </div>
          <Button asChild size="pill" className="w-full font-normal sm:w-[180px]">
            <Link href="/blog">Baca Selengkapnya</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
