import Image from "next/image";
import { AudioWaveform } from "lucide-react";
import { getAssistantAvatar, isDefaultVoice } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/select";
import { SelectValue } from "@radix-ui/react-select";

interface PickPersonalityProps {
    onVoicePicked: (toy: IToy) => void;
    allToys: IToy[];
    toyState: IToy;
    isDisabled?: boolean;
}

/**
 *
 * NOTE: toy and voice are being used interchangeably here
 */
const PickVoice: React.FC<PickPersonalityProps> = ({
    onVoicePicked,
    allToys,
    toyState,
    isDisabled,
}) => {
    return (
        <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-600 self-start flex flex-row items-center gap-2">
                <span>Character voice</span>
            </p>
            <Select
                onValueChange={(value: string) => {
                    const voicePicked = allToys.find(
                        (toy) => toy.toy_id === value
                    )!;
                    onVoicePicked(voicePicked);
                }}
                defaultValue={toyState?.toy_id}
            >
                <SelectTrigger disabled={isDisabled} className="rounded-full gap-2">
                    <AudioWaveform size={18} />
                    {toyState?.name}{" "}
                </SelectTrigger>
                <SelectContent>
                    {allToys.map((toy) => (
                        <SelectItem
                            value={toy.toy_id}
                            key={toy.toy_id}
                            onClick={() => onVoicePicked(toy)}
                        >
                            <div className="flex flex-row items-center">
                                <div className="w-1/4">
                                    <Image
                                        src={getAssistantAvatar(toy.image_src!)}
                                        width={100}
                                        height={100}
                                        alt={toy.name}
                                        className="transition-transform duration-300 ease-in-out scale-90 transform hover:scale-100 hover:-rotate-2"
                                    />
                                </div>
                                <div className="w-3/4 flex flex-col items-start p-2">
                                    <p>
                                        {toy.name}
                                        {isDefaultVoice(toy) && " (default)"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {toy.prompt}
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

export default PickVoice;
