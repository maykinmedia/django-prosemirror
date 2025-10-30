import { Meta, StoryObj } from "@storybook/preact-vite";
import { expect } from "storybook/test";
import { defaultArgs, defaultMeta } from "./constants";
import {
    createBlockquote,
    createBulletList,
    createCodeBlock,
    createHeading,
    createHorizontalRule,
    createListItem,
    createOrderedList,
    createParagraph,
    getEditorHTML,
    getEditorJSON,
    verifyEditorContent,
    waitForEditor,
} from "./utils";
import { DjangoProsemirrorWidget } from "./Widget";
import { ProseMirrorDoc } from "@/types/types";
import { en as translations } from "@/i18n/locales/en";
const meta: Meta<typeof DjangoProsemirrorWidget> = {
    ...defaultMeta,
    title: "Django ProseMirror/Plugins",
};

export default meta;
type Story = StoryObj<typeof DjangoProsemirrorWidget>;

const baseInputRulesJSONContent = {
    type: "doc",
    content: [
        createParagraph(
            "Try typing markdown syntax and see it transform automatically:",
        ),
    ],
};

/**
 * Test different markdown inputs plugin Story
 */
export const InputRulesPlugin: Story = {
    args: {
        ...defaultArgs,
        storyTitle: "Markdown Input Rules",
        storyDescription:
            "Test automatic markdown transformation for headings, lists, blockquotes, and code blocks. Individual input rules are tested in their respective Nodes stories.",
        storyInteractions: [
            "Type <b>#</b> for H1, <b>##</b> for H2, <b>###</b> for H3, etc.",
            "Type <b>></b> for blockquotes",
            "Type <b>1.</b> or <b>55.</b> to create ordered list",
            "Type <b>-</b>, <b>*</b> or <b>+</b> to create bullet list",
            "Type <b>```</b> to create code blocks",
            "Type <b>--</b> to create an em dash (—)",
            "Type <b>...</b> to create ellipsis (…)",
            "Quote transformations for smart quotes",
        ],
        initialContent: baseInputRulesJSONContent,
    },
    play: async ({ canvasElement, userEvent, step, canvas }) => {
        // This test should contain at least test for the following input rules
        /// * "> " blockquote
        /// * "1. " ol
        /// * "55. " ol
        /// * "-. " ul
        /// * "+. " ul
        /// * "*. " ul
        /// * "```"  codeblock
        /// * "#"  heading 1
        /// * "##"  heading 2
        /// * "###"  heading 3
        /// * "####"  heading 4
        /// * "#####"  heading 5
        /// * "######"  heading 6
        /// * "--"  em dash —
        /// * "..."  em elipsis …
        /// * """  double quote “ or ”
        /// * "'"  single quote ‘ or ’

        let editor: HTMLElement,
            expectedHTML: string,
            expectedJSON: ProseMirrorDoc,
            hrBtn: HTMLButtonElement;

        // Setup
        await step("Setup strong mark story", async () => {
            expectedHTML =
                "<p>Try typing markdown syntax and see it transform automatically:</p>";
            expectedJSON = baseInputRulesJSONContent;
            editor = await waitForEditor(canvasElement);
            hrBtn = await canvas.findByTitle(
                translations["Insert horizontal rule"],
            );
            await step("Verify input rules setup", async () => {
                // Verify initial setup
                expect(hrBtn).toBeInTheDocument();

                // Verify doc
                expect(editor).toBeDefined();
                expect(expectedHTML).toBeDefined();
                expect(expectedJSON).toBeDefined();
            });
        });

        // Start!
        await step("Select and press enter inside the editor", async () => {
            await userEvent.click(editor);
        });

        // Interaction 1 - Write markdown heading
        await step(
            "Test multiple heading nodes with the # markdown prefix",
            async () => {
                for (let heading = 1; heading <= 6; ++heading) {
                    const markdownTxt = "#".repeat(heading);
                    await step(
                        `Type ${markdownTxt} for H${heading} heading`,
                        async () => {
                            const hText = `Heading level ${heading}`;
                            await step(
                                `Create H${heading} heading with markdown syntax`,
                                async () => {
                                    await userEvent.keyboard(
                                        `{Enter}${markdownTxt} ${hText}`,
                                    );
                                },
                            );
                            await step(
                                `Verify H${heading} heading created`,
                                async () => {
                                    // Verify HTML structure contains formatting
                                    expectedHTML = `${expectedHTML}<h${heading}>${hText}</h${heading}>`;
                                    expectedJSON = {
                                        ...expectedJSON,
                                        content: [
                                            ...expectedJSON.content,
                                            createHeading(hText, heading),
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
                }
            },
        );

        // Interaction 2 - Test markdown ordered list transformation
        await step("Test markdown ordered list transformation", async () => {
            await step("Test ordered list with 1.", async () => {
                await userEvent.keyboard("{Enter}");
                await userEvent.keyboard(
                    "1. First ordered point (creation with 1.)",
                );
                await userEvent.keyboard("{Enter}");
                await userEvent.keyboard(
                    "Second ordered point (creation with 1.)",
                );
                // Double enter to escape list
                await userEvent.keyboard("{Enter}{Enter}");

                // Verify ordered list created with order = 1
                expectedHTML = `${expectedHTML}<ol start="1"><li><p>First ordered point (creation with 1.)</p></li><li><p>Second ordered point (creation with 1.)</p></li></ol><p><br class="ProseMirror-trailingBreak"></p>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        ...expectedJSON.content,
                        createOrderedList(
                            [
                                createListItem(
                                    "First ordered point (creation with 1.)",
                                ),
                                createListItem(
                                    "Second ordered point (creation with 1.)",
                                ),
                            ],
                            1,
                        ),
                        createParagraph(),
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });

            await step("Test ordered list with 44.", async () => {
                await userEvent.keyboard(
                    "44. First ordered point (creation with 44.)",
                );
                await userEvent.keyboard("{Enter}");
                await userEvent.keyboard(
                    "Second ordered point (creation with 44.)",
                );
                // Double enter to escape list
                await userEvent.keyboard("{Enter}");
                await userEvent.keyboard("{Enter}");

                // Verify ordered list created with order = 44
                expectedHTML = `${expectedHTML}<ol start="44"><li><p>First ordered point (creation with 44.)</p></li><li><p>Second ordered point (creation with 44.)</p></li></ol><p><br class="ProseMirror-trailingBreak"></p>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        ...expectedJSON.content,
                        createOrderedList(
                            [
                                createListItem(
                                    "First ordered point (creation with 44.)",
                                ),
                                createListItem(
                                    "Second ordered point (creation with 44.)",
                                ),
                            ],
                            44,
                        ),
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });

            await step("Test ordered list with 101.", async () => {
                await userEvent.keyboard(
                    "101. First ordered point (creation with 101.)",
                );
                await userEvent.keyboard("{Enter}");
                await userEvent.keyboard(
                    "Second ordered point (creation with 101.)",
                );
                // Double enter to escape list
                await userEvent.keyboard("{Enter}");
                await userEvent.keyboard("{Enter}");

                // Verify ordered list created with order = 101
                expectedHTML = `${expectedHTML}<ol start="101"><li><p>First ordered point (creation with 101.)</p></li><li><p>Second ordered point (creation with 101.)</p></li></ol><p><br class="ProseMirror-trailingBreak"></p>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        ...expectedJSON.content,
                        createOrderedList(
                            [
                                createListItem(
                                    "First ordered point (creation with 101.)",
                                ),
                                createListItem(
                                    "Second ordered point (creation with 101.)",
                                ),
                            ],
                            101,
                        ),
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });

        // Interaction 3 - Test markdown bullet list transformation
        await step("Test markdown bullet list transformation", async () => {
            // Add horizontal rule separator
            expectedHTML = `${expectedHTML}<hr>`;
            expectedJSON = {
                ...expectedJSON,
                content: [...expectedJSON.content, createHorizontalRule()],
            };
            await userEvent.click(hrBtn);

            await step("Test bullet list with -", async () => {
                await userEvent.keyboard("{Enter}");
                await userEvent.keyboard(
                    "- First bullet point (creation with -)",
                );
                await userEvent.keyboard("{Enter}");
                await userEvent.keyboard(
                    "Second bullet point (creation with -)",
                );
                // Double enter to escape list
                await userEvent.keyboard("{Enter}");
                await userEvent.keyboard("{Enter}");

                // Verify bullet list created
                expectedHTML = `${expectedHTML}<ul><li><p>First bullet point (creation with -)</p></li><li><p>Second bullet point (creation with -)</p></li></ul>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        ...expectedJSON.content,
                        createBulletList([
                            createListItem(
                                "First bullet point (creation with -)",
                            ),
                            createListItem(
                                "Second bullet point (creation with -)",
                            ),
                        ]),
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });

            await step("Test bullet list with *", async () => {
                await userEvent.keyboard(
                    "* First bullet point (creation with *)",
                );
                await userEvent.keyboard("{Enter}");
                await userEvent.keyboard(
                    "Second bullet point (creation with *)",
                );
                // Double enter to escape list
                await userEvent.keyboard("{Enter}");
                await userEvent.keyboard("{Enter}");

                // Verify bullet list created
                expectedHTML = `${expectedHTML}<ul><li><p>First bullet point (creation with *)</p></li><li><p>Second bullet point (creation with *)</p></li></ul>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        ...expectedJSON.content,
                        createBulletList([
                            createListItem(
                                "First bullet point (creation with *)",
                            ),
                            createListItem(
                                "Second bullet point (creation with *)",
                            ),
                        ]),
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });

            await step("Test bullet list with +", async () => {
                await userEvent.keyboard(
                    "+ First bullet point (creation with +)",
                );
                await userEvent.keyboard("{Enter}");
                await userEvent.keyboard(
                    "Second bullet point (creation with +)",
                );
                // Double enter to escape list
                await userEvent.keyboard("{Enter}");
                await userEvent.keyboard("{Enter}");

                // Verify bullet list created
                expectedHTML = `${expectedHTML}<ul><li><p>First bullet point (creation with +)</p></li><li><p>Second bullet point (creation with +)</p></li></ul>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        ...expectedJSON.content,
                        createBulletList([
                            createListItem(
                                "First bullet point (creation with +)",
                            ),
                            createListItem(
                                "Second bullet point (creation with +)",
                            ),
                        ]),
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });

        // Interaction 4 - Test markdown blockquote transformation
        await step("Test markdown blockquote transformation", async () => {
            // Add horizontal rule separator
            expectedHTML = `${expectedHTML}<hr>`;
            expectedJSON = {
                ...expectedJSON,
                content: [...expectedJSON.content, createHorizontalRule()],
            };
            await userEvent.click(hrBtn);

            await step("Create blockquote with >", async () => {
                await userEvent.keyboard("{Enter}");
                await userEvent.keyboard(
                    "> This is a blockquote created with markdown",
                );
                await userEvent.keyboard("{Enter}");
                await userEvent.keyboard(
                    "> This is a nested blockquote created with markdown",
                );

                // Exit blockquote with multiple enters
                await userEvent.keyboard("{Enter}");
                await userEvent.keyboard("{Enter}");
                await userEvent.keyboard("{Enter}");

                // Verify blockquote created
                expectedHTML = `${expectedHTML}<blockquote><p>This is a blockquote created with markdown</p><p>This is a nested blockquote created with markdown</p></blockquote>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        ...expectedJSON.content,
                        createBlockquote([
                            createParagraph(
                                "This is a blockquote created with markdown",
                            ),
                            createParagraph(
                                "This is a nested blockquote created with markdown",
                            ),
                        ]),
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });

        // Interaction 5 - Test markdown code block transformation
        await step("Test markdown code block transformation", async () => {
            // Add horizontal rule separator
            expectedHTML = `${expectedHTML}<hr>`;
            expectedJSON = {
                ...expectedJSON,
                content: [...expectedJSON.content, createHorizontalRule()],
            };
            await userEvent.click(hrBtn);

            await step("Create code block with ```", async () => {
                await userEvent.keyboard("{Enter}");
                await userEvent.keyboard(
                    "```This will be written inside a code block",
                );
                await userEvent.keyboard("{Enter}");
                await userEvent.keyboard("console.log('hello world');");

                // Verify code block created
                expectedHTML = `${expectedHTML}<pre><code>This will be written inside a code block\nconsole.log('hello world');</code></pre>`;
                expectedJSON = {
                    ...expectedJSON,
                    content: [
                        ...expectedJSON.content,
                        createCodeBlock(
                            "This will be written inside a code block\nconsole.log('hello world');",
                        ),
                    ],
                };
                verifyEditorContent(canvasElement, expectedHTML, expectedJSON);
            });
        });

        // Final verification - ensure all input rules worked
        await step("Final verification of all input rules", async () => {
            const htmlContent = getEditorHTML(canvasElement);
            const jsonContent = getEditorJSON(canvasElement);

            // Verify all major node types are present
            expect(htmlContent).toContain("<h1");
            expect(htmlContent).toContain("<h6");
            expect(htmlContent).toContain("<ol");
            expect(htmlContent).toContain("<ul");
            expect(htmlContent).toContain("<blockquote");
            expect(htmlContent).toContain("<pre><code>");
            expect(htmlContent).toContain("<hr>");

            // Verify JSON structure contains all expected node types
            expect(jsonContent).toEqual(
                expect.objectContaining({
                    type: "doc",
                    content: expect.arrayContaining([
                        expect.objectContaining({
                            type: "heading",
                            attrs: expect.objectContaining({ level: 1 }),
                        }),
                        expect.objectContaining({
                            type: "heading",
                            attrs: expect.objectContaining({ level: 6 }),
                        }),
                        expect.objectContaining({ type: "horizontal_rule" }),
                        expect.objectContaining({ type: "ordered_list" }),
                        expect.objectContaining({ type: "bullet_list" }),
                        expect.objectContaining({ type: "blockquote" }),
                        expect.objectContaining({ type: "code_block" }),
                    ]),
                }),
            );
        });
    },
};

// /**
//  * Test the keyboard shortcuts.
//  */
// export const KeymapPlugin: Story = {
//     args: {
//         ...defaultArgs,
//         storyTitle: "Keyboard Shortcuts",
//         storyDescription:
//             "Test keyboard shortcuts for formatting, navigation, and editor commands. For detailed mark and node testing, see the Marks and Nodes sections.",
//         storyInteractions: [
//             "Use Mod+B for bold, Mod+I for italic (Mod = Ctrl on Windows/Linux, Cmd on Mac)",
//             "Try Mod+` for inline code, Mod+U for underline",
//             "Use Mod+Z for undo, Mod+Shift+Z for redo",
//             "Navigate with arrow keys and text selection",
//             "Test all formatting shortcuts with keyboard",
//             "<b>Complete keymap reference:</b>",
//             "• Mod+B - Toggle bold",
//             "• Mod+I - Toggle italic",
//             "• Mod+` - Toggle code",
//             "• Mod+U - Toggle underline",
//             "• Ctrl+Shift+0 - Make paragraph",
//             "• Ctrl+Shift+1-6 - Make heading H1-H6",
//             "• Ctrl+Shift+\\ - Toggle code block",
//             "• Ctrl+Shift+8 - Wrap in bullet list",
//             "• Ctrl+Shift+9 - Wrap in ordered list",
//             "• Ctrl+> - Wrap in blockquote",
//             "• Mod+Enter - Insert hard break",
//             "• Mod+_ - Insert horizontal rule",
//             "• Alt+ArrowUp/Down - Join blocks",
//             "• Mod+[ - Lift block",
//             "• Escape - Select parent node",
//         ],
//     },
//     play: async ({ canvasElement }) => {
//         // This test should contain at least test for the following keymap

//         // Mod is meta on mac and ctrl on windows.
//         // Ctrl is always ctrl.

//         /// * Mod-b for toggling bold
//         /// * Mod-i for toggling italic
//         /// * Mod-` for toggling code
//         /// * Ctrl-Shift-0 for making the current textblock a paragraph
//         /// * Ctrl-Shift-1 - Ctrl-Shift-6 to Ctrl-Shift-Digit6 for making the current textblock a heading of the corresponding level
//         /// * Ctrl-Shift-Backslash to make the current textblock a code block
//         /// * Ctrl-Shift-8 to wrap the selection in an ordered list
//         /// * Ctrl-Shift-9 to wrap the selection in a bullet list
//         /// * Ctrl-> to wrap the selection in a block quote
//         /// * Enter to split a non-empty textblock in a list item while at the same time splitting the list item
//         /// * Mod-Enter to insert a hard break
//         /// * Mod-_ to insert a horizontal rule
//         /// * Backspace to undo an input rule
//         /// * Alt-ArrowUp to `joinUp`
//         /// * Alt-ArrowDown to `joinDown`
//         /// * Mod-BracketLeft to `lift`
//         /// * Escape to `selectParentNode`

//         const editor = await waitForEditor(canvasElement);

//         // Click editor
//         await userEvent.click(editor);
//         // Type text.
//         const insertedText = "My formatted text";
//         await userEvent.type(editor, insertedText);

//         // Select text
//         await userEvent.tripleClick(editor);

//         // Make text bold
//         await pressKey(editor, "b", { ctrlKey: true });

//         // Make text italic
//         await pressKey(editor, "i", { ctrlKey: true });

//         // Verify HTML structure contains formatting
//         let htmlAfterBold = getEditorHTML(canvasElement);
//         let jsonAfterBold = getEditorJSON(canvasElement);

//         expect(htmlAfterBold).toBe(
//             `<p><em><strong>${insertedText}</strong></em></p>`,
//         );

//         expect(jsonAfterBold).toEqual(
//             expect.objectContaining({
//                 type: "doc",
//                 content: [
//                     expect.objectContaining({
//                         type: "paragraph",
//                         content: [
//                             expect.objectContaining({
//                                 type: "text",
//                                 marks: [
//                                     expect.objectContaining({ type: "em" }),
//                                     expect.objectContaining({ type: "strong" }),
//                                 ],
//                                 text: insertedText,
//                             }),
//                         ],
//                     }),
//                 ],
//             }),
//         );

//         // Undo changes
//         await pressKey(editor, "z", { ctrlKey: true });
//         await pressKey(editor, "z", { ctrlKey: true });

//         jsonAfterBold = getEditorJSON(canvasElement);
//         htmlAfterBold = getEditorHTML(canvasElement);

//         expect(htmlAfterBold).toBe(`<p>${insertedText}</p>`);

//         expect(jsonAfterBold).toEqual(
//             expect.objectContaining({
//                 type: "doc",
//                 content: [
//                     expect.objectContaining({
//                         type: "paragraph",
//                         content: [
//                             expect.objectContaining({
//                                 type: "text",
//                                 text: insertedText,
//                             }),
//                         ],
//                     }),
//                 ],
//             }),
//         );

//         // Redo changes
//         await pressKey(editor, "z", { ctrlKey: true, shiftKey: true });
//         await pressKey(editor, "z", { ctrlKey: true, shiftKey: true });

//         // Verify HTML structure contains formatting
//         htmlAfterBold = getEditorHTML(canvasElement);
//         jsonAfterBold = getEditorJSON(canvasElement);

//         expect(htmlAfterBold).toBe(
//             `<p><em><strong>${insertedText}</strong></em></p>`,
//         );

//         expect(jsonAfterBold).toEqual(
//             expect.objectContaining({
//                 type: "doc",
//                 content: [
//                     expect.objectContaining({
//                         type: "paragraph",
//                         content: [
//                             expect.objectContaining({
//                                 type: "text",
//                                 marks: [
//                                     expect.objectContaining({ type: "em" }),
//                                     expect.objectContaining({ type: "strong" }),
//                                 ],
//                                 text: insertedText,
//                             }),
//                         ],
//                     }),
//                 ],
//             }),
//         );

//         // Test copy/cut + paste.
//         // Select text
//         await userEvent.tripleClick(editor);

//         // Copie text
//         const copy = await userEvent.copy();

//         // Click the editor to deselect.
//         await userEvent.click(editor);

//         // Press enter for new line
//         await pressKey(editor, "Enter");

//         // Paste copied text
//         await userEvent.paste(copy);

//         // Verify HTML structure contains formatting
//         htmlAfterBold = getEditorHTML(canvasElement);
//         jsonAfterBold = getEditorJSON(canvasElement);

//         expect(htmlAfterBold).toBe(
//             `<p><em><strong>${insertedText}</strong></em></p><p><em><strong>${insertedText}</strong></em></p>`,
//         );

//         expect(jsonAfterBold).toEqual(
//             expect.objectContaining({
//                 type: "doc",
//                 content: [
//                     expect.objectContaining({
//                         type: "paragraph",
//                         content: [
//                             expect.objectContaining({
//                                 type: "text",
//                                 marks: [
//                                     expect.objectContaining({ type: "em" }),
//                                     expect.objectContaining({ type: "strong" }),
//                                 ],
//                                 text: insertedText,
//                             }),
//                         ],
//                     }),
//                     expect.objectContaining({
//                         type: "paragraph",
//                         content: [
//                             expect.objectContaining({
//                                 type: "text",
//                                 marks: [
//                                     expect.objectContaining({ type: "em" }),
//                                     expect.objectContaining({ type: "strong" }),
//                                 ],
//                                 text: insertedText,
//                             }),
//                         ],
//                     }),
//                 ],
//             }),
//         );

//         // Select text
//         await userEvent.tripleClick(editor);

//         // Cut text
//         const cut = await userEvent.cut();

//         // Verify HTML structure contains formatting
//         htmlAfterBold = getEditorHTML(canvasElement);
//         jsonAfterBold = getEditorJSON(canvasElement);

//         expect(htmlAfterBold).toBe(
//             '<p><br class="ProseMirror-trailingBreak"></p>',
//         );

//         expect(jsonAfterBold).toEqual(
//             expect.objectContaining({
//                 type: "doc",
//                 content: [
//                     expect.objectContaining({
//                         type: "paragraph",
//                     }),
//                 ],
//             }),
//         );

//         // Paste cutted text
//         await userEvent.paste(cut);

//         // Verify HTML structure contains formatting
//         htmlAfterBold = getEditorHTML(canvasElement);
//         jsonAfterBold = getEditorJSON(canvasElement);

//         expect(htmlAfterBold).toBe(
//             `<p><em><strong>${insertedText}</strong></em></p><p><em><strong>${insertedText}</strong></em></p>`,
//         );

//         expect(jsonAfterBold).toEqual(
//             expect.objectContaining({
//                 type: "doc",
//                 content: [
//                     expect.objectContaining({
//                         type: "paragraph",
//                         content: [
//                             expect.objectContaining({
//                                 type: "text",
//                                 marks: [
//                                     expect.objectContaining({ type: "em" }),
//                                     expect.objectContaining({ type: "strong" }),
//                                 ],
//                                 text: insertedText,
//                             }),
//                         ],
//                     }),
//                     expect.objectContaining({
//                         type: "paragraph",
//                         content: [
//                             expect.objectContaining({
//                                 type: "text",
//                                 marks: [
//                                     expect.objectContaining({ type: "em" }),
//                                     expect.objectContaining({ type: "strong" }),
//                                 ],
//                                 text: insertedText,
//                             }),
//                         ],
//                     }),
//                 ],
//             }),
//         );

//         await pressKey(editor, "_", { ctrlKey: true, shiftKey: true }); // inset hr.

//         // pressKey(editor, "Enter");
//         // await userEvent.type(editor, "hello");
//         selectBackward(editor, 5);
//         // sleep(100);

//         await fireEvent.keyDown(editor, {
//             key: "1",
//             code: `Key1`,
//             bubbles: true,
//             cancelable: true,
//             ctrlKey: true,
//             shiftKey: true,
//         });

//         // lift list item.
//         await fireEvent.keyDown(editor, {
//             key: "]",
//             code: `Key]`,
//             bubbles: true,
//             cancelable: true,
//             ctrlKey: true,
//             shiftKey: true,
//         });

//         // sink list item.
//         await fireEvent.keyDown(editor, {
//             key: "]",
//             code: `Key]`,
//             bubbles: true,
//             cancelable: true,
//             ctrlKey: true,
//             shiftKey: true,
//         });
//     },
// };

/**
 * Test the History Plugin (Undo/Redo) Story
 */
export const HistoryPlugin: Story = {
    args: {
        ...defaultArgs,
        storyTitle: "Undo/Redo History",
        storyDescription:
            "Test undo/redo functionality with keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z).",
        storyInteractions: [
            "Make changes to text and formatting",
            "Use Ctrl+Z (Cmd+Z) to undo changes",
            "Use Ctrl+Shift+Z (Cmd+Shift+Z) (Ctrl+Y windows only) to redo",
            "Test history preservation across different operations",
            "Verify undo/redo works with complex edits",
        ],
        history: true,
        initialContent: {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "History plugin for undo/redo functionality:",
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Make changes, then use Ctrl+Z to undo and Ctrl+Shift+Z to redo.",
                        },
                    ],
                },
            ],
        },
    },
    play: async ({ canvasElement, userEvent }) => {
        const editor = await waitForEditor(canvasElement);

        // Make initial change
        await userEvent.click(editor);

        await userEvent.keyboard("{Enter}");

        await userEvent.keyboard("First change - will be undone");

        // Make second change
        await userEvent.keyboard("{Enter}");

        await userEvent.keyboard("Second change - will also be undone");

        // Test undo functionality
        await userEvent.keyboard("{Meta>}z{/Meta}");

        // Test redo functionality
        await userEvent.keyboard("{Meta>}{Shift>}z{/Meta}{/Shift}");

        // Verify history plugin worked
        const jsonContent = getEditorJSON(canvasElement);

        expect(jsonContent).toEqual({
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "History plugin for undo/redo functionality:",
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Make changes, then use Ctrl+Z to undo and Ctrl+Shift+Z to redo.",
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "First change - will be undone",
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Second change - will also be undone",
                        },
                    ],
                },
            ],
        });
    },
};
