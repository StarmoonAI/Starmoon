"use client";

import React, { useEffect, useRef, useState } from "react";
import { useWebSocketHandler } from "@/hooks/useWebSocketHandler";
import { createClient } from "@/utils/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn, getCreditsRemaining } from "@/lib/utils";
import ControlPanel from "./ControlPanel";
import { Messages } from "./Messages";
import { MoonStar, Sparkles } from "lucide-react";
import Image from "next/image";
import PickPersonality from "./PickPersonality";
import PickVoice from "./PickVoice";
import { updateUser } from "@/db/users";
import _ from "lodash";
import CreditsRemaining from "../CreditsRemaining";
import AddCreditsModal from "../Upsell/AddCreditsModal";
import Link from "next/link";

interface PlaygroundProps {
    selectedUser: IUser;
    allToys: IToy[];
    allPersonalities: IPersonality[];
}

const Playground: React.FC<PlaygroundProps> = ({
    selectedUser,
    allToys,
    allPersonalities,
}) => {
    const supabase = createClient();

    const {
        messageHistory,
        emotionDictionary,
        connectionStatus,
        microphoneStream,
        audioBuffer,
        handleClickOpenConnection,
        handleClickInterrupt,
        handleClickCloseConnection,
        muteMicrophone,
        unmuteMicrophone,
        isMuted,
    } = useWebSocketHandler(selectedUser);

    const selectedToy = selectedUser.toy!;
    const selectedPersonality = selectedUser.personality!;

    // Debounced function to update the user on the server
    const debouncedUpdateUser = _.debounce(
        async ({
            personality_id,
            toy_id,
        }: {
            personality_id: string;
            toy_id: string;
        }) => {
            await updateUser(
                supabase,
                { personality_id, toy_id },
                selectedUser.user_id
            );
        },
        1000
    ); // Adjust the debounce delay as needed

    const [userState, setUserState] = useState<IUser>(selectedUser);
    const creditsRemaining = getCreditsRemaining(userState);
    // const ref: any = useRef<ComponentRef<typeof Messages> | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const isSelectDisabled = connectionStatus === "Open";

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } =
                scrollContainerRef.current;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
            setIsScrolledToBottom(isAtBottom);
        }
    };

    useEffect(() => {
        if (isScrolledToBottom) {
            scrollToBottom();
        }
    }, [messageHistory, emotionDictionary, isScrolledToBottom]);

    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            scrollContainer.addEventListener("scroll", handleScroll);
            return () =>
                scrollContainer.removeEventListener("scroll", handleScroll);
        }
    }, []);

    const [personalityState, setPersonalityState] =
        useState<IPersonality>(selectedPersonality);
    const [toyState, setToyState] = useState<IToy>(selectedToy);

    const onPersonalityPicked = (personalitySelected: IPersonality) => {
        // Instantaneously update the state variable
        setPersonalityState(personalitySelected);

        // Debounce the server update
        debouncedUpdateUser({
            personality_id: personalitySelected.personality_id,
            toy_id: toyState.toy_id,
        });
    };

    const onVoicePicked = (toySelected: IToy) => {
        // Instantaneously update the state variable
        setToyState(toySelected);

        // Debounce the server update
        debouncedUpdateUser({
            personality_id: personalityState.personality_id,
            toy_id: toySelected.toy_id,
        });
    };

    return (
        <div className="flex flex-col">
            <div className="flex flex-col w-full gap-2">
                <h1 className="text-3xl font-normal">Playground</h1>
                <CreditsRemaining user={userState} />
                {messageHistory.length === 0 ? (
                    <div className="flex flex-col w-full justify-center gap-2">
                        <div className="flex flex-col max-h-[300px] items-start gap-2 my-4 transition-colors duration-200 ease-in-out">
                            <div className="flex flex-row items-start gap-8">
                                <PickVoice
                                    onVoicePicked={onVoicePicked}
                                    allToys={allToys}
                                    toyState={toyState}
                                    isDisabled={isSelectDisabled}
                                />
                                <PickPersonality
                                    onPersonalityPicked={onPersonalityPicked}
                                    allPersonalities={allPersonalities}
                                    personalityState={personalityState}
                                    toyState={toyState}
                                    isDisabled={isSelectDisabled}
                                />
                            </div>
                            <div className="flex flex-row items-center self-center">
                                <div className="max-w-[200px] transition-transform duration-300 ease-in-out scale-90 hover:scale-100">
                                    <Image
                                        // src={getAssistantAvatar(toyState.image_src!)}
                                        src={`/personality/${toyState?.image_src}_${personalityState.title.toLowerCase().replace(/\s+/g, "_")}.png`}
                                        width={200}
                                        height={200}
                                        alt={toyState.name}
                                        className="w-full h-auto" // Make image responsive within container
                                    />
                                </div>
                            </div>
                            <div className="w-full flex flex-col gap-8 items-center justify-center">
                                <AnimatePresence>
                                    <motion.div
                                        initial="initial"
                                        animate="enter"
                                        exit="exit"
                                        variants={{
                                            initial: { opacity: 0 },
                                            enter: { opacity: 1 },
                                            exit: { opacity: 0 },
                                        }}
                                    >
                                        {creditsRemaining <= 0 ? (
                                            <AddCreditsModal>
                                                <Button
                                                    className={
                                                        "z-50 flex items-center gap-1.5 rounded-full"
                                                    }
                                                    size="sm"
                                                    variant={"upsell_primary"}
                                                >
                                                    <Sparkles
                                                        size={16}
                                                        strokeWidth={3}
                                                        stroke={"currentColor"}
                                                    />
                                                    <span className="text-md font-semibold">
                                                        Subscribe
                                                    </span>
                                                </Button>
                                            </AddCreditsModal>
                                        ) : (
                                            <Button
                                                disabled={!selectedUser}
                                                className={
                                                    "z-50 flex items-center gap-1.5 rounded-full"
                                                }
                                                onClick={
                                                    handleClickOpenConnection
                                                }
                                                size="sm"
                                            >
                                                <MoonStar
                                                    size={16}
                                                    strokeWidth={3}
                                                    stroke={"currentColor"}
                                                />
                                                <span className="text-md font-semibold">
                                                    Play
                                                </span>
                                            </Button>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            <Messages
                messageHistory={messageHistory}
                selectedUser={selectedUser}
                selectedToy={toyState}
                emotionDictionary={emotionDictionary}
                handleScroll={handleScroll}
                isScrolledToBottom={isScrolledToBottom}
            />
            <ControlPanel
                connectionStatus={connectionStatus}
                isMuted={isMuted}
                muteMicrophone={muteMicrophone}
                unmuteMicrophone={unmuteMicrophone}
                handleClickInterrupt={handleClickInterrupt}
                handleClickCloseConnection={handleClickCloseConnection}
                microphoneStream={microphoneStream}
                audioBuffer={audioBuffer}
            />
        </div>
    );
};

export default Playground;
