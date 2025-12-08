"use client";

import { useEffect, useState } from "react";
import {
  FolderPlusIcon,
  FilePlus,
  MoreHorizontal,
  FolderIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiFetch } from "@/app/lib/api";
import { useNote } from "@/app/contexts/NotesContext";

type Note = {
  id: string;
  name: string;
  createdAt: string;
  content?: string;
};

type Folder = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  notes?: Note[];
};

type ApiFolder = {
  _id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
};

type ApiNote = {
  "_id": string,
  "userId": string,
  "folderId": string,
  "name": string,
  "content"?: string,
  "createdAt": string,
  "updatedAt": string,
  "__v": number
}


export default function NotesList() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const { setSelectedNoteId, setContent } = useNote()
  useEffect(() => {
    apiFetch("/fileTree/getFolders", {
      method: "GET"
    })
      .then((res) => res.json())
      .then((e: ApiFolder[]) => {
        const mapped: Folder[] = e.map((f) => ({
          id: f._id,
          name: f.name,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt,
        }))
        setFolders(mapped)
      })
  }, []);

  useEffect(() => {
    if (folders.length === 0) return;

    folders.forEach((folder) => {
      if (folder.notes) return;
      apiFetch("/fileTree/getNotes", {
        method: "POST",
        body: JSON.stringify({ folderID: folder.id }),
      })
        .then((res) => res.json())
        .then((notes: ApiNote[]) => {
  const mappedNotes: Note[] = notes.map(note => ({
    id: note._id,
    name: note.name,
    createdAt: note.createdAt,
    content: note.content
  }));

  setFolders(prev =>
    prev.map(f =>
      f.id === folder.id ? { ...f, notes: mappedNotes } : f
    )
  );
});

    });
  }, [folders]);





  const addFolder = async () => {
    const name = prompt("Folder name:");
    if (!name) return;

    try {
      const res = await apiFetch("/fileTree/addFolder", {
        method: "POST",
        body: JSON.stringify({ name }),
      });

      const newFolder: ApiFolder = await res.json();

      const mapped: Folder = {
        id: newFolder._id,
        name: newFolder.name,
        createdAt: newFolder.createdAt,
        updatedAt: newFolder.updatedAt,
        notes: []
      };

      setFolders((prev) => [...prev, mapped]);

    } catch (err) {
      console.error("Failed to create folder", err);
      alert("Could not create folder");
    }
  };

  const addNote = async () => {
    if (selectedFolder === null) return;

    const title = prompt("Note title:");
    if (!title) return;

    const res = await apiFetch("/fileTree/addNote", {
      method: "POST",
      body: JSON.stringify({ name: title, folderID: folders[selectedFolder].id }),
    });

    const newNoteFromDB = await res.json();
    console.log(newNoteFromDB)
    const note: Note = {
      id: newNoteFromDB._id,
      name: newNoteFromDB.name,
      createdAt: newNoteFromDB.createdAt,
    };

    setFolders((prev) =>
      prev.map((folder, idx) =>
        idx === selectedFolder
          ? { ...folder, notes: [...(folder.notes ?? []), note] }
          : folder
      )
    );
  };


  const deleteFolder = (index: number) => {
  };

  const renameFolder = (index: number) => {

  };

  return (
    <div className="flex flex-col p-3 gap-3 h-full text-sm">

      {/* GLOBAL ACTION BAR */}
      <div className="flex gap-2">
        <Button variant="outline" size="icon" onClick={addFolder}>
          <FolderPlusIcon size={18} />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={addNote}
          disabled={selectedFolder === null}
          className={selectedFolder === null ? "opacity-40 cursor-not-allowed" : ""}
        >
          <FilePlus size={18} />
        </Button>
      </div>

      {/* Folder Tree */}
      <Accordion type="multiple" className="w-full space-y-2">
        {folders.map((folder, i) => (
          <AccordionItem
            key={i}
            value={`folder-${i}`}

          >
            <AccordionTrigger
              className={`flex justify-between items-center text-neutral-500 px-3 ${selectedFolder === i ? "bg-neutral-950 text-neutral-100" : ""
                }`}
              onClick={() => setSelectedFolder(i)}
            >
              <span className="flex items-center gap-2"> <FolderIcon size={18} /> {folder.name}</span>
              {/* 
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="opacity-60 hover:opacity-100 px-1"
                    onClick={(e) => e.stopPropagation()} // prevent accordion toggle
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="bg-neutral-900 border-neutral-700">
                  <DropdownMenuItem onClick={() => renameFolder(i)}>
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => deleteFolder(i)}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> */}
            </AccordionTrigger>

            <AccordionContent className="pl-4 py-2">
              {folder.notes?.map(note => (
                <div className="p-2  rounded hover:bg-neutral-900 transition cursor-pointer" onClick={(e) => {
                  e.stopPropagation();
                  console.log(note.id)
                  setSelectedNoteId(note.id)
                  apiFetch("/fileTree/getNoteById", {
                    method:"POST",
                    body:JSON.stringify({noteID: note.id})
                  }).then(e => e.json())
                  .then(data => {
                    setContent(data[0].content ?? "") })
                }}>
                  <div className="font-medium">{note.name}</div>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
