import Image from "next/image";

import { PersonStanding } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/select";

interface PickPersonalityProps {
    onPersonalityPicked: (personalityPicked: IPersonality) => void;
    allPersonalities: IPersonality[];
    personalityState: IPersonality;
    isDisabled?: boolean;
}

const PickPersonality: React.FC<PickPersonalityProps> = ({
    onPersonalityPicked,
    allPersonalities,
    personalityState,
    isDisabled,
}) => {
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
                <SelectTrigger disabled={isDisabled} className="gap-2">
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
                                <div className="w-1/4">
                                    <Image
                                        src={"/aria.png"}
                                        width={100}
                                        height={100}
                                        alt={personality.title}
                                        className="w-full h-auto"
                                    />
                                </div>
                                <div className="w-3/4 flex flex-col items-start p-2">
                                    <p>{personality.title}</p>
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
