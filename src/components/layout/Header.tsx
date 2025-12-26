import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function Header() {
    return (
        <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4 md:px-8 max-w-screen-2xl">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative h-8 w-8 overflow-hidden rounded-lg">
                        <Image
                            src="/logo.png"
                            alt="Erudit Logo"
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent text-glow">
                        Erudit
                    </span>
                </Link>

                <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                    <Link href="/" className="transition-colors hover:text-primary">
                        Home
                    </Link>
                    <Link href="/#services" className="transition-colors hover:text-primary">
                        Services
                    </Link>
                    <Link href="/blog" className="transition-colors hover:text-primary">
                        Blog
                    </Link>
                    <Link href="/#contact" className="transition-colors hover:text-primary">
                        Contact
                    </Link>
                </nav>

                <div className="flex items-center gap-4">
                    <Button asChild variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(var(--primary),0.5)]">
                        <Link href="/#contact">Let&apos;s get to work</Link>
                    </Button>
                </div>
            </div>
        </header>
    );
}
