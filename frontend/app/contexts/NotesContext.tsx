"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type NoteContextType = {
  selectedNoteId: string | null;
  setSelectedNoteId: (id: string | null) => void;
  content: string | undefined;
  setContent: (text: string | undefined) => void;
  name: string | null;
  setName: (text: string | null) => void;
};

const NoteContext = createContext<NoteContextType | null>(null);

export function NoteProvider({ children }: { children: ReactNode }) {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [content, setContent] = useState<string | undefined>(undefined);
  const [name, setName] = useState<string | null>(null)

  return (
    <NoteContext.Provider value={{ selectedNoteId, setSelectedNoteId , content, setContent , name, setName }}>
      {children}
    </NoteContext.Provider>
  );
}

export function useNote() {
  const ctx = useContext(NoteContext);
  if (!ctx) throw new Error("useNote must be used inside <NoteProvider>");
  return ctx;
}
