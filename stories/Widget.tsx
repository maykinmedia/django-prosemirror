import { DjangoProsemirror } from "@/create";
import { MarkType, NodeType } from "@/schema/types";
import "@/scss/index.scss";
import type { JSX } from "preact";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { defaultDoc } from "./constants";
import { ProseMirrorDoc } from "@/types/types";

export interface DjangoProsemirrorWrapperProps {
    initialContent?: ProseMirrorDoc;
    debug?: boolean;
    allowedNodes: Array<NodeType>;
    allowedMarks: Array<MarkType>;
    classes?: Partial<Record<MarkType | NodeType, string>>;
    history: boolean;
    resize: "both" | "horizontal" | "vertical" | "block" | "inline" | "none";
    storyTitle?: string;
    storyDescription?: string;
    storyInteractions?: string[];
    storyAttrs?: string[][];
}

export const DjangoProsemirrorWidget = ({
    initialContent = defaultDoc,
    debug = true,
    allowedNodes = [],
    allowedMarks = [],
    classes = {},
    history = true,
    resize = "none",
    storyTitle,
    storyDescription,
    storyInteractions,
    storyAttrs,
}: DjangoProsemirrorWrapperProps) => {
    const [doc, setDoc] = useState<ProseMirrorDoc>(initialContent);
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
            // console.log(mutationList);
            const target = mutationList[0].target as HTMLInputElement;
            // console.log(target.value);
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
            <h2
                style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    lineHeight: "16px",
                    letterSpacing: "0.35em",
                    textTransform: "uppercase",
                    color: "rgb(92, 104, 112)",
                    border: 0,
                    marginBottom: "12px",
                    fontFamily:
                        '"Nunito Sans", -apple-system, ".SFNSText-Regular", "San Francisco", BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
                }}
            >
                Story
            </h2>
            <h3>{storyTitle || "Django ProseMirror Editor"}</h3>
            {storyDescription && <p>{storyDescription}</p>}
            {storyAttrs && <AttributesDisplay storyAttrs={storyAttrs} />}
            {storyInteractions && (
                <InteracionDisplay storyInteractions={storyInteractions} />
            )}
            <div style={{ marginTop: "20px" }}>
                <h3>Editor</h3>
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
                    data-prosemirror-classes={JSON.stringify(classes)}
                    data-prosemirror-history={history}
                    data-prosemirror-allowed-node-types={JSON.stringify(
                        allowedNodes,
                    )}
                    data-prosemirror-allowed-mark-types={JSON.stringify(
                        allowedMarks,
                    )}
                    data-prosemirror-upload-endpoint="/prosemirror/filer-image-upload/"
                    style={
                        resize !== "none"
                            ? {
                                  resize,
                                  overflow: "hidden",
                                  fontFamily: "Arial",
                              }
                            : { fontFamily: "Arial" }
                    }
                />
            </div>
            {/* Display current state for debugging */}
            <div style={{ marginTop: "20px" }}>
                <h3>Current Editor State (JSON)</h3>
                <JsonDisplay data={JSON.stringify(doc, null, 2)} />
            </div>
            {/* Display current state for debugging */}
            <div style={{ marginTop: "20px" }}>
                <h3>Current Editor State (HTML)</h3>
                <HtmlDisplay
                    html={
                        editorRef.current?.querySelector(".ProseMirror")
                            ?.innerHTML ?? ""
                    }
                />
            </div>
        </div>
    );
};

