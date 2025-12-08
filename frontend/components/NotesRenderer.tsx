"use client";

import { useNote } from "@/app/contexts/NotesContext";
import { Button } from "./ui/button";
import { X, SaveIcon } from "lucide-react";
import { apiFetch } from "@/app/lib/api";
import { useEffect, useState } from "react";

type Tab = {
  id: string | null;
  name: string | null;
};

export default function NotesRenderer() {
  const { selectedNoteId, setSelectedNoteId, content, setContent, name } = useNote();
  const [tabs, setTabs] = useState<Tab[]>([]);

  useEffect(() => {
    if (!selectedNoteId) return;

    setTabs((prev) => {
      const exists = prev.some((tab) => tab.id === selectedNoteId);
      if (exists) return prev;

      return [...prev, { id: selectedNoteId, name }];
    });
  }, [selectedNoteId]);

  const closeTab = (id: string | null) => {
    setTabs((prev) => {
      const updated = prev.filter((tab) => tab.id !== id);

      if (selectedNoteId === id) {
        const next = updated.at(-1);
        setSelectedNoteId(next?.id ?? null);

        if (next?.id) {
          // Load content of next tab
          apiFetch("/fileTree/getNoteById", {
            method: "POST",
            body: JSON.stringify({ noteID: next.id }),
          })
            .then((res) => res.json())
            .then((data) => setContent(data[0]?.content ?? ""));
        } else {
          setContent("");
        }
      }

      return updated;
    });
  };

  return (
   (selectedNoteId ? <div className="h-full overflow-y-scroll">
    
      <div className="flex border-b border-neutral-800 gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center px-3 py-2 gap-2 rounded-t-md cursor-pointer transition-all border-b-2 ${
              selectedNoteId === tab.id
                ? "bg-neutral-800 border-blue-400 text-white"
                : "bg-neutral-900 border-transparent text-neutral-400 hover:bg-neutral-800"
            }`}
            onClick={() => {
              if (selectedNoteId === tab.id) return;

              setSelectedNoteId(tab.id);
              apiFetch("/fileTree/getNoteById", {
                method: "POST",
                body: JSON.stringify({ noteID: tab.id }),
              })
                .then((e) => e.json())
                .then((data) => setContent(data[0]?.content ?? ""));
            }}
          >
            <span className="truncate max-w-[120px]">{tab.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="hover:text-red-400 transition"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <Button
        className="fixed right-4 m-4"
        onClick={() => {
          apiFetch("/fileTree/updateNote", {
            method: "POST",
            body: JSON.stringify({
              noteID: selectedNoteId,
              content: content,
            }),
          }).then(() => console.log("Saved"));
        }}
      >
        <SaveIcon size={16} /> Save
      </Button>

      <textarea
        value={content ?? ""}
        onChange={(e) => setContent(e.target.value)}
        className="
          w-full h-full resize-none outline-none bg-neutral-900 text-neutral-200
          p-6 text-base font-mono leading-6 border-none focus:ring-0
          scrollbar-thin scrollbar-track-neutral-800 scrollbar-thumb-neutral-600
        "
        autoFocus
      />
    </div> :   <div
      key="empty"
      className="flex items-center justify-center h-full text-neutral-500"
    >
      Select a note to start editing
    </div>)
  );
}
