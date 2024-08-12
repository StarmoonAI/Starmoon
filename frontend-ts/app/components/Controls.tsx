"use client";
import { useVoice } from "@humeai/voice-react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Phone } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Toggle } from "@/components/ui/toggle";
import MicFFT from "@/app/components/MicFFT";
import { cn } from "@/lib/utils";
import moment from "moment";

interface ControlsProps {
    userState: IUser;
    updateUserState: (user: IUser) => void;
}

export default function Controls({
    userState,
    updateUserState,
}: ControlsProps) {
    const {
        disconnect,
        status,
        isMuted,
        unmute,
        mute,
        micFft,
        callDurationTimestamp,
    } = useVoice();

    const addSessionTime = (timestamp: string) => {
        const durationObj = moment.duration(timestamp);
        const totalSeconds = durationObj.asSeconds();
        updateUserState({
            ...userState,
            session_time: userState.session_time + totalSeconds,
        });
    };

    return (
        <div
            className={cn(
                "fixed bottom-0 left-0 w-full p-4 flex items-center justify-center",
                "from-card via-card/90 to-card/0",
            )}
        >
            <AnimatePresence>
                {status.value === "connected" ? (
                    <motion.div
                        initial={{
                            y: "100%",
                            opacity: 0,
                        }}
                        animate={{
                            y: 0,
                            opacity: 1,
                        }}
                        exit={{
                            y: "100%",
                            opacity: 0,
                        }}
                        className={
                            "p-4 bg-card border border-border rounded-lg shadow-sm flex items-center gap-4"
                        }
                    >
                        <Toggle
                            pressed={!isMuted}
                            onPressedChange={() => {
                                if (isMuted) {
                                    unmute();
                                } else {
                                    mute();
                                }
                            }}
                        >
                            {isMuted ? (
                                <MicOff className={"size-4"} />
                            ) : (
                                <Mic className={"size-4"} />
                            )}
                        </Toggle>

                        <div className={"relative grid h-8 w-48 shrink grow-0"}>
                            <MicFFT fft={micFft} className={"fill-current"} />
                        </div>

                        <Button
                            className={"flex items-center gap-1"}
                            onClick={() => {
                                disconnect();
                                addSessionTime(
                                    callDurationTimestamp ?? "00:00:00",
                                );
                            }}
                            variant={"destructive"}
                        >
                            <span>
                                <Phone
                                    className={"size-4 opacity-50"}
                                    strokeWidth={2}
                                    stroke={"currentColor"}
                                />
                            </span>
                            <span>End Call</span>
                        </Button>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}
