"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import PlaceOrder from "./PlaceOrder";
import { useState } from "react";

const Preorder = () => {
  const [isDesktop, setIsDesktop] = useState(true); // Example value
  const [open, setOpen] = useState(false);

  const deliveryInfo =
    "Delivering to all US/UK/Singapore locations starting October 2024.";
  return (
    <div className="p-8 my-16 flex sm:flex-row rounded-xl flex-col gap-4 max-w-screen-md mx-auto justify-between bg-gradient-to-l from-gray-200 via-fuchsia-200 to-stone-100">
      <div className="min-w-[120px] sm:block hidden">
        <Image src="/mama_mia.png" alt="toy" width={120} height={120} />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">Get Your Starmoon Toy!</h2>
        <p className="text-sm font-medium">
          We are accepting preorders! Get your personalized, AI-enabled plushie
          that fosters a growth-mindset and supplements learning for your child.
          Preorder now to get 25% off.
        </p>
        <p className="text-xs text-gray-500">{deliveryInfo}</p>
      </div>
      <div className="flex sm:flex-col flex-row gap-2 items-center">
        <Link
          href="https://buy.stripe.com/4gweUX6Po6Hx6oEeUZ"
          className="w-full"
        >
          <Button variant="default" className="font-bold w-full" size="lg">
            Preorder
          </Button>
        </Link>
        <PlaceOrder isDesktop={isDesktop} open={open} setOpen={setOpen}>
          <Button variant="outline" className="font-bold" size="lg">
            See demo
          </Button>
        </PlaceOrder>
      </div>
    </div>
  );
};

export default Preorder;
