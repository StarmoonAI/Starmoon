import LandingPagePersonalityCard from "./LandingPagePersonalityCard";

const Personalities = ({
        allPersonalities,
}: {
        allPersonalities: IPersonality[];
}) => {
        return (
                <div className="relative w-full">
                        <div className="overflow-x-auto scrollbar-hide">
                                <div className="flex flex-row items-center gap-x-4 justify-between whitespace-nowrap px-4 py-8">
                                        {allPersonalities.map((personality) => (
                                                <LandingPagePersonalityCard
                                                        key={
                                                                personality.personality_id
                                                        }
                                                        personality={
                                                                personality
                                                        }
                                                />
                                        ))}
                                </div>
                        </div>
                </div>
        );
};

export default Personalities;
