import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, PlayCircle } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

export interface TestCharacterProps {
    toy: IToy;
    personality: IPersonality;
    character_description: string;
    audio_src: string;
    image_src: string;
}

const TestCharacter: React.FC<TestCharacterProps> = ({
    toy,
    character_description,
    personality,
    audio_src,
    image_src,
}) => {
    // Create a reference to the audio element
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const handlePlayAudio = () => {
        if (audioRef.current) {
            audioRef.current.play();
        }
    };

    return (
        <div
            className="flex w-full p-4 bg-white rounded-[30px] gap-x-2  
hover:scale-[1.01] transition-all duration-300 ease-in-out cursor-pointer shadow-custom_unfocus"
        >
            <div className="w-24 h-24 flex-shrink-0 relative">
                <Image
                    src={`/personality/` + image_src}
                    alt="Description of the image"
                    layout="fill"
                    objectFit="cover"
                    objectPosition="center"
                    className="rounded-[30px]"
                />
            </div>
            <div className="text-left py-2 flex flex-col gap-y-2 relative">
                <Button
                    size="icon"
                    variant="secondary"
                    className="rounded-full w-8 h-8 absolute top-1 right-0"
                    onClick={handlePlayAudio}
                >
                    <Play size={15} fill="bg-gray-400" />
                </Button>
                <audio ref={audioRef} src={audio_src} preload="auto" />
                <h3 className="text-lg gap-4 font-medium text-gray-700 truncate  flex flex-row items-center">
                    <Badge
                        variant="outline"
                        className="flex flex-row items-center gap-1 text-sm font-normal"
                    >
                        <Image
                            objectFit="cover"
                            width={20}
                            height={20}
                            alt={
                                "/personality/" +
                                toy.image_src +
                                "_starmoon.png"
                            }
                            src={
                                "/personality/" +
                                toy.image_src +
                                "_starmoon.png"
                            }
                        />
                        {toy.name}
                    </Badge>
                    <Badge
                        className="flex flex-row items-center gap-1  text-sm font-normal"
                        variant="outline"
                    >
                        <span>{personality.emoji}</span>
                        {personality.title}
                    </Badge>
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 pr-4">
                    {character_description}
                </p>
            </div>
        </div>
    );
};

export default TestCharacter;
