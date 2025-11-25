import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
    return (
        <section className="relative overflow-hidden py-20 md:py-32">
            <div className="container px-4 md:px-8 max-w-screen-2xl relative z-10">
                <div className="mx-auto max-w-3xl text-center">
                    <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-6xl bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-transparent">
                        Elevate Your Digital Presence with <span className="text-primary">Erudit</span>
                    </h1>
                    <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
                        Expert consulting in Sitecore DXP, .NET, Azure Cloud, and Digital Marketing. We build scalable, secure, and personalized digital experiences.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-[0_0_20px_rgba(var(--primary),0.4)]">
                            <Link href="/#contact">Work With Us</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="border-primary/20 hover:bg-primary/10 hover:text-primary">
                            <Link href="/#services">Our Services</Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Background Gradient Blob */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        </section>
    );
}
