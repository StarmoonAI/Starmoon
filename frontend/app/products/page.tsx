import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import { CheckCircle, Info } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Product {
    title: string;
    description: string;
    imageSrc: string;
    features: string[];
    price: number;
    tag: string;
    paymentLink: string;
    originalPrice: number;
    shadow: string;
}

const DeliveryString = "Delivery starting November 2024";

const products: Product[] = [
    {
        title: "Starmoon AI Device",
        description:
            "The Starmoon AI device provides all AI characters packed into one fully assembled compact device that can be added to any object",
        imageSrc: "/images/front_view.png",
        features: [
            "2-month FREE access to Starmoon AI subscription",
            "Unlimited access to Starmoon characters till we deliver your device",
            "On-the-go empathic companion for anyone",
            "Access any AI character from the Starmoon universe",
            "Compact and easy to use",
            "Customizable to fit any object",
            "Over 4 days standby and 6 hours of continuous voice interaction",
            "Understand your conversational insights",
        ],
        originalPrice: 89,
        price: 59,
        tag: "Most Popular",
        paymentLink: "https://buy.stripe.com/eVa3cfb5E9TJ3cs6ou",
        shadow: "0 4px 6px rgba(255, 215, 0, 0.2), 0 8px 24px rgba(218, 165, 32, 0.5) !important;",
    },
    {
        title: "Starmoon AI DIY Dev Kit",
        description:
            "The Starmoon AI Dev Kit is a powerful tool for developers to create their own AI characters and integrate them into the Starmoon universe.",
        imageSrc: "/case1.png",
        features: [
            "All hardware components included in your Starmoon kit",
            "Unlimited access to Starmoon characters till we deliver your device",
            "Tools to create your own AI character",
            "Integrate your AI character into the Starmoon universe",
            "Access to the Starmoon AI SDK",
            "Access to the Starmoon AI Discord community",
        ],
        originalPrice: 79,
        price: 49,
        tag: "Best Value",
        paymentLink: "https://buy.stripe.com/3cs6ora1A2rheVa3cj",
        shadow: "0 4px 6px rgba(135, 206, 235, 0.2), 0 8px 24px rgba(70, 130, 180, 0.5) !important;",
    },
];

export default async function Home() {
    return (
        <div className="flex-auto flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-medium">Products</h1>
                <p className="text-md text-gray-600 inline-block">
                    Choose the product that fits your needs.{" "}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="w-6 h-6"
                            >
                                <Info size={14} />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-3">
                            <p className="text-xs p-0">
                                All receipts will reflect Starmoon AI, operating
                                as HeyHaddock, Inc. (DBA). Thank you for your
                                understanding.
                            </p>
                        </PopoverContent>
                    </Popover>
                </p>
            </div>

            <div className="flex flex-col gap-10">
                {products.map((product, index) => (
                    <Card
                        key={`productCard-${index}`}
                        className={`w-full rounded-3xl max-w-2xl overflow-hidden transition-all duration-300 shadow-md`}
                    >
                        <CardFooter className="flex gap-6 justify-between items-center p-6 bg-muted/50">
                            <div className="flex flex-row items-baseline gap-2">
                                <div className="text-2xl font-bold">
                                    ${product.price}
                                </div>
                                <div className="text-lg text-muted-foreground opacity-80 line-through">
                                    ${product.originalPrice}
                                </div>
                            </div>

                            <Link href={product.paymentLink} passHref>
                                <Button
                                    size="sm"
                                    variant="primary"
                                    className="rounded-full"
                                >
                                    Preorder Now
                                </Button>
                            </Link>
                        </CardFooter>
                        <CardHeader className="p-2">
                            <div className="w-full">
                                <Image
                                    src={product.imageSrc}
                                    alt={product.title}
                                    width={600} // Specify desired width
                                    height={400} // Specify desired height
                                    layout="responsive" // Use responsive layout
                                    objectFit="contain" // Ensure the image fits without cropping
                                    className="px-4"
                                />
                            </div>
                        </CardHeader>

                        <CardContent className="p-8 relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="mt-8">
                                    <CardTitle className="text-3xl font-bold mb-2">
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
                            <div className="space-y-4 mb-2">
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">
                                        Features
                                    </h3>
                                    <ul className="space-y-2">
                                        {product.features.map((feature) => (
                                            <li
                                                key={feature}
                                                className="flex flex-row gap-1 items-center"
                                            >
                                                <CheckCircle
                                                    style={{
                                                        height: "20px",
                                                        width: "20px",
                                                    }}
                                                    strokeWidth={3}
                                                    className="min-h-5 min-w-5 text-green-500 mr-2"
                                                />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground absolute bottom-3 right-3">
                                {DeliveryString}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
