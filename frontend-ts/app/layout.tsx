import {
    Inter,
    Baloo_2,
    Comic_Neue,
    Quicksand,
    Chewy,
    Fredoka,
} from "next/font/google";
import localFont from "next/font/local";

import { DeepgramContextProvider } from "./context/DeepgramContextProvider";
import { MicrophoneContextProvider } from "./context/MicrophoneContextProvider";

import "./globals.css";

import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import supabaseServerClient from "@/db/supabaseServerClient";
import NavbarButtons from "./components/NavbarButtons";
import { Toaster } from "@/components/ui/toaster";
import Footer from "./components/Footer";

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
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

const chewy = Chewy({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-chewy",
    weight: ["400"],
});

const fredoka = Fredoka({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-fredoka",
});

const favorit = localFont({
    src: "./fonts/ABCFavorit-Bold.woff2",
    variable: "--font-favorit",
});

const fonts = `${inter.variable} ${baloo2.variable} ${comicNeue.variable} ${quicksand.variable} ${chewy.variable} ${fredoka.variable} ${favorit.variable}`;

export const viewport: Viewport = {
    themeColor: "#fef3c7",
    initialScale: 1,
    width: "device-width",
    // maximumScale: 1, hitting accessability
};

export const metadata: Metadata = {
    metadataBase: new URL("https://parakeetai.vercel.app"),
    title: "Parakeet AI",
    description: `We make toys you can grow and learn with.`,
    robots: {
        index: false,
        follow: false,
    },
};

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = supabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    return (
        <html lang="en" className={`h-dvh ${fonts}`}>
            <body>
                <div className="bg-amber-50 h-[4rem] flex items-center">
                    <header className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 flex items-center justify-between">
                        <div className="flex flex-row gap-1">
                            <a
                                className="flex items-center font-extrabold font-quicksand text-4xl text-amber-600"
                                href="/"
                            >
                                Parakeet AI
                            </a>
                            <p className="text-sm text-gray-600">beta</p>
                        </div>
                        <NavbarButtons user={user} />
                    </header>
                </div>
                <div className="min-h-screen flex-1">
                    <MicrophoneContextProvider>
                        <DeepgramContextProvider>
                            {children}
                        </DeepgramContextProvider>
                    </MicrophoneContextProvider>
                </div>
                <Toaster />
                <Footer />
            </body>
        </html>
    );
}
