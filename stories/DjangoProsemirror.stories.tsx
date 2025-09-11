import { Meta, StoryObj } from "@storybook/preact-vite";
import "../frontend/scss/index.scss";
import { expect, fireEvent, userEvent, within } from "storybook/test";
import {
    pressShortcut,
    getEditorHTML,
    getEditorJSON,
    waitForEditor,
} from "./utils";
import { DjangoProsemirrorWrapper, mockDocumentData } from "./Wrapper";
import { MarkType, NodeType } from "../frontend/schema/types";
import { defaultArgs } from "./constants";

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
        initialContent: {
            control: "object",
            description: "Initial document content in ProseMirror JSON format",
        },
        allowedNodes: { control: "check", options: NodeType },
        allowedMarks: { control: "check", options: MarkType },
        history: { control: "boolean" },
        classes: { control: "object" },
    },
};

export default meta;
type Story = StoryObj<typeof DjangoProsemirrorWrapper>;

export const Default: Story = {
    args: {
        ...defaultArgs,

        initialContent: mockDocumentData,
    },
};

export const WithImage: Story = {
    args: {
        ...defaultArgs,
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
        ...defaultArgs,
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

// Story with text formatting interactions
export const TextFormattingInteractionTest: Story = {
    args: {
        ...defaultArgs,
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
            `<p class="story_classes"><code class="story_classes"><em><s><strong><u>${insertedBoldText}</u></strong></s></em></code></p>`,
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
                                    expect.objectContaining({ type: "code" }),
                                    expect.objectContaining({ type: "em" }),
                                    expect.objectContaining({
                                        type: "strikethrough",
                                    }),
                                    expect.objectContaining({ type: "strong" }),
                                    expect.objectContaining({
                                        type: "underline",
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
export const TextFormattingShortcutInteractionTest: Story = {
    args: {
        ...defaultArgs,
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
            `<p class="story_classes"><em><strong>${insertedBoldText}</strong></em></p>`,
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
                                    expect.objectContaining({ type: "em" }),
                                    expect.objectContaining({ type: "strong" }),
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
export const HeadingInteractionTest: Story = {
    args: {
        ...defaultArgs,
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

        expect(htmlAfterBold).toContain(
            `<h1 class="story_classes">${h1Text}</h1>`,
        );
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
        expect(htmlAfterBold).toContain(
            `<h2 class="story_classes">${h2Text}</h2>`,
        );

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
        expect(htmlAfterBold).toContain(
            `<h3 class="story_classes">${h3Text}</h3>`,
        );

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
        expect(htmlAfterBold).toContain(
            `<h4 class="story_classes">${h4Text}</h4>`,
        );

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
        expect(htmlAfterBold).toContain(
            `<h5 class="story_classes">${h5Text}</h5>`,
        );

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
        expect(htmlAfterBold).toContain(
            `<h6 class="story_classes">${h6Text}</h6>`,
        );

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

// Story testing image interaction
export const ImageInteractionTest: Story = {
    args: {
        ...defaultArgs,

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
    play: async () => {
        // It should select the image
        // It should change (try to change) the image src
        // It should change (try to change) the image attributes
        // It should remove the image
        // It should validate the expected HTML
    },
};

// Story testing table interaction
export const TableInteractionTest: Story = {
    args: {
        ...defaultArgs,
        initialContent: {
            type: "doc",
            content: [],
        },
    },
    play: async () => {
        // It should select the table
        // It should remove the table
        // It should create a new table
        // It should select the correct size (5x8)
        // It should change the first row from th to td.
        // It should change the last row from td to th.
        // It should change the first column from td to th.
        // If it is possible it should resize some columns.
        // It should validate the expected HTML
    },
};

// Story testing list interactions
export const ListsInteractionTest: Story = {
    args: {
        ...defaultArgs,
        initialContent: {
            type: "doc",
            content: [],
        },
    },
    play: async () => {
        // It should create a bullet list (with text and the menu-item).
        // It should change the list from bullet to ordered.
        // It should be able to create a ordered list starting from 10.
        // It should be able to merge two lists.
        // It should be able to dedent a list item.
    },
};

// Story testing list interactions
export const BlockquoteInteractionTest: Story = {
    args: {
        ...defaultArgs,
        initialContent: {
            type: "doc",
            content: [],
        },
    },
    play: async () => {
        // It should create a blockquote (with text and the menu-item).
        // It should be able to create a blockquote inside a blockquote.
        // It should be able to dedent a blockquote
        // It should be able to merge two blockquotes
        // It should be able to fill a blockquote with multiple marks/blocks.
    },
};
