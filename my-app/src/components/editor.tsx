"use client";

import { BlockNoteView } from "@blocknote/mantine";
import { Block, BlockNoteEditor, filterSuggestionItems, InlineContent, PartialBlock, TableContent } from "@blocknote/core";
import { DefaultReactSuggestionItem, getDefaultReactSlashMenuItems, SuggestionMenuController, useCreateBlockNote } from "@blocknote/react";
import { useTheme } from "next-themes";

import { useEdgeStore } from "@/lib/edgestore";

import "@blocknote/mantine/style.css";
import { Brain } from "lucide-react";
import { string } from "zod";
import { useState } from "react";

interface EditorProps {
    onChange: (value: string) => void;
    initialContent?: string;
    editable?: boolean;
};

const Editor = ({onChange, initialContent, editable} : EditorProps) => {

    const { resolvedTheme } = useTheme();

    const { edgestore } = useEdgeStore();

    const handleUpload = async (file: File) => {
        const response = await edgestore.publicFiles.upload({
            file
        });

        return response.url;
    }

    const generateSummaryItem = (editor: BlockNoteEditor) => ({
        title: "Generate Summary of Text",
        onItemClick: () => {

            const currentBlock = editor.getTextCursorPosition().block;

            const testingBlock: PartialBlock = {
                type: "paragraph",
                content: [{ type: "text", text: "Hello World", styles: { bold: true }}],
            };

            editor.insertBlocks([testingBlock], currentBlock, "after");
        },
        group: "QuickNotes AI",
        icon: <Brain size={18} />,
        subtext: "Used to generate a summary of the given text"
    });

    const generateQueryItem = (editor: BlockNoteEditor) => ({
        title: "Ask QuickNotes AI a question",
        onItemClick: () => {

            const currentBlock = editor.getTextCursorPosition().block;

            let content = "";

            editor.forEachBlock((block: Block) => {

                let retrievedContent = getBlockTextAsserted(block);

                if (retrievedContent !== undefined) {
                    content += retrievedContent + "\n";
                }

                return true;
            });

            console.log(content);
        },
        group: "QuickNotes AI",
        icon: <Brain size={18} />,
        subtext: "Ask QuickNotes AI a question to generate a answer in a concise summary"
    });

    function getBlockTextAsserted(block: Block): string | undefined {
        return (block.content as Array<{text?: string}>)?.[0]?.text;
      }

    const getCustomSlashMenuItems = (editor: BlockNoteEditor): DefaultReactSuggestionItem[] => [
        ...getDefaultReactSlashMenuItems(editor),
        generateSummaryItem(editor),
        generateQueryItem(editor)
    ];

    // const editor: BlockNoteEditor = useBlockNote({
    //     initialContent: initialContent ? JSON.parse(initialContent) as PartialBlock[] : undefined,
    //     onEditorContentChange: (editor) => {
    //         onChange(JSON.stringify(editor.topLevelBlocks, null, 2));
    //     }
    // });

    const editor: BlockNoteEditor = useCreateBlockNote({
        initialContent: initialContent ? JSON.parse(initialContent) as PartialBlock[] : undefined,
        uploadFile: handleUpload
    });

    return(
        <div>
            <BlockNoteView 
                editor={editor}
                editable={editable}
                theme={resolvedTheme === "dark" ? "dark" : "light"}
                onChange={() => onChange(JSON.stringify(editor.topLevelBlocks, null, 2))}
                slashMenu={false}
            >
                <SuggestionMenuController 
                    triggerCharacter={"/"}
                    getItems={async (query) => 
                        filterSuggestionItems(getCustomSlashMenuItems(editor), query)
                    }
                />
            </BlockNoteView>
        </div>
    );
}

export default Editor;