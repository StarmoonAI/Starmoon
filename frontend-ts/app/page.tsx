import { createClient } from "@/utils/supabase/server";

import { getHumeAccessToken } from "@/lib/getHumeAccessToken";
import Products from "./components/Products";
import { getAllToys, getToyById } from "@/db/toys";
import { defaultToyId } from "@/lib/data";
import { getUserById } from "@/db/users";
import Preorder from "./components/Preorder";
import LandingPageSection from "./components/LandingPageSection";
import { Separator } from "@/components/ui/separator";
import Footer from "./components/Footer";

const Sections = [
    {
        title: "A companion for your child that fosters a growth mindset",
        description:
            "Our toys are designed to be thoughtful and engaging companions that foster a growth mindset by design.",
        imageSrc: "/growth.jpg",
    },
    {
        title: "Supplementing learning while reducing screen time",
        description:
            "AI designed to supplement learning while reducing screen time and providing a more engaging experience for your child.",
        imageSrc: "/learning.jpg",
        isImageRight: true,
    },
    {
        title: "Prioritising safety and content guidelines.",
        description:
            "All content is carefully curated and designed to foster a safe environment for children. Additionally we give parents granular controls to set content guidelines.",
        imageSrc: "/safety.jpg",
    },
    {
        title: "AI-driven insights for parents. With privacy first.",
        description:
            "We provide insights to parents on their child's learning and emotional growth. We take privacy seriously and all personal data is encrypted.",
        imageSrc: "/privacy.jpg",
        isImageRight: true,
    },
];

export default async function Index() {
    const accessToken = await getHumeAccessToken();

    if (!accessToken) {
        throw new Error();
    }

    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    console.log(user);

    const dbUser = user ? await getUserById(supabase, user.id) : undefined;
    const allToys = await getAllToys(supabase);
    const toy = await getToyById(supabase, dbUser?.toy_id ?? defaultToyId);

    return (
        <main className="font-quicksand ">
            <div className="flex flex-col gap-4 h-full mx-auto px-4 md:px-6 mt-6 lg:px-8 mb-[4rem]">
                <div className="flex flex-col items-center gap-2 justify-center">
                    <h1 className="text-4xl font-bold text-center ">
                        Welcome to Starmoon AI :)
                    </h1>
                    <p className="text-center text-xl font-quicksand">
                        We make AI-enabled toys for children that foster
                        learning & growth.
                    </p>
                </div>
                <Products allToys={allToys} toy={toy!} user={dbUser} />
                <Preorder />
                <div className="flex flex-col">
                    {Sections.map((section, index) => (
                        <LandingPageSection key={index} {...section} />
                    ))}
                </div>
            </div>
            <Footer />
        </main>
    );
}
