import { createToys, getAllToys, getToyById } from "@/db/toys";
import { getUserById } from "@/db/users";
import { createClient } from "@/utils/supabase/server";

import { defaultToyId } from "@/lib/data";

import Products from "../components/Products";
import Preorder from "../components/Preorder";
import LandingPageSection from "../components/LandingPageSection";

const Sections = [
    {
        title: "Growth Mindset",
        progress: "A companion for your child that fosters a growth mindset",
        description:
            "Our toys are designed to be thoughtful and engaging companions that foster a growth mindset by design.",
        imageSrc: "/growth.jpg",
    },
    {
        title: "Learning and Screen Time",
        progress: "Supplementing learning while reducing screen time",
        description:
            "AI designed to supplement learning while reducing screen time and providing a more engaging experience for your child.",
        imageSrc: "/learning.jpg",
        isImageRight: true,
    },
    {
        title: "Safety and Guidelines",
        progress: "Prioritising safety and content guidelines.",
        description:
            "All content is carefully curated and designed to foster a safe environment for children. Additionally we give parents granular controls to set content guidelines.",
        imageSrc: "/safety.jpg",
    },
    {
        title: "Privacy and Trends",
        progress: "AI-driven trends. With privacy first.",
        description:
            "We provide insights & trends to parents on their child's learning and emotional growth. We take privacy seriously and all personal data is encrypted.",
        imageSrc: "/privacy.jpg",
        isImageRight: true,
    },
];

export default async function Home() {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const dbUser = user ? await getUserById(supabase, user.id) : undefined;
    let allToys = await getAllToys(supabase);
    const toy = await getToyById(supabase, dbUser?.toy_id ?? defaultToyId);

    return (
        <main className="isolate flex-1 flex flex-col mx-auto w-full max-w-[1440px] gap-6 px-4 my-8">
            <div className="relative pt-2">
                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
                >
                    <div
                        style={{
                            clipPath:
                                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
                        }}
                        className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ffae00] to-[#ce96ff] opacity-35 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
                    />
                </div>
                <div className="py-4 sm:py-6">
                    <div className="mx-auto max-w-7xl">
                        <div className="mx-auto max-w-3xl text-center">
                            <h1
                                className="font-inter text-4xl font-bold tracking-tight text-stone-800 sm:text-6xl"
                                style={{ lineHeight: "1.25" }}
                            >
                                The open-source{" "}
                                <span className="text-amber-500">low-cost</span>{" "}
                                voice-enabled AI device{" "}
                            </h1>
                            <p className="mt-6 text-2xl leading-8 text-stone-600">
                                for companionship, entertainment, learning and
                                more...
                            </p>
                        </div>
                    </div>
                </div>

                <Products allToys={allToys} toy={toy!} user={dbUser} />

                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
                >
                    <div
                        style={{
                            clipPath:
                                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
                        }}
                        className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ffc038] to-[#f596ff] opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
                    />
                </div>
            </div>

            <Preorder />

            <div className="relative -z-10 px-6 lg:px-8">
                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 -z-10 flex -translate-y-1/2 transform-gpu justify-center overflow-hidden blur-3xl sm:bottom-0 sm:right-[calc(50%-6rem)] sm:top-auto sm:translate-y-0 sm:transform-gpu sm:justify-end"
                >
                    <div
                        style={{
                            clipPath:
                                "polygon(73.6% 48.6%, 91.7% 88.5%, 100% 53.9%, 97.4% 18.1%, 92.5% 15.4%, 75.7% 36.3%, 55.3% 52.8%, 46.5% 50.9%, 45% 37.4%, 50.3% 13.1%, 21.3% 36.2%, 0.1% 0.1%, 5.4% 49.1%, 21.4% 36.4%, 58.9% 100%, 73.6% 48.6%)",
                        }}
                        className="aspect-[1108/632] w-[69.25rem] flex-none bg-gradient-to-r from-[#ffc038] to-[#f596ff] opacity-25"
                    />
                </div>

                <div
                    aria-hidden="true"
                    className="absolute left-1/2 right-0 top-1/2 -z-10 hidden-translate-y-1/2 transform-gpu overflow-hidden blur-3xl sm:block"
                >
                    <div
                        style={{
                            clipPath:
                                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
                        }}
                        className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#ffc038] to-[#f596ff] opacity-30"
                    />
                </div>
                <div className="flex flex-col">
                    {Sections.map((section, index) => (
                        <LandingPageSection key={index} {...section} />
                    ))}
                </div>
            </div>
        </main>
    );
}
