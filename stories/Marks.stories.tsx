import { en } from "@/i18n/locales/en";
import { MarkType } from "@/schema/types";
import { ProseMirrorDoc } from "@/types/types";
import { Meta, StoryObj } from "@storybook/preact-vite";
import { expect } from "storybook/test";
import { defaultArgs, defaultMeta, shortcuts } from "./constants";
import {
    createParagraph,
    createTextNode,
    deselect,
    selectBackward,
    verifyEditorContent,
    verifyMenuButtonState,
    waitForEditor,
} from "./utils";
import { DjangoProsemirrorWidget } from "./Widget";

const meta: Meta<typeof DjangoProsemirrorWidget> = {
    ...defaultMeta,
    title: "Django ProseMirror/Marks",
    beforeEach: async () => {
        // Clean up any lingering editors from previous tests
        const existingEditors = document.querySelectorAll('.ProseMirror');
        existingEditors.forEach((editor) => {
            const parent = editor.closest('[data-prosemirror-id]');
            if (parent) {
                parent.innerHTML = '';
            }
        });

        // Wait for cleanup and next tick
        await new Promise((resolve) => setTimeout(resolve, 100));
    },
};

export default meta;
type Story = StoryObj<typeof DjangoProsemirrorWidget>;

/**
 * Tests bold text formatting using toolbar button and keyboard shortcut (Ctrl+B/⌘+B). Validates text selection, mark application/removal, and proper <strong> element generation for semantic emphasis.
 */

