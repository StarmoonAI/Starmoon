import { Metadata } from "next";
import { getOpenGraphMetadata } from "@/lib/utils";

export const metadata: Metadata = {
    title: "Login",
    ...getOpenGraphMetadata("Login"),
};

export default async function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-1 flex-col mx-auto w-full max-w-[1440px] gap-6 px-4 items-center py-2 sm:py-8">
            <div className="h-[calc(100vh-10.8em)]-">{children}</div>
        </div>
    );
}
