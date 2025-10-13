import { Meta, StoryObj } from "@storybook/preact-vite";
import { expect, within } from "storybook/test";
import { defaultArgs, defaultMeta } from "./constants";
import { getEditorHTML, getEditorJSON, waitForEditor } from "./utils";
import { DjangoProsemirrorWidget } from "./Widget";
const meta: Meta<typeof DjangoProsemirrorWidget> = {
    ...defaultMeta,
    title: "Django ProseMirror/Plugins",
};

export default meta;
type Story = StoryObj<typeof DjangoProsemirrorWidget>;

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
            "Type # for H1, ## for H2, ### for H3, etc.",
            "Type - or * for bullet lists, 1. for numbered lists",
            "Type > for blockquotes",
            "Type ``` for code blocks",
            "Watch text transform automatically as you type",
            "<b>Complete input rules reference:</b>",
            "• '> ' - Creates blockquote",
            "• '1. ', '55. ' - Creates ordered list",
            "• '- ', '* ', '+ ' - Creates bullet list",
            "• '``` ' - Creates code block",
            "• '# ' to '###### ' - Creates headings H1-H6",
            "• '--' - Em dash (—)",
            "• '...' - Ellipsis (…)",
            "• Quote transformations for smart quotes",
        ],
        initialContent: {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Try typing markdown syntax and see it transform automatically:",
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "- Type # for headings",
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "- Type - or * for bullet lists",
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "- Type 1. for numbered lists (or any number)",
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "- Type > for blockquotes",
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "- Type ``` for code blocks",
                        },
                    ],
                },
            ],
        },
    },
    play: async ({ canvasElement, userEvent, step }) => {
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

        const canvas = within(canvasElement);
        const editor = await waitForEditor(canvasElement);

        // Test markdown heading transformation
        await userEvent.click(editor);
        await userEvent.keyboard("{Enter}");

        const hrBtn = await canvas.findByTitle("Insert horizontal rule");
        await userEvent.click(hrBtn);

        // ---- START MARKDOWN HEADINGS ---- //
        await userEvent.type(
            editor,
            "Test multiple heading nodes with the # markdown prefix",
        );

        await step("Type Markdown Headings", async () => {
            for (let heading = 1; heading <= 6; ++heading) {
                const markdownTxt = "#".repeat(heading);
                await step(
                    `Type ${markdownTxt} for H${heading} heading`,
                    async () => {
                        const hText = `Level ${heading} Heading`;

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
                                const editorHTML = getEditorHTML(canvasElement);

                                expect(editorHTML).toContain(
                                    `<h${heading}>${hText}</h${heading}>`,
                                );
                            },
                        );
                    },
                );
            }
        });
        // ---- END MARKDOWN HEADINGS ---- //

        await userEvent.click(hrBtn);

        // ---- START MARKDOWN LISTS ---- //
        await userEvent.keyboard("{Enter}");

        // Test markdown list transformation
        await userEvent.type(editor, "- First bullet point (creation with -)");

        await userEvent.keyboard("{Enter}");

        await userEvent.keyboard("Second bullet point");

        // Double enter to escape list
        await userEvent.keyboard("{Enter}");
        await userEvent.keyboard("{Enter}");

        // Test markdown list transformation
        await userEvent.type(editor, "* First bullet point (creation with *)");

        await userEvent.keyboard("{Enter}");

        await userEvent.keyboard("Second bullet point");

        // Double enter to escape list
        await userEvent.keyboard("{Enter}");
        await userEvent.keyboard("{Enter}");
        // Test markdown list transformation

        await userEvent.type(editor, "+ First bullet point (creation with +)");

        await userEvent.keyboard("{Enter}");

        await userEvent.keyboard("Second bullet point");

        // Double enter to escape list
        await userEvent.keyboard("{Enter}");
        await userEvent.keyboard("{Enter}");

        // Test markdown list transformation
        await userEvent.type(
            editor,
            "1. First ordered point - starting from 1",
        );

        await userEvent.keyboard("{Enter}");

        await userEvent.keyboard("Second ordered point");

        // Double enter to escape list
        await userEvent.keyboard("{Enter}");
        await userEvent.keyboard("{Enter}");

        // Test markdown list transformation
        await userEvent.type(
            editor,
            "55. First ordered point - starting from 55",
        );

        await userEvent.keyboard("{Enter}");

        await userEvent.keyboard("Second ordered point");

        await userEvent.keyboard("{Enter}");
        await userEvent.keyboard("{Enter}");

        await userEvent.click(hrBtn);

        // ---- END MARKDOWN LISTS ---- //

        // ---- START MARKDOWN BLOCKQUOTES ---- //
        // Test markdown blockquote transformation
        await userEvent.type(
            editor,
            "> This is a blockquote created with markdown",
        );

        await userEvent.keyboard("{Enter}");

        // Test nested markdown blockquote transformation
        await userEvent.keyboard(
            "> This is a nested blockquote created with markdown",
        );

        await userEvent.keyboard("{Enter}");
        await userEvent.keyboard("{Enter}");
        await userEvent.keyboard("{Enter}");

        await userEvent.click(hrBtn);
        // ---- END MARKDOWN BLOCKQUOTES ---- //

        // ---- START MARKDOWN CODE BLOCKS ---- //
        await userEvent.click(editor);

        // Test markdown blockquote transformation
        await userEvent.type(
            editor,
            "```This will be written inside a code block",
        );

        await userEvent.keyboard("{Enter}");

        await userEvent.keyboard("console.log('hello world');");
        // ---- END MARKDOWN CODE BLOCKS ---- //

        // Verify markdown transformations worked
        const htmlContent = getEditorHTML(canvasElement);
        const jsonContent = getEditorJSON(canvasElement);

        expect(htmlContent).toContain("<h1");
        expect(htmlContent).toContain("<ul");
        expect(htmlContent).toContain("<blockquote");

        expect(jsonContent).toEqual(
            expect.objectContaining({
                type: "doc",
                content: expect.arrayContaining([
                    expect.objectContaining({
                        type: "heading",
                        attrs: expect.objectContaining({
                            level: 1,
                        }),
                    }),
                    expect.objectContaining({
                        type: "bullet_list",
                    }),
                    expect.objectContaining({
                        type: "blockquote",
                    }),
                ]),
            }),
        );
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
