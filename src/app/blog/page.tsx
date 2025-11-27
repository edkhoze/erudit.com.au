import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSortedPostsData } from "@/lib/posts";

export const metadata = {
    title: "Blog | Erudit Consulting",
    description: "Insights on Sitecore, .NET, Azure, and Digital Marketing.",
};

export default function BlogIndex() {
    const posts = getSortedPostsData();

    return (
        <div className="container px-4 md:px-8 max-w-screen-2xl py-20">
            <div className="mb-12 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight mb-4">Insights & Articles</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Explore our latest thoughts on technology, strategy, and AI / LLMs.
                </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                    <Link key={post.slug} href={`/blog/${post.slug}`}>
                        <Card className="h-full bg-card/50 backdrop-blur border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 group">
                            <CardHeader>
                                <div className="text-sm text-primary mb-2">{post.date}</div>
                                <CardTitle className="group-hover:text-primary transition-colors line-clamp-2">
                                    {post.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground line-clamp-3">
                                    {post.excerpt}
                                </p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {post.tags?.map((tag) => (
                                        <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
