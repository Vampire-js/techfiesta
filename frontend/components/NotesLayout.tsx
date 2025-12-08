"use client"

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import NotesList from "./NotesList";
import NotesRenderer from "./NotesRenderer";

export default function NotesLayout() {

    return (
        <PanelGroup direction="horizontal" className="text-white">
            <Panel defaultSize={20} minSize={20} maxSize={30} className="border-r-2 border-r-stone-800">
                <NotesList/>
            </Panel>
            <PanelResizeHandle />
            <Panel>
                <NotesRenderer/>
            </Panel>
            <PanelResizeHandle />
        </PanelGroup>
    )
}