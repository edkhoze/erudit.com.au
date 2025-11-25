import { getPostData, getSortedPostsData } from "@/lib/posts";
import ReactMarkdown from "react-markdown";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
    const posts = getSortedPostsData();
    return posts.map((post) => ({
        slug: post.slug,
    }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = getPostData(slug);

    if (!post) {
        return {
            title: "Post Not Found",
        };
    }

    return {
        title: `${post.title} | Erudit Consulting`,
        description: post.excerpt,
    };
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = getPostData(slug);

    if (!post) {
        notFound();
    }

    return (
        <article className="container px-4 md:px-8 max-w-3xl py-20">
            <header className="mb-12 text-center">
                <div className="text-sm text-primary mb-4">{post.date}</div>
                <h1 className="text-4xl font-extrabold tracking-tight mb-6">{post.title}</h1>
                <div className="flex justify-center gap-2">
                    {post.tags?.map((tag) => (
                        <span key={tag} className="text-sm bg-muted text-muted-foreground px-3 py-1 rounded-full">
                            {tag}
                        </span>
                    ))}
                </div>
            </header>

            <div className="prose prose-invert prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary/80">
                <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
        </article>
    );
}
