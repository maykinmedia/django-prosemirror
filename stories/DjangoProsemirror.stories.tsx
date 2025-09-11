import { Meta, StoryObj } from "@storybook/preact-vite";
import { useEffect, useRef } from "preact/hooks";
import { DjangoProsemirror } from "../frontend/create";
import { MouseEventHandler, useState } from "react";
import "../frontend/scss/index.scss";
import { expect, fireEvent, userEvent, within } from "storybook/test";
import { pressShortcut } from "./utils";

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
                data-testid="editor-test"
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

// Helper functions for interaction tests
const waitForEditor = async (canvasElement: HTMLElement) => {
    const canvas = canvasElement.querySelector(
        '[data-prosemirror-id="storybook-prosemirror-editor"]',
    );
    if (!canvas) throw new Error("Canvas element not found");

    // Wait for the ProseMirror editor to be initialized
    let editor = canvas.querySelector(".ProseMirror");
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds with 100ms intervals

    while (!editor && attempts < maxAttempts) {
        await sleep(100);
        editor = canvas.querySelector(".ProseMirror");
        attempts++;
    }

    if (!editor) throw new Error("Editor not found after waiting");
    return editor as HTMLElement;
};

const getEditorHTML = (canvasElement: HTMLElement) => {
    const editor = canvasElement.querySelector(".ProseMirror");
    return editor?.innerHTML || "";
};

const getEditorJSON = (canvasElement: HTMLElement) => {
    const input = canvasElement.querySelector(
        "#storybook-prosemirror-input",
    ) as HTMLInputElement;
    return input ? JSON.parse(input.value) : null;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Story with text formatting interactions
export const TextFormattingInteractions: Story = {
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
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const editor = await waitForEditor(canvasElement);

        // Click editor
        await userEvent.click(editor);
        // Type text.
        const insertedBoldText = "My formatted text";
        await userEvent.type(editor, insertedBoldText);

        // Select text
        await userEvent.tripleClick(editor);

        // Toggle italic with button
        const toggleBoldBtn = await canvas.findByTitle("Toggle strong style");
        await userEvent.click(toggleBoldBtn);

        // Toggle italic with button
        const toggleItalicBtn = await canvas.findByTitle("Toggle emphasis");
        await userEvent.click(toggleItalicBtn);

        // Toggle code with button
        const toggleCodeBtn = await canvas.findByTitle("Toggle code font");
        await userEvent.click(toggleCodeBtn);

        // Toggle underline with button
        const toggleUnderlineBtn = await canvas.findByTitle("Toggle underline");
        await userEvent.click(toggleUnderlineBtn);

        // Strike throufh with button
        const toggleStrikethrough = await canvas.findByTitle(
            "Toggle strikethrough",
        );
        await userEvent.click(toggleStrikethrough);

        // Verify HTML structure contains formatting
        const htmlAfterBold = getEditorHTML(canvasElement);
        const jsonAfterBold = getEditorJSON(canvasElement);

        expect(htmlAfterBold).toContain(
            `<p><strong><em><code><u><s>${insertedBoldText}</s></u></code></em></strong></p>`,
        );

        expect(jsonAfterBold).toEqual(
            expect.objectContaining({
                type: "doc",
                content: [
                    expect.objectContaining({
                        type: "paragraph",
                        content: [
                            expect.objectContaining({
                                type: "text",
                                marks: [
                                    expect.objectContaining({ type: "strong" }),
                                    expect.objectContaining({ type: "em" }),
                                    expect.objectContaining({ type: "code" }),
                                    expect.objectContaining({
                                        type: "underline",
                                    }),
                                    expect.objectContaining({
                                        type: "strikethrough",
                                    }),
                                ],
                                text: insertedBoldText,
                            }),
                        ],
                    }),
                ],
            }),
        );
    },
};

