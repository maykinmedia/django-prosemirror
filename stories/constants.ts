import { NodeType, MarkType } from "../frontend/schema/types";
import { createParagraph } from "./utils";
import {
    DjangoProsemirrorWidget,
    DjangoProsemirrorWrapperProps,
} from "./Widget";
import { Meta } from "@storybook/preact-vite";

// Mock Django data structure
export const defaultDoc = {
    type: "doc",
    content: [
        createParagraph(
            "Welcome to Django ProseMirror! This editor demonstrates the modal functionality.",
        ),
        createParagraph(
            "Try using the toolbar to open modals for editing images and other content.",
        ),
    ],
};

export const defaultArgs: DjangoProsemirrorWrapperProps = {
    history: true,
    allowedMarks: Object.values(MarkType),
    allowedNodes: Object.values(NodeType),
    resize: "none",
    initialContent: defaultDoc,
};

export const defaultMeta: Meta<typeof DjangoProsemirrorWidget> = {
    parameters: { layout: "fullscreen" },
    component: DjangoProsemirrorWidget,
    argTypes: {
        initialContent: {
            control: "object",
            description: "Initial document content in ProseMirror JSON format",
        },
        allowedNodes: { control: false, table: { disable: true } },
        allowedMarks: { control: false, table: { disable: true } },
        storyTitle: { control: false, table: { disable: true } },
        storyDescription: { control: false, table: { disable: true } },
        storyInteractions: { control: false, table: { disable: true } },
        classes: { control: false, table: { disable: true } },
        history: { control: "boolean" },
        resize: {
            control: "radio",
            options: [
                "both",
                "horizontal",
                "vertical",
                "block",
                "inline",
                "none",
            ],
        },
    },
};

export const shortcuts = {
    horizontal_rule: "{Shift>}{Meta>}_{/Meta}{/Shift}",
    bold: "{Meta>}b{/Meta}",
    italic: "{Meta>}i{/Meta}",
    code: "{Meta>}`{/Meta}",
};
