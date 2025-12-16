import { useEffect, useState } from "react";
import { useNote } from "@/app/contexts/NotesContext";
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";

type EditorProps = {
  setChanged: (v: boolean) => void;
};

export default function Editor({ setChanged }: EditorProps) {
  const { content, setContent, selectedNoteId } = useNote();
  const editor = useCreateBlockNote();
  const [a, setA] = useState(false)

  // -----------------------------
  // Load content into editor
  // -----------------------------
  useEffect(() => {
    if (!editor) return;
    if (!content) return;
    if(a) return;
    try {
      const parsed = JSON.parse(content);
      editor.replaceBlocks(editor.document, parsed);
    
    } catch {
      // FIXED: Only one paragraph block, preserve newlines
      const block = {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: content
          }
        ]
      };

      editor.replaceBlocks(editor.document, [block] as any);
   
    }
  }, [editor,content, selectedNoteId]);

  useEffect(() => {
    if (!editor) return;

    const unsubscribe = editor.onChange(() => {
      const json = JSON.stringify(editor.document);
      console.log(editor.document)
      setContent(json);
      setChanged(true);
      setA(true)
    });

    return unsubscribe;
  }, [editor, setContent, setChanged]);

useEffect(() => {setA(false)}, [selectedNoteId])
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        // we don't save here; parent handles save
        const event = new CustomEvent("save_note");
        window.dispatchEvent(event);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <BlockNoteView
      editor={editor}
      theme="dark"
      className="bg-neutral-950 h-full p-6 overflow-auto"
    />
  );
}
