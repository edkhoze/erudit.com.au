import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero() {
    return (
        <section className="relative overflow-hidden py-20 md:py-32 lg:py-40">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-grid-pattern [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none mix-blend-screen" />

            <div className="container px-4 md:px-8 max-w-screen-2xl relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">

                    {/* Text Content */}
                    <div className="max-w-3xl text-center lg:text-left mx-auto lg:mx-0">
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-8 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <Sparkles className="h-4 w-4" />
                            <span>Next-Gen Digital Consulting</span>
                        </div>

                        <h1 className="mb-8 text-5xl font-extrabold tracking-tight sm:text-6xl xl:text-7xl bg-gradient-to-b from-white via-white to-white/50 bg-clip-text text-transparent drop-shadow-sm animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                            Elevate Your Digital Presence with <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 text-glow">Erudit</span>
                        </h1>

                        <p className="mb-10 text-xl text-muted-foreground sm:text-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                            Expert consulting in Sitecore DXP, .NET, Azure Cloud, and Digital Marketing. We build scalable, secure, highly personalized and performant digital experiences.
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                            <Button asChild size="lg" className="h-12 px-8 text-base bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0 shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all hover:scale-105">
                                <Link href="/#contact">
                                    Work With Us <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base border-white/10 bg-white/5 hover:bg-white/10 hover:text-white backdrop-blur-sm transition-all hover:scale-105">
                                <Link href="/#services">Explore Services</Link>
                            </Button>
                        </div>
                    </div>

                    {/* Hero Image */}
                    <div className="relative mx-auto lg:mx-0 w-full max-w-[500px] lg:max-w-none animate-in fade-in zoom-in duration-1000 delay-500">
                        <div className="relative aspect-square w-full">
                            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 rounded-full blur-3xl -z-10 animate-pulse" />
                            <Image
                                src="/images/hero-abstract.png"
                                alt="Digital Transformation Abstract"
                                fill
                                className="object-contain drop-shadow-[0_0_50px_rgba(6,182,212,0.3)] animate-float"
                                priority
                            />
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
