import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/utils/supabase/server";
import { CheckCircle } from "lucide-react";
import Image from "next/image";

interface Product {
    title: string;
    description: string;
    imageSrc: string;
    features: string[];
    price: number;
    tag: string;
}

const products: Product[] = [
    {
        title: "Starmoon AI Toy",
        description:
            "The Starmoon AI Toy provides all AI characters packed into one compact device that can be added to any object.",
        imageSrc: "/case1.png",
        features: [
            "3-month FREE access to Starmoon subscription",
            "On-the-go empathic companion for anyone",
            "Access any AI character from the Starmoon universe",
            "Compact and easy to use",
            "Customizable to fit any object",
            "Battery life of 12 hours",
            "Understand your conversational trends",
        ],
        price: 79,
        tag: "Most Popular",
    },
    {
        title: "Starmoon AI DIY Dev kit",
        description:
            "The Starmoon AI Dev Kit is a powerful tool for developers to create their own AI characters and integrate them into the Starmoon universe.",
        imageSrc: "/case1.png",
        features: [
            "All hardware components included in your Starmoon kit",
            "Tools to create your own AI character",
            "Integrate your AI character into the Starmoon universe",
            "Access to the Starmoon AI SDK",
            "Access to the Starmoon AI Discord community",
        ],
        price: 49,
        tag: "Best Value",
    },
];

export default async function Home() {
    return (
        <div className="flex flex-col gap-2">
            <div className="overflow-hidden flex-auto flex  flex-col gap-6 px-1">
                <div className="flex flex-col gap-2">
                    <h1 className="text-6xl font-semibold">Products</h1>
                    <p className="text-lg text-gray-600">
                        Choose the product that fits your needs.
                    </p>
                </div>

                <div className="flex flex-col gap-6">
                    {products.map((product, index) => (
                        <Card
                            key={index}
                            className="w-full rounded-3xl max-w-2xl overflow-hidden transition-all duration-300 hover:shadow-lg"
                        >
                            <CardHeader className="p-0">
                                <div className="relative h-56 w-full">
                                    <Image
                                        src={product.imageSrc}
                                        alt={product.title}
                                        layout="fill"
                                        objectFit="cover"
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 relative">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="mt-6">
                                        <CardTitle className="text-4xl font-bold mb-2">
                                            {product.title}
                                        </CardTitle>
                                        <p className="text-muted-foreground">
                                            {product.description}
                                        </p>
                                    </div>
                                    <Badge
                                        variant="secondary"
                                        className="text-sm border-0 absolute top-6 right-6 text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 font-medium rounded-lg text-center"
                                    >
                                        {product.tag}
                                    </Badge>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2">
                                            Features
                                        </h3>
                                        <ul className="space-y-2">
                                            {product.features.map((feature) => (
                                                <li
                                                    key={feature}
                                                    className="flex items-center"
                                                >
                                                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between items-center p-6 bg-muted/50">
                                <div className="text-2xl font-bold">
                                    ${product.price}
                                </div>
                                <Button
                                    size="lg"
                                    className="rounded-full text-md"
                                >
                                    Pre-order Now
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
