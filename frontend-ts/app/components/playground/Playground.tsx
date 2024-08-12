"use client";

import React, {
  ComponentRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useWebSocketHandler } from "@/hooks/useWebSocketHandler";
import { createClient } from "@/utils/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Mail, Mic, MicOff, Phone } from "lucide-react";
import { cn, getCreditsRemaining, getMessageRoleName } from "@/lib/utils";
import ControlPanel from "./ControlPanel";
import { Label } from "@radix-ui/react-label";
import { Messages } from "./Messages";
import { getAssistantAvatar, getUserAvatar } from "@/lib/utils";
import { MoonStar, MoonStarIcon } from "lucide-react";
import Image from "next/image";

interface PlaygroundProps {
  selectedUser: IUser;
  selectedToy: IToy;
  accessToken: string;
}

const Playground: React.FC<PlaygroundProps> = ({
  selectedUser,
  selectedToy,
  accessToken,
}) => {
  const {
    messageHistory,
    emotionDictionary,
    connectionStatus,
    microphoneStream,
    audioBuffer,
    handleClickOpenConnection,
    handleClickCloseConnection,
    muteMicrophone,
    unmuteMicrophone,
    isMuted,
  } = useWebSocketHandler(accessToken, selectedUser);
  const supabase = createClient();

  const [userState, setUserState] = useState<IUser>(selectedUser);
  const creditsRemaining = getCreditsRemaining(userState);
  // const ref: any = useRef<ComponentRef<typeof Messages> | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

  const user = selectedUser;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, []);

  return (
    <div className="flex flex-col">
      <div className="flex-none">
        {messageHistory.length === 0 ? (
          <div className="w-full items-center justify-center">
            <p className="text-2xl text-gray-800">
              Talking to <span className="font-bold">{selectedToy?.name}</span>
            </p>

            <p className="text-sm text-gray-600">
              {creditsRemaining} credits remaining
            </p>

            <div className="flex flex-col max-h-[300px] gap-2 mb-4 items-center justify-center transition-colors duration-200 ease-in-out">
              <div className="flex flex-row items-center">
                <div className="max-w-[300px] transition-transform duration-300 ease-in-out scale-90 hover:scale-100">
                  <Image
                    src={getAssistantAvatar(selectedToy.image_src!)}
                    width={200}
                    height={200}
                    alt={selectedToy.name}
                    className="w-full h-auto" // Make image responsive within container
                  />
                </div>
                <MoonStar fill="#4b5563" className="text-gray-600" />
                <div className="max-w-[300px]  transition-transform duration-300 ease-in-out scale-90 hover:scale-100">
                  <Image
                    src={getUserAvatar(user.email)}
                    width={195}
                    height={195}
                    alt={user.child_name}
                    className="w-full h-auto" // Make image responsive within container
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {connectionStatus !== "Open" ? (
          <div className="w-full flex items-center justify-center">
            <AnimatePresence>
              <motion.div
                // className={
                //     "fixed inset-0 p-4 flex items-center justify-center bg-background"
                // }
                initial="initial"
                animate="enter"
                exit="exit"
                variants={{
                  initial: { opacity: 0 },
                  enter: { opacity: 1 },
                  exit: { opacity: 0 },
                }}
              >
                {/* <button
                                    disabled={
                                        creditsRemaining <= 0 ||
                                        !selectedUser ||
                                        !selectedToy
                                    }
                                    className={"z-50 flex items-center gap-1.5"}
                                    onClick={handleClickOpenConnection}
                                >
                                    Start
                                </button> */}
                <Button
                  disabled={
                    creditsRemaining <= 0 || !selectedUser || !selectedToy
                  }
                  className={"z-50 flex items-center gap-1.5"}
                  onClick={handleClickOpenConnection}
                  size="sm"
                >
                  <span>
                    <MoonStar
                      size={16}
                      strokeWidth={3}
                      stroke={"currentColor"}
                    />
                  </span>
                  <span className="text-md font-semibold">Play</span>
                </Button>
              </motion.div>
            </AnimatePresence>
          </div>
        ) : null}
      </div>

      <Messages
        messageHistory={messageHistory}
        selectedUser={selectedUser}
        selectedToy={selectedToy}
        emotionDictionary={emotionDictionary}
        handleScroll={handleScroll}
        isScrolledToBottom={isScrolledToBottom}
      />
      <ControlPanel
        connectionStatus={connectionStatus}
        isMuted={isMuted}
        muteMicrophone={muteMicrophone}
        unmuteMicrophone={unmuteMicrophone}
        handleClickCloseConnection={handleClickCloseConnection}
        microphoneStream={microphoneStream}
        audioBuffer={audioBuffer}
      />
      <footer
        className={cn(
          "fixed bottom-[1px] left-0 w-full flex items-center justify-center",
          "from-card via-card/90 to-card/0"
        )}
      >
        <a href="mailto:akad3b@gmail.com" target="_blank">
          <Button
            variant="link"
            size="sm"
            className="font-sans font-normal text-gray-500 text-xs"
            aria-label="Mail"
          >
            <Mail size={18} className="mr-2" />
            <p className="">Send feedback</p>
          </Button>
        </a>
        <Label className="font-normal text-xs text-gray-400">
          Starmoon AI (a project of HeyHaddock Inc.) ©{" "}
          {new Date().getFullYear()} All rights reserved.
        </Label>
      </footer>
    </div>
  );
};

export default Playground;
