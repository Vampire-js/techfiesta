"use client";

import { useNote } from "@/app/contexts/NotesContext";
import { X } from "lucide-react";
import { apiFetch } from "@/app/lib/api";
import { useEffect, useState, useCallback } from "react";
import { useUI } from "@/app/contexts/AlertContext";
import Editor from "./Editor";
import { useRouter } from "next/router";
import { useAuth } from "@/app/contexts/AuthContext";

type Tab = {
  id: string | null;
  name: string | null;
  saved: boolean;
};

export default function NotesRenderer() {
  const { selectedNoteId, setSelectedNoteId, content, setContent, name } =
    useNote();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const { showDialog } = useUI();
  const { logout } = useAuth()
  useEffect(() => {
    if (!selectedNoteId) return;
    setTabs((prev) => {
      const exists = prev.some((tab) => tab.id === selectedNoteId);
      if (exists) return prev;
      return [...prev, { id: selectedNoteId, name, saved: true }];
    });
  }, [selectedNoteId]);

const closeTab = (id: string | null) => {
  const tab = tabs.find(t => t.id === id);

  const performClose = () => {
    setTabs(prev => prev.filter(t => t.id !== id));

    if (selectedNoteId === id) {
      const updated = tabs.filter(t => t.id !== id);
      const next = updated.at(-1);

      setSelectedNoteId(next?.id ?? null);

      if (next?.id) {
        apiFetch("/fileTree/getNoteById", {
          method: "POST",
          body: JSON.stringify({ noteID: next.id }),
        })
          .then(res => {
            if(res.status == 401){
              showDialog({title:"Session expired" , message:"Please log in to continue using", onConfirm() {
                  logout()
              },})
            }
            return res.json();
          })
          .then(data => setContent(data[0]?.content ?? ""));
      } else {
        setContent("");
      }
    }
  };

  performClose();
};


  const saveChanges = useCallback(() => {
    if (!selectedNoteId) return;

    apiFetch("/fileTree/updateNote", {
      method: "POST",
      body: JSON.stringify({
        noteID: selectedNoteId,
        content: content,
      }),
    }).then(() => {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === selectedNoteId ? { ...t, saved: true } : t
        )
      );
    });
  }, [selectedNoteId, content]);

  useEffect(() => {
    const handler = () => saveChanges();
    window.addEventListener("save_note", handler);
    return () => window.removeEventListener("save_note", handler);
  }, [saveChanges]);

  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveChanges();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [saveChanges]);

  return selectedNoteId ? (
    <div className="h-full overflow-y-scroll">
      <div className="flex border-neutral-800 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center px-3 border-t-1 border-x-1 border-t-neutral-800 border-x-neutral-800 border-b-transparent py-2 gap-2 cursor-pointer transition-all ${
              selectedNoteId === tab.id
                ? "bg-neutral-950 text-white"
                : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
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
            <span className="truncate max-w-[120px]">
              {!tab.saved ? "*" : ""} {tab.name}
            </span>

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

      <div className="h-full"  spellCheck={false}
  contentEditable={false} >
        <Editor
          setChanged={() => {
            setTabs((prev) =>
              prev.map((t) =>
                t.id === selectedNoteId ? { ...t, saved: false } : t
              )
            );
          }}
        />
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center h-full text-neutral-500">
      Select a note to start editing
    </div>
  );
}
