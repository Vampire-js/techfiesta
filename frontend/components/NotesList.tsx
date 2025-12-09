"use client";

import { useEffect, useState } from "react";
import {
  FolderPlusIcon,
  FilePlus,
  MoreHorizontal,
  FolderIcon,
  LogOutIcon,
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
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { useAuth } from "@/app/contexts/AuthContext";

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
  const { setSelectedNoteId, setContent, setName } = useNote()
  const { logout , user} = useAuth()
  useEffect(() => {
    apiFetch("/fileTree/getFolders", {
      method: "GET"
    })
      .then((res) => res.json())
      .then((e: ApiFolder[]) => {
        const mapped: Folder[] = e.map((f: ApiFolder) => ({
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
    <div className="flex flex-col p-3 h-screen justify-between text-sm">
      <div>
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
        {/* Folder Tree */}
        <div className=" space-y-1 mt-5">
          {folders.map((folder, i) => (
            <div key={folder.id}>
              {/* Folder Row */}
              <div
                onClick={() =>
                  setSelectedFolder(selectedFolder === i ? null : i)
                }
                className={cn(
                  "flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-all",
                  selectedFolder === i
                    ? "bg-[#1a1a22] text-white border border-[#2b2b35]"
                    : "text-gray-400 hover:bg-[#121217]"
                )}
              >
                <FolderIcon className="size-4" />
                <span className="flex-1 truncate">{folder.name}</span>

                {/* Toggle Arrow */}
                <span className="text-gray-500">
                  {selectedFolder === i ? "▾" : "▸"}
                </span>
              </div>

              {/* Notes (Collapsible) */}
              {selectedFolder === i && (
                <div className="mt-1 ml-6 border-l border-neutral-800 pl-3 space-y-1">
                  {folder.notes?.length ? (
                    folder.notes?.map((note) => (
                      <div
                        key={note.id}
                        className="flex items-center gap-2 px-2 py-1.5 text-gray-300 rounded-md hover:bg-[#16161d] cursor-pointer transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setName(note.name);
                          setSelectedNoteId(note.id);

                          apiFetch("/fileTree/getNoteById", {
                            method: "POST",
                            body: JSON.stringify({ noteID: note.id }),
                          })
                            .then((e) => e.json())
                            .then((data) => {
                              setContent(data[0].content ?? "");
                            });
                        }}
                      >
                        <span className="text-[12px] opacity-60">📄</span>
                        <span className="truncate">{note.name}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500 italic pl-2 py-1">Empty</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="account-controls flex pb-5 items-center justify-between">
        
        <div className="flex gap-2 items-center"><div className="w-8">
          <img className="rounded-full" src="https://github.com/shadcn.png" />
        </div>
        <span className="text-lg text-stone-300">{user?.name}</span>
        </div>
        <Button className="bg-transparent text-white rounded-full hover:bg-stone-900" onClick={() => {
          setSelectedNoteId(null)
          setContent("")
          logout()
          }}>
          <LogOutIcon/>
        </Button>

      </div>

    </div>
  );
}
