import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { PostByline } from "@/components/blog/blog-card";
import { BlogCover } from "@/components/blog/blog-cover";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { CtaBanner } from "@/components/layout/cta-banner";
import { getAllPosts, getPost } from "@/lib/blog";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Artikel tidak ditemukan" };
  return { title: post.title, description: post.excerpt };
}

export default async function BlogDetailPage({ params }: Params) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <>
      <Breadcrumb items={[{ label: "Blog & Berita", href: "/blog" }, { label: post.title }]} />
      <article className="container-page flex flex-col gap-8 pt-10 pb-16 md:pt-14 lg:pt-[60px] lg:pb-24">
        <div className="mx-auto flex w-full max-w-[800px] flex-col gap-8">
          <header className="flex flex-col gap-3">
            <h1 className="text-[32px] leading-[1.15] font-medium tracking-tight md:text-[40px] lg:leading-[1.2]">
              {post.title}
            </h1>
            <PostByline post={post} />
          </header>
          <BlogCover post={post} size="hero" />
          <div className="prose-article">
            <MDXRemote source={post.content} />
          </div>
        </div>
      </article>
      <CtaBanner />
    </>
  );
}
