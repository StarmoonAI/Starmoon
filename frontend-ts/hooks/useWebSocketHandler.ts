import { useState, useRef, useEffect, useCallback } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { startRecording, stopRecording, playAudio } from "./useAudioService";

export const useWebSocketHandler = (
    accessToken: string,
    selectedUser: IUser,
) => {
    const [socketUrl, setSocketUrl] = useState<string | null>(null);
    const [messageHistory, setMessageHistory] = useState<MessageHistoryType[]>(
        [],
    );
    const [connectionStatus, setConnectionStatus] = useState("Uninstantiated");
    const [microphoneStream, setMicrophoneStream] =
        useState<MediaStream | null>(null);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioQueueRef = useRef<{ audio: string; boundary: string | null }[]>(
        [],
    );
    const [isMuted, setIsMuted] = useState(false);
    const isPlayingRef = useRef(false);
    const streamRef = useRef<MediaStream | null>(null);
    const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
    const [emotionDictionary, setEmotionDictionary] = useState<{
        [key: string]: { scores: { [key: string]: number } };
    }>({});

    const onOpenAuth = () => {
        sendJsonMessage({
            token: accessToken,
            device: "web",
            user_id: selectedUser.user_id,
        });
        console.log("WebSocket connection opened");
    };

    const { sendMessage, sendJsonMessage, lastJsonMessage, readyState } =
        useWebSocket(socketUrl, {
            onOpen: () => {
                onOpenAuth();
                setConnectionStatus("Open");
                startRecording(
                    setMicrophoneStream,
                    streamRef,
                    audioContextRef,
                    audioWorkletNodeRef,
                    sendMessage,
                );
            },
            onClose: () => {
                console.log("closed");
                setConnectionStatus("Closed");
                stopRecording(
                    streamRef,
                    setMicrophoneStream,
                    audioWorkletNodeRef,
                    audioContextRef,
                    audioQueueRef,
                    isPlayingRef,
                );
                // clear the audio queue
                // audioQueueRef.current = [];
                setMessageHistory([]);
            },
            onError: () => {
                console.log("connection error");
                setConnectionStatus("Error");
                stopRecording(
                    streamRef,
                    setMicrophoneStream,
                    audioWorkletNodeRef,
                    audioContextRef,
                    audioQueueRef,
                    isPlayingRef,
                );
            },
        });

    console.log("lastJsonMessage", lastJsonMessage);

    useEffect(() => {
        if (lastJsonMessage !== null) {
            if (typeof lastJsonMessage === "string") {
                const typedMessage = JSON.parse(
                    lastJsonMessage,
                ) as LastJsonMessageType;

                if (typedMessage.type === "input" && typedMessage.text_data) {
                    setMessageHistory((prev) =>
                        prev.concat({
                            type: typedMessage.type,
                            text_data: typedMessage.text_data,
                            task_id: typedMessage.task_id,
                        }),
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
                            }),
                        );
                    }
                    addToAudioQueue(
                        typedMessage.audio_data,
                        typedMessage.boundary,
                    );
                }

                if (typedMessage.type === "task") {
                    let parsedData;
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
                    console.log("Connection closed by server");
                    setConnectionStatus("Closed");
                    setSocketUrl(null);
                    stopRecording(
                        streamRef,
                        setMicrophoneStream,
                        audioWorkletNodeRef,
                        audioContextRef,
                        audioQueueRef,
                        isPlayingRef,
                    );
                }

                // console.log("text_data", typedMessage);
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
                // const playbacTime = nextAudio.audio.length / 16000;
                // console.log("playbackTime", playbacTime);
                // send sendJsonMessage after playbackTime
                console.log("playbackTime", "end");
                setTimeout(() => {
                    sendJsonMessage({ speaker: "user", is_replying: false });
                }, 50);
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
            is_ending: true,
        });
        setSocketUrl(null);
        stopRecording(
            streamRef,
            setMicrophoneStream,
            audioWorkletNodeRef,
            audioContextRef,
            audioQueueRef,
            isPlayingRef,
        );
    }, []);

    const handleClickOpenConnection = useCallback(() => {
        setSocketUrl("ws://localhost:8000/starmoon");
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
        handleClickCloseConnection,
        muteMicrophone,
        unmuteMicrophone,
        isMuted,
    };
};
