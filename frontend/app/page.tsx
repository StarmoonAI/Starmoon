import { createToys, getAllToys, getToyById } from "@/db/toys";
import { getUserById } from "@/db/users";
import { createClient } from "@/utils/supabase/server";
import { defaultToyId, toys } from "@/lib/data";
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
import { Gamepad2, Joystick, Store } from "lucide-react";

export default async function Index() {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const dbUser = user ? await getUserById(supabase, user.id) : undefined;
    let allToys = await getAllToys(supabase);

    if (allToys.length === 0) {
        try {
            await createToys(supabase, toys);
            allToys = toys;
            console.log("Toys created", allToys.length);
        } catch (error) {
            console.error(error);
        }
    }

    const toy = await getToyById(supabase, dbUser?.toy_id ?? defaultToyId);

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

            <div className="max-w-3xl text-center mx-8 md:mx-auto">
                <h1
                    className="ont-inter-tight text-4xl md:text-6xl font-semibold mt-14 tracking-tight text-stone-900 "
                    style={{ lineHeight: "1.25" }}
                >
                    The open-source{" "}
                    <span className="text-amber-500">low-cost</span>{" "}
                    voice-enabled AI device for
                </h1>

                <AnimatedText></AnimatedText>

                <p className="font-inter font-light mt-14 text-lg sm:text-xl leading-8 text-stone-800">
                    Starmoon is an affordable, compact, voiced-enabled AI
                    device. It can analyse human-speech and emotion and respond
                    with empathy, offering supportive conversations through
                    personalized AI characters.
                </p>
            </div>

            <div className="mt-10 flex items-center justify-center gap-x-8">
                <PreorderModal>
                    <Button className="flex flex-row items-center gap-2 font-medium text-base bg-stone-800 leading-8 rounded-full">
                        <Store size={20} />
                        <span>Preorder</span>
                    </Button>
                </PreorderModal>
                <Link href={user ? "/home" : "/login"}>
                    <Button className="flex flex-row items-center gap-2 font-medium text-base text-stone-800 leading-8 rounded-full bg-transparent border-2 border-stone-900 hover:bg-stone-500 hover:bg-opacity-5">
                        <Gamepad2 size={20} />
                        <span>Play Online</span>
                    </Button>
                </Link>
            </div>

            <CharacterPicker />
            <Usecases></Usecases>
            <InsightsDemoSection></InsightsDemoSection>
            <FeaturesSection></FeaturesSection>
            <EndingSection></EndingSection>
        </main>
        // <main className="isolate flex-1 flex flex-col mx-auto w-full max-w-[1440px] gap-6 px-4 my-8">
        //   <div className="relative pt-2">
        //     <div
        //       aria-hidden="true"
        //       className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        //     >
        //       <div
        //         style={{
        //           clipPath:
        //             "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
        //         }}
        //         className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ffae00] to-[#ce96ff] opacity-35 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
        //       />
        //     </div>
        //     <div className="py-4 sm:py-6">
        //       <div className="mx-auto max-w-7xl">
        //         <div className="mx-auto max-w-3xl text-center">
        //           <h1
        //             className="font-inter text-4xl font-bold tracking-tight text-stone-800 sm:text-6xl"
        //             style={{ lineHeight: "1.25" }}
        //           >
        //             The open-source <span className="text-amber-500">low-cost</span>{" "}
        //             voice-enabled AI device{" "}
        //           </h1>
        //           <p className="mt-6 text-2xl leading-8 text-stone-600">
        //             for companionship, entertainment, learning and more...
        //           </p>
        //         </div>
        //       </div>
        //     </div>

        //     <Products allToys={allToys} toy={toy!} user={dbUser} />

        //     <div
        //       aria-hidden="true"
        //       className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
        //     >
        //       <div
        //         style={{
        //           clipPath:
        //             "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
        //         }}
        //         className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ffc038] to-[#f596ff] opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
        //       />
        //     </div>
        //   </div>

        //   <Preorder />

        //   <div className="relative -z-10 px-6 lg:px-8">
        //     <div
        //       aria-hidden="true"
        //       className="absolute inset-x-0 top-0 -z-10 flex -translate-y-1/2 transform-gpu justify-center overflow-hidden blur-3xl sm:bottom-0 sm:right-[calc(50%-6rem)] sm:top-auto sm:translate-y-0 sm:transform-gpu sm:justify-end"
        //     >
        //       <div
        //         style={{
        //           clipPath:
        //             "polygon(73.6% 48.6%, 91.7% 88.5%, 100% 53.9%, 97.4% 18.1%, 92.5% 15.4%, 75.7% 36.3%, 55.3% 52.8%, 46.5% 50.9%, 45% 37.4%, 50.3% 13.1%, 21.3% 36.2%, 0.1% 0.1%, 5.4% 49.1%, 21.4% 36.4%, 58.9% 100%, 73.6% 48.6%)",
        //         }}
        //         className="aspect-[1108/632] w-[69.25rem] flex-none bg-gradient-to-r from-[#ffc038] to-[#f596ff] opacity-25"
        //       />
        //     </div>

        //     <div
        //       aria-hidden="true"
        //       className="absolute left-1/2 right-0 top-1/2 -z-10 hidden-translate-y-1/2 transform-gpu overflow-hidden blur-3xl sm:block"
        //     >
        //       <div
        //         style={{
        //           clipPath:
        //             "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
        //         }}
        //         className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#ffc038] to-[#f596ff] opacity-30"
        //       />
        //     </div>
        //     <div className="flex flex-col">
        //       {Sections.map((section, index) => (
        //         <LandingPageSection key={index} {...section} />
        //       ))}
        //     </div>
        //   </div>
        // </main>
    );
}
