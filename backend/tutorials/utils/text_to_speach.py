
import io
import os
import soundfile as sf
import torch
import pickle
from qwen_tts import Qwen3TTSModel



def generate_audio_bytes(text: str, mode: str = "essay") -> bytes:
    """
    Generate audio from text and return raw WAV bytes.
    
    Args:
        text: The text to synthesize
        mode: "essay" for voice clone reading, "podcast" for podcast style
    
    Returns:
        WAV audio as bytes
    """
    model = Qwen3TTSModel.from_pretrained(
        "Qwen/Qwen3-TTS-12Hz-1.7B-Base",
        device_map="cpu",
        dtype=torch.float32,
    )

    with open("tinashe_voice.pkl", "rb") as f:
        voice_prompt = pickle.load(f)

    buffer = io.BytesIO()


    wavs, sr = model.generate_voice_clone(
        text=text,
        language="English",
        voice_clone_prompt=voice_prompt,
    )
    sf.write(buffer, wavs[0], sr, format="WAV")
    return buffer.getvalue()