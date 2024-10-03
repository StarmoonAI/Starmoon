import { useState, useRef, useEffect, useCallback } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import {
    startRecording,
    stopRecording,
    stopAudioPlayback,
    playAudio,
} from "./useAudioService";
import { updateUser } from "@/db/users";
import { createClient } from "@/utils/supabase/client";
import _ from "lodash";
import { generateStarmoonAuthKey } from "@/app/actions";

export const useWebSocketHandler = (selectedUser: IUser) => {
    const supabase = createClient();
    const [socketUrl, setSocketUrl] = useState<string | null>(null);
    const [messageHistory, setMessageHistory] = useState<MessageHistoryType[]>(
        []
    );
    const [connectionStatus, setConnectionStatus] = useState("Uninstantiated");
    const [microphoneStream, setMicrophoneStream] =
        useState<MediaStream | null>(null);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioQueueRef = useRef<{ audio: string; boundary: string | null }[]>(
        []
    );
    const [isMuted, setIsMuted] = useState(false);
    const isPlayingRef = useRef(false);
    const streamRef = useRef<MediaStream | null>(null);
    const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
    const [emotionDictionary, setEmotionDictionary] = useState<{
        [key: string]: { scores: { [key: string]: number } };
    }>({});

    const connectionStartTimeRef = useRef<Date | null>(null);
    const connectionDurationRef = useRef<number | null>(null);

    const onOpenAuth = (accessToken: string) => {
        sendJsonMessage({
            token: accessToken,
            device: "web",
            user_id: selectedUser.user_id,
        });
        // console.log("WebSocket connection opened");
        connectionStartTimeRef.current = new Date();
    };

    const setDurationOnClose = async () => {
        const connectionEndTime = new Date();
        if (connectionStartTimeRef.current) {
            const connectionDuration = Math.round(
                (connectionEndTime.getTime() -
                    connectionStartTimeRef.current.getTime()) /
                    1000
            );
            connectionDurationRef.current = connectionDuration;
            await updateUser(
                supabase,
                {
                    ..._.omit(selectedUser, ["toy", "personality"]),
                    session_time:
                        selectedUser.session_time + connectionDuration,
                },
                selectedUser.user_id
            );
        }
    };

    const { sendMessage, sendJsonMessage, lastJsonMessage, readyState } =
        useWebSocket(socketUrl, {
            onOpen: async () => {
                const accessToken = await generateStarmoonAuthKey(selectedUser);
                onOpenAuth(accessToken);
                setConnectionStatus("Open");
                startRecording(
                    setMicrophoneStream,
                    streamRef,
                    audioContextRef,
                    audioWorkletNodeRef,
                    sendMessage
                );
            },
            onClose: async () => {
                // console.log("closed");
                setConnectionStatus("Closed");
                stopRecording(
                    streamRef,
                    setMicrophoneStream,
                    audioWorkletNodeRef,
                    audioContextRef,
                    audioQueueRef,
                    isPlayingRef
                );
                // clear the audio queue
                // audioQueueRef.current = [];
                setDurationOnClose();
                setMessageHistory([]);
            },
            onError: () => {
                // console.log("connection error");
                setConnectionStatus("Error");
                stopRecording(
                    streamRef,
                    setMicrophoneStream,
                    audioWorkletNodeRef,
                    audioContextRef,
                    audioQueueRef,
                    isPlayingRef
                );
                setDurationOnClose();
            },
        });

    // // console.log("lastJsonMessage", lastJsonMessage);

    useEffect(() => {
        if (lastJsonMessage !== null) {
            if (typeof lastJsonMessage === "string") {
                const typedMessage = JSON.parse(
                    lastJsonMessage
                ) as LastJsonMessageType;

                if (typedMessage.type === "input" && typedMessage.text_data) {
                    setMessageHistory((prev) =>
                        prev.concat({
                            type: typedMessage.type,
                            text_data: typedMessage.text_data,
                            task_id: typedMessage.task_id,
                        })
                    );
                }

                if (
                    typedMessage.type === "response" &&
                    typedMessage.audio_data
                ) {
                    if (typedMessage.text_data) {
                        setMessageHistory((prev) =>
                            prev.concat({
                                type: typedMessage.type,
                                text_data: typedMessage.text_data,
                                task_id: typedMessage.task_id,
                            })
                        );
                    }
                    addToAudioQueue(
                        typedMessage.audio_data,
                        typedMessage.boundary
                    );
                }

                if (typedMessage.type === "task") {
                    let parsedData: any;
                    if (typeof typedMessage.text_data === "string") {
                        parsedData = JSON.parse(typedMessage.text_data);
                    } else {
                        parsedData = typedMessage.text_data;
                    }
                    setEmotionDictionary((prev) => ({
                        ...prev,
                        [typedMessage.task_id]: parsedData,
                    }));
                }

                if (
                    typedMessage.type === "warning" &&
                    typedMessage.text_data === "OFF"
                ) {
                    // console.log("Connection closed by server");
                    setConnectionStatus("Closed");
                    setSocketUrl(null);
                    stopRecording(
                        streamRef,
                        setMicrophoneStream,
                        audioWorkletNodeRef,
                        audioContextRef,
                        audioQueueRef,
                        isPlayingRef
                    );
                }

                // // console.log("text_data", typedMessage);
            }
        }
    }, [lastJsonMessage]);

    const addToAudioQueue = (base64Audio: string, boundary: string | null) => {
        audioQueueRef.current.push({ audio: base64Audio, boundary });
        if (!isPlayingRef.current) {
            playNextInQueue();
        }
    };

    const playNextInQueue = async () => {
        if (audioQueueRef.current.length === 0) {
            isPlayingRef.current = false;
            return;
        }

        isPlayingRef.current = true;
        const nextAudio = audioQueueRef.current.shift();
        if (nextAudio) {
            await playAudio(nextAudio.audio, audioContextRef, setAudioBuffer);

            // Send JSON message based on the boundary
            if (nextAudio.boundary === "end") {
                const playbacTime = nextAudio.audio.length / 16000;
                // // console.log("playbackTime", playbacTime);
                // send sendJsonMessage after playbackTime
                setTimeout(() => {
                    sendJsonMessage({ speaker: "user", is_replying: false });
                }, playbacTime);
            } else if (nextAudio.boundary === "start") {
                sendJsonMessage({ speaker: "user", is_replying: true });
            }

            playNextInQueue();
        }
    };

    const handleClickCloseConnection = useCallback(() => {
        sendJsonMessage({
            speaker: "user",
            is_replying: false,
            is_interrupted: false,
            is_ending: true,
        });
        setSocketUrl(null);
        stopRecording(
            streamRef,
            setMicrophoneStream,
            audioWorkletNodeRef,
            audioContextRef,
            audioQueueRef,
            isPlayingRef
        );
    }, []);

    const handleClickInterrupt = useCallback(() => {
        // ! If the above interrupt message is sent, the backend will stop sending the rest of the audio in the current round response a action to frontend to stop the audio playback - stopAudioPlayback
        sendJsonMessage({
            speaker: "user",
            is_replying: false,
            is_interrupted: true,
            is_ending: false,
        });
        // console.log("interrupted");
        stopAudioPlayback(
            setMicrophoneStream,
            streamRef,
            audioContextRef,
            audioWorkletNodeRef,
            sendMessage,
            audioQueueRef,
            isPlayingRef,
            setAudioBuffer
        );
    }, []);

    const handleClickOpenConnection = useCallback(() => {
        const wsUrl =
            process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
                ? "wss://api.starmoon.app/starmoon"
                : "ws://localhost:8000/starmoon";
        // // console.log("opening ws connection", wsUrl);
        setSocketUrl(wsUrl);
        // setSocketUrl("wss://api.starmoon.app/starmoon");
    }, []);

    useEffect(() => {
        const status = {
            [ReadyState.CONNECTING]: "Connecting",
            [ReadyState.OPEN]: "Open",
            [ReadyState.CLOSING]: "Closing",
            [ReadyState.CLOSED]: "Closed",
            [ReadyState.UNINSTANTIATED]: "Uninstantiated",
        }[readyState];

        setConnectionStatus(status);
    }, [readyState]);

    const muteMicrophone = () => {
        if (microphoneStream) {
            microphoneStream.getAudioTracks().forEach((track) => {
                track.enabled = false;
            });
            setIsMuted(true);
        }
    };

    const unmuteMicrophone = () => {
        if (microphoneStream) {
            microphoneStream.getAudioTracks().forEach((track) => {
                track.enabled = true;
            });
            setIsMuted(false);
        }
    };

    return {
        socketUrl,
        setSocketUrl,
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
        connectionDuration: connectionDurationRef.current || null,
    };
};
