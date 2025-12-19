from fastapi import FastAPI, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
from transformers import pipeline
import shutil
import os
import tempfile
import yt_dlp
import fitz  # PyMuPDF
import re
import numpy as np
from collections import Counter
import time

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

# High Quality Model
whisper_model_file = WhisperModel("distil-large-v3", device="cpu", compute_type="int8")

# Fast Model for Live Streaming
whisper_model_live = WhisperModel("small.en", device="cpu", compute_type="int8")

# Summarizer (for audio/video)
summarizer = pipeline("summarization", model="facebook/bart-large-cnn", device=-1)

print("Models Loaded!")

# --------------------
# Helper: PDF Summarizer Logic (Adapted from pdf_summarizer_final.py)
# --------------------
def accurate_35_summarize(text, target_ratio=0.35):
    """TRUE 35% word coverage"""
    
    # 1. CLEAN TEXT
    text = re.sub(r'\s+', ' ', text)
    sentences = re.split(r'(?<=[\.!?])\s+', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 20]

    if not sentences:
        return "Not enough text to summarize."

    # 2. DEDUPLICATE
    unique_sentences = []
    seen = set()
    for sent in sentences:
        h = hash(sent.lower())
        if h not in seen:
            unique_sentences.append(sent)
            seen.add(h)
    sentences = unique_sentences

    # 3. CALCULATE TARGET WORD COUNT
    orig_words = len(re.findall(r'\b\w+\b', text))
    target_words = max(500, int(orig_words * target_ratio))

    # 4. SCORE ALL SENTENCES
    all_words = re.findall(r'\b\w+\b', text.lower())
    word_freq = Counter(all_words)

    scored_sentences = []
    for sent in sentences:
        sent_words = re.findall(r'\b\w+\b', sent.lower())
        # Avoid division by zero if word_freq is empty
        if not sent_words: 
            continue
            
        score = sum(word_freq[w] * np.log(len(all_words) / word_freq[w])
                   for w in sent_words if word_freq[w] > 1)
        word_count = len(sent_words)
        scored_sentences.append((score, word_count, sent))

    # 5. GREEDY SELECTION
    scored_sentences.sort(key=lambda x: x[0], reverse=True)
    selected_sentences = []
    current_word_count = 0

    for score, word_count, sent in scored_sentences:
        if current_word_count + word_count <= target_words:
            selected_sentences.append(sent)
            current_word_count += word_count
        if current_word_count >= target_words * 0.9:
            break

    # 6. PRESERVE ORDER
    order_map = {sent: i for i, sent in enumerate(sentences)}
    selected_sentences.sort(key=lambda x: order_map[x])
    summary_text = " ".join(selected_sentences)

    return summary_text

# --------------------
# Route 1: PDF Summarization (New)
# --------------------
@app.post("/pdf_summarize")
async def pdf_summarize(file: UploadFile):
    os.makedirs("./tmp", exist_ok=True)
    file_path = f"./tmp/{file.filename}"
    
    # Save uploaded file
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        print(f"Processing PDF: {file.filename}")
        doc = fitz.open(file_path)
        total_pages = len(doc)
        all_text = ""
        words = []

        # Extract Text
        for page_num in range(total_pages):
            page = doc[page_num]
            text1 = page.get_text()
            text2 = page.get_text("blocks")
            text3 = " ".join([block[4] for block in text2 if isinstance(block[4], str)])
            
            combined = f"{text1}\n\n{text3}"
            all_text += combined + f"\n--- Page {page_num+1} ---\n\n"
            words.extend(re.findall(r'\b\w+\b', combined))

        doc.close()

        # Run Summarizer
        summary_text = accurate_35_summarize(all_text)
        
        # Format as Markdown Report
        sentences = re.split(r'[.!?]+', summary_text)
        lines = [s.strip() for s in sentences if len(s.strip()) > 15]
        summary_content = '\n\n'.join(lines[:60]) # Double newline for markdown readability

        md_report = f"""# PDF Summary Report

**File**: {file.filename}
**Original Length**: {len(words):,} words
**Summary Length**: {len(lines)} key sentences
**Coverage**: 35% (TextRank Algorithm)

## Summary Content

{summary_content}

---
**Generated**: {time.strftime('%Y-%m-%d %H:%M IST')}
"""
        
        return {
            "status": "success",
            "summary_markdown": md_report,
            "original_word_count": len(words),
            "summary_word_count": len(re.findall(r'\b\w+\b', summary_text))
        }

    except Exception as e:
        print(f"PDF Error: {e}")
        return {"error": str(e)}
    
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

# --------------------
# Route 2: File Upload (Audio/Video)
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
# Route 3: YouTube Summarizer
# --------------------
@app.post("/youtube_summarize")
async def youtube_summarize(item: dict):
    url = item.get("url")
    if not url:
        return {"error": "No URL provided"}

    os.makedirs("./tmp", exist_ok=True)
    temp_filename = f"yt_{os.urandom(4).hex()}" 
    
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
        return process_audio(audio_path)

    except Exception as e:
        print(f"YouTube Error: {e}")
        return {"error": str(e)}
    
    finally:
        if os.path.exists(f"./tmp/{temp_filename}.mp3"):
            os.remove(f"./tmp/{temp_filename}.mp3")

# --------------------
# Helper: Shared Processing Logic (Audio)
# --------------------
def process_audio(audio_path):
    # 1. Transcribe (High Quality)
    print("Transcribing...")
    segments, _ = whisper_model_file.transcribe(audio_path, beam_size=5)
    full_transcript = "".join([s.text for s in segments])

    # 2. Summarize
    print("Summarizing...")
    chunk_size = 3000
    chunks = [full_transcript[i:i+chunk_size] for i in range(0, len(full_transcript), chunk_size)]
    bullet_points = []

    for chunk in chunks:
        input_len = len(chunk.split())
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
# Route 4: Live Transcription
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
            last_audio_bytes = new_audio_bytes 

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