const AttributesDisplay = ({ storyAttrs }: { storyAttrs: string[][] }) => {
    return (
        <div
            style={{
                border: "1px solid #e3e3e3",
                borderRadius: "4px",
                marginTop: "16px",
                marginBottom: "16px",
                overflow: "hidden",
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
                <span style={{ fontWeight: "bold" }}>
                    SUPPORTED JSON ATTRIBUTES
                </span>
            </div>
            <div
                style={{
                    backgroundColor: "#fafafa",
                    margin: 0,
                    padding: "0",
                    overflow: "auto",
                }}
            >
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        margin: 0,
                        fontSize: "13px",
                        lineHeight: "1.45",
                    }}
                >
                    <colgroup>
                        <col width={100} />
                        <col width={100} />
                        <col />
                    </colgroup>
                    <thead>
                        <tr
                            style={{
                                borderBottom: "1px solid #e3e3e3",
                            }}
                        >
                            <th
                                style={{
                                    padding: "8px 12px",
                                    textAlign: "left",
                                    fontWeight: "600",
                                    color: "#333",
                                    width: "120px",
                                }}
                            >
                                Attribute
                            </th>
                            <th
                                style={{
                                    padding: "8px 12px",
                                    textAlign: "left",
                                    fontWeight: "600",
                                    color: "#333",
                                    width: "120px",
                                }}
                            >
                                Type
                            </th>
                            <th
                                style={{
                                    padding: "8px 12px",
                                    textAlign: "left",
                                    fontWeight: "600",
                                    color: "#333",
                                }}
                            >
                                Description
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {storyAttrs.map(
                            ([attribute, type, description], index) => (
                                <tr
                                    key={`${attribute}-${index}`}
                                    style={{
                                        borderBottom:
                                            index < storyAttrs.length - 1
                                                ? "1px solid #e8e8e8"
                                                : "none",
                                    }}
                                >
                                    <td
                                        style={{
                                            padding: "8px 12px",
                                            fontFamily:
                                                "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
                                            fontSize: "12px",
                                            color: "#0066cc",
                                            fontWeight: "600",
                                            backgroundColor: "#f8f9fa",
                                        }}
                                    >
                                        {attribute}
                                    </td>
                                    <td
                                        style={{
                                            padding: "8px 12px",
                                            color: "#555",
                                            lineHeight: "1.4",
                                        }}
                                    >
                                        <code
                                            style={{
                                                padding: "2px 5px",
                                                borderRadius: "3px",
                                                border: "1px solid rgb(236, 244, 249)",
                                                color: "rgba(46, 52, 56, 0.9)",
                                                backgroundColor:
                                                    "rgb(247, 250, 252)",
                                                flex: "0 0 auto",
                                                fontFamily:
                                                    'ui-monospace, Menlo, Monaco, "Roboto Mono", "Oxygen Mono", "Ubuntu Monospace", "Source Code Pro", "Droid Sans Mono", "Courier New", monospace',
                                                fontSize: "12px",
                                                wordBreak: "break-word",
                                                whiteSpace: "normal",
                                                maxWidth: "100%",
                                                margin: "0px 4px 4px 0px",
                                                lineHeight: "13px",
                                            }}
                                        >
                                            {type}
                                        </code>
                                    </td>
                                    <td
                                        style={{
                                            padding: "8px 12px",
                                            color: "#555",
                                            lineHeight: "1.4",
                                        }}
                                    >
                                        {description}
                                    </td>
                                </tr>
                            ),
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const InteracionDisplay = ({
    storyInteractions,
}: {
    storyInteractions: string[];
}) => {
    return (
        <div
            style={{
                border: "1px solid #e3e3e3",
                borderRadius: "4px",
                marginTop: "16px",
                marginBottom: "16px",
                overflow: "hidden",
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
                <span style={{ fontWeight: "bold" }}>INTERACTIONS</span>
            </div>
            <div
                style={{
                    backgroundColor: "#fafafa",
                    margin: 0,
                    padding: "16px",
                    overflow: "auto",
                    lineHeight: "1.45",
                }}
            >
                <ul
                    style={{
                        lineHeight: "1.5",
                        padding: 0,
                        margin: "0 1.2rem 0",
                    }}
                >
                    {storyInteractions.map((item) => (
                        <li
                            key={item}
                            dangerouslySetInnerHTML={{ __html: item }}
                        />
                    ))}
                </ul>
            </div>
        </div>
    );
};

const JsonDisplay = ({ data }: { data: string | object }) => {
    const handleCopy = async (e: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
        try {
            const textToCopy =
                typeof data === "string" ? data : JSON.stringify(data, null, 2);
            await navigator.clipboard.writeText(textToCopy);

            const target = e.target as HTMLButtonElement;
            if (target) {
                const oldValue = target.textContent;
                target.textContent = "✅ Copied!";

                setTimeout(() => {
                    target.textContent = oldValue;
                }, 2000);
            }
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };
    const syntaxHighlight = (json: string | object) => {
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
                    color: #737373;
                    font-style: italic;
                }
            `}</style>
            <div
                style={{
                    border: "1px solid #e3e3e3",
                    borderRadius: "4px",
                    marginTop: "16px",
                    marginBottom: "16px",
                    overflow: "hidden",
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

export const HtmlDisplay = ({ html }: { html: string }) => {
    const handleCopy = useCallback(
        async (e: React.MouseEvent<HTMLButtonElement>) => {
            try {
                await navigator.clipboard.writeText(html);
                const target = e.currentTarget;
                const oldValue = target.textContent;
                target.textContent = "✅ Copied!";
                setTimeout(() => {
                    target.textContent = oldValue;
                }, 2000);
            } catch (err) {
                console.error("Failed to copy text: ", err);
            }
        },
        [html],
    );
    if (!html) return "";

    const formatHtml = (rawHtml: string) => {
        let formatted = "";
        const pad = "  ";
        let indent = 0;

        rawHtml
            .replace(/>\s+</g, "><") // collapse whitespace between tags
            .split(/></)
            .forEach((node, i, arr) => {
                if (i > 0) node = "<" + node;
                if (i < arr.length - 1) node = node + ">";

                // decrease indent if it's a closing tag
                if (/^<\/\w/.test(node)) {
                    indent = Math.max(indent - 1, 0);
                }

                formatted += pad.repeat(indent) + node + "\n";

                // increase indent if it's an opening tag (not closing or self-closing)
                if (
                    /^<\w[^>]*[^/]?>$/.test(node) &&
                    !node.includes('br class="ProseMirror-trailingBreak"') &&
                    node !== "<col>"
                ) {
                    indent++;
                }
            });

        // Escape for safe <code> display
        return formatted
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    };

    const formattedHtml = formatHtml(html);

    return (
        <div
            style={{
                border: "1px solid #e3e3e3",
                borderRadius: "4px",
                marginTop: "16px",
                marginBottom: "16px",
                overflow: "hidden",
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
                <span style={{ fontWeight: "bold" }}>HTML</span>
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
                    fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
                }}
                tabIndex={0}
            >
                <code
                    dangerouslySetInnerHTML={{
                        __html: formattedHtml,
                    }}
                />
            </pre>
        </div>
    );
};
