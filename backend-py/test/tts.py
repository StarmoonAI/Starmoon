import os

import azure.cognitiveservices.speech as speechsdk

speech_config = speechsdk.SpeechConfig(
    subscription="d9e1868008cf477eb9cad5ddca6e4994", region="eastus"
)
audio_config = speechsdk.audio.AudioOutputConfig(use_default_speaker=True)

speech_config.set_property(
    property_id=speechsdk.PropertyId.SpeechServiceResponse_RequestSentenceBoundary,
    value="true",
)
audio_config = speechsdk.audio.AudioOutputConfig(use_default_speaker=True)
speech_synthesizer = speechsdk.SpeechSynthesizer(
    speech_config=speech_config, audio_config=audio_config
)

# The language of the voice that speaks.
speech_synthesis_voice_name = "en-US-GuyNeural"

ssml = """<speak version='1.0' xml:lang='en-US' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts'>
    <voice name='{}'>
        <mstts:express-as style="cheerful" styledegree="1">
            wow, you are so hard working
        </mstts:express-as>
        <mstts:express-as style="whispering" styledegree="1">
           Oh, I don't think so.
        </mstts:express-as>
        <mstts:express-as style="cheerful" styledegree="1">
           Oh, I'm glad you're feeling a bit calmer now.
        </mstts:express-as>
        <mstts:express-as style="cheerful" styledegree="1">
           You know, sometimes when we're not sure what to talk about, it can help to think of something fun or interesting.
        </mstts:express-as>
         <mstts:express-as style="whispering" styledegree="1">
           Pleas don't have to worry about that.
        </mstts:express-as>
        <mstts:express-as style="hopeful" styledegree="1">
           Is there anything exciting you've learned recently or a cool project you're working on?
        </mstts:express-as>
        <mstts:express-as style="excited" styledegree="1.5">
           Or maybe we could come up with a fun game to play together.
        </mstts:express-as>
    </voice>
</speak>""".format(
    speech_synthesis_voice_name
)


tts_request = speechsdk.SpeechSynthesisRequest(
    input_type=speechsdk.SpeechSynthesisRequestInputType.TextStream
)
speech_synthesis_result = speech_synthesizer.speak_ssml_async(ssml).get()


# from RealtimeTTS import AzureEngine, ElevenlabsEngine, SystemEngine, TextToAudioStream

# engine = AzureEngine(
#     speech_key="d9e1868008cf477eb9cad5ddca6e4994",
#     service_region="eastus",
#     voice="en-US-GuyNeural",
# )  # replace with your TTS e"ngine
# engine.emotion = "excited"
# stream = TextToAudioStream(engine)

# stream.feed(
#     "OpenAI's API supports streaming responses. You can use this feature to receive text in chunks."
# )
# stream.feed(
#     "OpenAI's API supports streaming responses. You can use this feature to receive text in chunks."
# )
# stream.play_async()
