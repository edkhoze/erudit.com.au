import Link from "next/link";

export function Footer() {
    return (
        <footer className="border-t border-border/40 bg-background py-6 md:py-0">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-4 md:px-8 max-w-screen-2xl">
                <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        &copy; {new Date().getFullYear()} Erudit Consulting. All rights reserved.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        Privacy Policy
                    </Link>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        Terms of Service
                    </Link>
                </div>
            </div>
        </footer>
    );
}
