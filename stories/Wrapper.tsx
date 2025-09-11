import { Meta, StoryObj } from "@storybook/preact-vite";
import { useEffect, useRef } from "preact/hooks";
import { DjangoProsemirror } from "../frontend/create";
import { MouseEventHandler, useState } from "react";
import "../frontend/scss/index.scss";
import { expect, fireEvent, userEvent, within } from "storybook/test";
import { pressShortcut } from "./utils";
import { MarkType, NodeType } from "../frontend/schema/types";

interface DjangoProsemirrorWrapperProps {
    initialContent?: Record<string, unknown>;
    debug?: boolean;
    allowedNodes: Array<NodeType>;
    allowedMarks: Array<MarkType>;
    classes: Partial<Record<MarkType | NodeType, string>>;
    history: boolean;
}

// Mock Django data structure
export const mockDocumentData = {
    type: "doc",
    content: [
        {
            type: "paragraph",
            content: [
                {
                    type: "text",
                    text: "Welcome to Django ProseMirror! This editor demonstrates the modal functionality.",
                },
            ],
        },
        {
            type: "paragraph",
            content: [
                {
                    type: "text",
                    text: "Try using the toolbar to open modals for editing images and other content.",
                },
            ],
        },
    ],
};

export const DjangoProsemirrorWrapper = ({
    initialContent = mockDocumentData,
    debug = true,
    allowedNodes = [],
    allowedMarks = [],
    classes = {},
    history = true,
}: DjangoProsemirrorWrapperProps) => {
    const [doc, setDoc] = useState<Record<string, unknown>>(initialContent);
    const editorRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const prosemirrorInstanceRef = useRef<DjangoProsemirror | null>(null);

    useEffect(() => {
        if (!editorRef.current || !inputRef.current) return;

        if (debug) {
            editorRef.current.setAttribute("data-debug", debug.toString());
        }

        try {
            // Initialize Django ProseMirror
            prosemirrorInstanceRef.current = new DjangoProsemirror(
                editorRef.current,
            );
        } catch (error) {
            console.error("Failed to initialize DjangoProsemirror:", error);
        }

        // Cleanup
        return () => {
            if (prosemirrorInstanceRef.current?.editor) {
                prosemirrorInstanceRef.current.editor.destroy();
            }
        };
    }, [initialContent, debug]);

    useEffect(() => {
        const input = document.querySelector("#storybook-prosemirror-input");
        if (!input) return;
        // Callback function to execute when mutations are observed
        const callback: MutationCallback = (mutationList) => {
            console.log(mutationList);
            const target = mutationList[0].target as HTMLInputElement;
            console.log(target.value);
            setDoc(JSON.parse(target.value));
        };

        // Create an observer instance linked to the callback function
        const observer = new MutationObserver(callback);
        // Start observing the target node for configured mutations
        observer.observe(input, { attributeFilter: ["value"] });

        // Later, you can stop observing
        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <div style={{ padding: "20px", maxWidth: "800px" }}>
            <h2>Django ProseMirror Editor with Modal Support</h2>
            <p>
                This story demonstrates the Django ProseMirror editor with
                toolbar and modal functionality.
            </p>
            {/* Hidden input to store the editor state (Django pattern) */}
            <input
                ref={inputRef}
                type="hidden"
                name="content"
                id="storybook-prosemirror-input"
                defaultValue={JSON.stringify(initialContent, null, 2)}
            />
            {/* Editor container */}
            <div
                ref={editorRef}
                className="editor"
                data-testid="editor-test"
                data-prosemirror-id="storybook-prosemirror-editor"
                data-prosemirror-input-id="storybook-prosemirror-input"
                data-prosemirror-schema="[]"
                data-prosemirror-classes={JSON.stringify(classes)}
                data-prosemirror-history={history}
                data-prosemirror-allowed-node-types={JSON.stringify(
                    allowedNodes,
                )}
                data-prosemirror-allowed-mark-types={JSON.stringify(
                    allowedMarks,
                )}
                // data-prosemirror-allowed-mark-types='["strong", "em", "link", "code", "underline", "strikethrough"]'
                data-prosemirror-upload-endpoint="/prosemirror/filer-image-upload/"
            />
            {/* Display current state for debugging */}
            <div style={{ marginTop: "20px" }}>
                <h3>Current Editor State (JSON)</h3>
                <JsonDisplay data={JSON.stringify(doc, null, 2)} />
            </div>
        </div>
    );
};

const JsonDisplay = ({ data }: { data: string | object }) => {
    const handleCopy: MouseEventHandler<HTMLButtonElement> = async (e) => {
        try {
            const textToCopy =
                typeof data === "string" ? data : JSON.stringify(data, null, 2);
            await navigator.clipboard.writeText(textToCopy);

            const target = e.currentTarget;
            if (target) {
                const oldValue = target.textContent;
                target.textContent = "✅ Copied!";

                setTimeout(() => {
                    target.textContent = oldValue;
                }, 2000);
            }
            // You could add a toast notification here if needed
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };
    const syntaxHighlight = (json) => {
        // Ensure we have a string to work with
        let jsonString =
            typeof json === "string" ? json : JSON.stringify(json, null, 2);

        // Replace different JSON elements with styled spans
        jsonString = jsonString
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(
                /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
                function (match) {
                    let cls = "json-number";

                    if (/^"/.test(match)) {
                        if (/:$/.test(match)) {
                            cls = "json-key";
                        } else {
                            cls = "json-string";
                        }
                    } else if (/true|false/.test(match)) {
                        cls = "json-boolean";
                    } else if (/null/.test(match)) {
                        cls = "json-null";
                    }

                    return '<span class="' + cls + '">' + match + "</span>";
                },
            );

        return jsonString;
    };

    const highlightedJson = syntaxHighlight(data);

    return (
        <>
            <style>{`
                .json-key {
                    color: #0066cc;
                    font-weight: 600;
                }
                .json-string {
                    color: #008000;
                }
                .json-number {
                    color: #C24E00;
                }
                .json-boolean {
                    color: #cc0066;
                    font-weight: 600;
                }
                .json-null {
                    color: #999999;
                    font-style: italic;
                }
            `}</style>
            <div
                style={{
                    border: "1px solid #e3e3e3",
                    borderRadius: "4px",
                    marginTop: "16px",
                    marginBottom: "16px",
                }}
            >
                <div
                    style={{
                        backgroundColor: "#f8f8f8",
                        padding: "8px 12px",
                        borderBottom: "1px solid #e3e3e3",
                        fontSize: "12px",
                        color: "#666",
                        fontWeight: "500",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <span style={{ fontWeight: "bold" }}>JSON</span>
                    <button
                        onClick={handleCopy}
                        style={{
                            background: "none",
                            border: "1px solid #d1d5db",
                            borderRadius: "3px",
                            padding: "4px 8px",
                            fontSize: "11px",
                            color: "#666",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = "#e5e7eb";
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor =
                                "transparent";
                        }}
                    >
                        📋 Copy
                    </button>
                </div>
                <pre
                    style={{
                        backgroundColor: "#fafafa",
                        margin: 0,
                        padding: "16px",
                        overflow: "auto",
                        fontSize: "13px",
                        lineHeight: "1.45",
                        fontFamily:
                            "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
                    }}
                    tabIndex={0}
                >
                    <code
                        dangerouslySetInnerHTML={{
                            __html: highlightedJson,
                        }}
                    />
                </pre>
            </div>
        </>
    );
};
