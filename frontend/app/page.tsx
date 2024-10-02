import { createToys, getAllToys, getToyById } from "@/db/toys";
import { getUserById } from "@/db/users";
import { createClient } from "@/utils/supabase/server";
import Illustration from "@/public/hero_section.svg";

import { Button } from "@/components/ui/button";
import CharacterPicker from "./components/CharacterPicker";
import AnimatedText from "./components/AnimatedText";
import Usecases from "./components/Usecases";
import InsightsDemoSection from "./components/InsightsDemoSection";
import FeaturesSection from "./components/FeaturesSection";
import EndingSection from "./components/EndingSection";
import Link from "next/link";
import PreorderModal from "./components/Upsell/PreorderModal";
import { Gamepad2, ShoppingCart } from "lucide-react";
import { getAllPersonalities } from "@/db/personalities";

export default async function Index() {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const allToys = (await getAllToys(supabase)) ?? [];
    const allPersonalities = await getAllPersonalities(supabase);

    return (
        <main className="flex flex-1 flex-col mx-auto w-full gap-6 my-8">
            {/* Illustration */}
            <div className="relative w-full max-w-[1440px] mx-auto">
                <div
                    className="absolute -top-24 pointer-events-none -z-10 opacity-90 w-full h-[650px] bg-cover bg-center bg-no-repeat blur-2xl"
                    style={{ backgroundImage: `url(${Illustration.src})` }}
                    aria-hidden="true"
                ></div>
            </div>

            <div className="max-w-4xl text-center mx-8 md:mx-auto">
                <h1
                    className="font-inter-tight- text-4xl md:text-6xl font-semibold sm:mt-14 tracking-tight text-stone-900 "
                    style={{ lineHeight: "1.25" }}
                >
                    A compact, conversational, and open-source AI device for
                </h1>

                <AnimatedText />

                <p className="font-inter font-light mt-14 text-lg sm:text-xl leading-8 text-stone-800">
                    With a platform that supports real-time conversations safe
                    for all ages, manages your AI characters, with long-term
                    memory, RAG-based responses, and more.
                </p>
            </div>

            <div className="flex items-center justify-center gap-x-8 mt-10">
                <Link href="/products" passHref>
                    <Button className="flex flex-row items-center gap-2 font-medium text-base bg-stone-800 leading-8 rounded-full">
                        <ShoppingCart size={20} />
                        <span>Preorder</span>
                    </Button>
                </Link>
                <Link href={user ? "/home" : "/login"}>
                    <Button className="flex flex-row items-center bg-white gap-2 font-medium text-base text-stone-800 leading-8 rounded-full border-2 border-stone-900 hover:bg-gray-100">
                        <Gamepad2 size={20} />
                        <span>Play Online</span>
                    </Button>
                </Link>
            </div>

            <CharacterPicker
                allToys={allToys}
                allPersonalities={allPersonalities}
            />
            <Usecases></Usecases>
            <InsightsDemoSection></InsightsDemoSection>
            <FeaturesSection></FeaturesSection>
            <EndingSection></EndingSection>
        </main>
    );
}
