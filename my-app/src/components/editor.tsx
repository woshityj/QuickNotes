"use client";

import { BlockNoteView } from "@blocknote/mantine";
import { Block, BlockNoteEditor, filterSuggestionItems, InlineContent, PartialBlock, TableContent } from "@blocknote/core";
import { DefaultReactSuggestionItem, getDefaultReactSlashMenuItems, SuggestionMenuController, useCreateBlockNote } from "@blocknote/react";
import { useTheme } from "next-themes";

import { useEdgeStore } from "@/lib/edgestore";

import "@blocknote/mantine/style.css";
import { Brain, Mic, Wand } from "lucide-react";
import { string } from "zod";
import { useEffect, useRef, useState } from "react";
import { summarizeContent, elaborateText, summarizeContentWithFactCheck } from "@/app/services/llmServices";

import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { toast } from "sonner";

import "../../public/static/css/editor.css"

interface EditorProps {
    onChange: (value: string) => void;
    initialContent?: string;
    editable?: boolean;
};

const Editor = ({onChange, initialContent, editable} : EditorProps) => {

    const { resolvedTheme } = useTheme();
    const { edgestore } = useEdgeStore();

    const [microphoneState, setMicrophoneState] = useState(false);
    const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();
    const [transcriptionBlockId, setTranscriptionBlockId] = useState<string | null>(null);

    const [stream, setStream] = useState<any>(null);
    const [track, setTrack] = useState<any>(null);

    const handleUpload = async (file: File) => {
        const response = await edgestore.publicFiles.upload({
            file
        });

        return response.url;
    }

    const speechToTextItem = (editor: BlockNoteEditor) => ({
        title: "Speech to Text",
        onItemClick: async () => {

            const currentBlock = editor.getTextCursorPosition().block;

            if (!browserSupportsSpeechRecognition) {
                toast.error("Browser does not support speech recognition.");
                return;
            }

            if (false == microphoneState) {
                const transcriptBlock: PartialBlock = {
                    type: "paragraph",
                    content: [{ type: "text", text: "", styles: {} }]
                };

                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setStream(stream);
                const track = stream.getAudioTracks()[0];
                setTrack(track);
                setMicrophoneState(!microphoneState);
                SpeechRecognition.startListening({ continuous: true });

                const insertedBlocks = editor.insertBlocks([transcriptBlock], currentBlock, "after");
                setTranscriptionBlockId(insertedBlocks[0].id);
            } else {
                track.stop();
                stream.removeTrack(track);
                setMicrophoneState(!microphoneState);
                SpeechRecognition.stopListening();
                setTranscriptionBlockId(null);
                resetTranscript();
            }
        },
        group: "Others",
        icon: <Mic size={18} />,
        subtext: "Speech to text"
    });

    const generateSummaryItem = (editor: BlockNoteEditor) => ({
        title: "Generate Summary of Text",
        onItemClick: async () => {

            const currentBlock = editor.getTextCursorPosition().block;

            let documentContent = "";

            editor.forEachBlock((block: Block) => {
                const blockText = getBlockTextAsserted(block);
                if (blockText !== undefined) {
                    documentContent += blockText + "\n";
                }
                return true;
            });

            let summarizedContent = "";

            if (documentContent !== undefined || documentContent !== "") {
                try {
                    const summarizeContentResult = await summarizeContent({content: documentContent});
                    summarizedContent = summarizeContentResult.data;
                    
                    const summaryBlock: PartialBlock = {
                        type: "paragraph",
                        content: [{ type: "text", text: summarizedContent, styles: {} }],
                    }
    
                    editor.insertBlocks([summaryBlock], currentBlock, "after");
                    
                    toast.dismiss();
                    toast.success("Successfully generated summary");
                }
                catch (err: any) {
                    toast.dismiss();
                    toast.error("Failed to generate summary");
                }

            } else {
                toast.dismiss();
                toast.error("No content to summarize");
            }
        },
        group: "QuickNotes AI",
        icon: <Brain size={18} />,
        subtext: "Used to generate a summary of the given text"
    });

    const generateSummaryWithFactCheckItem = (editor: BlockNoteEditor) => ({
        title: "Generate Summary with Fact Check",
        onItemClick: async () => {

            const currentBlock = editor.getTextCursorPosition().block;

            let documentContent = "";

            editor.forEachBlock((block: Block) => {
                const blockText = getBlockTextAsserted(block);
                if (blockText !== undefined) {
                    documentContent += blockText + "\n";
                }
                return true;
            });

            let summarizedContent = "";


            if (documentContent.length !== 0 || documentContent !== "") {
                try {
                    toast.loading("Generating summary with fact check...");
                    const summarizedContentResult = await summarizeContentWithFactCheck({content: documentContent});
                    summarizedContent = summarizedContentResult.data;
                    
                    const blocksFromMarkdown = await editor.tryParseMarkdownToBlocks(summarizedContent);
    
                    editor.insertBlocks(blocksFromMarkdown, currentBlock, "after");
    
                    toast.dismiss();
                    toast.success("Successfully generated summary with fact check");
                } catch (err: any) {
                    toast.dismiss();
                    toast.error("Failed to generate summary with fact check");
                }
            } else {
                toast.dismiss();
                toast.error("No content to summarize");
            }
        },
        group: "QuickNotes AI",
        icon: <Brain size={18} />,
        subtext: "Used to generate a summary of the given text with fact check"
    });

    const elaborateTextItem = (editor: BlockNoteEditor) => ({
        title: "Elaborate Text and Continue Writing",
        onItemClick: async () => {

            const currentBlock = editor.getTextCursorPosition().block;

            let documentContent = "";

            editor.forEachBlock((block: Block) => {
                const blockText = getBlockTextAsserted(block);
                if (blockText !== undefined) {
                    documentContent += blockText + "\n";
                }
                return true;
            });


            if (documentContent !== undefined || documentContent !== "") {
                try {
                    toast.loading("Elaborating text...");

                    const elaborateTextResult = await elaborateText({content: documentContent});
                    const elaboratedContent = elaborateTextResult.data;
    
                    const blocksFromMarkdown = await editor.tryParseMarkdownToBlocks(elaboratedContent)

    
                    editor.insertBlocks(blocksFromMarkdown, currentBlock, "after");
    
                    toast.dismiss();
                    toast.success("Successfully elaborated text");

                } catch (err: any) {
                    toast.dismiss();
                    toast.error("Failed to elaborate text");
                }
            } else {
                toast.dismiss();
                toast.error("No content to elaborate");
            }
        },
        group: "QuickNotes AI",
        icon: <Wand size={18} />,
        subtext: "Used to elaborate the given text"
    })

    function getBlockTextAsserted(block: Block): string | undefined {
        return (block.content as Array<{text?: string}>)?.[0]?.text;
      }

    const getCustomSlashMenuItems = (editor: BlockNoteEditor): DefaultReactSuggestionItem[] => [
        ...getDefaultReactSlashMenuItems(editor),
        speechToTextItem(editor),
        generateSummaryItem(editor),
        generateSummaryWithFactCheckItem(editor),
        elaborateTextItem(editor)
    ];

    const editor: BlockNoteEditor = useCreateBlockNote({
        initialContent: initialContent ? JSON.parse(initialContent) as PartialBlock[] : undefined,
        uploadFile: handleUpload
    });

    useEffect(() => {
        if (listening) {
            if (null != transcriptionBlockId) {
                editor.updateBlock(transcriptionBlockId, { content : transcript });
            }
        }
    }, [transcript]);

    return(
        <div>
            <BlockNoteView 
                editor={editor}
                editable={editable}
                theme={resolvedTheme === "dark" ? "dark" : "light"}
                onChange={() => onChange(JSON.stringify(editor.topLevelBlocks, null, 2))}
                slashMenu={false}
                data-theming-css-variables-demo
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