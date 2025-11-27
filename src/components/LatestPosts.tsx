import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSortedPostsData } from "@/lib/posts";
import { ArrowRight } from "lucide-react";

export async function LatestPosts() {
    const posts = getSortedPostsData().slice(0, 3);

    return (
        <section className="py-20">
            <div className="container px-4 md:px-8 max-w-screen-2xl">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Latest Insights</h2>
                        <p className="text-muted-foreground">
                            Thoughts on technology, strategy, and AI / LLMs.
                        </p>
                    </div>
                    <Link href="/blog" className="hidden md:flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium">
                        View all posts <ArrowRight className="h-4 w-4" />
                    </Link>
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
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                <div className="mt-8 text-center md:hidden">
                    <Link href="/blog" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium">
                        View all posts <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
