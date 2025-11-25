import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-8">
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                            Erudit
                        </span>
                    </Link>
                </div>

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
                        <Link href="/#contact">Get Started</Link>
                    </Button>
                </div>
            </div>
        </header>
    );
}
