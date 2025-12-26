import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { LatestPosts } from "@/components/LatestPosts";
import { About } from "@/components/About";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <About />
      <Services />
      <LatestPosts />

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-muted/30">
        <div className="container px-4 md:px-8 max-w-screen-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">Let&apos;s get to work</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Reach out and have a chat about how Erudit can help you.
          </p>
          <a href="mailto:jobs@edkhoze.com" className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
            Get in Touch
          </a>
        </div>
      </section>
    </div>
  );
}
