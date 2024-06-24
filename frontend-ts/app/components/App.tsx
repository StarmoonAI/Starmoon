"use client";

import { useEffect, useRef, useState } from "react";
import {
    LiveConnectionState,
    LiveTranscriptionEvent,
    LiveTranscriptionEvents,
    useDeepgram,
} from "../context/DeepgramContextProvider";
import {
    MicrophoneEvents,
    MicrophoneState,
    useMicrophone,
} from "../context/MicrophoneContextProvider";
import Visualizer from "./Visualizer";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const App: () => JSX.Element = () => {
    const [caption, setCaption] = useState<string | undefined>(
        "Listening for audio..."
    );
    const [isListening, setIsListening] = useState<boolean>(false);
    const { connection, connectToDeepgram, connectionState } = useDeepgram();
    const { setupMicrophone, microphone, startMicrophone, microphoneState } =
        useMicrophone();
    const captionTimeout = useRef<any>();
    const keepAliveInterval = useRef<any>();

    const handleSwitchChange = () => {
        setIsListening(!isListening);
    };

    useEffect(() => {
        setupMicrophone();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (microphoneState === MicrophoneState.Ready && isListening) {
            connectToDeepgram({
                model: "nova-2",
                interim_results: true,
                smart_format: true,
                filler_words: true,
                utterance_end_ms: 3000,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [microphoneState, isListening]);

    useEffect(() => {
        if (!microphone || !connection || !isListening) return;

        const onData = (e: BlobEvent) => {
            connection?.send(e.data);
        };

        const onTranscript = (data: LiveTranscriptionEvent) => {
            const { is_final: isFinal, speech_final: speechFinal } = data;
            let thisCaption = data.channel.alternatives[0].transcript;

            console.log("thisCaption", thisCaption);
            if (thisCaption !== "") {
                console.log('thisCaption !== ""', thisCaption);
                setCaption(thisCaption);
            }

            if (isFinal && speechFinal) {
                clearTimeout(captionTimeout.current);
                captionTimeout.current = setTimeout(() => {
                    setCaption(undefined);
                    clearTimeout(captionTimeout.current);
                }, 3000);
            }
        };

        if (connectionState === LiveConnectionState.OPEN) {
            connection.addListener(
                LiveTranscriptionEvents.Transcript,
                onTranscript
            );
            microphone.addEventListener(MicrophoneEvents.DataAvailable, onData);

            startMicrophone();
        }

        return () => {
            // prettier-ignore
            connection.removeListener(LiveTranscriptionEvents.Transcript, onTranscript);
            microphone.removeEventListener(
                MicrophoneEvents.DataAvailable,
                onData
            );
            clearTimeout(captionTimeout.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connectionState, isListening]);

    useEffect(() => {
        if (!connection) return;

        if (
            microphoneState !== MicrophoneState.Open &&
            connectionState === LiveConnectionState.OPEN &&
            isListening
        ) {
            connection.keepAlive();

            keepAliveInterval.current = setInterval(() => {
                connection.keepAlive();
            }, 10000);
        } else {
            clearInterval(keepAliveInterval.current);
        }

        return () => {
            clearInterval(keepAliveInterval.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [microphoneState, connectionState, isListening]);

    return (
        <>
            <div className="flex items-center space-x-2">
                <Switch
                    id="listening-switch"
                    checked={isListening}
                    onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="listening-switch">Listening</Label>
            </div>
            <span>Audio</span>
            {microphone && <Visualizer microphone={microphone} />}
            <div className="max-w-4xl mx-auto text-center">
                {caption && <span>{caption}</span>}
            </div>
        </>
    );
};

export default App;
