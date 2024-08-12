"use client";
import { cn, getMessageRoleName } from "@/lib/utils";
import { useVoice } from "@humeai/voice-react";
import Expressions from "@/app/components/Expressions";
import { AnimatePresence, motion } from "framer-motion";
import { ComponentRef, forwardRef } from "react";
import ChatAvatar from "./ChatAvatar";
// import { JSONErrorMessage } from "@humeai/voice";

interface MessagesProps {
    selectedUser: IUser;
    selectedToy: IToy;
}

const Messages = forwardRef<ComponentRef<typeof motion.div>, MessagesProps>(
    function Messages(props, ref) {
        const { selectedUser, selectedToy } = props;
        const { messages } = useVoice();
        return (
            messages.length > 1 && (
                <motion.div
                    layoutScroll
                    className={
                        "grow rounded-md overflow-auto px-2 py-4 md:px-2 w-full"
                    }
                    ref={ref}
                >
                    <AnimatePresence mode={"popLayout"}>
                        {messages.map((msg, index) => {
                            if (
                                msg.type === "user_message" ||
                                msg.type === "assistant_message"
                            ) {
                                return (
                                    <motion.div
                                        key={msg.type + index}
                                        className={cn(
                                            "w-[80%]",
                                            "bg-card",
                                            "border border-border rounded-lg my-4",
                                            msg.type === "user_message"
                                                ? "ml-auto"
                                                : "",
                                        )}
                                        initial={{
                                            opacity: 0,
                                            y: 10,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                        }}
                                        exit={{
                                            opacity: 0,
                                            y: 0,
                                        }}
                                    >
                                        <div className="flex flex-row gap-1 pt-3 pl-3">
                                            <ChatAvatar
                                                role={msg.message!.role}
                                                user={selectedUser}
                                                toy={selectedToy}
                                            />
                                            <div>
                                                <div
                                                    className={cn(
                                                        "text-xs capitalize font-medium leading-none opacity-50 px-3",
                                                    )}
                                                >
                                                    {getMessageRoleName(
                                                        msg.message!.role,
                                                        selectedUser,
                                                        selectedToy,
                                                    )}
                                                </div>
                                                <div className={"pb-3 px-3"}>
                                                    {msg.message!.content}
                                                </div>
                                            </div>
                                        </div>

                                        <Expressions
                                            values={
                                                msg.models!.prosody?.scores ??
                                                {}
                                            }
                                        />
                                    </motion.div>
                                );
                            }

                            return null;
                        })}
                    </AnimatePresence>
                </motion.div>
            )
        );
    },
);

export default Messages;
