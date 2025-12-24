import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { compileMDX } from 'next-mdx-remote/rsc';

const contentDirectory = path.join(process.cwd(), 'content');

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  content: string;
}

export interface BlogPostMetadata {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
}

export async function getBlogPosts(): Promise<BlogPostMetadata[]> {
  const blogDirectory = path.join(contentDirectory, 'blog');
  
  if (!fs.existsSync(blogDirectory)) {
    return [];
  }

  const files = fs.readdirSync(blogDirectory);
  const posts = files
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => {
      const slug = file.replace('.mdx', '');
      const filePath = path.join(blogDirectory, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(fileContent);

      return {
        slug,
        title: data.title || '',
        description: data.description || '',
        date: data.date || '',
        tags: data.tags || [],
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}

export async function getBlogPost(slug: string) {
  const filePath = path.join(contentDirectory, 'blog', `${slug}.mdx`);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContent);

  const { content: mdxContent } = await compileMDX({
    source: content,
    options: {
      parseFrontmatter: true,
    },
  });

  return {
    slug,
    title: data.title || '',
    description: data.description || '',
    date: data.date || '',
    tags: data.tags || [],
    content: mdxContent,
  };
}