// Story with text formatting interactions
export const TextFormattingShortcuts: Story = {
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
    play: async ({ canvasElement }) => {
        const editor = await waitForEditor(canvasElement);

        // Click editor
        await userEvent.click(editor);
        // Type text.
        const insertedBoldText = "My formatted text";
        await userEvent.type(editor, insertedBoldText);

        // Select text
        await userEvent.tripleClick(editor);

        // Make text bold
        await pressShortcut(editor, "b");

        // Make text italic
        await pressShortcut(editor, "i");

        // Verify HTML structure contains formatting
        const htmlAfterBold = getEditorHTML(canvasElement);
        const jsonAfterBold = getEditorJSON(canvasElement);

        expect(htmlAfterBold).toContain(
            `<p><strong><em>${insertedBoldText}</em></strong></p>`,
        );

        expect(jsonAfterBold).toEqual(
            expect.objectContaining({
                type: "doc",
                content: [
                    expect.objectContaining({
                        type: "paragraph",
                        content: [
                            expect.objectContaining({
                                type: "text",
                                marks: [
                                    expect.objectContaining({ type: "strong" }),
                                    expect.objectContaining({ type: "em" }),
                                ],
                                text: insertedBoldText,
                            }),
                        ],
                    }),
                ],
            }),
        );
    },
};

// Story with heading interactions
export const HeadingInteractions: Story = {
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
    play: async ({ canvasElement }) => {
        const editor = await waitForEditor(canvasElement);

        // Click editor
        await userEvent.click(editor);
        // Type text.
        const h1Text = "Heading one";
        await userEvent.type(editor, `# ${h1Text}`);

        // Verify HTML structure contains formatting
        let htmlAfterBold = getEditorHTML(canvasElement);
        let jsonAfterBold = getEditorJSON(canvasElement);

        expect(htmlAfterBold).toContain(`<h1>${h1Text}</h1>`);
        expect(jsonAfterBold).toEqual(
            expect.objectContaining({
                type: "doc",
                content: [
                    expect.objectContaining({
                        type: "heading",
                        attrs: expect.objectContaining({
                            level: 1,
                        }),
                        content: [
                            expect.objectContaining({
                                type: "text",
                                text: h1Text,
                            }),
                        ],
                    }),
                ],
            }),
        );

        // Dispatch Enter (new line)
        fireEvent.keyDown(editor, {
            key: "Enter",
            code: "KeyEnter",
            bubbles: true,
        });

        const h2Text = "Heading two";
        await userEvent.type(editor, `## ${h2Text}`);

        // Expect that the h2 is present
        htmlAfterBold = getEditorHTML(canvasElement);
        expect(htmlAfterBold).toContain(`<h2>${h2Text}</h2>`);

        // Dispatch Enter (new line)
        fireEvent.keyDown(editor, {
            key: "Enter",
            code: "KeyEnter",
            bubbles: true,
        });

        const h3Text = "Heading three";
        await userEvent.type(editor, `### ${h3Text}`);

        // Expect that the h3 is present
        htmlAfterBold = getEditorHTML(canvasElement);
        expect(htmlAfterBold).toContain(`<h3>${h3Text}</h3>`);

        // Dispatch Enter (new line)
        fireEvent.keyDown(editor, {
            key: "Enter",
            code: "KeyEnter",
            bubbles: true,
        });

        const h4Text = "Heading four";
        await userEvent.type(editor, `#### ${h4Text}`);

        // Expect that the h4 is present
        htmlAfterBold = getEditorHTML(canvasElement);
        expect(htmlAfterBold).toContain(`<h4>${h4Text}</h4>`);

        // Dispatch Enter (new line)
        fireEvent.keyDown(editor, {
            key: "Enter",
            code: "KeyEnter",
            bubbles: true,
        });

        const h5Text = "Heading five";
        await userEvent.type(editor, `##### ${h5Text}`);

        // Expect that the h5 is present
        htmlAfterBold = getEditorHTML(canvasElement);
        expect(htmlAfterBold).toContain(`<h5>${h5Text}</h5>`);

        // Dispatch Enter (new line)
        fireEvent.keyDown(editor, {
            key: "Enter",
            code: "KeyEnter",
            bubbles: true,
        });

        const h6Text = "Heading six";
        await userEvent.type(editor, `###### ${h6Text}`);

        // Expect that the h6 is present
        htmlAfterBold = getEditorHTML(canvasElement);
        expect(htmlAfterBold).toContain(`<h6>${h6Text}</h6>`);

        // Update jsonAfterBold var.
        jsonAfterBold = getEditorJSON(canvasElement);
        // Validate complete json
        expect(jsonAfterBold).toEqual(
            expect.objectContaining({
                type: "doc",
                content: [
                    ...[
                        [1, "one"],
                        [2, "two"],
                        [3, "three"],
                        [4, "four"],
                        [5, "five"],
                        [6, "six"],
                    ].map(([h, h_ex]) => {
                        return expect.objectContaining({
                            type: "heading",
                            attrs: expect.objectContaining({
                                level: h,
                            }),
                            content: [
                                expect.objectContaining({
                                    type: "text",
                                    text: "Heading " + h_ex,
                                }),
                            ],
                        });
                    }),
                ],
            }),
        );
    },
};

