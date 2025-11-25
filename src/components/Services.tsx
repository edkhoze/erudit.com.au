import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, Cloud, Megaphone, LayoutTemplate } from "lucide-react";

const services = [
    {
        title: "Sitecore DXP",
        description: "Enterprise-grade content management and digital experience platform implementation and optimization.",
        icon: LayoutTemplate,
    },
    {
        title: ".NET / C# Development",
        description: "Robust, scalable custom software solutions built on the latest Microsoft .NET framework.",
        icon: Code2,
    },
    {
        title: "Azure Cloud",
        description: "Cloud-native architecture, migration, and management on Microsoft Azure.",
        icon: Cloud,
    },
    {
        title: "Digital Marketing",
        description: "Data-driven strategies to grow your audience and increase engagement.",
        icon: Megaphone,
    },
];

export function Services() {
    return (
        <section id="services" className="py-20 bg-muted/30">
            <div className="container px-4 md:px-8 max-w-screen-2xl">
                <div className="mb-12 text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Our Expertise</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        We deliver end-to-end solutions tailored to your business needs.
                    </p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {services.map((service) => (
                        <Card key={service.title} className="bg-card/50 backdrop-blur border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
                            <CardHeader>
                                <service.icon className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>{service.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-base">
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
