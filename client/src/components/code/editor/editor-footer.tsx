"use client";

import { useCodingStates } from "@/context/coding-states-provider"
import { useEffect, useState } from "react";
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { ELanguage } from "@/types/types";
import { Info } from "lucide-react";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"

export default function EditorFooter() {
    const { editorInstance, selectedFile, project } = useCodingStates();
    const [position, setPosition] = useState<monaco.Position>();
    const [modelOptions, setModelOptions] = useState<monaco.editor.TextModelResolvedOptions>();

    useEffect(() => {
        if (!editorInstance) return;

        // set position on first mount
        setPosition(editorInstance.getPosition() ?? undefined);

        // attach listener for position
        const cursorDisposable = editorInstance.onDidChangeCursorPosition(e => setPosition(e.position));

        const modelDisposable = editorInstance.onDidChangeModelOptions(() => {
            const model = editorInstance.getModel();
            if (model) {
                setModelOptions(model.getOptions());
            }
        });

        return () => {
            cursorDisposable?.dispose()
            modelDisposable?.dispose()
        }
    }, [editorInstance]);

    useEffect(() => {
        if (!editorInstance) return;
        setModelOptions(editorInstance.getModel()?.getOptions() ?? undefined);

    }, [editorInstance?.getModel()?.getOptions()])

    function openIndentDialog(value: string) {
        if (!editorInstance) return;

        editorInstance.focus();
        editorInstance.trigger("keyboard", "editor.action.quickCommand", null);
        setTimeout(() => {
            const input = document.querySelector('.monaco-inputbox .ibwrapper input') as HTMLInputElement;
            if (input) {
                input.value = value;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }, 50);
    }

    return (
        <section className="text-xs px-2 flex items-center justify-between bg-card font-sans">
            {
                project && (project.language in availablePort) && (
                    <p className="flex items-center gap-1 p-1">
                        <HoverCard>
                            <HoverCardTrigger>
                                <Info size={12} />
                            </HoverCardTrigger>
                            <HoverCardContent className="text-sm">
                                Internally the application will be live on port {availablePort[project.language]}. If you programatically change the port, your application
                                won&apos;t be live on that port. Not recommended to change the port.
                            </HoverCardContent>
                        </HoverCard>
                        Exposed port: {availablePort[project.language]}
                    </p>
                )
            }

            <div className="text-muted-foreground flex items-center gap-4">
                {
                    position && (
                        <button
                            type="button"
                            onClick={() => openIndentDialog(":")}
                            className="p-1 hover:bg-secondary"
                        >
                            Ln {position.lineNumber}, Col {position.column}
                        </button>
                    )
                }
                {
                    modelOptions && (
                        <button
                            type="button"
                            onClick={() => openIndentDialog(">Indent Using Spaces")}
                            className="p-1 hover:bg-secondary"
                        >
                            {modelOptions.insertSpaces ? `Spaces: ${modelOptions.indentSize}` : `Tab Size: ${modelOptions.tabSize}`}
                        </button>
                    )
                }

                {
                    selectedFile && (
                        <p>
                            {langObj?.[selectedFile.name.split('.').pop() as keyof typeof langObj] || "Plaintext"}
                        </p>
                    )
                }
            </div>
        </section>
    )
}

const langObj = {
    "js": "JavaScript",
    "jsx": "JavaScript",
    "ts": "TypeScript",
    "tsx": "TypeScript JSX",
    "py": "Python",
    "html": "HTML",
    "htm": "HTML",
    "css": "CSS",
    "json": "JSON",
    "md": "Markdown",
    "c": "C",
    "cpp": "C++",
    "c++": "C++",
    "mjs": "JavaScript",
    "java": "Java",
}

const availablePort: Partial<Record<ELanguage, number>> = {
    [ELanguage.NEXT_TS]: 3000,
    [ELanguage.NODE_JS]: 3000,
    [ELanguage.REACT_JS]: 5173,
    [ELanguage.REACT_TS]: 5173,
    [ELanguage.NONE]: 3000,
}