"use client";

import { VoiceProvider } from "@humeai/voice-react";
import Messages from "./Messages";
import Controls from "./Controls";
import StartCall from "./StartCall";
import { ComponentRef, useRef, useState } from "react";
import ParentDashboard from "./ParentDashboard";
import ChildPlayground from "./ChildPlayground";

export default function ClientComponent({
    accessToken,
}: {
    accessToken: string;
}) {
    const timeout = useRef<number | null>(null);
    const ref = useRef<ComponentRef<typeof Messages> | null>(null);

    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
    const [selectedToy, setSelectedToy] = useState<IToy | null>(null);

    const chooseUser = (user: IUser) => {
        setSelectedUser(user);
    };

    const chooseToy = (toy: IToy) => {
        setSelectedToy(toy);
    };

    return (
        <>
            <div className="flex flex-col gap-2 sm:w-1/2 border border-black rounded-md">
                {/* <ParentDashboard
                    selectedUser={selectedUser}
                    selectedToy={selectedToy}
                    allToys={[]}
                /> */}
            </div>
            <div className="flex flex-col gap-2 sm:w-1/2 border border-black rounded-md">
                <ChildPlayground
                    selectedUser={selectedUser!}
                    selectedToy={selectedToy}
                >
                    <VoiceProvider
                        auth={{ type: "accessToken", value: accessToken }}
                        onMessage={() => {
                            if (timeout.current) {
                                window.clearTimeout(timeout.current);
                            }

                            timeout.current = window.setTimeout(() => {
                                if (ref.current) {
                                    const scrollHeight =
                                        ref.current.scrollHeight;

                                    ref.current.scrollTo({
                                        top: scrollHeight,
                                        behavior: "smooth",
                                    });
                                }
                            }, 200);
                        }}
                        configId={
                            selectedToy?.hume_ai_config_id ??
                            "6947ac53-5f3b-4499-abc5-f8b368552cb6"
                        }
                    >
                        {selectedUser && selectedToy && (
                            <Messages
                                ref={ref}
                                selectedUser={selectedUser}
                                selectedToy={selectedToy}
                            />
                        )}
                        {/* <Controls /> */}
                        {/* <StartCall
                            selectedUser={selectedUser}
                            selectedToy={selectedToy}
                        /> */}
                    </VoiceProvider>
                </ChildPlayground>
            </div>
        </>
    );
}