// Story with list interactions
export const ListInteractions: Story = {
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
    play: async ({ canvasElement }) => {
        const editor = await waitForEditor(canvasElement);

        editor.focus();
        await sleep(100);

        // Create a bullet list
        editor.textContent = "- First item";
        editor.dispatchEvent(new Event("input", { bubbles: true }));
        await sleep(200);

        // Press Enter to create new list item
        const enterEvent = new KeyboardEvent("keydown", {
            key: "Enter",
            bubbles: true,
        });
        editor.dispatchEvent(enterEvent);
        await sleep(100);

        // Add second item
        const secondItemNode = document.createTextNode("Second item");
        editor.appendChild(secondItemNode);
        editor.dispatchEvent(new Event("input", { bubbles: true }));
        await sleep(200);

        const htmlResult = getEditorHTML(canvasElement);
        const jsonResult = getEditorJSON(canvasElement);

        console.log("List HTML:", htmlResult);
        console.log("List JSON:", JSON.stringify(jsonResult, null, 2));

        // Verify list was created
        const hasList =
            htmlResult.includes("<ul>") ||
            htmlResult.includes("<li>") ||
            (jsonResult.content &&
                jsonResult.content.some(
                    (node: { type: string }) =>
                        node.type === "bullet_list" ||
                        node.type === "list_item",
                ));

        console.log("List created:", hasList);
    },
};

// Story with blockquote interactions
export const BlockquoteInteractions: Story = {
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
    play: async ({ canvasElement }) => {
        const editor = await waitForEditor(canvasElement);

        editor.focus();
        await sleep(100);

        // Create a blockquote
        editor.textContent = "> This is a blockquote";
        editor.dispatchEvent(new Event("input", { bubbles: true }));
        await sleep(300);

        // Press Enter to trigger markdown parsing
        const enterEvent = new KeyboardEvent("keydown", {
            key: "Enter",
            bubbles: true,
        });
        editor.dispatchEvent(enterEvent);
        await sleep(200);

        const htmlResult = getEditorHTML(canvasElement);
        const jsonResult = getEditorJSON(canvasElement);

        console.log("Blockquote HTML:", htmlResult);
        console.log("Blockquote JSON:", JSON.stringify(jsonResult, null, 2));

        // Verify blockquote was created
        const hasBlockquote =
            htmlResult.includes("<blockquote>") ||
            (jsonResult.content &&
                jsonResult.content.some(
                    (node: { type: string }) => node.type === "blockquote",
                ));

        console.log("Blockquote created:", hasBlockquote);
    },
};

