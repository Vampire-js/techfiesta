from fastapi import FastAPI, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
from transformers import pipeline
import shutil
import os
import tempfile
import yt_dlp  # <--- Make sure you ran: pip install yt-dlp

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------
# 1. Load Models (Mac CPU Optimized)
# --------------------
print("Loading Models...")

# High Quality Model (Matches your script's 'distil-large-v3')
# Note: On Mac, we use device="cpu" and compute_type="int8" or "float32"
whisper_model_file = WhisperModel("distil-large-v3", device="cpu", compute_type="int8")

# Fast Model for Live Streaming
whisper_model_live = WhisperModel("small.en", device="cpu", compute_type="int8")

# Summarizer (Matches your script's 'facebook/bart-large-cnn')
summarizer = pipeline("summarization", model="facebook/bart-large-cnn", device=-1)

print("Models Loaded!")

# --------------------
# Route 1: File Upload
# --------------------
@app.post("/transcribe_and_summarize")
async def transcribe_and_summarize(file: UploadFile):
    os.makedirs("./tmp", exist_ok=True)
    audio_path = f"./tmp/{file.filename}"
    with open(audio_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        return process_audio(audio_path)
    finally:
        if os.path.exists(audio_path):
            os.remove(audio_path)

# --------------------
# Route 2: YouTube Summarizer (Adapted from your script)
# --------------------
@app.post("/youtube_summarize")
async def youtube_summarize(item: dict):
    url = item.get("url")
    if not url:
        return {"error": "No URL provided"}

    os.makedirs("./tmp", exist_ok=True)
    temp_filename = f"yt_{os.urandom(4).hex()}" 
    
    # 1. Download Audio using settings from your uploaded script
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': f'./tmp/{temp_filename}.%(ext)s',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'quiet': True,
        'no_warnings': True
    }

    try:
        print(f"Fetching YouTube Audio: {url}")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        
        audio_path = f"./tmp/{temp_filename}.mp3"
        
        # 2. Process using Shared Logic
        return process_audio(audio_path)

    except Exception as e:
        print(f"YouTube Error: {e}")
        return {"error": str(e)}
    
    finally:
        # Cleanup
        if os.path.exists(f"./tmp/{temp_filename}.mp3"):
            os.remove(f"./tmp/{temp_filename}.mp3")

# --------------------
# Helper: Shared Processing Logic
# --------------------
def process_audio(audio_path):
    # 1. Transcribe (High Quality)
    print("Transcribing...")
    segments, _ = whisper_model_file.transcribe(audio_path, beam_size=5)
    full_transcript = "".join([s.text for s in segments])

    # 2. Summarize (Using logic from your script)
    print("Summarizing...")
    chunk_size = 3000
    chunks = [full_transcript[i:i+chunk_size] for i in range(0, len(full_transcript), chunk_size)]
    bullet_points = []

    for chunk in chunks:
        input_len = len(chunk.split())
        # Dynamic length calculation from your script
        max_len = min(150, input_len // 2)
        min_len = min(30, max_len // 2)

        try:
            if input_len > 10: 
                summary = summarizer(chunk, max_length=max_len, min_length=min_len, do_sample=False)
                bullet_points.append(f"- {summary[0]['summary_text']}")
        except Exception as e:
            print(f"Summarizer error: {e}")

    return {
        "transcript": full_transcript,
        "summary": bullet_points
    }

# --------------------
# Route 3: Live Transcription
# --------------------
@app.websocket("/ws/live_transcribe")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connected for live transcription")
    
    last_audio_bytes = b""
    
    try:
        while True:
            new_audio_bytes = await websocket.receive_bytes()
            combined_audio = last_audio_bytes + new_audio_bytes
            last_audio_bytes = new_audio_bytes # Update buffer

            with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as temp_audio:
                temp_audio.write(combined_audio)
                temp_audio_path = temp_audio.name
            
            try:
                segments, _ = whisper_model_live.transcribe(
                    temp_audio_path, 
                    beam_size=1, 
                    language="en",
                    vad_filter=True,
                    vad_parameters=dict(min_silence_duration_ms=500),
                    condition_on_previous_text=False,
                    initial_prompt="Live meeting transcript." 
                )
                
                text = " ".join([s.text for s in segments]).strip()
                
                if text:
                    cleaned = text.lower().strip(".!? ")
                    blacklist = ["you", "thank you", "thanks for watching"]
                    if cleaned not in blacklist:
                        print(f"Heard: {text}")
                        await websocket.send_text(text)
                    
            finally:
                if os.path.exists(temp_audio_path):
                    os.remove(temp_audio_path)
                    
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Error: {e}")
        await websocket.close()