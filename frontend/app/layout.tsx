import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import {
    Inter,
    Baloo_2,
    Comic_Neue,
    Quicksand,
    Chewy,
    Fredoka,
    Lora,
    Inter_Tight,
} from "next/font/google";
import "./globals.css";
import { createClient } from "@/utils/supabase/server";
import { FaGithub } from "react-icons/fa";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import Footer from "./components/Footer";
import NavbarButtons from "./components/NavbarButtons";
import StarmoonLogo from "./components/StarmoonLogo";
import { BriefcaseBusiness, ShoppingCart, Store } from "lucide-react";
import PreorderModal from "./components/Upsell/PreorderModal";
import { Button } from "@/components/ui/button";
import { starmoonProductsLink } from "@/lib/data";

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
});

const inter_tight = Inter_Tight({
    weight: ["500", "600", "700"],
    style: ["normal", "italic"],
    subsets: ["latin"],
    variable: "--font-inter-tight",
    display: "swap",
});

const baloo2 = Baloo_2({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-baloo2",
});

const comicNeue = Comic_Neue({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-comic-neue",
    weight: ["300", "400", "700"],
});

const quicksand = Quicksand({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-quicksand",
});

const fredoka = Fredoka({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-fredoka",
});

const lora = Lora({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-lora",
});

const fonts = `${inter.variable} ${inter_tight.variable} ${baloo2.variable} ${comicNeue.variable} ${quicksand.variable} ${fredoka.variable} ${lora.variable}`;

const defaultUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata = {
    metadataBase: new URL(defaultUrl),
    title: "Starmoon",
    description: "Starmoon, your affordable conversational AI companion",
};

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    return (
        <html
            lang="en"
            className={`${GeistSans.className} h-full ${fonts}`}
            suppressHydrationWarning
        >
            <body className="bg-background text-foreground flex flex-col min-h-screen bg-gray-50">
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <main className="flex-grow mx-auto w-full flex flex-col">
                        <div className="backdrop-blur-[3px] h-[4rem]- h-[60px] flex-none flex items-center sticky top-0 z-50">
                            <nav className="mx-auto w-full max-w-[1440px] px-4 flex items-center justify-between">
                                <a className="flex flex-row gap-3" href="/">
                                    <StarmoonLogo
                                        width={33}
                                        height={33}
                                    ></StarmoonLogo>
                                    <p className="flex items-center font-chewy font-medium text-xl text-stone-800 dark:text-gray-700">
                                        Starmoon AI
                                    </p>
                                    {/* <p className="text-xs text-gray-500">beta</p> */}
                                </a>

                                <div className="flex flex-row gap-2 items-center font-bold text-sm ">
                                    <Link
                                        href="https://github.com/StarmoonAI/Starmoon"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Visit our GitHub"
                                        // className="bg-nav-bar rounded-full px-3"
                                    >
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="flex flex-row gap-2 items-center rounded-full bg-nav-bar"
                                        >
                                            <FaGithub className="text-xl" />
                                            <p className="hidden sm:flex font-medium">
                                                GitHub
                                            </p>
                                        </Button>
                                    </Link>
                                    <NavbarButtons user={user} />
                                    <Link href={starmoonProductsLink} passHref>
                                        <Button
                                            size="sm"
                                            variant="primary"
                                            className="flex flex-row gap-2 items-center rounded-full border-2 border-gray-400"
                                        >
                                            <ShoppingCart size={18} />
                                            <p className="hidden sm:flex font-medium">
                                                Preorder
                                            </p>
                                        </Button>
                                    </Link>
                                </div>
                            </nav>
                        </div>
                        {children}
                        <Footer />
                    </main>

                    <Analytics />
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    );
}
