import { Separator } from "@/components/ui/separator";
import { createClient } from "@/utils/supabase/server";
import Image from "next/image";

interface Product {
    title: string;
    description: string;
    imageSrc: string;
    features: string[];
    price: number;
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
    },
    {
        title: "Starmoon AI Dev kit",
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
    },
];

export default async function Home() {
    const supabase = createClient();

    return (
        <div className="flex flex-col gap-2">
            <div className="overflow-hidden flex-auto flex flex-col gap-2 px-1">
                <h1 className="text-3xl font-semibold">Products</h1>
                <p className="text-lg">
                    Choose the product that fits your needs.
                </p>
                {products.map((product) => (
                    <div key={product.title} className="flex flex-col gap-2">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-2xl font-semibold">
                                {product.title}
                            </h2>
                            <p className="text-lg">{product.description}</p>
                            <Image
                                src={product.imageSrc}
                                alt={product.title}
                                objectFit="cover"
                                width={100}
                                height={100}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <h3 className="text-xl font-semibold">Features</h3>
                            <ul>
                                {product.features.map((feature) => (
                                    <li key={feature}>{feature}</li>
                                ))}
                            </ul>
                            <p className="text-lg font-semibold">
                                Price: ${product.price}
                            </p>
                        </div>
                        <Separator />
                    </div>
                ))}
            </div>
        </div>
    );
}
