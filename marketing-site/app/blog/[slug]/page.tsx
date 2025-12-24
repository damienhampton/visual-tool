import { notFound } from "next/navigation";
import { getBlogPost, getBlogPosts } from "@/lib/mdx";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);
  
  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: `${post.title} | 26 Diagrams Blog`,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="container py-24 max-w-4xl">
      <Link 
        href="/blog" 
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Blog
      </Link>

      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <div className="mb-8">
          <div className="flex gap-2 mb-4">
            {post.tags.map((tag: string, i: number) => (
              <Badge key={i} variant="secondary">{tag}</Badge>
            ))}
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">{post.title}</h1>
          <p className="text-muted-foreground">
            {new Date(post.date).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <div className="mt-8">
          {post.content}
        </div>
      </article>
    </div>
  );
}
