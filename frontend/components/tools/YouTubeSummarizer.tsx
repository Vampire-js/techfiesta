"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Youtube, Loader2, Copy, CheckCircle2 } from "lucide-react";

type ApiResponse = {
  transcript: string;
  summary: string[];
  error?: string;
};

export default function YouTubeSummarizer() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  const handleSummarize = async () => {
    if (!url) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/youtube_summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      console.error("YouTube Error:", err);
      alert("Failed to process video. Check the backend logs for details.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-5 text-sm text-neutral-300">
      <h2 className="font-semibold text-lg text-white flex items-center gap-2">
        <Youtube className="text-red-500" /> YouTube Summarizer
      </h2>
      <p className="text-neutral-400">
        Paste a YouTube link to get a transcript and summary.
      </p>

      {/* Input Section */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="https://www.youtube.com/watch?v=..."
          className="flex-1 bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <Button 
          onClick={handleSummarize} 
          disabled={!url || loading}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Summarize"}
        </Button>
      </div>

      {/* Result Section */}
      {result && (
        <div className="border border-neutral-800 bg-neutral-900/50 rounded-lg p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2">
          
          {/* Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-white font-medium">
              <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500"/> Summary</span>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(result.summary.join("\n"))}>
                <Copy size={14} className="mr-1"/> Copy
              </Button>
            </div>
            <ul className="list-disc list-inside space-y-1 text-neutral-300">
              {result.summary.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          </div>

          <div className="border-t border-neutral-800 my-2"></div>

          {/* Transcript */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-white font-medium">
              <span>Full Transcript</span>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(result.transcript)}>
                <Copy size={14} className="mr-1"/> Copy
              </Button>
            </div>
            <p className="text-neutral-400 text-xs leading-relaxed max-h-60 overflow-y-auto bg-neutral-950 p-3 rounded-md">
              {result.transcript}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}