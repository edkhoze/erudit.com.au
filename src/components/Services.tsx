import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, Cloud, Megaphone, LayoutTemplate } from "lucide-react";

const services = [
    {
        title: "Sitecore DXP",
        description: "Enterprise-grade content management and digital experience platform implementation and optimization.",
        icon: LayoutTemplate,
    },
    {
        title: "AI-assisted .NET Development",
        description: "Robust, scalable & secure software solutions built on .NET using latest AI tools.",
        icon: Code2,
    },
    {
        title: "Azure Cloud",
        description: "Cloud-native architecture, migration, as well as solution development and optimization on Microsoft Azure.",
        icon: Cloud,
    },
    {
        title: "Digital Consulting Services",
        description: "Helping to make sense of rapidly changing digital landscape.",
        icon: Megaphone,
    },
];

export function Services() {
    return (
        <section id="services" className="py-16 md:py-24 relative">
            <div className="container px-4 md:px-8 max-w-screen-2xl relative z-10">
                <div className="mb-10 md:mb-16 text-center">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">Our Expertise</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
                        We can help you in the following areas
                    </p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {services.map((service) => (
                        <Card key={service.title} className="bg-white/5 backdrop-blur-xl border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:border-primary/50 group overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <CardHeader>
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                    <service.icon className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle className="text-xl group-hover:text-primary transition-colors">{service.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-base text-muted-foreground/80">
                                    {service.description}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
