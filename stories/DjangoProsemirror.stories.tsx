import { Meta, StoryObj } from "@storybook/preact-vite";
import { useEffect, useRef } from "preact/hooks";
import { DjangoProsemirror } from "../frontend/create";
import { MouseEventHandler, useState } from "react";
import "../frontend/scss/index.scss";

interface DjangoProsemirrorWrapperProps {
    initialContent?: Record<string, unknown>;
    debug?: boolean;
}

// Mock Django data structure
const mockDocumentData = {
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

const DjangoProsemirrorWrapper = ({
    initialContent = mockDocumentData,
    debug = true,
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
                data-prosemirror-id="storybook-prosemirror-editor"
                data-prosemirror-input-id="storybook-prosemirror-input"
                data-prosemirror-schema='["paragraph", "blockquote", "horizontal_rule", "heading", "image", "hard_break", "code_block", "bullet_list", "ordered_list", "list_item", "table", "table_row", "table_cell", "table_header", "strong", "em", "link", "code", "underline", "strikethrough"]'
                data-prosemirror-classes="{}"
                data-prosemirror-history="true"
                data-prosemirror-allowed-node-types='["paragraph", "blockquote", "horizontal_rule", "heading", "image", "hard_break", "code_block", "bullet_list", "ordered_list", "list_item", "table", "table_row", "table_cell", "table_header"]'
                data-prosemirror-allowed-mark-types='["strong", "em", "link", "code", "underline", "strikethrough"]'
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

const meta: Meta<typeof DjangoProsemirrorWrapper> = {
    title: "Django ProseMirror/Editor",
    component: DjangoProsemirrorWrapper,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component:
                    "Django ProseMirror editor with toolbar and modal functionality for editing rich content.",
            },
        },
    },
    argTypes: {
        debug: {
            control: "boolean",
            description: "Enable debug logging for the editor",
        },
        initialContent: {
            control: "object",
            description: "Initial document content in ProseMirror JSON format",
        },
    },
};

export default meta;
type Story = StoryObj<typeof DjangoProsemirrorWrapper>;

export const Default: Story = {
    args: {
        debug: true,
        initialContent: mockDocumentData,
    },
};

export const WithImage: Story = {
    args: {
        debug: true,
        initialContent: {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Here is an example with an image that can be edited via modal:",
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "image",
                            attrs: {
                                src: "https://i.pinimg.com/originals/2c/c0/5b/2cc05b4e08e0916cfe20b1ce9526c1bf.gif",
                                alt: "Placeholder image",
                                title: "Example Image",
                                caption: "test",
                                imageId: "id",
                            },
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Click on the image to open the editing modal.",
                        },
                    ],
                },
            ],
        },
    },
};

export const EmptyEditor: Story = {
    args: {
        debug: true,
        initialContent: {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                },
            ],
        },
    },
};

const JsonDisplay = ({ data }) => {
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
                /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
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
                    color: #ff6600;
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
