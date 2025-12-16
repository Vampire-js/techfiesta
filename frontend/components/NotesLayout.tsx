"use client";

import { useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import NotesList from "./NotesList";
import NotesRenderer from "./NotesRenderer";
import Tools from "./Tools";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function NotesLayout() {
  const toolsPanelRef = useRef<any>(null);
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  const toggleToolsPanel = () => {
    if (!toolsPanelRef.current) return;

    if (isToolsOpen) {
      toolsPanelRef.current.collapse();
      setIsToolsOpen(false);
    } else {
      toolsPanelRef.current.expand();
      setIsToolsOpen(true);
    }
  };

  return (
    <div className="relative h-screen">
   
      <PanelGroup direction="horizontal" className="text-white h-full">

        <Panel defaultSize={20} minSize={20} maxSize={30} className="border-r border-stone-800">
          <NotesList />
        </Panel>

        <PanelResizeHandle className="bg-stone-800 w-[2px]" />

        <Panel minSize={50}>
          <NotesRenderer />
        </Panel>

        {isToolsOpen && (
          <PanelResizeHandle className="bg-stone-800 w-[2px]" />
        )}

        <Panel
          defaultSize={4}
          minSize={15}
          collapsedSize={4}
          collapsible
          ref={toolsPanelRef}
          className="border-l border-stone-800 bg-neutral-950"
        >
          <Tools isCollapsed={!isToolsOpen} setCollapsed={toggleToolsPanel}/>
        </Panel>
      </PanelGroup>
    </div>
  );
}