const baseStrongJSONContent = {
    type: "doc",
    content: [
        createParagraph([
            createTextNode("This text contains "),
            createTextNode("bold formatting", [{ type: MarkType.STRONG }]),
            createTextNode(" to emphasize important content."),
        ]),
        createParagraph(
            "You can make text bold by selecting it and clicking the bold button or using Ctrl+B (⌘+B on Mac).",
        ),
    ],
};
export const StrongMarkStory: Story = {
    name: "Strong/Bold Mark",
    parameters: {
        docs: {
            description: {
                story: "Tests bold text formatting using toolbar button and keyboard shortcut (Ctrl+B/⌘+B). Validates text selection, mark application/removal, and proper <strong> element generation for semantic emphasis.",
            },
        },
    },
    args: {
        ...defaultArgs,
        storyTitle: "Bold/Strong Text",
        storyDescription:
            "Bold text creates semantic emphasis for important content, rendering text with heavier font weight. Use for highlighting key concepts, warnings, or critical information.",
        storyInteractions: [
            "Select text and click <b>Bold button (B)</b> in toolbar",
            "Use keyboard shortcut <b>Mod+B</b> to toggle bold formatting",
            "Type text while bold is active for new content",
            "Toggle bold on/off by clicking button or shortcut again",
            "Combine with other marks (italic, underline, code, etc.)",
        ],
        initialContent: baseStrongJSONContent,
    },
    play: async ({ canvasElement, canvas, userEvent, step }) => {
        let editor: HTMLElement,
            strongBtn: HTMLButtonElement,
            expectedHTML: string,
            expectedJSON: ProseMirrorDoc;

        // Setup
        await step("Setup strong mark story", async () => {
            expectedHTML =
                "<p>This text contains <strong>bold formatting</strong> to emphasize important content.</p><p>You can make text bold by selecting it and clicking the bold button or using Ctrl+B (⌘+B on Mac).</p>";
            expectedJSON = baseStrongJSONContent;
            editor = await waitForEditor(canvasElement);
            strongBtn = await canvas.findByTitle(en["Toggle strong style"]);

            await step("Verify strong mark setup", async () => {
                // Verify initial setup
                expect(strongBtn).toBeDefined();
                expect(strongBtn).toBeInTheDocument();
                await verifyMenuButtonState(strongBtn, false);

                expect(editor).toBeDefined();
                expect(expectedHTML).toBeDefined();
                expect(expectedJSON).toBeDefined();
            });
        });

        // Start!
        await step("Select and press enter inside the editor", async () => {
            await userEvent.click(editor);
            await userEvent.keyboard("{Enter}");
        });

        // Interaction 1 - select and toggle
        await step(
            "Select text and click Bold button (B) in toolbar",
            async () => {
                let selection: Selection | null = window.getSelection();
                const notBoldText = "This is not bold text, ";
                const boldText = "this is bold.";

                await step(
                    "Test mark strong by selecting text and clicking the strong menuitem.",
                    async () => {
                        await userEvent.type(editor, notBoldText);
                        await userEvent.type(editor, boldText);
                        selection = await selectBackward(editor, boldText);
                        await userEvent.click(strongBtn);
                    },
                );

                await step("Verify current document", async () => {
                    expectedHTML = `${expectedHTML}<p>${notBoldText}<strong>${boldText}</strong></p>`;
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            ...expectedJSON.content,
                            createParagraph([
                                createTextNode(notBoldText),
                                createTextNode(boldText, [
                                    { type: MarkType.STRONG },
                                ]),
                            ]),
                        ],
                    };
                    verifyEditorContent(
                        canvasElement,
                        expectedHTML,
                        expectedJSON,
                    );
                });

                await step("Deselect selection", () => {
                    deselect(selection!);
                });

                await step("Toggle bold off via toolbar button", async () => {
                    await userEvent.click(strongBtn);
                    await verifyMenuButtonState(strongBtn, false);
                });
            },
        );

        // Interaction 2 - shortcut and type
        await step(
            "Use keyboard shortcut Mod+B to toggle bold formatting",
            async () => {
                await step("Activate bold with shortcut", async () => {
                    // Not active
                    await verifyMenuButtonState(strongBtn, false);
                    await userEvent.keyboard(shortcuts.bold);
                    await verifyMenuButtonState(strongBtn, true);
                });

                await step("Deativate bold with shortcut", async () => {
                    // Not active
                    await verifyMenuButtonState(strongBtn, true);
                    await userEvent.keyboard(shortcuts.bold);
                    await verifyMenuButtonState(strongBtn, false);
                });
            },
        );

        // Interaction 3 - active and type
        const shortcutBoldText = "This text uses keyboard shortcut.";
        await step(
            "Type text while bold is active for new content",
            async () => {
                await step(
                    "Insert bold text by activation bold with shortcut and then type",
                    async () => {
                        await userEvent.keyboard("{Enter}");
                        await userEvent.keyboard(shortcuts.bold);
                        await verifyMenuButtonState(strongBtn, true);
                        await userEvent.type(editor, shortcutBoldText);
                    },
                );
                await step("Verify current document", async () => {
                    expectedHTML = `${expectedHTML}<p><strong>${shortcutBoldText}</strong></p>`;
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            ...expectedJSON.content,
                            createParagraph([
                                createTextNode(shortcutBoldText, [
                                    { type: MarkType.STRONG },
                                ]),
                            ]),
                        ],
                    };
                    verifyEditorContent(
                        canvasElement,
                        expectedHTML,
                        expectedJSON,
                    );
                });
            },
        );

        // Interaction 4 - toggle with shortcut
        await step(
            "Toggle bold on/off by clicking button or shortcut again",
            async () => {
                await userEvent.keyboard(shortcuts.bold);
                await verifyMenuButtonState(strongBtn, false);
            },
        );

        // Interaction 5 - combine multiple
        await step("Combine with other marks", async () => {
            const boldItalicCodeText = "I am code/italic/bold text";
            await userEvent.keyboard("{Enter}" + boldItalicCodeText);
            await selectBackward(editor, boldItalicCodeText);

            // Toggle bold, italic and code with shortcuts
            await userEvent.keyboard("{Meta>}bi`{/Meta}");

            await step("Verify current document", async () => {
                expectedHTML = `${expectedHTML}<p><strong><em><code>${boldItalicCodeText}</code></em></strong></p>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        ...expectedJSON.content,
                        createParagraph([
                            createTextNode(boldItalicCodeText, [
                                { type: MarkType.STRONG },
                                { type: MarkType.ITALIC },
                                { type: MarkType.CODE },
                            ]),
                        ]),
                    ],
                };

                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });
    },
};

/**
 * Demonstrates italic text formatting with toolbar button and keyboard shortcut (Ctrl+I/⌘+I). Tests text selection, emphasis mark toggling, and semantic <em> element generation for proper text styling.
 */
const baseItalicJSONContent = {
    type: "doc",
    content: [
        createParagraph([
            createTextNode("This text demonstrates "),
            createTextNode("italic emphasis", [{ type: MarkType.ITALIC }]),
            createTextNode(" for highlighting words or phrases."),
        ]),
        createParagraph(
            "Use italic text for book titles, foreign words, or gentle emphasis.",
        ),
    ],
};
export const ItalicMarkStory: Story = {
    name: "Italic/Emphasis Mark",
    parameters: {
        docs: {
            description: {
                story: "Demonstrates italic text formatting with toolbar button and keyboard shortcut (Ctrl+I/⌘+I). Tests text selection, emphasis mark toggling, and semantic <em> element generation for proper text styling.",
            },
        },
    },
    args: {
        ...defaultArgs,
        storyTitle: "Italic/Emphasis Text",
        storyDescription:
            "Italic text provides subtle emphasis and stylistic differentiation, rendering text with slanted letterforms. Ideal for quotes, foreign words, book titles, or gentle emphasis.",
        storyInteractions: [
            "Select text and click <b>Italic button (I)</b> in toolbar",
            "Use keyboard shortcut <b>Mod+I</b> (Ctrl+I on Windows/Linux, ⌘+I on Mac)",
            "<b>Type text</b> while italic is active for new content",
            "<b>Toggle italic on/off</b> by clicking button or shortcut again",
            "<b>Combine with other marks</b> (bold, underline, code, etc.)",
            "<b>Keymap:</b> Mod+I toggles italic/emphasis formatting",
        ],
        initialContent: baseItalicJSONContent,
    },
    play: async ({ canvasElement, canvas, userEvent, step }) => {
        let editor: HTMLElement,
            italicBtn: HTMLButtonElement,
            expectedHTML: string,
            expectedJSON: ProseMirrorDoc;

        // Setup
        await step("Setup italic mark story", async () => {
            expectedHTML =
                "<p>This text demonstrates <em>italic emphasis</em> for highlighting words or phrases.</p><p>Use italic text for book titles, foreign words, or gentle emphasis.</p>";
            expectedJSON = baseItalicJSONContent;
            editor = await waitForEditor(canvasElement);
            italicBtn = await canvas.findByTitle("Toggle emphasis");

            await step("Verify italic mark setup", () => {
                // Verify initial setup
                expect(italicBtn).toBeDefined();
                expect(italicBtn).toBeInTheDocument();
                expect(italicBtn).not.toHaveClass("ProseMirror-menu-disabled");

                expect(editor).toBeDefined();
                expect(expectedHTML).toBeDefined();
                expect(expectedJSON).toBeDefined();
            });
        });

        // Start!
        await step("Select and press enter inside the editor", async () => {
            await userEvent.click(editor);
            await userEvent.keyboard("{Enter}");
        });

        // Interaction 1 - select and toggle
        await step(
            "Select text and click Italic button (I) in toolbar",
            async () => {
                let selection: Selection | null = window.getSelection();
                const notItalicText = "This is not italic text, ";
                const italicText = "this is italic.";

                await step(
                    "Test mark italic by selecting text and clicking the italic menuitem.",
                    async () => {
                        await userEvent.type(editor, notItalicText);
                        await userEvent.type(editor, italicText);
                        selection = await selectBackward(editor, italicText);
                        await userEvent.click(italicBtn);
                    },
                );

                await step("Verify current document", async () => {
                    expectedHTML = `${expectedHTML}<p>${notItalicText}<em>${italicText}</em></p>`;
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            ...expectedJSON.content,
                            createParagraph([
                                createTextNode(notItalicText),
                                createTextNode(italicText, [
                                    { type: MarkType.ITALIC },
                                ]),
                            ]),
                        ],
                    };
                    verifyEditorContent(
                        canvasElement,
                        expectedHTML,
                        expectedJSON,
                    );
                });

                await step("Deselect selection", () => {
                    deselect(selection!);
                });

                await step("Toggle italic off via toolbar button", async () => {
                    await userEvent.click(italicBtn);
                    await verifyMenuButtonState(italicBtn, false);
                });
            },
        );

        // Interaction 2 - shortcut and type
        await step(
            "Use keyboard shortcut Mod+I to toggle italic formatting",
            async () => {
                await step("Activate italic with shortcut", async () => {
                    // Not active
                    await verifyMenuButtonState(italicBtn, false);
                    await userEvent.keyboard(shortcuts.italic);
                    await verifyMenuButtonState(italicBtn, true);
                });

                await step("Deativate italic with shortcut", async () => {
                    // Not active
                    await verifyMenuButtonState(italicBtn, true);
                    await userEvent.keyboard(shortcuts.italic);
                    await verifyMenuButtonState(italicBtn, false);
                });
            },
        );

        // Interaction 3 - active and type
        const shortcutItalicText = "This text uses keyboard shortcut.";
        await step(
            "Type text while italic is active for new content",
            async () => {
                await step(
                    "Insert italic text by activation italic with shortcut and then type",
                    async () => {
                        await userEvent.keyboard("{Enter}");
                        await userEvent.keyboard(shortcuts.italic);
                        await verifyMenuButtonState(italicBtn, true);
                        await userEvent.type(editor, shortcutItalicText);
                    },
                );
                await step("Verify current document", async () => {
                    expectedHTML = `${expectedHTML}<p><em>${shortcutItalicText}</em></p>`;
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            ...expectedJSON.content,
                            createParagraph([
                                createTextNode(shortcutItalicText, [
                                    { type: MarkType.ITALIC },
                                ]),
                            ]),
                        ],
                    };
                    verifyEditorContent(
                        canvasElement,
                        expectedHTML,
                        expectedJSON,
                    );
                });
            },
        );

        // Interaction 4 - toggle with shortcut
        await step(
            "Toggle italic on/off by clicking button or shortcut again",
            async () => {
                await userEvent.keyboard(shortcuts.italic);
                await verifyMenuButtonState(italicBtn, false);
            },
        );

        // Interaction 5 - combine multiple
        await step("Combine with other marks", async () => {
            const italicBoldCodeText = "I am code/bold/italic text";
            await userEvent.keyboard("{Enter}" + italicBoldCodeText);
            await selectBackward(editor, italicBoldCodeText);

            // Toggle italic, bold and code with shortcuts
            await userEvent.keyboard("{Meta>}ib`{/Meta}");

            await step("Verify current document", async () => {
                expectedHTML = `${expectedHTML}<p><strong><em><code>${italicBoldCodeText}</code></em></strong></p>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        ...expectedJSON.content,
                        createParagraph([
                            createTextNode(italicBoldCodeText, [
                                { type: MarkType.STRONG },
                                { type: MarkType.ITALIC },
                                { type: MarkType.CODE },
                            ]),
                        ]),
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });
    },
};

/**
 * Tests inline code formatting using toolbar button and keyboard shortcut (Ctrl+`). Validates monospace text styling, proper <code> element generation, and inline code mark behavior within paragraphs.
 */
const baseCodeJSONContent = {
    type: "doc",
    content: [
        createParagraph([
            createTextNode("Use the "),
            createTextNode("console.log()", [{ type: MarkType.CODE }]),
            createTextNode(" function to debug your code."),
        ]),
        createParagraph(
            "Inline code formatting is perfect for variable names, function calls, and short code snippets.",
        ),
    ],
};
export const CodeMarkStory: Story = {
    name: "Code Mark",
    parameters: {
        docs: {
            description: {
                story: "Tests inline code formatting using toolbar button and keyboard shortcut (Ctrl+`). Validates monospace text styling, proper <code> element generation, and inline code mark behavior within paragraphs.",
            },
        },
    },
    args: {
        ...defaultArgs,
        storyTitle: "Inline Code",
        storyDescription:
            "Inline code marks text as code snippets within paragraphs, rendering with monospace font and distinct styling. Perfect for variable names, function calls, or technical terms.",
        storyInteractions: [
            "Select text and click <b>Code button (&lt;/&gt;)</b> in toolbar",
            "Use keyboard shortcut <b>Mod+`</b> (Ctrl+` on Windows/Linux, ⌘+` on Mac)",
            "<b>Type text</b> while code mark is active for new content",
            "<b>Toggle code formatting</b> on/off by clicking button or shortcut again",
            "<b>Combine with other marks</b> (bold, italic for formatted code)",
            "<b>Keymap:</b> Mod+` toggles inline code formatting",
        ],
        initialContent: baseCodeJSONContent,
    },
    play: async ({ canvasElement, canvas, userEvent, step }) => {
        let editor: HTMLElement,
            codeBtn: HTMLButtonElement,
            expectedHTML: string,
            expectedJSON: ProseMirrorDoc;

        // Setup
        await step("Setup code mark story", async () => {
            expectedHTML =
                "<p>Use the <code>console.log()</code> function to debug your code.</p><p>Inline code formatting is perfect for variable names, function calls, and short code snippets.</p>";
            expectedJSON = baseCodeJSONContent;
            editor = await waitForEditor(canvasElement);
            codeBtn = await canvas.findByTitle("Toggle code font");

            await step("Verify code mark setup", () => {
                // Verify initial setup
                expect(codeBtn).toBeDefined();
                expect(codeBtn).toBeInTheDocument();
                expect(codeBtn).not.toHaveClass("ProseMirror-menu-disabled");

                expect(editor).toBeDefined();
                expect(expectedHTML).toBeDefined();
                expect(expectedJSON).toBeDefined();
            });
        });

        // Start!
        await step("Select and press enter inside the editor", async () => {
            await userEvent.click(editor);
            await userEvent.keyboard("{Enter}");
        });

        // Interaction 1 - select and toggle
        await step(
            "Select text and click Code button (</>)  in toolbar",
            async () => {
                let selection: Selection | null = window.getSelection();
                const notCodeText = "This is normal text, ";
                const codeText = "this is code.";

                await step(
                    "Test mark code by selecting text and clicking the code menuitem.",
                    async () => {
                        await userEvent.type(editor, notCodeText);
                        await userEvent.type(editor, codeText);
                        selection = await selectBackward(editor, codeText);
                        await userEvent.click(codeBtn);
                    },
                );

                await step("Verify current document", async () => {
                    expectedHTML = `${expectedHTML}<p>${notCodeText}<code>${codeText}</code></p>`;
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            ...expectedJSON.content,
                            createParagraph([
                                createTextNode(notCodeText),
                                createTextNode(codeText, [
                                    { type: MarkType.CODE },
                                ]),
                            ]),
                        ],
                    };
                    verifyEditorContent(
                        canvasElement,
                        expectedHTML,
                        expectedJSON,
                    );
                });

                await step("Deselect selection", () => {
                    deselect(selection!);
                });

                await step("Toggle code off via toolbar button", async () => {
                    await userEvent.click(codeBtn);
                    await verifyMenuButtonState(codeBtn, false);
                });
            },
        );

        // Interaction 2 - shortcut and type
        await step(
            "Use keyboard shortcut Mod+` to toggle code formatting",
            async () => {
                await step("Activate code with shortcut", async () => {
                    // Not active
                    await verifyMenuButtonState(codeBtn, false);
                    await userEvent.keyboard(shortcuts.code);
                    await verifyMenuButtonState(codeBtn, true);
                });

                await step("Deativate code with shortcut", async () => {
                    // Not active
                    await verifyMenuButtonState(codeBtn, true);
                    await userEvent.keyboard(shortcuts.code);
                    await verifyMenuButtonState(codeBtn, false);
                });
            },
        );

        // Interaction 3 - active and type
        const shortcutCodeText = "This text uses keyboard shortcut.";
        await step(
            "Type text while code is active for new content",
            async () => {
                await step(
                    "Insert code text by activation code with shortcut and then type",
                    async () => {
                        await userEvent.keyboard("{Enter}");
                        await userEvent.keyboard(shortcuts.code);
                        await verifyMenuButtonState(codeBtn, true);
                        await userEvent.type(editor, shortcutCodeText);
                    },
                );
                await step("Verify current document", async () => {
                    expectedHTML = `${expectedHTML}<p><code>${shortcutCodeText}</code></p>`;
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            ...expectedJSON.content,
                            createParagraph([
                                createTextNode(shortcutCodeText, [
                                    { type: MarkType.CODE },
                                ]),
                            ]),
                        ],
                    };
                    verifyEditorContent(
                        canvasElement,
                        expectedHTML,
                        expectedJSON,
                    );
                });
            },
        );

        // Interaction 4 - toggle with shortcut
        await step(
            "Toggle code on/off by clicking button or shortcut again",
            async () => {
                await userEvent.keyboard(shortcuts.code);
                await verifyMenuButtonState(codeBtn, false);
            },
        );

        // Interaction 5 - combine multiple
        await step("Combine with other marks", async () => {
            const codeBoldItalicText = "I am bold/italic/code text";
            await userEvent.keyboard("{Enter}" + codeBoldItalicText);
            await selectBackward(editor, codeBoldItalicText);

            // Toggle code, bold and italic with shortcuts
            await userEvent.keyboard("{Meta>}`bi{/Meta}");

            await step("Verify current document", async () => {
                expectedHTML = `${expectedHTML}<p><strong><em><code>${codeBoldItalicText}</code></em></strong></p>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        ...expectedJSON.content,
                        createParagraph([
                            createTextNode(codeBoldItalicText, [
                                { type: MarkType.STRONG },
                                { type: MarkType.ITALIC },
                                { type: MarkType.CODE },
                            ]),
                        ]),
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });
    },
};

/**
 * Underline Mark Story
 */
const baseUnderlineJSONContent = {
    type: "doc",
    content: [
        createParagraph([
            createTextNode("Underline formatting can be used to "),
            createTextNode("highlight important information", [
                { type: MarkType.UNDERLINE },
            ]),
            createTextNode(" or mimic traditional document formatting."),
        ]),
        createParagraph(
            "Note: Use underlines sparingly as they can be confused with links in digital content.",
        ),
    ],
};
export const UnderlineMarkStory: Story = {
    name: "Underline Mark",
    parameters: {
        docs: {
            description: {
                story: "Validates underline text decoration using toolbar button and keyboard shortcut (Ctrl+U). Tests proper <u> element generation, underline mark application to selected text, and visual text decoration styling.",
            },
        },
    },
    args: {
        ...defaultArgs,
        storyTitle: "Underline Text",
        storyDescription:
            "Underline adds a line beneath text for emphasis or decoration, commonly used for highlighting important points. Use sparingly as it can be confused with hyperlinks.",
        storyInteractions: [
            "Select text and click <b>Underline button (U)</b> in toolbar",
            "Use keyboard shortcut <b>Mod+U</b> (Ctrl+U on Windows/Linux, ⌘+U on Mac)",
            "<b>Type text</b> while underline is active for new content",
            "<b>Toggle underline on/off</b> by clicking button or shortcut again",
            "<b>Combine with other marks</b> (bold, italic, strikethrough, etc.)",
            "<b>Keymap:</b> Mod+U toggles underline formatting",
        ],
        initialContent: baseUnderlineJSONContent,
    },
    play: async ({ canvasElement, canvas, userEvent, step }) => {
        let editor: HTMLElement,
            underlineBtn: HTMLButtonElement,
            expectedHTML: string,
            expectedJSON: ProseMirrorDoc;

        // Setup
        await step("Setup underline mark story", async () => {
            expectedHTML =
                "<p>Underline formatting can be used to <u>highlight important information</u> or mimic traditional document formatting.</p><p>Note: Use underlines sparingly as they can be confused with links in digital content.</p>";
            expectedJSON = baseUnderlineJSONContent;
            editor = await waitForEditor(canvasElement);
            underlineBtn = await canvas.findByTitle("Toggle underline");

            await step("Verify underline mark setup", () => {
                // Verify initial setup
                expect(underlineBtn).toBeDefined();
                expect(underlineBtn).toBeInTheDocument();
                expect(underlineBtn).not.toHaveClass(
                    "ProseMirror-menu-disabled",
                );

                expect(editor).toBeDefined();
                expect(expectedHTML).toBeDefined();
                expect(expectedJSON).toBeDefined();
            });
        });

        // Start!
        await step("Select and press enter inside the editor", async () => {
            await userEvent.click(editor);
            await userEvent.keyboard("{Enter}");
        });

        // Interaction 1 - select and toggle
        await step(
            "Select text and click Underline button (U) in toolbar",
            async () => {
                let selection: Selection | null = window.getSelection();
                const notUnderlineText = "This is not underlined, ";
                const underlineText = "this is underlined.";

                await step(
                    "Test mark underline by selecting text and clicking the underline menuitem.",
                    async () => {
                        await userEvent.type(editor, notUnderlineText);
                        await userEvent.type(editor, underlineText);
                        selection = await selectBackward(editor, underlineText);
                        await userEvent.click(underlineBtn);
                    },
                );

                await step("Verify current document", async () => {
                    expectedHTML = `${expectedHTML}<p>${notUnderlineText}<u>${underlineText}</u></p>`;
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            ...expectedJSON.content,
                            createParagraph([
                                createTextNode(notUnderlineText),
                                createTextNode(underlineText, [
                                    { type: MarkType.UNDERLINE },
                                ]),
                            ]),
                        ],
                    };
                    verifyEditorContent(
                        canvasElement,
                        expectedHTML,
                        expectedJSON,
                    );
                });

                await step("Deselect selection", () => {
                    deselect(selection!);
                });

                await step(
                    "Toggle underline off via toolbar button",
                    async () => {
                        await userEvent.click(underlineBtn);
                        await verifyMenuButtonState(underlineBtn, false);
                    },
                );
            },
        );

        // Interaction 2 - type while active
        const toolbarUnderlineText = "This text uses toolbar activation.";
        await step(
            "Type text while underline is active for new content",
            async () => {
                await step(
                    "Insert underline text by activation underline with toolbar and then type",
                    async () => {
                        await userEvent.keyboard("{Enter}");
                        await userEvent.click(underlineBtn);
                        await verifyMenuButtonState(underlineBtn, true);
                        await userEvent.type(editor, toolbarUnderlineText);
                    },
                );
                await step("Verify current document", async () => {
                    expectedHTML = `${expectedHTML}<p><u>${toolbarUnderlineText}</u></p>`;
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            ...expectedJSON.content,
                            createParagraph([
                                createTextNode(toolbarUnderlineText, [
                                    { type: MarkType.UNDERLINE },
                                ]),
                            ]),
                        ],
                    };
                    verifyEditorContent(
                        canvasElement,
                        expectedHTML,
                        expectedJSON,
                    );
                });
            },
        );

        // Interaction 3 - toggle with toolbar
        await step(
            "Toggle underline on/off by clicking button again",
            async () => {
                await userEvent.click(underlineBtn);
                await verifyMenuButtonState(underlineBtn, false);
            },
        );

        // Interaction 4 - combine multiple
        await step("Combine with other marks", async () => {
            const underlineBoldItalicText = "I am bold/italic/underline text";
            await userEvent.keyboard("{Enter}" + underlineBoldItalicText);
            await selectBackward(editor, underlineBoldItalicText);

            // Mark selected text with underline
            await userEvent.click(underlineBtn);

            // Toggle bold and italic with shortcuts
            await userEvent.keyboard("{Meta>}bi{/Meta}");

            await step("Verify current document", async () => {
                expectedHTML = `${expectedHTML}<p><strong><em><u>${underlineBoldItalicText}</u></em></strong></p>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        ...expectedJSON.content,
                        createParagraph([
                            createTextNode(underlineBoldItalicText, [
                                { type: MarkType.STRONG },
                                { type: MarkType.ITALIC },
                                { type: MarkType.UNDERLINE },
                            ]),
                        ]),
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });
    },
};

/**
 * Strikethrough Mark Story
 * @done
 */
const baseStrikethroughJSONContent = {
    type: "doc",
    content: [
        createParagraph([
            createTextNode("Strikethrough text shows "),
            createTextNode("deleted or outdated information", [
                { type: MarkType.STRIKETHROUGH },
            ]),
            createTextNode(" while keeping it visible for reference."),
        ]),
        createParagraph(
            "Use strikethrough to show corrections or changes in documents.",
        ),
    ],
};
export const StrikethroughMarkStory: Story = {
    args: {
        ...defaultArgs,
        storyTitle: "Strikethrough Text",
        storyDescription:
            "Strikethrough crosses out text to indicate deletion, completion, or outdated information while keeping it visible. Essential for editing workflows and document revisions.",
        storyInteractions: [
            "Select text and click <b>Strikethrough button (S)</b> in toolbar",
            "<b>Type text</b> while strikethrough is active for new content",
            "<b>Toggle strikethrough on/off</b> by clicking button again",
            "<b>Combine with other marks</b> (bold, italic, underline, etc.)",
            "Create <b>crossed-out text</b> for editing workflows and revisions",
        ],
        initialContent: baseStrikethroughJSONContent,
    },
    play: async ({ canvasElement, canvas, userEvent, step }) => {
        let editor: HTMLElement,
            strikethroughBtn: HTMLButtonElement,
            expectedHTML: string,
            expectedJSON: ProseMirrorDoc;

        // Setup
        await step("Setup strikethrough mark story", async () => {
            expectedHTML =
                "<p>Strikethrough text shows <s>deleted or outdated information</s> while keeping it visible for reference.</p><p>Use strikethrough to show corrections or changes in documents.</p>";
            expectedJSON = baseStrikethroughJSONContent;
            editor = await waitForEditor(canvasElement);
            strikethroughBtn = await canvas.findByTitle("Toggle strikethrough");

            await step("Verify strikethrough mark setup", () => {
                // Verify initial setup
                expect(strikethroughBtn).toBeDefined();
                expect(strikethroughBtn).toBeInTheDocument();
                expect(strikethroughBtn).not.toHaveClass(
                    "ProseMirror-menu-disabled",
                );

                expect(editor).toBeDefined();
                expect(expectedHTML).toBeDefined();
                expect(expectedJSON).toBeDefined();
            });
        });

        // Start!
        await step("Select and press enter inside the editor", async () => {
            await userEvent.click(editor);
            await userEvent.keyboard("{Enter}");
        });

        // Interaction 1 - select and toggle
        await step(
            "Select text and click Strikethrough button (S) in toolbar",
            async () => {
                let selection: Selection | null = window.getSelection();
                const notStrikethroughText = "This is normal text, ";
                const strikethroughText = "this is crossed out.";

                await step(
                    "Test mark strikethrough by selecting text and clicking the strikethrough menuitem.",
                    async () => {
                        await userEvent.type(editor, notStrikethroughText);
                        await userEvent.type(editor, strikethroughText);
                        selection = await selectBackward(editor, strikethroughText);
                        await userEvent.click(strikethroughBtn);
                    },
                );

                await step("Verify current document", async () => {
                    expectedHTML = `${expectedHTML}<p>${notStrikethroughText}<s>${strikethroughText}</s></p>`;
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            ...expectedJSON.content,
                            createParagraph([
                                createTextNode(notStrikethroughText),
                                createTextNode(strikethroughText, [
                                    { type: MarkType.STRIKETHROUGH },
                                ]),
                            ]),
                        ],
                    };
                    verifyEditorContent(
                        canvasElement,
                        expectedHTML,
                        expectedJSON,
                    );
                });

                await step("Deselect selection", () => {
                    deselect(selection!);
                });

                await step(
                    "Toggle strikethrough off via toolbar button",
                    async () => {
                        await userEvent.click(strikethroughBtn);
                        await verifyMenuButtonState(strikethroughBtn, false);
                    },
                );
            },
        );

        // Interaction 2 - type while active
        const shortcutStrikethroughText = "This text uses toolbar activation.";
        await step(
            "Type text while strikethrough is active for new content",
            async () => {
                await step(
                    "Insert strikethrough text by activation strikethrough with toolbar and then type",
                    async () => {
                        await userEvent.keyboard("{Enter}");
                        await userEvent.click(strikethroughBtn);
                        await verifyMenuButtonState(strikethroughBtn, true);
                        await userEvent.type(editor, shortcutStrikethroughText);
                    },
                );
                await step("Verify current document", async () => {
                    expectedHTML = `${expectedHTML}<p><s>${shortcutStrikethroughText}</s></p>`;
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            ...expectedJSON.content,
                            createParagraph([
                                createTextNode(shortcutStrikethroughText, [
                                    { type: MarkType.STRIKETHROUGH },
                                ]),
                            ]),
                        ],
                    };
                    // expectedJSON = appendMarkedJSON(
                    //     expectedJSON,
                    //     shortcutStrikethroughText,
                    //     ["strikethrough"],
                    // );
                    verifyEditorContent(
                        canvasElement,
                        expectedHTML,
                        expectedJSON,
                    );
                });
            },
        );

        // Interaction 3 - toggle with toolbar
        await step(
            "Toggle strikethrough on/off by clicking button again",
            async () => {
                await userEvent.click(strikethroughBtn);
                await verifyMenuButtonState(strikethroughBtn, false);
            },
        );

        // Interaction 4 - combine multiple
        await step("Combine with other marks", async () => {
            const strikethroughBoldItalicText =
                "I am bold/italic/strikethrough text";
            await userEvent.keyboard("{Enter}" + strikethroughBoldItalicText);
            await selectBackward(editor, strikethroughBoldItalicText);

            // Toggle strikethrough, bold and italic with mixed methods
            await userEvent.click(strikethroughBtn);
            await userEvent.keyboard("{Meta>}bi{/Meta}");

            await step("Verify current document", async () => {
                expectedHTML = `${expectedHTML}<p><strong><em><s>${strikethroughBoldItalicText}</s></em></strong></p>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        ...expectedJSON.content,
                        createParagraph([
                            createTextNode(strikethroughBoldItalicText, [
                                { type: MarkType.STRONG },
                                { type: MarkType.ITALIC },
                                { type: MarkType.STRIKETHROUGH },
                            ]),
                        ]),
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });
    },
};

/**
 * Test the usage of the link and link menu item form
 * @done
 */
const baseLinkJSONContent = {
    type: "doc",
    content: [
        createParagraph([
            createTextNode("Visit "),
            createTextNode("ProseMirror's official website", [
                {
                    type: MarkType.LINK,
                    attrs: {
                        href: "https://prosemirror.net",
                        title: null,
                    },
                },
            ]),
            createTextNode(" for comprehensive documentation."),
        ]),
        createParagraph(
            "Links can point to external websites, email addresses, or internal document sections.",
        ),
    ],
};
export const LinkMarkStory: Story = {
    args: {
        ...defaultArgs,
        storyTitle: "Link in text",
        storyDescription:
            "Link connect text to external URLs or internal references, enabling navigation and cross-referencing. Include accessibility attributes like titles for better user experience.",
        storyInteractions: [
            "Select text and click <b>Link button</b> in toolbar",
            "<b>Enter URL and optional title</b> in modal dialog",
            // TODO link should include this logic "<b>Click existing links</b> to edit their properties",
            "<b>Remove links</b> by selecting and clicking toolbar button",
            "<b>Combine with other marks</b> (bold, italic links for emphasis)",
        ],
        initialContent: baseLinkJSONContent,
        storyAttrs: [
            ["href", "string", "The href of the link"],
            ["title", "string", "The accesibility title of the link"],
        ],
    },
    play: async ({ canvasElement, canvas, userEvent, step }) => {
        const user = userEvent.setup({});
        // Clean up any existing state
        const existingEditors = canvasElement.querySelectorAll(".ProseMirror");
        if (existingEditors.length > 1) {
            console.warn(
                "Multiple editors detected, potential duplication issue",
            );
        }

        let editor: HTMLElement,
            linkBtn: HTMLButtonElement,
            expectedHTML: string,
            expectedJSON: ProseMirrorDoc;

        // Setup
        await step("Setup link mark story", async () => {
            expectedHTML =
                '<p>Visit <a href="https://prosemirror.net">ProseMirror\'s official website</a> for comprehensive documentation.</p><p>Links can point to external websites, email addresses, or internal document sections.</p>';
            expectedJSON = baseLinkJSONContent;
            editor = await waitForEditor(canvasElement);
            linkBtn = await canvas.findByTitle("Add or remove link");

            await step("Verify link mark setup", () => {
                // Verify initial setup
                expect(linkBtn).toBeDefined();
                expect(linkBtn).toBeInTheDocument();
                expect(linkBtn).toHaveClass("ProseMirror-menu-disabled");

                expect(editor).toBeDefined();
                expect(expectedHTML).toBeDefined();
                expect(expectedJSON).toBeDefined();
            });
        });

        // Start!
        await step("Select and press enter inside the editor", async () => {
            await userEvent.click(editor);
            await userEvent.keyboard("{Enter}");
        });

        // Interaction 1 - select and create link
        const notLinkText = "This is normal text, ";
        const linkText = "this is a link.";
        const hrefValue = "https://maykin.nl";
        const titleValue = "link to maykin.nl";
        let selection: Selection | null = null;

        await step("Select text and click Link button in toolbar", async () => {
            await step(
                "Test creating a link by selecting text and clicking the link menuitem.",
                async () => {
                    await userEvent.type(editor, notLinkText);
                    await userEvent.type(editor, linkText);
                    selection = await selectBackward(editor, linkText);
                    await userEvent.click(linkBtn);
                },
            );

            await step("Fill the link form", async () => {
                // Expect the form
                const hrefInput =
                    await canvas.findByPlaceholderText("Link target");
                expect(hrefInput).toBeInTheDocument();
                const titleInput = await canvas.findByPlaceholderText("Title");
                expect(titleInput).toBeInTheDocument();
                const submitButton = await canvas.findByText("OK");
                expect(submitButton).toBeInTheDocument();

                // Insert href value
                hrefInput.focus();
                await userEvent.keyboard(hrefValue);
                expect(hrefInput).toHaveValue(hrefValue);

                // Insert title value
                titleInput.focus();
                await userEvent.keyboard(titleValue);
                expect(titleInput).toHaveValue(titleValue);

                // Submit the form
                submitButton.click();
            });

            await step("Verify current document", async () => {
                expectedHTML = `${expectedHTML}<p>${notLinkText}<a href="${hrefValue}" title="${titleValue}">${linkText}</a></p>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        ...expectedJSON.content,
                        createParagraph([
                            createTextNode(notLinkText),
                            createTextNode(linkText, [
                                {
                                    type: MarkType.LINK,
                                    attrs: {
                                        href: hrefValue,
                                        title: titleValue,
                                    },
                                },
                            ]),
                        ]),
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });

            await step("Deselect selection", () => {
                deselect(selection!);
            });
        });

        // Interaction 2 - remove links
        await step(
            "Remove links by selecting and clicking toolbar button",
            async () => {
                // Select the link text
                selection = await selectBackward(editor, linkText);
                // Click link button to remove link
                await user.click(linkBtn);
                await step("Deselect selection", () => {
                    deselect(selection!);
                });
                await step("Verify link was removed", async () => {
                    expectedHTML = expectedHTML.replace(
                        `<a href="${hrefValue}" title="${titleValue}">${linkText}</a>`,
                        linkText,
                    );
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            ...expectedJSON.content.slice(0, -1),
                            createParagraph(notLinkText + linkText),
                        ],
                    };
                    verifyEditorContent(
                        canvasElement,
                        expectedHTML,
                        expectedJSON,
                    );
                });
            },
        );

        // Interaction 3 - combine with other marks
        await step(
            "Combine with other marks (bold, italic links for emphasis)",
            async () => {
                const boldItalicLinkText = "I am bold/italic/link text";
                await userEvent.keyboard("{Enter}" + boldItalicLinkText);
                await selectBackward(editor, boldItalicLinkText);

                // Apply bold and italic first
                await userEvent.keyboard("{Meta>}bi{/Meta}");

                // Then apply link
                await userEvent.click(linkBtn);

                await step("Fill link form for combined marks", async () => {
                    const hrefInput =
                        await canvas.findByPlaceholderText("Link target");
                    const submitButton = await canvas.findByText("OK");

                    hrefInput.focus();
                    await userEvent.keyboard("https://example.com");
                    submitButton.click();
                });

                await step("Verify current document", async () => {
                    expectedHTML = `${expectedHTML}<p><strong><em><a href="https://example.com" title="">${boldItalicLinkText}</a></em></strong></p>`;
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            ...expectedJSON.content,
                            createParagraph([
                                createTextNode(boldItalicLinkText, [
                                    { type: MarkType.STRONG },
                                    { type: MarkType.ITALIC },
                                    {
                                        type: MarkType.LINK,
                                        attrs: {
                                            href: "https://example.com",
                                            title: "",
                                        },
                                    },
                                ]),
                            ]),
                        ],
                    };
                    verifyEditorContent(
                        canvasElement,
                        expectedHTML,
                        expectedJSON,
                    );
                });
            },
        );
    },
};
