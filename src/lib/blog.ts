import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export const BLOG_CATEGORIES = ["Tutorial", "Tips & Trik", "Edukasi", "Kampus"] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export type PostMeta = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  category: BlogCategory;
  cover?: string;
  readingMinutes: number;
};

export type Post = PostMeta & { content: string };

const BLOG_DIR = path.join(process.cwd(), "content/blog");

function readPost(file: string): Post {
  const slug = file.replace(/\.mdx$/, "");
  const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
  const { data, content } = matter(raw);
  const words = content.trim().split(/\s+/).length;
  return {
    slug,
    title: String(data.title),
    excerpt: String(data.excerpt ?? ""),
    date: data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date),
    author: String(data.author ?? "Tim Gleans"),
    category: (data.category ?? "Edukasi") as BlogCategory,
    cover: data.cover ? String(data.cover) : undefined,
    readingMinutes: Math.max(1, Math.round(words / 200)),
    content,
  };
}

export function categorySlug(category: string) {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const meta: Partial<Post> = readPost(f);
      delete meta.content;
      return meta as PostMeta;
    })
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export function getPost(slug: string): Post | null {
  const file = `${slug}.mdx`;
  if (!/^[a-z0-9-]+$/.test(slug) || !fs.existsSync(path.join(BLOG_DIR, file))) return null;
  return readPost(file);
}
