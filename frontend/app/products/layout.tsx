export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-1 flex-col mx-auto w-full max-w-[1400px] gap-6 py-2 sm:py-4 md:flex-row">
            <div className="md:max-w-screen-lg mx-auto p-4">{children}</div>
        </div>
    );
}
