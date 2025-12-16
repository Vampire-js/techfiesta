"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react"; // Import a loading icon

type ApiResponse = {
  transcript: string;
  summary: string[];
};

export default function Summarizer() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false); // Add loading state
  const [result, setResult] = useState<ApiResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.type !== "audio/mpeg") {
      alert("Please upload an MP3 file");
      return;
    }
    setAudioFile(file);
    setResult(null); // Reset result when new file is picked
  };

  const sendToAPI = async () => {
    if (!audioFile) return;

    setLoading(true); // Start loading
    setResult(null);

    const formData = new FormData();
    formData.append("file", audioFile);

    try {
      // FIX: Use 127.0.0.1 to avoid connection issues on Mac/Node
      const res = await fetch("http://127.0.0.1:8000/transcribe_and_summarize", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      setResult(data as ApiResponse);
    } catch (err) {
      console.error("Transcription failed:", err);
      alert("Failed to connect to the summarizer. Make sure the Python backend is running.");
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-5 text-sm text-neutral-300">
      <h2 className="font-semibold text-lg text-white">Audio Summarizer</h2>
      <p className="text-neutral-400">
        Upload an MP3 file to generate a summary or ask questions.
      </p>

      {/* Upload Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          {audioFile ? "Change Audio" : "Upload MP3"}
        </Button>
        {audioFile && <span className="self-center text-xs">{audioFile.name}</span>}
      </div>

      <Button
        disabled={!audioFile || loading}
        onClick={sendToAPI}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Generate Summary"
        )}
      </Button>

      {/* ================= RESULT ================= */}
      {result && (
        <div className="space-y-4 border border-neutral-800 rounded-lg p-4 bg-neutral-900 mt-4">
          
          {/* Transcript */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-white">Transcript</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(result.transcript)}
              >
                Copy
              </Button>
            </div>
            <p className="text-neutral-400 leading-relaxed max-h-60 overflow-y-auto">
              {result.transcript}
            </p>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-white">Summary</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  copyToClipboard(result.summary.join("\n"))
                }
              >
                Copy
              </Button>
            </div>

            <ul className="list-disc list-inside space-y-1 text-neutral-300">
              {result.summary.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}