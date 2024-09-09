import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from "@/components/ui/carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AudioLines, Check, PersonStanding } from "lucide-react";
import React from "react";
import ToyPicker from "../ToyPicker";
import { createClient } from "@/utils/supabase/client";
import { updateUser } from "@/db/users";
import { useToast } from "@/components/ui/use-toast";

interface PickCharacterProps {
    selectedUser: IUser;
    selectedToy: IToy;
    allToys: IToy[];
    allPersonalities: IPersonality[];
}

const isPersonalitySelected = (personalityId: string, selectedUser: IUser) => {
    return selectedUser.personality_id === personalityId;
};

export default function PickCharacter({
    selectedUser,
    selectedToy,
    allToys,
    allPersonalities,
}: PickCharacterProps) {
    const supabase = createClient();
    const { toast } = useToast();

    const pickToy = async (toy: IToy) => {
        // chooseToy(toy);
        await updateUser(
            supabase,
            { toy_id: toy.toy_id },
            selectedUser!.user_id
        );
        toast({
            description: "Your toy has been saved.",
        });
    };

    const [api, setApi] = React.useState<CarouselApi>();
    const [current, setCurrent] = React.useState(0);
    const [count, setCount] = React.useState(0);
    const [activeTab, setActiveTab] = React.useState("personality");

    React.useEffect(() => {
        if (!api) {
            return;
        }

        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap() + 1);

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1);
        });
    }, [api]);

    return (
        <div className="w-full max-w-7xl mx-auto">
            <h1 className="text-2xl">Pick your character</h1>
            <p className="text-sm text-gray-400">
                Personalize your toy character by selecting a personality and
                voice
            </p>
            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
            >
                <TabsList className="grid w-full sm:w-1/2 grid-cols-2 my-4">
                    <TabsTrigger
                        value="personality"
                        className="flex flex-row items-center gap-1"
                    >
                        <PersonStanding size={18} />
                        Personality
                    </TabsTrigger>
                    <TabsTrigger
                        value="voice"
                        className="flex flex-row items-center gap-1"
                    >
                        <AudioLines size={18} />
                        Voice
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="voice">
                    <ToyPicker
                        allToys={allToys}
                        currentToy={selectedToy}
                        buttonText={"Pick"}
                        imageSize={250}
                        chooseToy={pickToy}
                        showHelpText={false}
                    />
                </TabsContent>
                <TabsContent value="personality">
                    <div className="w-full mx-auto px-10">
                        <Carousel
                            setApi={setApi}
                            opts={{
                                align: "start",
                                loop: true,
                            }}
                            className="w-full"
                        >
                            <CarouselContent>
                                {allPersonalities.map((personality) => (
                                    <CarouselItem
                                        key={personality.personality_id}
                                        className="sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
                                    >
                                        <Card className="overflow-hidden rounded-lg">
                                            <div className="h-[370px] relative">
                                                <img
                                                    src={`/aria.png`}
                                                    alt={personality.title}
                                                    className="w-full h-2/3 object-cover transition-transform duration-300 ease-in-out transform hover:scale-110"
                                                />
                                                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-white p-4 flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h3 className="font-semibold text-lg">
                                                                    {
                                                                        personality.title
                                                                    }
                                                                </h3>
                                                            </div>
                                                            <Button
                                                                size="icon"
                                                                className="w-6 h-6 ml-1 flex-shrink-0"
                                                                onClick={async () => {
                                                                    await updateUser(
                                                                        supabase,
                                                                        {
                                                                            personality_id:
                                                                                personality.personality_id,
                                                                        },
                                                                        selectedUser.user_id
                                                                    );
                                                                }}
                                                            >
                                                                <Check
                                                                    size={14}
                                                                />
                                                            </Button>
                                                        </div>
                                                        <p className="text-sm text-gray-600">
                                                            {
                                                                personality.subtitle
                                                            }
                                                        </p>
                                                    </div>
                                                    {isPersonalitySelected(
                                                        personality.personality_id,
                                                        selectedUser
                                                    ) && (
                                                        <span className="text-xs flex-end text-gray-400">
                                                            Selected
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious />
                            <CarouselNext />
                        </Carousel>
                        <div className="py-2 text-center text-sm text-muted-foreground">
                            Personality {current} of {count}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
