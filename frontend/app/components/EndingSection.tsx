"use client";

import Illustration from "@/public/hero_section.svg";
import InsightsDemo from "./InsightsDemo";
import { Button } from "@/components/ui/button";
import AnimatedText from "./AnimatedText";

export default function EndingSection() {
  return (
    <section className="py-8  md:py-24">
      <div className="relative w-full max-w-[1440px] mx-auto">
        <div
          className="absolute -top-24 pointer-events-none -z-10 opacity-90 w-full h-[650px] bg-cover bg-center bg-no-repeat blur-3xl"
          style={{
            backgroundImage: `url(${Illustration.src})`,
            transform: "scaleX(-1)",
          }}
          aria-hidden="true"
        ></div>
      </div>

      <div className="max-w-3xl text-center mx-8 md:mx-auto">
        <h1
          className="ont-inter-tight text-3xl md:text-6xl font-semibold mt-14 tracking-tight text-stone-900 "
          style={{ lineHeight: "1.25" }}
        >
          Over 20,000 success stories and counting…
        </h1>

        <h1 className="text-4xl sm:text-4xl mt-4 font-lora text-light">
          Get your Starmoon today!
        </h1>
      </div>

      <div className="my-20 flex items-center justify-center gap-x-8">
        <Button className="font-medium text-base bg-stone-800 leading-8 rounded-full">
          Preorder Now
        </Button>
        <Button className="font-medium text-base text-stone-800 leading-8 rounded-full bg-transparent border-2 border-stone-900 hover:bg-stone-500 hover:bg-opacity-5">
          Book a Demo
        </Button>
      </div>
    </section>
  );
}
