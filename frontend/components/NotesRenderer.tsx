"use client";

import { useNote } from "@/app/contexts/NotesContext";
import { Button } from "./ui/button";
import { SaveIcon } from "lucide-react";
import { apiFetch } from "@/app/lib/api";

export default function NotesRenderer() {
    const { selectedNoteId, content, setContent } = useNote();
    console.log(selectedNoteId)
    return (
        (<div className="h-full overflow-y-scroll">
            <Button className="fixed right-4 m-4 top" onClick={() => {
                console.log(selectedNoteId)
                apiFetch("/fileTree/updateNote", {
                      method: "POST",
                      body: JSON.stringify({
                        noteID: selectedNoteId,
                        content:content,
                      }),
                    }).then(() => console.log("Saved"))
            }}><SaveIcon size={16}/> Save</Button>
            <textarea
            value={content ?? ""}
            onChange={(e) => setContent(e.target.value)}
            className="
        w-full 
        h-full
        resize-none
        outline-none
        bg-neutral-900
        text-neutral-200
        p-6
        text-base
        font-mono
        leading-6
        border-none
        focus:ring-0
        scrollbar-thin scrollbar-track-neutral-800 scrollbar-thumb-neutral-600
      "
            autoFocus
        /></div>)
    )
}
