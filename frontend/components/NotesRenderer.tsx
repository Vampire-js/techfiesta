"use client";

import { useNote } from "@/app/contexts/NotesContext";
import { Button } from "./ui/button";
import { X, SaveIcon } from "lucide-react";
import { apiFetch } from "@/app/lib/api";
import { useEffect, useState } from "react";
import { useUI } from "@/app/contexts/AlertContext";
import Editor from "./Editor";

type Tab = {
  id: string | null;
  name: string | null;
};

export default function NotesRenderer() {
  const { selectedNoteId, setSelectedNoteId, content, setContent, name } = useNote();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [changed, setChanged] = useState(false);
  const { showAlert, showDialog } = useUI()
  useEffect(() => {
    if (!selectedNoteId) return;

    setTabs((prev) => {
      const exists = prev.some((tab) => tab.id === selectedNoteId);
      if (exists) return prev;

      return [...prev, { id: selectedNoteId, name }];
    });
  }, [selectedNoteId]);

  const closeTab = (id: string | null) => {
    if (!changed) {
      setTabs((prev) => {
        const updated = prev.filter((tab) => tab.id !== id);

        if (selectedNoteId === id) {
          const next = updated.at(-1);
          setSelectedNoteId(next?.id ?? null);

          if (next?.id) {
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
    } else {
      showDialog({
        title: "Do you want to revert all the changes?", message: "Closing the tab without saving the contents will revert the changes", confirmText: "Yes, revert the changes", onConfirm: () => {

          setTabs((prev) => {
            const updated = prev.filter((tab) => tab.id !== id);

            if (selectedNoteId === id) {
              const next = updated.at(-1);
              setSelectedNoteId(next?.id ?? null);

              if (next?.id) {
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
        }
      });
    }

  };

  const saveChanges = () => {
    apiFetch("/fileTree/updateNote", {
      method: "POST",
      body: JSON.stringify({
        noteID: selectedNoteId,
        content: content,
      }),
    }).then(() => setChanged(false))
  }

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
  }, [content, selectedNoteId]);

  return (
    (selectedNoteId ? <div className="h-full overflow-y-scroll">

      <div className="flex  border-neutral-800  overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center px-3 border-t-1 border-x-1 border-t-neutral-800 border-x-neutral-800 border-b-transparent  py-2 gap-2  cursor-pointer transition-all  ${selectedNoteId === tab.id
                ? "bg-neutral-950  text-white"
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
            <span className="truncate max-w-[120px]">{changed ? "*" : ""} {tab.name}</span>
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

      {/* <Button
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
      </Button> */}
<div className="h-full">
      {/* <textarea
        value={content ?? ""}
        onChange={(e) => {
          setChanged(true)
          setContent(e.target.value)
        }}
        className="
          w-full h-full resize-none outline-none bg-neutral-950 text-neutral-200
          p-6 text-base font-mono leading-6 border-none focus:ring-0
          scrollbar-thin scrollbar-track-neutral-800 scrollbar-thumb-neutral-600
        "
        autoFocus

/> */}
<Editor setChanged={setChanged} />

      </div>
    </div> : <div
      key="empty"
      className="flex items-center justify-center h-full text-neutral-500"
    >
      Select a note to start editing
    </div>)
  );
}
