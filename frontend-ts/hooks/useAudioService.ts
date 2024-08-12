export const startRecording = async (
    setMicrophoneStream: React.Dispatch<
        React.SetStateAction<MediaStream | null>
    >,
    streamRef: React.MutableRefObject<MediaStream | null>,
    audioContextRef: React.MutableRefObject<AudioContext | null>,
    audioWorkletNodeRef: React.MutableRefObject<AudioWorkletNode | null>,
    sendMessage: (message: any) => void,
) => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                sampleRate: 24000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
            },
        });

        streamRef.current = stream;
        setMicrophoneStream(stream);

        if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        }

        const audioContext = audioContextRef.current;
        await audioContext.audioWorklet.addModule("/audioProcessor.js");

        const mediaStreamSource = audioContext.createMediaStreamSource(stream);
        const audioWorkletNode = new AudioWorkletNode(
            audioContext,
            "audio-processor",
        );

        audioWorkletNodeRef.current = audioWorkletNode;

        audioWorkletNode.port.onmessage = (event) => {
            const inputData = event.data;

            // Convert float32 to int16
            const int16Array = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
                // Scale the float32 value to the range of int16
                const scaledValue = inputData[i] * 32768;
                // Clamp the value to be within the int16 range
                int16Array[i] = Math.max(
                    -32768,
                    Math.min(32767, Math.round(scaledValue)),
                );
            }
            // Send the raw PCM data
            sendMessage(int16Array);
        };

        mediaStreamSource.connect(audioWorkletNode);
    } catch (err) {
        console.error("Error accessing microphone", err);
    }
};

export const stopRecording = (
    streamRef: React.MutableRefObject<MediaStream | null>,
    setMicrophoneStream: React.Dispatch<
        React.SetStateAction<MediaStream | null>
    >,
    audioWorkletNodeRef: React.MutableRefObject<AudioWorkletNode | null>,
    audioContextRef: React.MutableRefObject<AudioContext | null>,
    audioQueueRef: React.MutableRefObject<
        { audio: string; boundary: string | null }[]
    >,
    isPlayingRef: React.MutableRefObject<boolean>,
) => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setMicrophoneStream(null);
    }

    if (audioWorkletNodeRef.current) {
        audioWorkletNodeRef.current.disconnect();
        audioWorkletNodeRef.current = null;
    }

    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }

    // Clear unplayed audio
    audioQueueRef.current = [];
    isPlayingRef.current = false;
};

export const playAudio = async (
    base64Audio: string,
    audioContextRef: React.MutableRefObject<AudioContext | null>,
    setAudioBuffer: React.Dispatch<React.SetStateAction<AudioBuffer | null>>,
) => {
    if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
    }

    const audioContext = audioContextRef.current;

    const audioData = await fetch(`data:audio/wav;base64,${base64Audio}`).then(
        (res) => res.arrayBuffer(),
    );
    const audioBuffer = await audioContext.decodeAudioData(audioData);

    setAudioBuffer(audioBuffer);

    return new Promise<void>((resolve) => {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.onended = () => resolve();
        source.start();
    });
};
