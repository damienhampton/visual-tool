import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getBlogPosts } from "@/lib/mdx";

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <div className="container py-24">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
          Blog
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Insights, tutorials, and updates from the 26 Diagrams team.
        </p>
      </div>

      {posts.length > 0 ? (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {posts.map((post, index) => (
            <Link key={index} href={`/blog/${post.slug}`}>
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {post.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                  <CardTitle>{post.title}</CardTitle>
                  <CardDescription>
                    {new Date(post.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{post.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center">
          <p className="text-muted-foreground">
            No blog posts yet. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}
