import { NodeType } from "@/schema/types";
import { ProseMirrorDoc } from "@/types/types";
import { Meta, StoryObj } from "@storybook/preact-vite";
import { expect } from "storybook/test";
import { defaultArgs, defaultMeta, shortcuts } from "./constants";
import {
    createBlockquote,
    createBulletList,
    createCodeBlock,
    createHardBreak,
    createHeading,
    createHorizontalRule,
    createListItem,
    createOrderedList,
    createParagraph,
    createTable,
    createTableCell,
    createTableRow,
    createTextNode,
    deselect,
    selectBackward,
    verifyEditorContent,
    waitForEditor,
} from "./utils";
import { DjangoProsemirrorWidget } from "./Widget";

const meta: Meta<typeof DjangoProsemirrorWidget> = {
    ...defaultMeta,
    title: "Django ProseMirror/Nodes",
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
 * Tests paragraph creation with Enter key, hard line breaks with Shift+Enter, and proper content structure validation. Paragraphs are the fundamental text container in ProseMirror documents.
 */
const baseParagraphJSONContent: ProseMirrorDoc = {
    type: "doc",
    content: [
        {
            type: "paragraph",
            content: [
                {
                    type: "text",
                    text: "This is a simple paragraph node. It's the most basic content block.",
                },
            ],
        },
        {
            type: "paragraph",
            content: [
                {
                    type: "text",
                    text: "You can have multiple paragraphs in sequence by pressing Enter.",
                },
            ],
        },
    ],
};
export const ParagraphStory: Story = {
    name: "Paragraph Node",
    args: {
        ...defaultArgs,
        storyTitle: "Paragraph Blocks",
        storyDescription:
            "Test paragraph creation with Enter key and hard line breaks with Shift+Enter.",
        storyInteractions: [
            "Press Enter to create new paragraphs",
            "Press Shift+Enter to create hard line breaks within paragraphs",
            "Type text normally - it flows into paragraph blocks",
            "Use backspace to merge paragraphs together",
            "<b>Keymap:</b> Ctrl+Shift+0 converts current block to paragraph",
        ],
        initialContent: baseParagraphJSONContent,
    },
    play: async ({ canvasElement, canvas, userEvent, step }) => {
        let editor: HTMLElement,
            styleDropdown: HTMLElement,
            expectedHTML: string,
            expectedJSON: ProseMirrorDoc;

        // Setup
        await step("Setup paragraph node story", async () => {
            expectedHTML =
                "<p>This is a simple paragraph node. It's the most basic content block.</p><p>You can have multiple paragraphs in sequence by pressing Enter.</p>";
            expectedJSON = baseParagraphJSONContent;
            editor = await waitForEditor(canvasElement);
            styleDropdown = await canvas.findByText("Style");

            await step("Verify paragraph node setup", () => {
                // Verify initial setup
                expect(styleDropdown).toBeDefined();
                expect(styleDropdown).toBeInTheDocument();

                expect(editor).toBeDefined();
                expect(expectedHTML).toBeDefined();
                expect(expectedJSON).toBeDefined();
            });
        });

        // Start!
        await step("Click editor to focus", async () => {
            await userEvent.click(editor);
        });

        // Interaction 1 - Create new paragraphs with Enter
        await step("Press Enter to create new paragraphs", async () => {
            const firstParagraphText = "First new paragraph created by typing.";
            const secondParagraphText = "Second paragraph in sequence.";

            await step(
                "Type text and press Enter to create paragraphs",
                async () => {
                    await userEvent.keyboard(
                        `{Enter}${firstParagraphText}{Enter}${secondParagraphText}`,
                    );
                },
            );

            await step("Verify new paragraphs created", async () => {
                expectedHTML = `${expectedHTML}<p>${firstParagraphText}</p><p>${secondParagraphText}</p>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        ...expectedJSON.content,
                        {
                            type: "paragraph",
                            content: [
                                {
                                    type: "text",
                                    text: firstParagraphText,
                                },
                            ],
                        },
                        {
                            type: "paragraph",
                            content: [
                                {
                                    type: "text",
                                    text: secondParagraphText,
                                },
                            ],
                        },
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });

        // Interaction 2 - Create hard breaks with Shift+Enter
        await step(
            "Press Shift+Enter to create hard line breaks within paragraphs",
            async () => {
                const hardBreakText1 = "This line has a hard break";
                const hardBreakText2 =
                    "and continues on the next line within the same paragraph.";

                await step(
                    "Type text with hard break using Shift+Enter",
                    async () => {
                        await userEvent.keyboard(
                            `{Enter}${hardBreakText1}{Shift>}{Enter}{/Shift}${hardBreakText2}`,
                        );
                    },
                );

                await step("Verify hard break created", async () => {
                    expectedHTML = `${expectedHTML}<p>${hardBreakText1}<br>${hardBreakText2}</p>`;
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            ...expectedJSON.content,
                            {
                                type: "paragraph",
                                content: [
                                    createTextNode(hardBreakText1),
                                    createHardBreak(),
                                    createTextNode(hardBreakText2),
                                ],
                            },
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

        // Interaction 3 - Type text normally (flows into paragraphs)
        await step(
            "Type text normally - it flows into paragraph blocks",
            async () => {
                const normalText = "This text flows normally into a paragraph.";

                await step("Type normal text", async () => {
                    await userEvent.keyboard(`{Enter}${normalText}`);
                });

                await step("Verify normal text in paragraph", async () => {
                    expectedHTML = `${expectedHTML}<p>${normalText}</p>`;
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            ...expectedJSON.content,
                            createParagraph(normalText),
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

        // Interaction 4 - Keymap: Ctrl+Shift+0 converts current block to paragraph
        await step(
            "Use Ctrl+Shift+0 to convert current block to paragraph",
            async () => {
                await step(
                    "Convert any block type to paragraph using keymap",
                    async () => {
                        // First, let's create a different block type (like a heading) to convert
                        // We'll position cursor and create some content that we can convert
                        await userEvent.keyboard("{Enter}");

                        // Type some text that we'll convert to paragraph format
                        const textToConvert =
                            "This text will be converted to paragraph format";
                        await userEvent.keyboard("# " + textToConvert);

                        const selection = await selectBackward(editor, textToConvert);

                        // Apply the paragraph conversion keymap
                        await userEvent.keyboard(
                            "{Shift>}{Control>}0{/Shift}{/Control}",
                        );

                        await step("Deselect selection", () => {
                            deselect(selection!);
                        });
                    },
                );

                await step("Verify block converted to paragraph", async () => {
                    const textToConvert =
                        "This text will be converted to paragraph format";
                    expectedHTML = `${expectedHTML}<p>${textToConvert}</p>`;
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            ...expectedJSON.content,
                            createParagraph(textToConvert),
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

/**
 * Demonstrates blockquote creation through style menu conversion and markdown syntax (> text). Tests nested paragraphs within blockquotes and proper semantic HTML structure generation.
 */
const baseBlockquoteJSONContent: ProseMirrorDoc = {
    type: "doc",
    content: [
        {
            type: "paragraph",
            content: [
                {
                    type: "text",
                    text: "Here's a blockquote example:",
                },
            ],
        },
    ],
};
export const BlockquoteStory: Story = {
    name: "Blockquote Node",
    parameters: {
        docs: {
            description: {
                story: "Demonstrates blockquote creation through style menu conversion and markdown syntax (> text). Tests nested paragraphs within blockquotes and proper semantic HTML structure generation.",
            },
        },
    },
    args: {
        ...defaultArgs,
        storyTitle: "Blockquotes",
        storyDescription:
            "Test blockquote creation through style menu and markdown syntax (> text).",
        storyInteractions: [
            "Type > followed by space to create blockquote",
            "Press Enter to create a new paragraph inside the blockquote",
            "Press Enter two times to exit blockquote completely",
            "Nest paragraphs within blockquotes",
            "<b>Input Rule:</b> '> ' at start of line creates blockquote",
            "Move blockquote content back to doc scope using lift out button.",
            "Select text and click on the menu item to wrap the content in a blockquote.",
        ],
        initialContent: baseBlockquoteJSONContent,
    },
    play: async ({ canvasElement, canvas, userEvent, step }) => {
        let editor: HTMLElement,
            blockquoteBtn: HTMLElement,
            expectedHTML: string,
            expectedJSON: ProseMirrorDoc;

        const blockquoteText = "This becomes blockquote via markdown syntax.";

        // Setup
        await step("Setup blockquote node story", async () => {
            expectedHTML = "<p>Here's a blockquote example:</p>";
            expectedJSON = baseBlockquoteJSONContent;
            editor = await waitForEditor(canvasElement);
            blockquoteBtn = await canvas.findByTitle("Change to block quote");
            // styleDropdown = await canvas.findByText("Style");

            await step("Verify blockquote node setup", async () => {
                // Verify initial setup
                expect(blockquoteBtn).toBeDefined();
                expect(blockquoteBtn).toBeInTheDocument();
                expect(editor).toBeDefined();
                expect(expectedHTML).toBeDefined();
                expect(expectedJSON).toBeDefined();
            });
        });

        // Start!
        await step("Click editor to focus", async () => {
            await userEvent.click(editor);
        });

        // Interaction 1 - Type > followed by space to create blockquote (Input Rule)
        await step(
            "Type > followed by space to create blockquote",
            async () => {
                await step(
                    "Use markdown syntax to create blockquote",
                    async () => {
                        await userEvent.keyboard(`{Enter}> ${blockquoteText}`);
                    },
                );

                await step("Verify markdown blockquote created", async () => {
                    expectedHTML = `${expectedHTML}<blockquote><p>${blockquoteText}</p></blockquote>`;
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            ...expectedJSON.content,
                            createBlockquote([createParagraph(blockquoteText)]),
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

        // Interaction 2 - Press Enter to create a new paragraph inside the blockquote
        await step(
            "Press Enter to create a new paragraph inside the blockquote",
            async () => {
                const secondBlockquoteText =
                    "Second paragraph in same blockquote.";

                await step("Add new paragraph within blockquote", async () => {
                    await userEvent.keyboard(`{Enter}${secondBlockquoteText}`);
                });

                await step("Verify new paragraph in blockquote", async () => {
                    expectedHTML = `${expectedHTML.substring(0, 94)}</p><p>${secondBlockquoteText}</p></blockquote>`;

                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            ...expectedJSON.content.slice(0, -1),
                            createBlockquote([
                                createParagraph(blockquoteText),
                                createParagraph(secondBlockquoteText),
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

        // Interaction 3 - Press Enter two times to exit blockquote completely
        await step(
            "Press Enter two times to exit blockquote completely",
            async () => {
                const exitText = "This text is outside the blockquote.";

                await step(
                    "Exit blockquote and add normal paragraph",
                    async () => {
                        // Double Enter to exit blockquote
                        await userEvent.keyboard(`{Enter}{Enter}${exitText}`);
                    },
                );

                await step("Verify exited blockquote", async () => {
                    expectedHTML = `${expectedHTML}<p>${exitText}</p>`;
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            ...expectedJSON.content,
                            createParagraph(exitText),
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

        const wrapText =
            "This text will be wrapped in blockquote using menu item.";

        // Interaction 4 - Select text and click on the menu item to wrap the content in a blockquote
        await step(
            "Select text and click on the menu item to wrap the content in a blockquote",
            async () => {
                await step("Type text and select it for wrapping", async () => {
                    await userEvent.keyboard(`{Enter}${wrapText}`);
                    const selection = await selectBackward(editor, wrapText);

                    // Click blockquote menu item to wrap selection
                    await userEvent.click(blockquoteBtn);

                    await step("Deselect selection", () => {
                        deselect(selection!);
                    });
                });

                await step("Verify text wrapped in blockquote", async () => {
                    expectedHTML = `${expectedHTML}<blockquote><p>${wrapText}</p></blockquote>`;
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            ...expectedJSON.content,
                            createBlockquote([createParagraph(wrapText)]),
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

        // Interaction 5 - Move blockquote content back to doc scope using lift out button
        await step(
            "Move blockquote content back to doc scope using lift out button",
            async () => {
                await step("Find and click lift out button", async () => {
                    // First ensure we're in a blockquote by positioning cursor there
                    await userEvent.keyboard("{ArrowUp}{ArrowUp}");

                    // Look for lift out button in the toolbar
                    const liftOutBtn = await canvas.findByTitle(
                        "Lift out of enclosing block",
                    );

                    expect(liftOutBtn).toBeDefined();
                    expect(liftOutBtn).toBeInTheDocument();

                    await userEvent.click(liftOutBtn);
                });

                await step(
                    "Verify content moved out of blockquote",
                    async () => {
                        expectedHTML =
                            expectedHTML.substring(0, 197) +
                            `<p>${wrapText}</p>`;

                        expectedJSON = {
                            ...expectedJSON,
                            content: [
                                ...expectedJSON.content.slice(0, -1),
                                createParagraph(wrapText),
                            ],
                        };
                        verifyEditorContent(
                            canvasElement,
                            expectedHTML,
                            expectedJSON,
                        );
                    },
                );
            },
        );
    },
};

/**
 * Tests horizontal rule insertion via toolbar button and keyboard shortcut (Ctrl+_). Validates proper positioning within document flow and non-editable content attributes.
 */
const baseHorizontalRuleJSONContent: ProseMirrorDoc = {
    type: "doc",
    content: [
        createParagraph("Content before the horizontal rule."),
        createHorizontalRule(),
        createParagraph("Content after the horizontal rule."),
    ],
};
export const HorizontalRuleStory: Story = {
    name: "Horizontal Rule Node",
    parameters: {
        docs: {
            description: {
                story: "Tests horizontal rule insertion via toolbar button and keyboard shortcut (Ctrl+_). Validates proper positioning within document flow and non-editable content attributes.",
            },
        },
    },
    args: {
        ...defaultArgs,
        storyTitle: "Horizontal Rules",
        storyDescription:
            "Test horizontal rule insertion via toolbar button and keyboard shortcut (Ctrl+_).",
        storyInteractions: [
            "Click Horizontal Rule button (—) in toolbar",
            "Use keyboard shortcut Mod+_ (Ctrl+_ on Windows/Linux, Cmd+_ on Mac)",
            "Creates a non-editable divider line",
            "Use to separate content sections",
            "Position cursor and insert between paragraphs",
            "<b>Keymap:</b> Mod+_ inserts horizontal rule",
        ],
        initialContent: baseHorizontalRuleJSONContent,
    },
    play: async ({ canvasElement, canvas, userEvent, step }) => {
        let editor: HTMLElement,
            hrBtn: HTMLElement,
            expectedHTML: string,
            expectedJSON: ProseMirrorDoc;

        // Setup
        await step("Setup horizontal rule node story", async () => {
            expectedHTML = `<p>Content before the horizontal rule.</p><hr contenteditable="false"><p>Content after the horizontal rule.</p>`;
            expectedJSON = baseHorizontalRuleJSONContent;
            editor = await waitForEditor(canvasElement);
            hrBtn = await canvas.findByTitle("Insert horizontal rule");

            await step("Verify horizontal rule node setup", () => {
                // Verify initial setup
                expect(hrBtn).toBeDefined();
                expect(hrBtn).toBeInTheDocument();
                expect(hrBtn).not.toHaveClass("ProseMirror-menu-disabled");

                expect(editor).toBeDefined();
                expect(expectedHTML).toBeDefined();
                expect(expectedJSON).toBeDefined();
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });

        // Start!
        await step("Click editor to focus", async () => {
            await userEvent.click(editor);
        });

        // Interaction 1 - Click Horizontal Rule button in toolbar
        await step("Click Horizontal Rule button (—) in toolbar", async () => {
            const afterHrText = "New content after inserted horizontal rule.";

            await step("Insert horizontal rule using menu button", async () => {
                await userEvent.click(hrBtn);
            });

            await step("Add content after horizontal rule", async () => {
                await userEvent.keyboard("{Enter}");
                await userEvent.type(editor, afterHrText);
            });

            await step("Verify horizontal rule inserted", async () => {
                expectedHTML = `${expectedHTML}<hr contenteditable="false" class=""><p>${afterHrText}</p>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        ...expectedJSON.content,
                        createHorizontalRule(),
                        createParagraph(afterHrText),
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });

        // Interaction 2 - Use keyboard shortcut Mod+_
        await step(
            "Use keyboard shortcut Mod+_ to insert horizontal rule",
            async () => {
                const shortcutText = "Insert hr with shortcut (ctrl+_)";

                await step("Insert HR with keyboard shortcut", async () => {
                    await userEvent.keyboard("{Enter}");
                    await userEvent.keyboard(shortcuts.horizontal_rule);
                    await userEvent.keyboard("{ArrowRight}");
                    await userEvent.keyboard(shortcutText);
                });

                await step("Verify HR inserted with shortcut", async () => {
                    expectedHTML = `${expectedHTML}<hr contenteditable="false" class=""><p>${shortcutText}</p>`;
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            ...expectedJSON.content,
                            createHorizontalRule(),
                            createParagraph(shortcutText),
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

        // Interaction 3 - Position cursor and insert between paragraphs
        await step(
            "Position cursor and insert between paragraphs",
            async () => {
                const beforeText = "Before the divider.";
                const afterText = "After the divider.";

                await step(
                    "Create paragraphs and position cursor between them",
                    async () => {
                        await userEvent.keyboard(
                            `{Enter}${beforeText}${afterText}`,
                        );
                        await userEvent.keyboard("{Control>}a{/Control}");

                        // Move cursor to between the paragraphs
                        for (let i = 0; i < beforeText.length; i++) {
                            await userEvent.keyboard("{ArrowRight}");
                        }
                        // Insert HR between paragraphs
                        await userEvent.click(hrBtn);
                    },
                );

                await step(
                    "Verify HR positioned between paragraphs",
                    async () => {
                        expectedHTML = `${expectedHTML}<p>${beforeText}</p><hr contenteditable="false"><p>${afterText}</p>`;
                        expectedJSON = {
                            ...expectedJSON,
                            content: [
                                ...expectedJSON.content,
                                createParagraph(beforeText),
                                createHorizontalRule(),
                                createParagraph(afterText),
                            ],
                        };
                        verifyEditorContent(
                            canvasElement,
                            expectedHTML,
                            expectedJSON,
                        );
                    },
                );
            },
        );
    },
};

/**
 * Validates heading creation using markdown syntax (# ## ### ####). Tests multiple heading levels (H1-H4), proper semantic hierarchy, and accessible heading structure generation.
 */
const baseHeadingJSONContent: ProseMirrorDoc = {
    type: "doc",
    content: [
        createHeading("Main Heading", 1),
        createParagraph(
            "This document demonstrates different heading levels using markdown syntax.",
        ),
    ],
};
export const HeadingNodeStory: Story = {
    name: "Heading Node",
    parameters: {
        docs: {
            description: {
                story: "Validates heading creation using markdown syntax (# ## ### ####). Tests multiple heading levels (H1-H4), proper semantic hierarchy, and accessible heading structure generation.",
            },
        },
    },
    args: {
        ...defaultArgs,
        storyTitle: "Headings (H1-H6)",
        storyDescription:
            "Test heading creation using markdown syntax (# ## ### ####) with proper semantic hierarchy.",
        storyInteractions: [
            "Type # followed by space for H1 heading",
            "Type ## for H2, ### for H3, etc. (up to H6)",
            "Use Style dropdown to convert paragraph to heading",
            "Press Enter to exit heading and return to paragraph",
            "Create semantic document structure with proper hierarchy",
            "<b>Keymaps:</b> Ctrl+Shift+1 to Ctrl+Shift+6 for H1-H6",
            "<b>Input Rules:</b> '# ', '## ', '### ', '#### ', '##### ', '###### ' create headings",
        ],
        storyAttrs: [["level", "number", "The level of the heading"]],
        initialContent: baseHeadingJSONContent,
    },
    play: async ({ canvasElement, canvas, userEvent, step }) => {
        let editor: HTMLElement,
            styleDropdown: HTMLElement,
            expectedHTML: string,
            expectedJSON: ProseMirrorDoc;

        // Setup
        await step("Setup heading node story", async () => {
            expectedHTML = `<h1>Main Heading</h1><p>This document demonstrates different heading levels using markdown syntax.</p>`;
            expectedJSON = baseHeadingJSONContent;
            editor = await waitForEditor(canvasElement);
            styleDropdown = await canvas.findByText("Style");

            await step("Verify heading node setup", () => {
                // Verify initial setup
                expect(styleDropdown).toBeDefined();
                expect(styleDropdown).toBeInTheDocument();

                expect(editor).toBeDefined();
                expect(expectedHTML).toBeDefined();
                expect(expectedJSON).toBeDefined();
            });
        });

        // Start!
        await step("Click editor to focus", async () => {
            await userEvent.click(editor);
        });

        // Interaction 1a - Type ## for H2 heading
        await step("Type ## for H2 heading", async () => {
            const h2Text = "Second Level Heading";

            await step("Create H2 heading with markdown syntax", async () => {
                await userEvent.keyboard(`{Enter}## ${h2Text}`);
            });

            await step("Verify H2 heading created", async () => {
                expectedHTML = `${expectedHTML}<h2>${h2Text}</h2>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        ...expectedJSON.content,
                        createHeading(h2Text, 2),
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });

        // Interaction 1b - Type ### for H3 heading
        await step("Type ### for H3 heading", async () => {
            const h3Text = "Third Level Heading";

            await step("Create H3 heading with markdown syntax", async () => {
                await userEvent.keyboard(`{Enter}### ${h3Text}`);
            });

            await step("Verify H3 heading created", async () => {
                expectedHTML = `${expectedHTML}<h3>${h3Text}</h3>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        ...expectedJSON.content,
                        createHeading(h3Text, 3),
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });

        // Interaction 1c - Type #### for H4 heading
        await step("Type #### for H4 heading", async () => {
            const h4Text = "Fourth Level Heading";

            await step("Create H4 heading with markdown syntax", async () => {
                await userEvent.keyboard(`{Enter}#### ${h4Text}`);
            });

            await step("Verify H4 heading created", async () => {
                expectedHTML = `${expectedHTML}<h4>${h4Text}</h4>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        ...expectedJSON.content,
                        createHeading(h4Text, 4),
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });

        // Interaction 1d - Type ##### for H4 heading
        await step("Type ##### for H5 heading", async () => {
            const h5Text = "Fifth Level Heading";

            await step("Create H6 heading with markdown syntax", async () => {
                await userEvent.keyboard(`{Enter}##### ${h5Text}`);
            });

            await step("Verify H5 heading created", async () => {
                expectedHTML = `${expectedHTML}<h5>${h5Text}</h5>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        ...expectedJSON.content,
                        createHeading(h5Text, 5),
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });

        // Interaction 1e - Type #### for H4 heading
        await step("Type ###### for H6 heading", async () => {
            const h6Text = "Sixth Level Heading";

            await step("Create H6 heading with markdown syntax", async () => {
                await userEvent.keyboard(`{Enter}###### ${h6Text}`);
            });

            await step("Verify H6 heading created", async () => {
                expectedHTML = `${expectedHTML}<h6>${h6Text}</h6>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        ...expectedJSON.content,
                        createHeading(h6Text, 6),
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });

        // Interaction 2 - Use Style dropdown to convert paragraph to heading
        await step(
            "Use Style dropdown to convert paragraph to heading",
            async () => {
                const convertText = "This will be converted to heading";

                await step("Type text and convert to heading", async () => {
                    await userEvent.keyboard(`{Enter}${convertText}`);

                    const selection = await selectBackward(editor, convertText);

                    // Use style dropdown to convert to heading
                    await userEvent.click(styleDropdown);
                    const h1Option = await canvas.findByText("Level 1");
                    await userEvent.click(h1Option);

                    await step("Deselect selection", () => {
                        deselect(selection!);
                    });
                });

                await step("Verify text converted to heading", async () => {
                    expectedHTML = `${expectedHTML}<h1>${convertText}</h1>`;
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            ...expectedJSON.content,
                            createHeading(convertText, 1),
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

        // Interaction 3 - Press Enter to exit heading and return to paragraph
        await step(
            "Press Enter to exit heading and return to paragraph",
            async () => {
                const paragraphText = "Back to normal paragraph after heading";

                await step("Exit heading and create paragraph", async () => {
                    await userEvent.keyboard(`{Enter}${paragraphText}`);
                });

                await step(
                    "Verify paragraph created after heading",
                    async () => {
                        expectedHTML = `${expectedHTML}<p>${paragraphText}</p>`;
                        expectedJSON = {
                            ...expectedJSON,
                            content: [
                                ...expectedJSON.content,
                                createParagraph(paragraphText),
                            ],
                        };
                        verifyEditorContent(
                            canvasElement,
                            expectedHTML,
                            expectedJSON,
                        );
                    },
                );
            },
        );

        const headings = [1, 2, 3, 4, 5, 6];

        // Interaction 4 - Change selected text to heading with short-cut

        for (const shortcut of headings) {
            await step(
                `Use Ctrl+Shift+${shortcut} to convert current selection to H${shortcut}`,
                async () => {
                    await step(
                        "Convert any block type to paragraph using keymap",
                        async () => {
                            // First, let's create a different block type (like a heading) to convert
                            // We'll position cursor and create some content that we can convert
                            await userEvent.keyboard("{Enter}");

                            // Type some text that we'll convert to paragraph format
                            const textToConvert =
                                "This text will be converted to heading format H" +
                                shortcut +
                                " using the short-cut ctrl+shift+" +
                                shortcut;
                            await userEvent.keyboard(textToConvert);

                            const selection = await selectBackward(
                                editor,
                                textToConvert,
                            );

                            const node = `h${shortcut}`;
                            // Apply the paragraph conversion keymap
                            await userEvent.keyboard(
                                `{Shift>}{Control>}${shortcut}{/Shift}{/Control}`,
                            );

                            await step(
                                "Verify block converted to heading H" +
                                    shortcut,
                                async () => {
                                    expectedHTML = `${expectedHTML}<${node}>${textToConvert}</${node}>`;
                                    expectedJSON = {
                                        ...expectedJSON,
                                        content: [
                                            ...expectedJSON.content,
                                            createHeading(
                                                textToConvert,
                                                shortcut,
                                            ),
                                        ],
                                    };
                                    verifyEditorContent(
                                        canvasElement,
                                        expectedHTML,
                                        expectedJSON,
                                    );
                                },
                            );

                            await step("Deselect selection", () => {
                                deselect(selection!);
                            });
                        },
                    );
                },
            );
        }
    },
};

/**
 * Tests image insertion via toolbar button, image interaction handling, and proper media embedding with alt text, title, and caption attributes for accessibility compliance.
 */
const baseImageJSONContent: ProseMirrorDoc = {
    type: "doc",
    content: [
        createParagraph("Here's an image example:"),
        {
            type: "paragraph",
            content: [
                {
                    type: "image",
                    attrs: {
                        src: "https://picsum.photos/400/300",
                        alt: "Sample image",
                        title: "Sample Image Title",
                        caption: "This is a sample image caption",
                        imageId: "sample-image-id",
                    },
                },
            ],
        },
        createParagraph("Content after the image."),
    ],
};
export const FilerImageNodeStory: Story = {
    name: "Filer Image Node",
    parameters: {
        docs: {
            description: {
                story: "Tests image insertion via toolbar button, image interaction handling, and proper media embedding with alt text, title, and caption attributes for accessibility compliance.",
            },
        },
    },
    args: {
        ...defaultArgs,
        storyTitle: "Images",
        storyDescription:
            "Test image insertion via toolbar with alt text, title, and caption attributes.",
        storyInteractions: [
            "Click Image button (🖼️) in toolbar",
            "Enter image URL in modal dialog",
            "Add alt text for accessibility",
            "Set optional title and caption",
            "Click existing images to edit their properties",
        ],
        initialContent: baseImageJSONContent,
        storyAttrs: [
            ["src", "string", "The src of the image"],
            ["title", "string", "The accesibility title of the image"],
            ["alt", ["string|null"], "The alt of the image"],
            ["imageId", ["string"], "The id of the image"],
            ["caption", ["string|null"], "The caption of the image"],
        ],
    },
    // TODO [WIP]
    // play: async ({ canvasElement, canvas, userEvent, step }) => {
    //     let editor: HTMLElement,
    //         imageBtn: HTMLElement,
    //         expectedHTML: string,
    //         expectedJSON: ProseMirrorDoc;

    //     // Setup
    //     await step("Setup image node story", async () => {
    //         expectedHTML = `<p>Here's an image example:</p><p><img src="https://picsum.photos/400/300" alt="Sample image" title="Sample Image Title"></p><p>Content after the image.</p>`;
    //         expectedJSON = baseImageJSONContent;
    //         editor = await waitForEditor(canvasElement);
    //         imageBtn = await canvas.findByTitle("Insert image");

    //         await step("Verify image node setup", () => {
    //             // Verify initial setup
    //             expect(imageBtn).toBeDefined();
    //             expect(imageBtn).toBeInTheDocument();

    //             expect(editor).toBeDefined();
    //             expect(expectedHTML).toBeDefined();
    //             expect(expectedJSON).toBeDefined();
    //         });
    //     });

    //     // Start!
    //     await step("Click editor to focus", async () => {
    //         await userEvent.click(editor);
    //     });

    //     // Interaction 1 - Click Image button in toolbar
    //     await step("Click Image button in toolbar", async () => {
    //         await step("Insert image using menu button", async () => {
    //             await userEvent.keyboard("{Enter}"); // new line
    //             await userEvent.click(imageBtn); // insert image
    //         });

    //         await step("Verify image button interaction", async () => {
    //             // Note: Image insertion typically involves a modal/dialog for URL input
    //             // For this test, we'll verify the button works and check structure
    //             expect(imageBtn).not.toHaveClass("ProseMirror-menu-disabled");
    //         });
    //     });

    //     // Interaction 2 - Click existing images to edit their properties
    //     await step(
    //         "Click existing images to edit their properties",
    //         async () => {
    //             await step("Find and click existing image", async () => {
    //                 const images = canvasElement.querySelectorAll("img");
    //                 if (images.length > 0) {
    //                     await userEvent.click(images[0]); // click on existing image
    //                 }
    //             });

    //             await step("Verify image content and structure", async () => {
    //                 const htmlContent = getEditorHTML(canvasElement);
    //                 const jsonContent = getEditorJSON(canvasElement);

    //                 // Verify image content exists and structure is maintained
    //                 expect(htmlContent).toContain(
    //                     '<img src="https://picsum.photos/400/300"',
    //                 );
    //                 expect(htmlContent).toContain('alt="Sample image"');
    //                 expect(jsonContent).toEqual(
    //                     expect.objectContaining({
    //                         type: "doc",
    //                         content: expect.arrayContaining([
    //                             expect.objectContaining({
    //                                 type: "paragraph",
    //                                 content: expect.arrayContaining([
    //                                     expect.objectContaining({
    //                                         type: "image",
    //                                         attrs: expect.objectContaining({
    //                                             src: "https://picsum.photos/400/300",
    //                                             alt: "Sample image",
    //                                         }),
    //                                     }),
    //                                 ]),
    //                             }),
    //                         ]),
    //                     }),
    //                 );
    //             });
    //         },
    //     );

    //     // Interaction 3 - Add content after image interaction
    //     await step("Add content after image interaction", async () => {
    //         const afterImageText = "New content added after image interaction.";

    //         await step("Type content after image", async () => {
    //             await userEvent.keyboard("{Enter}"); // new line
    //             await userEvent.type(editor, afterImageText); // type
    //         });

    //         await step("Verify content added after image", async () => {
    //             expectedHTML = `${expectedHTML}<p>${afterImageText}</p>`;
    //             expectedJSON = {
    //                 ...expectedJSON,
    //                 content: [
    //                     ...expectedJSON.content,
    //                     {
    //                         type: "paragraph",
    //                         content: [
    //                             {
    //                                 type: "text",
    //                                 text: afterImageText,
    //                             },
    //                         ],
    //                     },
    //                 ],
    //             };
    //             const htmlContent = getEditorHTML(canvasElement);
    //             const jsonContent = getEditorJSON(canvasElement);
    //             expect(htmlContent).toContain(afterImageText);
    //             expect(jsonContent).toEqual(expectedJSON);
    //         });
    //     });
    // },
};

/**
 * Demonstrates hard line break creation using Shift+Enter within paragraphs. Tests multiple consecutive breaks and proper inline break positioning without creating new paragraph elements.
 */
const baseHardBreakJSONContent: ProseMirrorDoc = {
    type: "doc",
    content: [
        {
            type: "paragraph",
            content: [
                createTextNode("This line has a hard break"),
                createHardBreak(),
                createTextNode(
                    "and continues on the next line within the same paragraph.",
                ),
            ],
        },
        {
            type: "paragraph",
            content: [
                {
                    type: "text",
                    text: "Hard breaks are useful for line breaks without creating new paragraphs.",
                },
            ],
        },
    ],
};
export const HardBreakStory: Story = {
    name: "Hard Break Node",
    parameters: {
        docs: {
            description: {
                story: "Demonstrates hard line break creation using Shift+Enter within paragraphs. Tests multiple consecutive breaks and proper inline break positioning without creating new paragraph elements.",
            },
        },
    },
    args: {
        ...defaultArgs,
        storyTitle: "Line Breaks",
        storyDescription:
            "Test hard line break creation using Shift+Enter within paragraphs.",
        storyInteractions: [
            "Press Shift+Enter to create hard line breaks",
            "Creates line break without starting new paragraph",
            "Use for addresses, poetry, or formatted text",
            "Combine multiple hard breaks for spacing",
            "Different from Enter which creates new paragraphs",
            "<b>Keymap:</b> Mod+Enter inserts hard break",
        ],
        initialContent: baseHardBreakJSONContent,
    },
    play: async ({ canvasElement, userEvent, step }) => {
        let editor: HTMLElement,
            expectedHTML: string,
            expectedJSON: ProseMirrorDoc;

        // Setup
        await step("Setup hard break node story", async () => {
            expectedHTML = `<p>This line has a hard break<br>and continues on the next line within the same paragraph.</p><p>Hard breaks are useful for line breaks without creating new paragraphs.</p>`;
            expectedJSON = baseHardBreakJSONContent;
            editor = await waitForEditor(canvasElement);

            await step("Verify hard break node setup", () => {
                // Verify initial setup
                expect(editor).toBeDefined();
                expect(expectedHTML).toBeDefined();
                expect(expectedJSON).toBeDefined();
            });
        });

        // Start!
        await step("Click editor to focus", async () => {
            await userEvent.click(editor);
        });

        // Interaction 1 - Press Shift+Enter to create hard line breaks
        await step("Press Shift+Enter to create hard line breaks", async () => {
            const beforeBreakText = "Before hard break";
            const afterBreakText = "after hard break";

            await step("Create hard break using Shift+Enter", async () => {
                await userEvent.keyboard(
                    // new line
                    "{Enter}" +
                        // type first part
                        beforeBreakText +
                        // Hardbreak
                        "{Shift>}{Enter}{/Shift}" +
                        // type second part
                        afterBreakText,
                );
            });

            await step("Verify hard break created", async () => {
                expectedHTML = `${expectedHTML}<p>${beforeBreakText}<br>${afterBreakText}</p>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        ...expectedJSON.content,
                        {
                            type: "paragraph",
                            content: [
                                createTextNode(beforeBreakText),
                                createHardBreak(),
                                createTextNode(afterBreakText),
                            ],
                        },
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });

        // Interaction 2 - Combine multiple hard breaks for spacing
        await step("Combine multiple hard breaks for spacing", async () => {
            const afterMultipleBreaksText = "After multiple breaks";

            await step("Create multiple consecutive hard breaks", async () => {
                await userEvent.keyboard(
                    "{Shift>}{Enter}{Enter}{/Shift}" + afterMultipleBreaksText,
                );
            });

            await step("Verify multiple hard breaks created", async () => {
                expectedHTML = `${expectedHTML.substring(0, 212)}<br><br>${afterMultipleBreaksText}</p>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        ...expectedJSON.content.slice(0, -1),
                        {
                            type: "paragraph",
                            content: [
                                createTextNode("Before hard break"),
                                createHardBreak(),
                                createTextNode("after hard break"),
                                createHardBreak(),
                                createHardBreak(),
                                createTextNode(afterMultipleBreaksText),
                            ],
                        },
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });

        // Interaction 3 - Use for addresses, poetry, or formatted text
        await step("Use for addresses, poetry, or formatted text", async () => {
            const addressText = "John Doe";
            const streetText = "123 Main Street";
            const cityText = "New York, NY 10001";

            await step(
                "Create formatted address with hard breaks",
                async () => {
                    await userEvent.keyboard("{Enter}" + addressText); // new paragraph
                    await userEvent.keyboard(
                        "{Shift>}{Enter}{/Shift}" + streetText,
                    );
                    await userEvent.keyboard(
                        "{Shift>}{Enter}{/Shift}" + cityText,
                    );
                },
            );

            await step(
                "Verify formatted address with hard breaks",
                async () => {
                    expectedHTML = `${expectedHTML}<p>${addressText}<br>${streetText}<br>${cityText}</p>`;
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            ...expectedJSON.content,
                            {
                                type: "paragraph",
                                content: [
                                    createTextNode(addressText),
                                    createHardBreak(),
                                    createTextNode(streetText),
                                    createHardBreak(),
                                    createTextNode(cityText),
                                ],
                            },
                        ],
                    };
                    verifyEditorContent(
                        canvasElement,
                        expectedHTML,
                        expectedJSON,
                    );
                },
            );
        });
    },
};

/**
 * Tests code block creation via style menu and markdown syntax (```). Validates syntax highlighting, whitespace preservation, code block exit behavior, and proper monospace formatting.
 */
const baseCodeBlockJSONContent: ProseMirrorDoc = {
    type: "doc",
    content: [
        createParagraph("Here's a code block example:"),
        createCodeBlock(
            "function hello() {\n  console.log('Hello, world!');\n  return 'Done';\n}",
        ),
        createParagraph("Code blocks preserve formatting and whitespace."),
    ],
};
export const CodeBlockStory: Story = {
    name: "Code Block Node",
    parameters: {
        docs: {
            description: {
                story: "Tests code block creation via style menu and markdown syntax (```). Validates syntax highlighting, whitespace preservation, code block exit behavior, and proper monospace formatting.",
            },
        },
    },
    args: {
        ...defaultArgs,
        storyTitle: "Code Blocks",
        storyDescription:
            "Test code block creation via style menu and markdown syntax (```).",
        storyInteractions: [
            "Type ``` followed by space to create code block",
            "Use Style dropdown to convert paragraph to code block",
            "Type code with syntax highlighting",
            "Press Enter for new lines within code block",
            "Press Shift/Meta + Enter to exit code block",
            "<b>Keymap:</b> Ctrl+Shift+\\ toggles code block",
            "<b>Input Rule:</b> '``` ' at start of line creates code block",
        ],
        initialContent: baseCodeBlockJSONContent,
    },
    play: async ({ canvasElement, canvas, userEvent, step }) => {
        let editor: HTMLElement,
            styleDropdown: HTMLElement,
            codeBlockBtn: HTMLElement,
            expectedHTML: string,
            expectedJSON: ProseMirrorDoc;

        // Setup
        await step("Setup code block node story", async () => {
            expectedHTML = `<p>Here's a code block example:</p><pre spellcheck="false"><code>function hello() {\n  console.log('Hello, world!');\n  return 'Done';\n}</code></pre><p>Code blocks preserve formatting and whitespace.</p>`;
            expectedJSON = baseCodeBlockJSONContent;
            editor = await waitForEditor(canvasElement);
            styleDropdown = await canvas.findByText("Style");

            // Click style dropdown to access code block button
            await userEvent.click(styleDropdown);
            codeBlockBtn = await canvas.findByTitle("Change to code block");

            await step("Verify code block node setup", () => {
                // Verify initial setup
                expect(styleDropdown).toBeDefined();
                expect(styleDropdown).toBeInTheDocument();
                expect(codeBlockBtn).toBeDefined();
                expect(codeBlockBtn).toBeInTheDocument();

                expect(editor).toBeDefined();
                expect(expectedHTML).toBeDefined();
                expect(expectedJSON).toBeDefined();
            });
        });

        // Start!
        await step("Click editor to focus", async () => {
            await userEvent.click(editor);
        });

        // Interaction 1 - Use Style dropdown to convert paragraph to code block
        await step(
            "Use Style dropdown to convert paragraph to code block",
            async () => {
                const codeText = "const newVar = 'test';";

                await step("Create code block using menu button", async () => {
                    await userEvent.keyboard("{Enter}"); // new line
                    await userEvent.click(codeBlockBtn); // convert to code block
                    await userEvent.type(editor, codeText); // type code
                });

                await step("Verify code block created", async () => {
                    expectedHTML = `${expectedHTML}<pre spellcheck="false"><code>${codeText}</code></pre>`;
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            ...expectedJSON.content,
                            createCodeBlock(codeText),
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

        // Interaction 2 - Press Enter twice to exit code block
        await step("Press Shift/Meta + Enter to exit code block", async () => {
            const afterCodeText = "Back to regular paragraph.";

            await step("Exit code block and create paragraph", async () => {
                await userEvent.keyboard("{Shift>}{Enter}{/Shift}"); // new line in code block
                await userEvent.type(editor, afterCodeText); // type
            });

            await step("Verify exited code block", async () => {
                expectedHTML = `${expectedHTML}<p>${afterCodeText}</p>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        ...expectedJSON.content,
                        createParagraph(afterCodeText),
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });

        // Interaction 3 - Type ``` followed by space to create code block
        await step(
            "Type ``` followed by space to create code block",
            async () => {
                const markdownCodeText = "console.log('markdown code block');";

                await step(
                    "Create code block using markdown syntax",
                    async () => {
                        await userEvent.keyboard("{Enter}"); // new line
                        await userEvent.keyboard(`\`\`\`${markdownCodeText}`); // markdown syntax
                    },
                );

                await step("Verify markdown code block created", async () => {
                    expectedHTML = `${expectedHTML}<pre spellcheck="false"><code>${markdownCodeText}</code></pre>`;
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            ...expectedJSON.content,
                            createCodeBlock(markdownCodeText),
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

        // Interaction 4 - Convert text block to codeblock using shortcut `Ctlr+Shift+\`
        await step(
            "Convert text block to codeblock using shortcut `Ctlr+Shift+\\`",
            async () => {
                const syntaxCodeText = "const a = 1000;";

                await step(
                    "Add new code block with multiline code",
                    async () => {
                        await userEvent.keyboard(
                            "{Shift>}{Enter}{/Shift}" + syntaxCodeText,
                        );

                        await selectBackward(editor, syntaxCodeText);

                        await userEvent.keyboard(
                            "{Shift>}{Control>}\\{/Control}{/Shift}",
                        );
                    },
                );

                await step("Verify syntax code block created", async () => {
                    expectedHTML = `${expectedHTML}<pre spellcheck="false"><code>${syntaxCodeText}</code></pre>`;
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            ...expectedJSON.content,
                            createCodeBlock(syntaxCodeText),
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

/**
 * Validates unordered list creation, item addition with Enter key, list nesting with Tab indentation, and proper hierarchical list structure with nested bullet points.
 */
const baseBulletListJSONContent: ProseMirrorDoc = {
    type: "doc",
    content: [
        createParagraph("Here's a bullet list:"),
        createBulletList([
            createListItem("First bullet point"),
            createListItem("Second bullet point"),
        ]),
    ],
};
export const BulletListStory: Story = {
    name: "Bullet List Node",
    parameters: {
        docs: {
            description: {
                story: "Validates unordered list creation, item addition with Enter key, list nesting with Tab indentation, and proper hierarchical list structure with nested bullet points.",
            },
        },
    },
    args: {
        ...defaultArgs,
        storyTitle: "Bullet Lists",
        storyDescription:
            "Test unordered list creation, nesting with Tab, and proper hierarchical structure.",
        storyInteractions: [
            "Type - followed by space to create bullet list",
            "Type * or + followed by space (alternative syntax)",
            "Press Tab to indent/nest list items",
            "Press Shift+Tab to outdent list items",
            "Press Enter to add new list items",
            "<b>Keymap:</b> Ctrl+Shift+8 wraps selection in bullet list",
            "<b>Input Rules:</b> '- ', '* ', '+ ' at start of line create bullet lists",
        ],
        initialContent: baseBulletListJSONContent,
    },
    play: async ({ canvasElement, canvas, userEvent, step }) => {
        let editor: HTMLElement,
            bulletListBtn: HTMLElement,
            expectedHTML: string,
            expectedJSON: ProseMirrorDoc;

        // Setup
        await step("Setup bullet list node story", async () => {
            expectedHTML = `<p>Here's a bullet list:</p><ul><li><p>First bullet point</p></li><li><p>Second bullet point</p></li></ul>`;
            expectedJSON = baseBulletListJSONContent;
            editor = await waitForEditor(canvasElement);
            bulletListBtn = await canvas.findByTitle("Wrap in bullet list");

            await step("Verify bullet list node setup", () => {
                // Verify initial setup
                expect(bulletListBtn).toBeDefined();
                expect(bulletListBtn).toBeInTheDocument();

                expect(editor).toBeDefined();
                expect(expectedHTML).toBeDefined();
                expect(expectedJSON).toBeDefined();
            });
        });

        // Start!
        await step("Click editor to focus", async () => {
            await userEvent.click(editor);
        });

        // Interaction 1 - Press Enter to add new list items
        await step("Press Enter to add new list items", async () => {
            const newItemText = "Third bullet point";

            await step("Add new list item", async () => {
                await userEvent.keyboard("{Enter}" + newItemText); // new line
            });

            await step("Verify new list item created", async () => {
                expectedHTML = `<p>Here's a bullet list:</p><ul><li><p>First bullet point</p></li><li><p>Second bullet point</p></li><li><p>${newItemText}</p></li></ul>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        expectedJSON.content[0],
                        {
                            ...expectedJSON.content[1],
                            content: [
                                ...(expectedJSON?.content?.[1]?.content ?? []),
                                createListItem(newItemText),
                            ],
                        },
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });

        // Interaction 2 - Press Tab to indent/nest list items
        await step("Press Tab to indent/nest list items", async () => {
            const nestedItemText = "Nested item";

            await step("Create nested list item with Tab", async () => {
                await userEvent.keyboard("{Enter}"); // new line
                await userEvent.click(bulletListBtn);
                await userEvent.keyboard(nestedItemText); // new line
            });

            await step("Verify nested list item created", async () => {
                expectedHTML = `<p>Here's a bullet list:</p><ul><li><p>First bullet point</p></li><li><p>Second bullet point</p></li><li><p>Third bullet point</p><ul><li><p>${nestedItemText}</p></li></ul></li></ul>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        expectedJSON.content[0],
                        {
                            ...expectedJSON.content[1],
                            content: [
                                ...(
                                    expectedJSON.content[1].content || []
                                ).slice(0, 2),
                                createListItem(
                                    "Third bullet point",
                                    createBulletList([
                                        createListItem(nestedItemText),
                                    ]),
                                ),
                            ],
                        },
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });

        // Interaction 3 - Create new paragraph after list
        await step("Create new paragraph after list", async () => {
            const afterListText = "After the bullet list.";

            await step("Exit list and create paragraph", async () => {
                await userEvent.keyboard(
                    "{Enter}" + "{Enter}" + "{Enter}" + afterListText,
                );
            });

            await step("Verify paragraph after list", async () => {
                expectedHTML = `${expectedHTML}<p>${afterListText}</p>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        ...expectedJSON.content,
                        createParagraph(afterListText),
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });

        // Interaction 4 - Type - followed by space to create bullet list
        await step(
            "Type - followed by space to create bullet list",
            async () => {
                const markdownItemText = "Markdown bullet item";

                await step(
                    "Create bullet list using markdown syntax",
                    async () => {
                        await userEvent.keyboard("{Enter}"); // new line
                        await userEvent.type(editor, `- ${markdownItemText}`);
                    },
                );

                await step("Verify markdown bullet list created", async () => {
                    expectedHTML = `${expectedHTML}<ul><li><p>${markdownItemText}</p></li></ul>`;
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            ...expectedJSON.content,
                            createBulletList([
                                createListItem(markdownItemText),
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
        // Interaction 4 - Select and use shortcut Control+Shift+8
        await step("Select and use shortcut Control+Shift+8", async () => {
            const shortcutItemText = "Selected new bullet item";

            await step("Create bullet list using shortcut", async () => {
                await userEvent.keyboard(
                    "{Enter}" + "{Enter}" + shortcutItemText,
                );

                await selectBackward(editor, shortcutItemText);

                await userEvent.keyboard(
                    "{Shift>}{Control>}8{/Control}{/Shift}",
                );
            });

            await step("Verify markdown bullet list created", async () => {
                expectedHTML = `${expectedHTML}<ul><li><p>${shortcutItemText}</p></li></ul>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        ...expectedJSON.content,
                        createBulletList([createListItem(shortcutItemText)]),
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });
    },
};

/**
 * Tests numbered list creation with markdown syntax (1. 2. 3.), custom start numbers (5. 6. 7.), automatic number sequencing, and proper ordered list semantic structure.
 */
const baseOrderedListJSONContent: ProseMirrorDoc = {
    type: "doc",
    content: [
        createParagraph("Here's an ordered list:"),
        createOrderedList(
            [
                createListItem("First numbered item"),
                createListItem("Second numbered item"),
            ],
            1,
        ),
    ],
};
export const OrderedListStory: Story = {
    name: "Ordered List Node",
    parameters: {
        docs: {
            description: {
                story: "Tests numbered list creation with markdown syntax (1. 2. 3.), custom start numbers (5. 6. 7.), automatic number sequencing, and proper ordered list semantic structure.",
            },
        },
    },
    args: {
        ...defaultArgs,
        storyTitle: "Numbered Lists",
        storyDescription:
            "Test ordered list creation with markdown syntax and custom start numbers.",
        storyInteractions: [
            "Type 1. followed by space to create numbered list",
            "Use any number (e.g., 5.) to set custom start value",
            "Press Tab to indent/nest numbered items",
            "Press Shift+Tab to outdent list items",
            "Automatic numbering continues in sequence",
            "<b>Keymap:</b> Ctrl+Shift+9 wraps selection in ordered list",
            "<b>Input Rules:</b> '1. ', '55. ' (any number) at start of line create ordered lists",
            "<b>Alt-ArrowUp</b> to joinUp",
            "<b>Alt-ArrowDown</b> to joinDown",
            "<b>Mod-[</b> lift block",
        ],
        initialContent: baseOrderedListJSONContent,
        storyAttrs: [["order", "number", "The start item of the list"]],
    },
    play: async ({ canvasElement, canvas, userEvent, step }) => {
        let editor: HTMLElement,
            orderedListBtn: HTMLElement,
            expectedHTML: string,
            expectedJSON: ProseMirrorDoc;

        // Setup
        await step("Setup ordered list node story", async () => {
            expectedHTML = `<p>Here's an ordered list:</p><ol><li><p>First numbered item</p></li><li><p>Second numbered item</p></li></ol>`;
            expectedJSON = baseOrderedListJSONContent;
            editor = await waitForEditor(canvasElement);
            orderedListBtn = await canvas.findByTitle("Wrap in ordered list");

            await step("Verify ordered list node setup", () => {
                // Verify initial setup
                expect(orderedListBtn).toBeDefined();
                expect(orderedListBtn).toBeInTheDocument();

                expect(editor).toBeDefined();
                expect(expectedHTML).toBeDefined();
                expect(expectedJSON).toBeDefined();
            });
        });

        // Start!
        await step("Click editor to focus", async () => {
            await userEvent.click(editor);
        });

        // Interaction 1 - Press Enter to add new numbered items
        await step("Press Enter to add new numbered items", async () => {
            const newItemText = "Third numbered item";

            await step("Add new numbered list item", async () => {
                await userEvent.keyboard("{Enter}" + newItemText); // new line
            });

            await step("Verify new numbered item created", async () => {
                expectedHTML = `<p>Here's an ordered list:</p><ol start="1"><li><p>First numbered item</p></li><li><p>Second numbered item</p></li><li><p>${newItemText}</p></li></ol>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        expectedJSON.content[0],
                        {
                            ...expectedJSON.content[1],
                            content: [
                                ...(expectedJSON.content[1].content ?? []),
                                createListItem(newItemText),
                            ],
                        },
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });

        // Interaction 2 - Press ordered list menu item to indent/nest list items
        await step(
            "Press ordered list menu item to indent/nest list items",
            async () => {
                const nestedItemText = "Nested numbered item";

                await step(
                    "Create nested list item with ordered list menu item",
                    async () => {
                        await userEvent.keyboard("{Enter}"); // new line
                        await userEvent.click(orderedListBtn);
                        await userEvent.keyboard(nestedItemText);
                    },
                );

                await step("Verify nested list item created", async () => {
                    expectedHTML = `<p>Here's an ordered list:</p><ol start="1"><li><p>First numbered item</p></li><li><p>Second numbered item</p></li><li><p>Third numbered item</p><ol start="1"><li><p>${nestedItemText}</p></li></ol></li></ol>`;
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            expectedJSON.content[0],
                            {
                                ...expectedJSON.content[1],
                                content: [
                                    ...(
                                        expectedJSON.content[1].content || []
                                    ).slice(0, 2),
                                    createListItem(
                                        "Third numbered item",
                                        createOrderedList(
                                            [createListItem(nestedItemText)],
                                            1,
                                        ),
                                    ),
                                ],
                            },
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

        // Interaction 3 - Create new paragraph after list
        await step("Create new paragraph after list", async () => {
            const afterListText = "After the ordered list.";

            await step("Exit list and create paragraph", async () => {
                await userEvent.keyboard(
                    "{Enter}" + "{Enter}" + "{Enter}" + afterListText,
                );
            });

            await step("Verify paragraph after list", async () => {
                expectedHTML = `${expectedHTML}<p>${afterListText}</p>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        ...expectedJSON.content,
                        createParagraph(afterListText),
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });

        // Interaction 4 - Type 1. followed by space to create numbered list
        await step(
            "Type 1. followed by space to create numbered list",
            async () => {
                const markdownListText = "New markdown item";

                await step(
                    "Create ordered list using markdown syntax",
                    async () => {
                        await userEvent.keyboard("{Enter}"); // new line
                        await userEvent.type(editor, `1. ${markdownListText}`);
                    },
                );

                await step("Verify markdown ordered list created", async () => {
                    expectedHTML = `${expectedHTML}<ol start="1"><li><p>${markdownListText}</p></li></ol>`;
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            ...expectedJSON.content,
                            createOrderedList(
                                [createListItem(markdownListText)],
                                1,
                            ),
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

        // Interaction 5 - Use any number (e.g., 5.) to set custom start value
        await step(
            "Use any number (e.g., 5.) to set custom start value",
            async () => {
                const customStartText = "Starting at five";

                await step(
                    "Create ordered list with custom start number",
                    async () => {
                        await userEvent.keyboard("{Enter}{Enter}"); // exit list
                        await userEvent.keyboard(`5. ${customStartText}`);
                    },
                );

                await step("Verify custom start number", async () => {
                    expectedHTML = `${expectedHTML}<ol start="5"><li><p>${customStartText}</p></li></ol>`;
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            ...expectedJSON.content,
                            createOrderedList(
                                [createListItem(customStartText)],
                                5,
                            ),
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

        // Interaction 6 - Automatic numbering continues in sequence
        await step("Automatic numbering continues in sequence", async () => {
            const sequenceText6th = "Sixth item in sequence";
            const sequenceText7th = "Seventh item in sequence";

            await step("Add item to continue sequence", async () => {
                await userEvent.keyboard("{Enter}" + sequenceText6th);
                await userEvent.keyboard("{Enter}" + sequenceText7th);
            });

            await step("Verify automatic numbering continues", async () => {
                expectedHTML = `${expectedHTML.substring(0, expectedHTML.lastIndexOf("</ol>"))}<li><p>${sequenceText6th}</p></li><li><p>${sequenceText7th}</p></li></ol>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        ...expectedJSON.content.slice(0, -1),
                        createOrderedList(
                            [
                                createListItem("Starting at five"),
                                createListItem(sequenceText6th),
                                createListItem(sequenceText7th),
                            ],
                            5,
                        ),
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });

        // Interaction 7 - Select and use shortcut Control+Shift+9
        await step("Select and use shortcut Control+Shift+9", async () => {
            const shortcutItemText = "Selected new ordered item";

            await step("Create ordered list using shortcut", async () => {
                await userEvent.keyboard(
                    "{Enter}" + "{Enter}" + shortcutItemText,
                );

                await selectBackward(editor, shortcutItemText);

                await userEvent.keyboard(
                    "{Shift>}{Control>}9{/Control}{/Shift}",
                );
            });

            await step(
                "Verify ordered list created with shortcut",
                async () => {
                    expectedHTML = `${expectedHTML}<ol start="1"><li><p>${shortcutItemText}</p></li></ol>`;
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            ...expectedJSON.content,
                            createOrderedList(
                                [createListItem(shortcutItemText)],
                                1,
                            ),
                        ],
                    };
                    verifyEditorContent(
                        canvasElement,
                        expectedHTML,
                        expectedJSON,
                    );
                },
            );
        });
    },
};

/**
 * Demonstrates table creation via toolbar button, cell navigation with Tab key, cell content editing, and proper table structure with thead/tbody semantic elements and accessibility features.
 */
const baseTableJSONContent: ProseMirrorDoc = {
    type: "doc",
    content: [
        createParagraph("Here's a table example:"),
        createTable([
            createTableRow([
                createTableCell(NodeType.TABLE_HEADER, "Name"),
                createTableCell(NodeType.TABLE_HEADER, "Age"),
            ]),
            createTableRow([
                createTableCell(NodeType.TABLE_CELL, "John Doe"),
                createTableCell(NodeType.TABLE_CELL, "30"),
            ]),
        ]),
    ],
};
export const TableStory: Story = {
    name: "Table Node",
    parameters: {
        docs: {
            description: {
                story: "Demonstrates table creation via toolbar button, cell navigation with Tab key, cell content editing, and proper table structure with thead/tbody semantic elements and accessibility features.",
            },
        },
    },
    args: {
        ...defaultArgs,
        storyTitle: "Tables",
        storyDescription:
            "Test table creation, cell navigation with Tab, and content editing.",
        storyInteractions: [
            "Click Table button (☷️) in toolbar to insert table",
            "Press Tab to move to next cell",
            "Press Shift+Tab to move to previous cell",
            "Type content directly in table cells",
            "Right-click for context menu (add/remove rows/columns)",
        ],
        initialContent: baseTableJSONContent,
    },
    play: async ({ canvasElement, canvas, userEvent, step }) => {
        let editor: HTMLElement,
            tableBtn: HTMLElement,
            expectedHTML: string,
            expectedJSON: ProseMirrorDoc;

        // Setup
        await step("Setup table node story", async () => {
            expectedHTML = `<p>Here's a table example:</p><div class="tableWrapper"><table style="--default-cell-min-width: 100px; min-width: 200px;"><thead><tr><th><p>Name</p></th><th><p>Age</p></th></tr></thead><tbody><tr><td><p>John Doe</p></td><td><p>30</p></td></tr></tbody></table></div>`;
            expectedJSON = baseTableJSONContent;
            editor = await waitForEditor(canvasElement);
            tableBtn = await canvas.findByTitle("Insert table");

            await step("Verify table node setup", () => {
                // Verify initial setup
                expect(tableBtn).toBeDefined();
                expect(tableBtn).toBeInTheDocument();

                expect(editor).toBeDefined();
                expect(expectedHTML).toBeDefined();
                expect(expectedJSON).toBeDefined();
            });
        });

        // Start!
        await step("Click editor to focus", async () => {
            await userEvent.click(editor);
        });

        // Interaction 1 - Type content directly in table cells
        await step("Type content directly in table cells", async () => {
            await step("Edit table cell content", async () => {
                const firstCell = canvasElement.querySelector("td");
                await userEvent.click(firstCell!);
                await userEvent.tab();
                await userEvent.keyboard("{Backspace}"); // Clear second td content
                await userEvent.keyboard("40");
            });

            await step("Verify table cell content edited", async () => {
                expectedHTML = `<p>Here's a table example:</p><div class="tableWrapper"><table style="--default-cell-min-width: 100px; min-width: 200px;"><colgroup><col><col></colgroup><tbody><tr><th><p>Name</p></th><th><p>Age</p></th></tr><tr><td><p>John Doe</p></td><td><p>40</p></td></tr></tbody></table></div>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        expectedJSON.content[0],
                        createTable([
                            createTableRow([
                                createTableCell(NodeType.TABLE_HEADER, "Name"),
                                createTableCell(NodeType.TABLE_HEADER, "Age"),
                            ]),
                            createTableRow([
                                createTableCell(
                                    NodeType.TABLE_CELL,
                                    "John Doe",
                                ),
                                createTableCell(NodeType.TABLE_CELL, "40"),
                            ]),
                        ]),
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });

        // Interaction 2 - Press Tab to move to next cell
        await step(
            "Press Tab (+ Shift)  to move to next (or previous) cell",
            async () => {
                const newNameText = "Jane Doe";

                await step("Navigate to previous cell and edit", async () => {
                    await userEvent.tab({ shift: true }); // move to next cell
                    await userEvent.keyboard("{Backspace}" + newNameText);
                });

                await step("Verify next cell content edited", async () => {
                    expectedHTML = expectedHTML.replace("John", "Jane");
                    expectedJSON = {
                        ...expectedJSON,
                        content: [
                            expectedJSON.content[0],
                            createTable([
                                createTableRow([
                                    createTableCell(
                                        NodeType.TABLE_HEADER,
                                        "Name",
                                    ),
                                    createTableCell(
                                        NodeType.TABLE_HEADER,
                                        "Age",
                                    ),
                                ]),
                                createTableRow([
                                    createTableCell(
                                        NodeType.TABLE_CELL,
                                        "Jane Doe",
                                    ),
                                    createTableCell(NodeType.TABLE_CELL, "40"),
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

        // Interaction 3 - Click Table button to insert table
        await step("Click Table button to insert table", async () => {
            const newTableText = "New table below:";

            await step("Create new table using menu button", async () => {
                await userEvent.click(editor); // select editor
                await userEvent.keyboard("{ArrowDown}{Enter}"); // new line
                await userEvent.type(editor, newTableText);
                await userEvent.keyboard("{Enter}"); // new line

                // Create new table using menu button
                await userEvent.click(tableBtn);

                const buttons = await canvas.findAllByRole("button");
                if (buttons[10]) buttons[10].click(); // 3 x 2
            });

            await step("Verify new table created", async () => {
                expectedHTML = `${expectedHTML}<p>${newTableText}</p><div class="tableWrapper"><table style="--default-cell-min-width: 100px; min-width: 300px;"><colgroup><col><col><col></colgroup><tbody><tr><th><p><br class="ProseMirror-trailingBreak"></p></th><th><p><br class="ProseMirror-trailingBreak"></p></th><th><p><br class="ProseMirror-trailingBreak"></p></th></tr><tr><td><p><br class="ProseMirror-trailingBreak"></p></td><td><p><br class="ProseMirror-trailingBreak"></p></td><td><p><br class="ProseMirror-trailingBreak"></p></td></tr></tbody></table></div>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        ...expectedJSON.content,
                        createParagraph("New table below:"),
                        createTable([
                            createTableRow([
                                createTableCell(NodeType.TABLE_HEADER),
                                createTableCell(NodeType.TABLE_HEADER),
                                createTableCell(NodeType.TABLE_HEADER),
                            ]),
                            createTableRow([
                                createTableCell(NodeType.TABLE_CELL),
                                createTableCell(NodeType.TABLE_CELL),
                                createTableCell(NodeType.TABLE_CELL),
                            ]),
                        ]),
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });

        // Interaction 4 - Fill in new table with content
        await step("Fill in new table with content", async () => {
            const headerText1 = "Product";
            const headerText2 = "Price";
            const headerText3 = "Amount";
            const cellText1 = "Laptop";
            const cellText2 = "$1000";
            const cellText3 = "10";

            await step(
                "Select first cell and add content to table headers and cells",
                async () => {
                    // Fill first header
                    const times = 5;

                    // Tab 8 times;
                    for (const shift of new Array(times).fill(true)) {
                        await userEvent.tab({ shift });
                    }

                    // Add a value to each cell.
                    await userEvent.keyboard(headerText1);
                    await userEvent.tab();
                    await userEvent.keyboard(headerText2);
                    await userEvent.tab();
                    await userEvent.keyboard(headerText3);
                    await userEvent.tab();
                    await userEvent.keyboard(cellText1);
                    await userEvent.tab();
                    await userEvent.keyboard(cellText2);
                    await userEvent.tab();
                    await userEvent.keyboard(cellText3);
                },
            );

            await step("Verify table content filled", async () => {
                expectedHTML = `<p>Here's a table example:</p><div class="tableWrapper"><table style="--default-cell-min-width: 100px; min-width: 200px;"><colgroup><col><col></colgroup><tbody><tr><th><p>Name</p></th><th><p>Age</p></th></tr><tr><td><p>Jane Doe</p></td><td><p>40</p></td></tr></tbody></table></div><p>New table below:</p><div class="tableWrapper"><table style="--default-cell-min-width: 100px; min-width: 300px;"><colgroup><col><col><col></colgroup><tbody><tr><th><p>Product</p></th><th><p>Price</p></th><th><p>Amount</p></th></tr><tr><td><p>Laptop</p></td><td><p>$1000</p></td><td><p>10</p></td></tr></tbody></table></div>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        expectedJSON.content[0],
                        expectedJSON.content[1],
                        expectedJSON.content[2],
                        createTable([
                            createTableRow([
                                createTableCell(
                                    NodeType.TABLE_HEADER,
                                    "Product",
                                ),
                                createTableCell(NodeType.TABLE_HEADER, "Price"),
                                createTableCell(
                                    NodeType.TABLE_HEADER,
                                    "Amount",
                                ),
                            ]),
                            createTableRow([
                                createTableCell(NodeType.TABLE_CELL, "Laptop"),
                                createTableCell(NodeType.TABLE_CELL, "$1000"),
                                createTableCell(NodeType.TABLE_CELL, "10"),
                            ]),
                        ]),
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });
    },
};
