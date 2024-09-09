import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDownIcon } from "lucide-react";

interface PickPersonalityProps {
    onPersonalityPicked: (personalityId: string) => void;
    allPersonalities: IPersonality[];
    selectedPersonalityId: string;
    isDisabled?: boolean;
}

const PickPersonality: React.FC<PickPersonalityProps> = ({
    onPersonalityPicked,
    allPersonalities,
    selectedPersonalityId,
    isDisabled,
}) => {
    const selectedPersonality = allPersonalities.find(
        (personality) => personality.personality_id === selectedPersonalityId
    );

    return (
        <div className="flex flex-col gap-2">
            <Popover>
                <PopoverTrigger asChild disabled={isDisabled}>
                    <Button variant="outline">
                        {selectedPersonality?.title}{" "}
                        <ChevronDownIcon className="ml-2 h-4 w-4 text-muted-foreground" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Select new personality..." />
                        <CommandList>
                            <CommandEmpty>No roles found.</CommandEmpty>
                            <CommandGroup>
                                {allPersonalities.map((personality) => (
                                    <CommandItem
                                        key={personality.personality_id}
                                        onClick={() =>
                                            onPersonalityPicked(
                                                personality.personality_id
                                            )
                                        }
                                        className="teamaspace-y-1 px-4 py-2 flex flex-row"
                                    >
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
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            <p className="text-sm text-gray-500 self-start">
                Choose a personality
            </p>
        </div>
    );
};

export default PickPersonality;
