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
import { ShoppingCart, Store } from "lucide-react";
import PreorderModal from "./components/Upsell/PreorderModal";
import { Button } from "@/components/ui/button";

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
    description: "Starmoon, your low-cost physical empathic AI companion",
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
                                    <p className="flex items-center font-chewy font-medium text-xl text-stone-800 dark:text-stone-100">
                                        Starmoon AI
                                    </p>
                                    {/* <p className="text-xs text-gray-500">beta</p> */}
                                </a>

                                <div className="flex flex-row gap-4 items-center font-bold text-sm">
                                    <Link
                                        href="https://github.com/StarmoonAI/Starmoon"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Visit our GitHub"
                                    >
                                        <Button
                                            size="sm"
                                            variant="link"
                                            className="flex flex-row gap-2 px-0 py-[6px] items-center"
                                        >
                                            <FaGithub className="text-xl" />
                                            <p className="hidden sm:flex font-medium">
                                                GitHub
                                            </p>
                                        </Button>
                                    </Link>
                                    <NavbarButtons user={user} />
                                    <PreorderModal>
                                        <Button
                                            size="sm"
                                            variant="primary"
                                            className="flex flex-row px-3 py-[6px] items-center"
                                        >
                                            <ShoppingCart size={18} />
                                            <p className="pl-2 hidden sm:flex font-medium">
                                                Preorder
                                            </p>
                                        </Button>
                                    </PreorderModal>
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