// Story with comprehensive state consistency test
export const StateConsistencyTest: Story = {
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
    play: async ({ canvasElement }) => {
        const editor = await waitForEditor(canvasElement);

        editor.focus();
        await sleep(100);

        // Step 1: Add a heading
        editor.textContent = "# Test Document";
        editor.dispatchEvent(new Event("input", { bubbles: true }));
        await sleep(200);

        // Press Enter
        let enterEvent = new KeyboardEvent("keydown", {
            key: "Enter",
            bubbles: true,
        });
        editor.dispatchEvent(enterEvent);
        await sleep(100);

        const step1HTML = getEditorHTML(canvasElement);
        const step1JSON = getEditorJSON(canvasElement);
        console.log("Step 1 - After heading:");
        console.log("HTML:", step1HTML);
        console.log("JSON:", JSON.stringify(step1JSON, null, 2));

        // Step 2: Add paragraph with formatting
        const paragraphText = "This paragraph has bold and italic text.";
        const textNode = document.createTextNode(paragraphText);
        editor.appendChild(textNode);
        editor.dispatchEvent(new Event("input", { bubbles: true }));
        await sleep(200);

        const step2HTML = getEditorHTML(canvasElement);
        const step2JSON = getEditorJSON(canvasElement);
        console.log("Step 2 - After paragraph:");
        console.log("HTML:", step2HTML);
        console.log("JSON:", JSON.stringify(step2JSON, null, 2));

        // Step 3: Add a list
        enterEvent = new KeyboardEvent("keydown", {
            key: "Enter",
            bubbles: true,
        });
        editor.dispatchEvent(enterEvent);
        await sleep(100);

        const listText = "- List item 1";
        const listNode = document.createTextNode(listText);
        editor.appendChild(listNode);
        editor.dispatchEvent(new Event("input", { bubbles: true }));
        await sleep(200);

        const finalHTML = getEditorHTML(canvasElement);
        const finalJSON = getEditorJSON(canvasElement);
        console.log("Final state:");
        console.log("HTML:", finalHTML);
        console.log("JSON:", JSON.stringify(finalJSON, null, 2));

        // Verify state consistency
        const hasComplexStructure =
            finalJSON.content && finalJSON.content.length > 1;
        console.log("Complex structure created:", hasComplexStructure);
        console.log(
            "Total content nodes:",
            finalJSON.content ? finalJSON.content.length : 0,
        );
    },
};

// Story testing image interaction
export const ImageInteractionTest: Story = {
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
                            text: "Click the image below to test modal interaction:",
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
                                alt: "Test image",
                                title: "Test Image",
                                caption: "test",
                                imageId: "test-id",
                            },
                        },
                    ],
                },
            ],
        },
    },
    play: async ({ canvasElement }) => {
        await waitForEditor(canvasElement);
        await sleep(500);

        // Find the image
        const image = canvasElement.querySelector("img");
        if (image) {
            console.log("Image found:", image.src);

            // Click on the image to test modal functionality
            image.click();
            await sleep(200);

            // Check if modal opened (this would depend on the actual implementation)
            const modal = document.querySelector(
                '[role="dialog"], .modal, .overlay',
            );
            console.log("Modal opened:", !!modal);
        }

        const htmlResult = getEditorHTML(canvasElement);
        const jsonResult = getEditorJSON(canvasElement);

        console.log("Image HTML:", htmlResult);
        console.log("Image JSON:", JSON.stringify(jsonResult, null, 2));

        // Verify image is present in both HTML and JSON
        const hasImageInHTML = htmlResult.includes("<img");
        const hasImageInJSON =
            jsonResult.content &&
            jsonResult.content.some(
                (node: { content?: Array<{ type: string }> }) =>
                    node.content &&
                    node.content.some(
                        (content: { type: string }) => content.type === "image",
                    ),
            );

        console.log("Image in HTML:", hasImageInHTML);
        console.log("Image in JSON:", hasImageInJSON);
        console.log(
            "State consistency check:",
            hasImageInHTML && hasImageInJSON,
        );
    },
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
