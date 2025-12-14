"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type ApiResponse = {
  transcript: string;
  summary: string[];
};

export default function Summarizer() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // 🔹 Temporary stored sample response
  const [result, setResult] = useState<ApiResponse | null>({
    transcript:
      "Akser people, when something want to do so first, the first, their mind thinks that people what it's not it's not what will or then what will it's it's to that you think you, you're or you or then success to do you. You're your the you are the you you're on that you you on you you're you're you're you're that you that you you're Oh, oh.",
    summary: [
      "- Akser people, when something want to do so first, the first, their mind thinks that people what it's not. It's not what will",
    ],
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.type !== "audio/mpeg") {
      alert("Please upload an MP3 file");
      return;
    }
    setAudioFile(file);
  };

    const sendToAPI = async () => {
    if (!audioFile) return;

    const formData = new FormData();
    formData.append("file", audioFile);

    let res = await fetch("http://localhost:8000/transcribe_and_summarize", {
      method: "POST",
      body:formData
    });
    setResult(await res.json() as ApiResponse)
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

      {/* Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg"
        className="hidden"
        onChange={handleFileChange}
      />

      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
        {audioFile ? "Change Audio" : "Upload MP3"}
      </Button>

 <Button
        disabled={!audioFile}
        onClick={sendToAPI}
        className="w-full"
      >
        Generate Summary
      </Button>
      {/* ================= RESULT ================= */}
      {result && (
        <div className="space-y-4 border border-neutral-800 rounded-lg p-4 bg-neutral-900">
          
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
            <p className="text-neutral-400 leading-relaxed">
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
