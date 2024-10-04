import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatAvatar from "../ChatAvatar";
import Expressions from "../Expressions";
import { cn, getMessageRoleName } from "@/lib/utils";

interface MessagesProps {
    // messageHistory: any[];
    selectedUser: any;
    selectedToy: any;
    emotionDictionary: any;
    handleScroll: () => void;
    isScrolledToBottom: boolean;
}

export const Messages: React.FC<MessagesProps> = ({
    // messageHistory,
    selectedUser,
    selectedToy,
    emotionDictionary,
    handleScroll,
    isScrolledToBottom,
}) => {
    const messageHistory = [
        {
            type: "input",
            text_data: "I'm feeling okay.",
            task_id: "94edb460-2d05-471e-b6b6-145b55bf1d35",
        },
        {
            type: "response",
            text_data: "That's good to hear, Tim.",
            task_id: "8672fee7-67a4-410a-bd57-a8b88ae9aea6",
        },
        {
            type: "response",
            text_data:
                "Remember, this is a quick and simple process, and you're doing great already.",
            task_id: "e46b0285-8184-4a61-a76c-bd4348bf7c47",
        },
        {
            type: "response",
            text_data: "Do you have any questions about the blood test?",
            task_id: "472694fa-e1f5-4edd-8aaa-4a4bad2a4f5b",
        },
        {
            type: "response",
            text_data: "Anything you're curious about?",
            task_id: "3ba9c036-944f-444b-97d1-80a170f8950f",
        },
    ];
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const ref: any = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    }, [handleScroll]);

    return (
        <div
            className="flex-grow pb-6 mb-20 overflow-auto"
            ref={scrollContainerRef}
            onScroll={handleScroll}
        >
            <ul className="space-y-2">
                <motion.div
                    layoutScroll
                    className={
                        "grow rounded-md overflow-auto px-2 pb-4 md:px-2 w-full"
                    }
                    ref={ref}
                >
                    <AnimatePresence mode={"popLayout"}>
                        {messageHistory.map((msg, index) => {
                            if (
                                msg.type === "input" ||
                                msg.type === "response"
                            ) {
                                return (
                                    <motion.div
                                        key={msg.type + index}
                                        className={cn(
                                            "w-[80%]",
                                            "bg-card",
                                            "border border-border rounded-lg my-4",
                                            msg.type === "input"
                                                ? "ml-auto"
                                                : ""
                                        )}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 0 }}
                                    >
                                        <div className="flex flex-row gap-1 pt-3 pl-3">
                                            <ChatAvatar
                                                role={msg!.type}
                                                user={selectedUser}
                                                toy={selectedToy}
                                            />
                                            <div>
                                                <div
                                                    className={cn(
                                                        "text-xs capitalize font-medium leading-none opacity-50 px-3"
                                                    )}
                                                >
                                                    {getMessageRoleName(
                                                        msg!.type,
                                                        selectedUser,
                                                        selectedToy
                                                    )}
                                                </div>
                                                <div className={"pb-3 px-3"}>
                                                    {msg!.text_data}
                                                </div>
                                            </div>
                                        </div>
                                        <Expressions
                                            values={
                                                emotionDictionary[msg!.task_id]
                                                    ?.scores ?? {}
                                            }
                                        />
                                    </motion.div>
                                );
                            }
                            return null;
                        })}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </motion.div>
            </ul>
        </div>
    );
};
