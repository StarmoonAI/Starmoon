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
import { getAssistantAvatar } from "@/lib/utils";

interface PickPersonalityProps {
    onVoicePicked: (toyId: string) => void;
    allToys: IToy[];
    selectedToyId: string;
    isDisabled?: boolean;
}

const PickVoice: React.FC<PickPersonalityProps> = ({
    onVoicePicked,
    allToys,
    selectedToyId,
    isDisabled,
}) => {
    const selectedToy = allToys.find((toy) => toy.toy_id === selectedToyId);
    return (
        <div className="flex flex-col gap-2">
            <Popover>
                <PopoverTrigger asChild disabled={isDisabled}>
                    <Button variant="outline">
                        {selectedToy?.name}{" "}
                        <ChevronDownIcon className="ml-2 h-4 w-4 text-muted-foreground" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Select new voice..." />
                        <CommandList>
                            <CommandEmpty>No roles found.</CommandEmpty>
                            <CommandGroup>
                                {allToys.map((toy) => (
                                    <CommandItem
                                        key={toy.toy_id}
                                        onClick={() =>
                                            onVoicePicked(toy.toy_id)
                                        }
                                        className="teamaspace-y-1 flex flex-row px-4 py-2"
                                    >
                                        <div className="w-1/4">
                                            <Image
                                                src={getAssistantAvatar(
                                                    toy.image_src!
                                                )}
                                                width={100}
                                                height={100}
                                                alt={toy.name}
                                                className="transition-transform duration-300 ease-in-out scale-90 transform hover:scale-100 hover:-rotate-2"
                                            />
                                        </div>
                                        <div className="w-3/4 flex flex-col items-start p-2">
                                            <p>{toy.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {toy.prompt}
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
                Pick a character voice
            </p>
        </div>
    );
};

export default PickVoice;
