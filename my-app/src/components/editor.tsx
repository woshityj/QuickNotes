"use client";

import { BlockNoteView } from "@blocknote/mantine";
import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { BlockNoteViewRaw, useCreateBlockNote } from "@blocknote/react";
import { useTheme } from "next-themes";

import "@blocknote/mantine/style.css";

interface EditorProps {
    onChange: (value: string) => void;
    initialContent?: string;
    editable?: boolean;
};

export default function Editor({onChange, initialContent, editable} : EditorProps) {

    const editor: BlockNoteEditor = useCreateBlockNote({
        initialContent: initialContent ? JSON.parse(initialContent) as PartialBlock[] : undefined,
    });

    return(
        <>
            <BlockNoteView editor = {editor} theme = "light" />
        </>
    
    );
}