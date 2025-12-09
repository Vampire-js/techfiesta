"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronRight, ChevronLeft, HelpCircleIcon } from "lucide-react";
import clsx from "clsx";
import Summarizer from "./tools/Summarizer";
import Help from "./tools/Help";

type ToolKey = "ai" |"help" | null;

type ToolsProps = {
  isCollapsed: boolean;
  setCollapsed: () => void;
};

export default function Tools({ isCollapsed, setCollapsed }: ToolsProps) {
  const [activeTool, setActiveTool] = useState<ToolKey>(null);

  const tools = [
    { id: "ai", icon: Sparkles, label: "AI Assistant", component: <Summarizer /> },
    { id: "help", icon: HelpCircleIcon, label: "Markdown Help", component: <Help /> },
  ];

  return (
    <div className="h-full flex flex-row-reverse overflow-hidden">
      
      <div className="flex flex-col gap-2 bg-neutral-900 border-l border-neutral-800 p-2 w-14 items-center shrink-0">
        
        {/* Collapse Toggle */}
        <Button
          size="icon"
          className="text-white bg-neutral-800 hover:bg-neutral-700"
          onClick={() => setCollapsed()}
        >
          {!isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>

        {tools.map(({ id, icon: Icon }) => (
          <Button
            key={id}
            size="icon"
            variant="ghost"
            className={clsx(
              "rounded-lg transition-all",
              activeTool === id
                ? "bg-neutral-700 text-white"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800"
            )}
            onClick={() => setActiveTool(activeTool === id ? null : (id as ToolKey))}
          >
            <Icon size={18} />
          </Button>
        ))}
      </div>

      <div
        className={clsx(
          "flex-1 transition-all duration-300 overflow-y-auto px-4 py-3",
          isCollapsed ? "opacity-0 pointer-events-none w-0" : "opacity-100 w-auto"
        )}
      >
        {activeTool ? (
          tools.find(t => t.id === activeTool)?.component
        ) : (
          <div className="text-neutral-500 text-sm flex items-center justify-center h-full">
            Select a tool →
          </div>
        )}
      </div>
    </div>
  );
}
