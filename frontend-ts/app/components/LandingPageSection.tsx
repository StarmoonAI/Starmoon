import Image from "next/image";

interface LandingPageSectionProps {
    title: string;
    description: string;
    imageSrc: string;
    isImageRight?: boolean;
}

const LandingPageSection: React.FC<LandingPageSectionProps> = ({
    title,
    description,
    imageSrc,
    isImageRight,
}) => {
    return (
        <div
            className={`flex flex-col max-w-screen-lg ${
                isImageRight ? "sm:flex-row" : "sm:flex-row-reverse"
            } gap-4 justify-between mx-auto items-center`}
        >
            <Image src={imageSrc} alt="toy" width={300} height={300} />
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl text-gray-800 font-semibold">
                    {title}
                </h2>
                <p className="text-lg font-medium text-gray-400">
                    {description}
                </p>
            </div>
        </div>
    );
};

export default LandingPageSection;
