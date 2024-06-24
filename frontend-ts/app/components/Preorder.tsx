"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import PlaceOrder from "./PlaceOrder";

const Preorder = () => {
    const deliveryInfo =
        "Delivering to all US/UK/Singapore locations starting August 2024.";
    return (
        <div className="p-8 flex sm:flex-row rounded-xl flex-col gap-4 max-w-screen-md mx-auto justify-between bg-amber-100">
            <div className="min-w-[120px] sm:block hidden">
                <Image src="/coco2.png" alt="toy" width={120} height={120} />
            </div>

            <div className="flex flex-col gap-4">
                <h2 className="text-2xl font-semibold">
                    Preorder a Parakeet Toy
                </h2>
                <p className="text-sm text-gray-500">
                    We are excited to accept preorders. Get a personalized,
                    AI-enabled plushie that fosters a growth-mindset and
                    supplements learning for your child. Preorder now to get 25%
                    off.
                </p>
                <p className="text-xs font-semibold text-gray-500">
                    {deliveryInfo}
                </p>
            </div>
            <div className="flex sm:flex-col flex-row gap-2 items-center">
                <Link
                    href="https://buy.stripe.com/4gweUX6Po6Hx6oEeUZ"
                    className="w-full"
                >
                    <Button
                        variant="primary"
                        className="font-bold w-full"
                        size="lg"
                    >
                        Preorder
                    </Button>
                </Link>
                <PlaceOrder>
                    <Button
                        variant="primary_outline"
                        className="font-bold"
                        size="lg"
                    >
                        See demo
                    </Button>
                </PlaceOrder>
            </div>
        </div>
    );
};

export default Preorder;
