import io
import speech_recognition as sr
from pydub import AudioSegment


class Recognizer:
    def __init__(self):
        self.recognizer = sr.Recognizer()

    def audio_to_text(self, voice: io.BytesIO) -> str:
        audio = AudioSegment.from_ogg(voice)
        audio_buffer = io.BytesIO()
        audio.export(audio_buffer, format="wav")
        audio_buffer.seek(0)

        recognizer = sr.Recognizer()
        with sr.AudioFile(audio_buffer) as source:
            audio_data = recognizer.record(source)

        text = recognizer.recognize_google(audio_data, language="ru-RU")

        return text


recognizer = Recognizer()
