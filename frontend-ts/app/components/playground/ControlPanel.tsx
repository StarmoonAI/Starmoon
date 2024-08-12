import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import Visualizer from "./Visualizer";

interface ControlPanelProps {
    connectionStatus: string;
    isMuted: boolean;
    muteMicrophone: () => void;
    unmuteMicrophone: () => void;
    handleClickCloseConnection: () => void;
    microphoneStream: MediaStream | null | undefined;
    audioBuffer: AudioBuffer | null | undefined;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
    connectionStatus,
    isMuted,
    muteMicrophone,
    unmuteMicrophone,
    handleClickCloseConnection,
    microphoneStream,
    audioBuffer,
}) => {
    return (
        <div
            className={cn(
                "fixed bottom-4 left-0 w-full p-6 flex items-center justify-center",
                "from-card via-card/90 to-card/0",
            )}
        >
            <AnimatePresence>
                {connectionStatus === "Open" ? (
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
                                    unmuteMicrophone();
                                } else {
                                    muteMicrophone();
                                }
                            }}
                        >
                            {isMuted ? (
                                <MicOff className={"size-4"} />
                            ) : (
                                <Mic className={"size-4"} />
                            )}
                        </Toggle>

                        <div className="flex justify-center items-center">
                            <Visualizer
                                stream={microphoneStream || undefined}
                                audioBuffer={audioBuffer || undefined}
                            />
                        </div>
                        <Button
                            className={"flex items-center gap-1"}
                            onClick={() => {
                                handleClickCloseConnection();
                                // addSessionTime(
                                //     callDurationTimestamp ?? "00:00:00",
                                // );
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
};

export default ControlPanel;
