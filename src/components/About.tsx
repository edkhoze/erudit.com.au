import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export function About() {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="container px-4 md:px-8 max-w-screen-2xl relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">

                    {/* Image Side */}
                    <div className="relative order-2 lg:order-1 animate-in fade-in slide-in-from-left-8 duration-1000 view-timeline-name:--reveal">
                        <div className="relative aspect-square w-full max-w-[500px] mx-auto">
                            <div className="absolute inset-0 bg-gradient-to-bl from-cyan-500/20 to-purple-500/20 rounded-full blur-3xl -z-10" />
                            <Image
                                src="/images/about-tech.png"
                                alt="Digital Transformation"
                                fill
                                className="object-contain drop-shadow-[0_0_30px_rgba(168,85,247,0.2)] animate-float"
                                style={{ animationDelay: "2s" }}
                            />
                        </div>
                    </div>

                    {/* Text Side */}
                    <div className="order-1 lg:order-2">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                            Driving Digital Excellence
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                            At Erudit, we believe that technology should be an enabler, not a barrier. Our mission is to empower businesses with scalable, secure, and personalized digital solutions that drive real growth.
                        </p>

                        <div className="space-y-4 mb-8">
                            {[
                                "Solution Design and Architecture",
                                "Digital Marketing Consulting",
                                "AI-assisted content management and software development",
                                "Fixing long standing issues with your existing solutions"
                            ].map((item) => (
                                <div key={item} className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                    <span className="text-foreground/80">{item}</span>
                                </div>
                            ))}
                        </div>

                        {/*  <Button asChild size="lg" className="bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm">
                            <Link href="/#contact">Learn More About Us</Link>
                        </Button> */}
                    </div>

                </div>
            </div>
        </section>
    );
}
