"use client";

import Illustration from "@/public/hero_section.svg";
import { Button } from "@/components/ui/button";
import BookDemoModal from "./BookDemoModal";
import { CalendarCheck, ShoppingCart, Star, Store } from "lucide-react";
import { FaDiscord, FaGithub } from "react-icons/fa";
import Link from "next/link";
import {
    discordInviteLink,
    githubPublicLink,
    starmoonProductsLink,
} from "@/lib/data";

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

            <div className="max-w-4xl text-center mx-8 md:mx-auto">
                <h1
                    className="ont-inter-tight text-4xl md:text-6xl font-semibold mt-14 tracking-tight text-stone-900 "
                    style={{ lineHeight: "1.25" }}
                >
                    Bring life into anything—toys, plushies and a whole lot
                    more.
                </h1>

                <h1 className="text-4xl md:text-5xl mt-8 font-lora text-light">
                    Get your Starmoon today.
                </h1>
            </div>

            <div className="mt-20 flex flex-col items-center justify-center gap-8">
                <div className="flex items-center justify-center gap-8 flex-wrap">
                    <Link href={starmoonProductsLink} passHref>
                        <Button className="flex flex-row items-center gap-2 font-medium text-base bg-white leading-8 rounded-full">
                            <ShoppingCart size={20} />
                            <span>Preorder Now</span>
                        </Button>
                    </Link>
                    <Link
                        href="https://calendly.com/akadeb/starmoon-ai-enterprise-demo"
                        passHref
                    >
                        <Button
                            variant="secondary"
                            className="flex flex-row bg-white items-center gap-2 font-medium text-base text-stone-800 leading-8 rounded-full border-2 border-stone-900"
                        >
                            <CalendarCheck size={20} />
                            <span>Book a Demo</span>
                        </Button>
                    </Link>
                </div>
                <div className="flex items-center justify-center gap-8 flex-wrap">
                    <Link href={githubPublicLink} passHref>
                        <Button
                            variant="link"
                            className="flex flex-row items-center gap-2 font-medium text-base text-stone-800 leading-8 rounded-full bg-transparent"
                        >
                            <Star size={20} className="text-2xl" />
                            <span>Star us on GitHub</span>
                        </Button>
                    </Link>
                    <Link href={discordInviteLink} passHref>
                        <Button
                            variant="link"
                            className="flex flex-row items-center gap-2 font-medium text-base text-stone-800 leading-8 rounded-full bg-transparent"
                        >
                            <FaDiscord className="text-2xl" />
                            <span>Join our Discord</span>
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
