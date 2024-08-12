// export const dynamic = "force-dynamic";

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-1 flex-col items-center py-2 sm:py-8">
            {children}
        </div>
    );
}
