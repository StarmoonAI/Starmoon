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
} from "next/font/google";
import "./globals.css";
import { createClient } from "@/utils/supabase/server";
import { FaGithub } from "react-icons/fa";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import Footer from "./components/Footer";
import NavbarButtons from "./components/NavbarButtons";
import StarmoonLogo from "./components/StarmoonLogo";

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

const fredoka = Fredoka({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fredoka",
});

const fonts = `${inter.variable} ${baloo2.variable} ${comicNeue.variable} ${quicksand.variable} ${fredoka.variable}`;

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
      <body className="bg-background text-foreground flex flex-col min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="flex-grow mx-auto w-full flex flex-col">
            <div className="backdrop-blur-[3px] h-[4rem]- h-[60px] flex-none flex items-center sticky top-0 z-50">
              <nav className="mx-auto w-full max-w-[1400px] px-4 flex items-center justify-between">
                <a className="flex flex-row gap-3" href="/">
                  <StarmoonLogo width={33} height={33}></StarmoonLogo>
                  <p className="flex items-center font-medium font-inter md:text-xl text-lg text-stone-800 dark:text-stone-100">
                    Starmoon AI
                  </p>
                  {/* <p className="text-xs text-gray-500">beta</p> */}
                </a>

                <div className="flex flex-row md:gap-4 gap-2 items-center font-bold md:text-sm text-sm">
                  <div className="flex flex-row md:gap-4 gap-2 items-center">
                    <Link href="/order">
                      <div className="flex flex-row md:px-4 px-2 py-[6px] items-center text-stone-800 dark:text-stone-50 hover:text-stone-700 bg-stone-50- hover:bg-stone-100 dark:hover:bg-stone-900 bg-nav-bar rounded-full">
                        <p className="font-medium">Preorder</p>
                      </div>
                    </Link>

                    <Link href="/doc">
                      <div className="flex flex-row md:px-4 px-2 py-[6px] items-center text-stone-800 dark:text-stone-50 hover:text-stone-700 bg-stone-50- hover:bg-stone-100 dark:hover:bg-stone-900 bg-nav-bar rounded-full">
                        <p className="font-medium">Docs</p>
                      </div>
                    </Link>

                    <Link
                      href="https://github.com/StarmoonAI/Starmoon"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Visit our GitHub"
                    >
                      <div className="flex flex-row gap-2 md:px-4 px-2 py-[6px] items-center text-stone-800 dark:text-stone-50 hover:text-stone-700 bg-stone-50- hover:bg-stone-100 dark:hover:bg-stone-900 bg-nav-bar rounded-full">
                        <FaGithub className="text-2xl" />
                        <p className="font-medium">GitHub</p>
                      </div>
                    </Link>
                  </div>
                  <NavbarButtons user={user} />
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
