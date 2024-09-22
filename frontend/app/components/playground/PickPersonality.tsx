import Image from "next/image";

import { PersonStanding } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/select";
import { isDefaultPersonality, removeEmojis } from "@/lib/utils";

interface PickPersonalityProps {
    onPersonalityPicked: (personalityPicked: IPersonality) => void;
    allPersonalities: IPersonality[];
    personalityState: IPersonality;
    toyState: IToy;
    isDisabled?: boolean;
}

const PickPersonality: React.FC<PickPersonalityProps> = ({
    onPersonalityPicked,
    allPersonalities,
    personalityState,
    toyState,
    isDisabled,
}) => {
    //   set
    return (
        <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-600 self-start flex flex-row items-center gap-2">
                <span>Personality</span>
            </p>{" "}
            <Select
                onValueChange={(value: string) => {
                    const personalityPicked = allPersonalities.find(
                        (personality) => personality.personality_id === value
                    )!;
                    onPersonalityPicked(personalityPicked);
                }}
                defaultValue={personalityState?.personality_id}
            >
                <SelectTrigger
                    disabled={isDisabled}
                    className="rounded-full gap-2"
                >
                    <PersonStanding size={18} />
                    {personalityState?.title}{" "}
                </SelectTrigger>
                <SelectContent>
                    {allPersonalities.map((personality) => (
                        <SelectItem
                            key={personality.personality_id}
                            value={personality.personality_id}
                        >
                            <div className="flex flex-row items-center">
                                <div className="w-20 h-20 flex-shrink-0">
                                    <Image
                                        src={`/personality/${toyState?.image_src}_${personality.title
                                            .toLowerCase()
                                            .replace(/\s+/g, "_")}.png`}
                                        width={100}
                                        height={100}
                                        alt={personality.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex flex-col items-start p-2">
                                    <p>
                                        {personality.title}
                                        {isDefaultPersonality(personality) &&
                                            " (default)"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {personality.subtitle}
                                    </p>
                                </div>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};

export default PickPersonality;
