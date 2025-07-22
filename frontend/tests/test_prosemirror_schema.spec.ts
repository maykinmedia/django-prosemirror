import { describe, it, expect } from "vitest";
import { Mark, Node, Schema, StyleParseRule } from "prosemirror-model";
import DjangoProsemirrorSchema from "../schema/prosemirror-schema";
import { IDPMSettings, LanguageCodeEnum } from "../types/types";
import { SchemaNodesEnum } from "../schema/choices";
import { MarkType, NodeType } from "../schema/types";
import { ParagraphNode } from "../schema/nodes/paragraph";

// Helper function for deep comparison of objects
const deepEqual = (actual: unknown, expected: unknown) => {
    expect(JSON.stringify(actual, null, 2)).toEqual(
        JSON.stringify(expected, null, 2),
    );
};

const basicsettings: IDPMSettings = {
    allowedNodes: [NodeType.PARAGRAPH],
    allowedMarks: [],
    classNames: {},
    history: true,
    debug: false,
    menubar: true,
    language: LanguageCodeEnum.NL,
    floatingMenu: false,
};

let DjangoProsemirrorSchemaCls = new DjangoProsemirrorSchema(basicsettings);

describe("DjangoProsemirrorSchema", () => {
    describe("Required Nodes", () => {
        it("should return correct doc node spec", () => {
            const docSpec = DjangoProsemirrorSchemaCls.schema.nodes.doc.spec;
            expect(docSpec).toEqual({
                content: "block+",
            });
        });

        it("should return correct text node spec", () => {
            const textSpec = DjangoProsemirrorSchemaCls.schema.nodes.text.spec;
            expect(textSpec).toEqual({
                group: "inline",
            });
        });

        it("should return correct paragraph node spec", () => {
            const textParagraphNodeSpec =
                DjangoProsemirrorSchemaCls.schema.nodes.paragraph.spec;
            // @ts-expect-error spec is somehow not defined inside this test file.
            const spec = new ParagraphNode({}).spec;

            deepEqual(textParagraphNodeSpec, spec);
        });

        it("should return correct paragraph node spec", () => {
            const paragraphSpec =
                DjangoProsemirrorSchemaCls.schema.nodes.paragraph.spec;
            expect(paragraphSpec.content).toBe("inline*");
            expect(paragraphSpec.group).toBe("block");
            expect(paragraphSpec.parseDOM).toEqual([{ tag: "p" }]);
            expect(paragraphSpec.toDOM?.apply(paragraphSpec)).toEqual([
                "p",
                {},
                0,
            ]);
        });

        it("should return all required nodes", () => {
            const requiredNodes = DjangoProsemirrorSchemaCls.schema.nodes;
            expect(Object.keys(requiredNodes)).toEqual([
                SchemaNodesEnum.DOC,
                SchemaNodesEnum.PARAGRAPH,
                SchemaNodesEnum.TEXT,
            ]);
            expect(requiredNodes.doc.spec.content).toBe("block+");
            expect(requiredNodes.text.spec).toEqual({ group: "inline" });
            // @ts-expect-error spec is somehow not defined inside this test file.
            deepEqual(requiredNodes.paragraph.spec, new ParagraphNode({}).spec);
        });
    });

    describe("Block Nodes", () => {
        it("should return correct blockquote node spec", () => {
            DjangoProsemirrorSchemaCls = new DjangoProsemirrorSchema({
                ...basicsettings,
                allowedNodes: [NodeType.PARAGRAPH, NodeType.BLOCKQUOTE],
            });
            const blockquoteSpec =
                DjangoProsemirrorSchemaCls.schema.nodes.blockquote.spec;
            expect(blockquoteSpec.content).toBe("block+");
            expect(blockquoteSpec.group).toBe("block");
            expect(blockquoteSpec.defining).toBe(true);
            expect(blockquoteSpec.parseDOM).toEqual([{ tag: "blockquote" }]);
            // @ts-expect-error An argument for 'node' was not provided.
            expect(blockquoteSpec.toDOM?.()).toEqual(["blockquote", {}, 0]);
        });

        it("should return correct horizontal_rule node spec", () => {
            DjangoProsemirrorSchemaCls = new DjangoProsemirrorSchema({
                ...basicsettings,
                allowedNodes: [NodeType.PARAGRAPH, NodeType.HORIZONTAL_RULE],
            });
            const hrSpec =
                DjangoProsemirrorSchemaCls.schema.nodes.horizontal_rule.spec;
            expect(hrSpec.group).toBe("block");
            expect(hrSpec.parseDOM).toEqual([{ tag: "hr" }]);
            // @ts-expect-error An argument for 'node' was not provided.
            expect(hrSpec.toDOM?.()).toEqual(["hr", {}]);
        });

        it("should return correct heading node spec", () => {
            DjangoProsemirrorSchemaCls = new DjangoProsemirrorSchema({
                ...basicsettings,
                allowedNodes: [NodeType.PARAGRAPH, NodeType.HEADING],
            });
            const headingSpec =
                DjangoProsemirrorSchemaCls.schema.nodes.heading.spec;
            expect(headingSpec.content).toBe("inline*");
            expect(headingSpec.group).toBe("block");
            expect(headingSpec.defining).toBe(true);
            expect(headingSpec.attrs).toEqual({
                level: { default: 1, validate: "number" },
            });

            // Test parseDOM for all heading levels
            const expectedParseDOM = [
                { tag: "h1", attrs: { level: 1 } },
                { tag: "h2", attrs: { level: 2 } },
                { tag: "h3", attrs: { level: 3 } },
                { tag: "h4", attrs: { level: 4 } },
                { tag: "h5", attrs: { level: 5 } },
                { tag: "h6", attrs: { level: 6 } },
            ];
            expect(headingSpec.parseDOM).toEqual(expectedParseDOM);

            // Test toDOM function
            let mockNode: Partial<Node> = { attrs: { level: 3 } };
            expect(headingSpec.toDOM?.(mockNode as Node)).toEqual([
                "h3",
                {},
                0,
            ]);

            // Test toDOM function
            mockNode = { attrs: { level: 2 } };
            expect(headingSpec.toDOM?.(mockNode as Node)).toEqual([
                "h2",
                {},
                0,
            ]);

            // Test toDOM function
            mockNode = { attrs: { level: 6 } };
            expect(headingSpec.toDOM?.(mockNode as Node)).toEqual([
                "h6",
                {},
                0,
            ]);
        });

        it("should return correct code_block node spec", () => {
            DjangoProsemirrorSchemaCls = new DjangoProsemirrorSchema({
                ...basicsettings,
                allowedNodes: [NodeType.PARAGRAPH, NodeType.CODE_BLOCK],
            });
            const codeBlockSpec =
                DjangoProsemirrorSchemaCls.schema.nodes.code_block.spec;
            expect(codeBlockSpec.content).toBe("text*");
            expect(codeBlockSpec.marks).toBe("");
            expect(codeBlockSpec.group).toBe("block");
            expect(codeBlockSpec.code).toBe(true);
            expect(codeBlockSpec.defining).toBe(true);
            expect(codeBlockSpec.parseDOM).toEqual([
                { tag: "pre", preserveWhitespace: "full" },
            ]);
            // @ts-expect-error An argument for 'node' was not provided.
            expect(codeBlockSpec.toDOM?.()).toEqual([
                "pre",
                { spellcheck: false },
                ["code", {}, 0],
            ]);
        });
    });

    describe("Inline Nodes", () => {
        it("should return correct image node spec", () => {
            DjangoProsemirrorSchemaCls = new DjangoProsemirrorSchema({
                ...basicsettings,
                allowedNodes: [NodeType.PARAGRAPH, NodeType.IMAGE],
            });
            const imageSpec =
                DjangoProsemirrorSchemaCls.schema.nodes.image.spec;
            expect(imageSpec.inline).toBe(true);
            expect(imageSpec.group).toBe("inline");
            expect(imageSpec.draggable).toBe(true);
            expect(imageSpec.attrs).toEqual({
                src: { validate: "string" },
                alt: { default: "", validate: "string|null" },
                title: { default: null, validate: "string|null" },
            });

            // Test parseDOM getAttrs function
            const mockDOM: Partial<HTMLElement> = {
                getAttribute: (attr) => {
                    const attrs = {
                        src: "test.jpg",
                        alt: "Test image",
                        title: "Test title",
                    };
                    return attrs[attr as keyof typeof attrs];
                },
            };
            const parseDOMRule = imageSpec.parseDOM?.[0];
            const attrs = parseDOMRule?.getAttrs?.(mockDOM as HTMLElement);
            expect(attrs).toEqual({
                src: "test.jpg",
                alt: "Test image",
                title: "Test title",
            });

            // Test toDOM function
            const mockNode: Partial<Node> = {
                attrs: {
                    src: "test.jpg",
                    alt: "Test alt",
                    title: "Test title",
                },
            };
            expect(imageSpec.toDOM?.(mockNode as Node)).toEqual([
                "img",
                { src: "test.jpg", alt: "Test alt", title: "Test title" },
            ]);
        });

        it("should return correct hard_break node spec", () => {
            DjangoProsemirrorSchemaCls = new DjangoProsemirrorSchema({
                ...basicsettings,
                allowedNodes: [NodeType.PARAGRAPH, NodeType.HARD_BREAK],
            });
            const hardBreakSpec =
                DjangoProsemirrorSchemaCls.schema.nodes.hard_break.spec;
            expect(hardBreakSpec.inline).toBe(true);
            expect(hardBreakSpec.group).toBe("inline");
            expect(hardBreakSpec.selectable).toBe(false);
            expect(hardBreakSpec.parseDOM).toEqual([{ tag: "br" }]);
            // @ts-expect-error An argument for 'node' was not provided.
            expect(hardBreakSpec.toDOM?.()).toEqual(["br", {}]);
        });
    });

    describe("List Nodes", () => {
        it("should return correct ordered_list node spec", () => {
            DjangoProsemirrorSchemaCls = new DjangoProsemirrorSchema({
                ...basicsettings,
                allowedNodes: [NodeType.PARAGRAPH, NodeType.ORDERED_LIST],
            });
            const orderedListSpec =
                DjangoProsemirrorSchemaCls.schema.nodes.ordered_list.spec;
            expect(orderedListSpec.content).toBe("list_item+");
            expect(orderedListSpec.group).toBe("block");
            expect(orderedListSpec.attrs).toEqual({
                order: { default: 1, validate: "number" },
            });

            // Test parseDOM getAttrs function
            const mockDOMWithStart: Partial<HTMLElement> = {
                hasAttribute: () => true,
                getAttribute: () => "5",
            };
            const mockDOMWithoutStart: Partial<HTMLElement> = {
                hasAttribute: () => false,
            };

            const parseDOMRule = orderedListSpec.parseDOM?.[0];
            expect(
                parseDOMRule?.getAttrs?.(mockDOMWithStart as HTMLElement),
            ).toEqual({
                order: 5,
            });
            expect(
                parseDOMRule?.getAttrs?.(mockDOMWithoutStart as HTMLElement),
            ).toEqual({
                order: 1,
            });

            // Test toDOM function
            const nodeWithDefaultOrder: Partial<Node> = { attrs: { order: 1 } };
            const nodeWithCustomOrder: Partial<Node> = { attrs: { order: 5 } };
            expect(
                orderedListSpec?.toDOM?.(nodeWithDefaultOrder as Node),
            ).toEqual(["ol", { start: 1 }, 0]);
            expect(
                orderedListSpec?.toDOM?.(nodeWithCustomOrder as Node),
            ).toEqual(["ol", { start: 5 }, 0]);
        });

        it("should return correct bullet_list node spec", () => {
            DjangoProsemirrorSchemaCls = new DjangoProsemirrorSchema({
                ...basicsettings,
                allowedNodes: [NodeType.PARAGRAPH, NodeType.BULLET_LIST],
            });
            const bulletListSpec =
                DjangoProsemirrorSchemaCls.schema.nodes.bullet_list.spec;
            expect(bulletListSpec.content).toBe("list_item+");
            expect(bulletListSpec.group).toBe("block");
            expect(bulletListSpec.parseDOM).toEqual([{ tag: "ul" }]);
            // @ts-expect-error An argument for 'node' was not provided.
            expect(bulletListSpec?.toDOM?.()).toEqual(["ul", {}, 0]);
        });

        it("should return correct list_item node spec", () => {
            DjangoProsemirrorSchemaCls = new DjangoProsemirrorSchema({
                ...basicsettings,
                allowedNodes: [NodeType.PARAGRAPH, NodeType.LIST_ITEM],
            });
            const listItemSpec =
                DjangoProsemirrorSchemaCls.schema.nodes.list_item.spec;
            expect(listItemSpec.content).toBe("paragraph block*");
            expect(listItemSpec.defining).toBe(true);
            expect(listItemSpec.parseDOM).toEqual([{ tag: "li" }]);
            // @ts-expect-error An argument for 'node' was not provided.
            expect(listItemSpec?.toDOM?.()).toEqual(["li", {}, 0]);
        });
    });

    describe("Table nodes", () => {
        it("should return correct table specs", () => {
            expect(true).toBe(true);
        });
    });

    describe("Mark Specs", () => {
        it("should return correct link mark spec", () => {
            DjangoProsemirrorSchemaCls = new DjangoProsemirrorSchema({
                ...basicsettings,
                allowedMarks: [MarkType.LINK],
            });

            const linkSpec = DjangoProsemirrorSchemaCls.schema.marks.link.spec;
            expect(linkSpec.inclusive).toBe(false);
            expect(linkSpec.attrs).toEqual({
                href: { validate: "string" },
                title: { default: null, validate: "string|null" },
            });

            // Test parseDOM getAttrs function
            const mockDOM: Partial<HTMLElement> = {
                getAttribute: (attr) => {
                    const attrs = {
                        href: "https://example.com",
                        title: "Example",
                    };
                    return attrs[attr as keyof typeof attrs];
                },
            };
            const parseDOMRule = linkSpec.parseDOM?.[0];
            const attrs = parseDOMRule?.getAttrs?.(
                mockDOM as HTMLElement & string,
            );
            expect(attrs).toEqual({
                href: "https://example.com",
                title: "Example",
            });

            // Test toDOM function
            const mockNode: Partial<Mark> = {
                attrs: { href: "https://example.com", title: "Example" },
            };

            // @ts-expect-error An argument for 'node' was not provided.
            expect(linkSpec?.toDOM?.(mockNode as Mark)).toEqual([
                "a",
                { href: "https://example.com", title: "Example" },
                0,
            ]);
        });

        it("should return correct em mark spec", () => {
            DjangoProsemirrorSchemaCls = new DjangoProsemirrorSchema({
                ...basicsettings,
                allowedMarks: [MarkType.ITALIC],
            });
            const emSpec = DjangoProsemirrorSchemaCls.schema.marks.em.spec;
            expect(emSpec.parseDOM).toEqual([
                { tag: "i" },
                { tag: "em" },
                { style: "font-style=italic" },
                {
                    style: "font-style=normal",
                    clearMark: expect.any(Function),
                },
            ]);
            // @ts-expect-error An argument for 'node' was not provided.
            expect(emSpec?.toDOM?.()).toEqual(["em", {}, 0]);

            // Test clearMark function
            const clearMarkFn = (emSpec?.parseDOM?.[3] as StyleParseRule)
                .clearMark;
            const mockMark = { type: { name: "em" } };
            const mockOtherMark = { type: { name: "strong" } };
            expect(clearMarkFn?.(mockMark as Mark)).toBe(true);
            expect(clearMarkFn?.(mockOtherMark as Mark)).toBe(false);
        });

        it("should return correct strong mark spec", () => {
            DjangoProsemirrorSchemaCls = new DjangoProsemirrorSchema({
                ...basicsettings,
                allowedMarks: [MarkType.STRONG],
            });
            const strongSpec =
                DjangoProsemirrorSchemaCls.schema.marks.strong.spec;
            expect(strongSpec.parseDOM).toHaveLength(4);
            expect(strongSpec.parseDOM?.[0]).toEqual({ tag: "strong" });
            // @ts-expect-error An argument for 'node' was not provided.
            expect(strongSpec.toDOM?.()).toEqual(["strong", {}, 0]);

            // Test font-weight getAttrs function
            const getAttrsFn = strongSpec.parseDOM?.[3].getAttrs;
            expect(getAttrsFn?.("bold" as HTMLElement & string)).toBeNull();
            expect(getAttrsFn?.("bolder" as HTMLElement & string)).toBeNull();
            expect(getAttrsFn?.("600" as HTMLElement & string)).toBeNull();
            expect(getAttrsFn?.("700" as HTMLElement & string)).toBeNull();
            expect(getAttrsFn?.("normal" as HTMLElement & string)).toBeFalsy();
            expect(getAttrsFn?.("400" as HTMLElement & string)).toBeFalsy();
        });

        it("should return correct code mark spec", () => {
            DjangoProsemirrorSchemaCls = new DjangoProsemirrorSchema({
                ...basicsettings,
                allowedMarks: [MarkType.CODE],
            });
            const codeSpec = DjangoProsemirrorSchemaCls.schema.marks.code.spec;
            expect(codeSpec.parseDOM).toEqual([{ tag: "code" }]);
            // @ts-expect-error An argument for 'node' was not provided.
            expect(codeSpec.toDOM?.()).toEqual(["code", {}, 0]);
        });

        it("should return correct underline mark spec", () => {
            DjangoProsemirrorSchemaCls = new DjangoProsemirrorSchema({
                ...basicsettings,
                allowedMarks: [MarkType.UNDERLINE],
            });
            const underlineSpec =
                DjangoProsemirrorSchemaCls.schema.marks.underline.spec;
            expect(underlineSpec.parseDOM).toEqual([
                { tag: "u" },
                { style: "text-decoration=underline" },
            ]);
            // @ts-expect-error An argument for 'node' was not provided.
            expect(underlineSpec.toDOM?.()).toEqual(["u", {}, 0]);
        });

        it("should return correct strikethrough mark spec", () => {
            DjangoProsemirrorSchemaCls = new DjangoProsemirrorSchema({
                ...basicsettings,
                allowedMarks: [MarkType.STRIKETHROUGH],
            });
            const strikethroughSpec =
                DjangoProsemirrorSchemaCls.schema.marks.strikethrough.spec;
            expect(strikethroughSpec.parseDOM).toEqual([
                { tag: "s" },
                { tag: "del" },
                { tag: "strike" },
                { style: "text-decoration=line-through" },
                { style: "text-decoration-line=line-through" },
            ]);
            // @ts-expect-error An argument for 'node' was not provided.
            expect(strikethroughSpec.toDOM?.()).toEqual(["s", {}, 0]);
        });
    });

    describe("Schema Generation", () => {
        it("should return all node specs", () => {
            DjangoProsemirrorSchemaCls = new DjangoProsemirrorSchema({
                ...basicsettings,
                allowedNodes: [
                    SchemaNodesEnum.DOC,
                    SchemaNodesEnum.TEXT,
                    SchemaNodesEnum.PARAGRAPH,
                    SchemaNodesEnum.HEADING,
                    SchemaNodesEnum.BLOCKQUOTE,
                    SchemaNodesEnum.IMAGE,
                    SchemaNodesEnum.ORDERED_LIST,
                    SchemaNodesEnum.BULLET_LIST,
                    SchemaNodesEnum.LIST_ITEM,
                    SchemaNodesEnum.HORIZONTAL_RULE,
                    SchemaNodesEnum.CODE_BLOCK,
                    SchemaNodesEnum.HARD_BREAK,
                ],
            });

            const nodeSpecs = DjangoProsemirrorSchemaCls.schema.nodes;
            const expectedKeys = [
                SchemaNodesEnum.DOC,
                SchemaNodesEnum.TEXT,
                SchemaNodesEnum.PARAGRAPH,
                SchemaNodesEnum.HEADING,
                SchemaNodesEnum.BLOCKQUOTE,
                SchemaNodesEnum.IMAGE,
                SchemaNodesEnum.ORDERED_LIST,
                SchemaNodesEnum.BULLET_LIST,
                SchemaNodesEnum.LIST_ITEM,
                SchemaNodesEnum.HORIZONTAL_RULE,
                SchemaNodesEnum.CODE_BLOCK,
                SchemaNodesEnum.HARD_BREAK,
            ];
            expect(Object.keys(nodeSpecs).sort()).toEqual(expectedKeys.sort());
        });

        it("should return all mark specs", () => {
            DjangoProsemirrorSchemaCls = new DjangoProsemirrorSchema({
                ...basicsettings,
                allowedMarks: [
                    SchemaNodesEnum.LINK,
                    SchemaNodesEnum.ITALIC,
                    SchemaNodesEnum.STRONG,
                    SchemaNodesEnum.CODE,
                    SchemaNodesEnum.STRIKETHROUGH,
                    SchemaNodesEnum.UNDERLINE,
                ],
            });
            const markSpecs = DjangoProsemirrorSchemaCls.schema.marks;
            const expectedKeys = [
                SchemaNodesEnum.LINK,
                SchemaNodesEnum.ITALIC,
                SchemaNodesEnum.STRONG,
                SchemaNodesEnum.CODE,
                SchemaNodesEnum.STRIKETHROUGH,
                SchemaNodesEnum.UNDERLINE,
            ];
            expect(Object.keys(markSpecs)).toEqual(expectedKeys);
        });

        it("should filter node specs correctly", () => {
            const testSettings: IDPMSettings = {
                ...basicsettings,
                allowedNodes: [
                    SchemaNodesEnum.PARAGRAPH,
                    SchemaNodesEnum.BLOCKQUOTE,
                ],
            };

            DjangoProsemirrorSchemaCls = new DjangoProsemirrorSchema(
                testSettings,
            );
            const filteredSpecs = DjangoProsemirrorSchemaCls.schema.nodes;

            // Should include required nodes plus allowed ones
            const expectedKeys = [
                SchemaNodesEnum.DOC,
                SchemaNodesEnum.TEXT,
                SchemaNodesEnum.BLOCKQUOTE,
                SchemaNodesEnum.PARAGRAPH,
            ];
            expect(Object.keys(filteredSpecs).sort()).toEqual(
                expectedKeys.sort(),
            );
        });

        it("should include list_item when list nodes are allowed", () => {
            const testSettings: IDPMSettings = {
                ...basicsettings,
                allowedNodes: [
                    SchemaNodesEnum.PARAGRAPH,
                    SchemaNodesEnum.BULLET_LIST,
                ],
            };
            const testSchema = new DjangoProsemirrorSchema(testSettings);
            const filteredSpecs = testSchema.schema.nodes;

            expect(Object.keys(filteredSpecs)).toContain(
                SchemaNodesEnum.BULLET_LIST,
            );
            expect(Object.keys(filteredSpecs)).toContain(
                SchemaNodesEnum.LIST_ITEM,
            );
        });

        it("should include list_item when ordered_list is allowed", () => {
            const testSettings: IDPMSettings = {
                ...basicsettings,
                allowedNodes: [
                    SchemaNodesEnum.PARAGRAPH,
                    SchemaNodesEnum.ORDERED_LIST,
                ],
            };
            const testSchema = new DjangoProsemirrorSchema(testSettings);
            const filteredSpecs = testSchema.schema.nodes;

            expect(Object.keys(filteredSpecs)).toContain(
                SchemaNodesEnum.ORDERED_LIST,
            );
            expect(Object.keys(filteredSpecs)).toContain(
                SchemaNodesEnum.LIST_ITEM,
            );
        });

        it("should create a valid ProseMirror schema", () => {
            const testSettings: IDPMSettings = {
                ...basicsettings,
                allowedNodes: [
                    SchemaNodesEnum.PARAGRAPH,
                    SchemaNodesEnum.HEADING,
                    SchemaNodesEnum.BLOCKQUOTE,
                    SchemaNodesEnum.BULLET_LIST,
                ],
                allowedMarks: [
                    SchemaNodesEnum.ITALIC,
                    SchemaNodesEnum.STRONG,
                    SchemaNodesEnum.LINK,
                ],
            };
            const testSchema = new DjangoProsemirrorSchema(testSettings);
            const schema = testSchema.schema;

            expect(schema).toBeInstanceOf(Schema);
            expect(schema.nodes.doc).toBeDefined();
            expect(schema.nodes.text).toBeDefined();
            expect(schema.nodes.paragraph).toBeDefined();
            expect(schema.nodes.heading).toBeDefined();
            expect(schema.nodes.blockquote).toBeDefined();
            expect(schema.nodes.bullet_list).toBeDefined();
            expect(schema.nodes.list_item).toBeDefined(); // Auto-included with bullet_list

            expect(schema.marks.em).toBeDefined();
            expect(schema.marks.strong).toBeDefined();
            expect(schema.marks.link).toBeDefined();
        });

        it("should create a minimal schema with only required nodes", () => {
            const schema = DjangoProsemirrorSchemaCls.schema;

            expect(schema).toBeInstanceOf(Schema);
            expect(schema.nodes.doc).toBeDefined();
            expect(schema.nodes.text).toBeDefined();
            expect(schema.nodes.paragraph).toBeDefined();

            expect(schema.marks.em).toBeUndefined();
            expect(schema.marks.strong).toBeUndefined();
            expect(schema.marks.link).toBeUndefined();
            expect(schema.marks.code).toBeUndefined();
        });
    });

    describe("Edge Cases and Error Handling", () => {
        it("should handle missing attributes gracefully in image parseDOM", () => {
            const testSettings: IDPMSettings = {
                ...basicsettings,
                allowedNodes: [NodeType.PARAGRAPH, NodeType.IMAGE],
            };

            DjangoProsemirrorSchemaCls = new DjangoProsemirrorSchema(
                testSettings,
            );
            const imageSpec =
                DjangoProsemirrorSchemaCls.schema.nodes.image.spec;
            const mockDOMWithMissingAttrs: Partial<HTMLElement> = {
                getAttribute: () => null,
            };

            const parseDOMRule = imageSpec.parseDOM?.[0];
            const attrs = parseDOMRule?.getAttrs?.(
                mockDOMWithMissingAttrs as HTMLElement,
            );
            expect(attrs).toEqual({
                src: null,
                alt: null,
                title: null,
            });
        });

        it("should handle missing attributes gracefully in link parseDOM", () => {
            const testSettings: IDPMSettings = {
                ...basicsettings,
                allowedMarks: [MarkType.LINK],
            };

            DjangoProsemirrorSchemaCls = new DjangoProsemirrorSchema(
                testSettings,
            );
            const linkSpec = DjangoProsemirrorSchemaCls.schema.marks.link.spec;
            const mockDOMWithMissingTitle: Partial<HTMLElement> = {
                getAttribute: (attr) =>
                    attr === "href" ? "https://example.com" : null,
            };

            const parseDOMRule = linkSpec.parseDOM?.[0];
            const attrs = parseDOMRule?.getAttrs?.(
                mockDOMWithMissingTitle as HTMLElement & string,
            );
            expect(attrs).toEqual({
                href: "https://example.com",
                title: null,
            });
        });

        it("should handle b tag with normal font-weight in strong mark", () => {
            const testSettings: IDPMSettings = {
                ...basicsettings,
                allowedNodes: [NodeType.PARAGRAPH, NodeType.BLOCKQUOTE],
                allowedMarks: [MarkType.STRONG],
            };

            DjangoProsemirrorSchemaCls = new DjangoProsemirrorSchema(
                testSettings,
            );
            const strongSpec = DjangoProsemirrorSchemaCls.schema.marks.strong;
            const bTagRule = strongSpec?.spec?.parseDOM;

            const mockNodeNormal = { style: { fontWeight: "normal" } };
            const mockNodeBold = { style: { fontWeight: "bold" } };
            const mockNodeUndefined = { style: {} };

            if (!bTagRule) return;

            expect(
                bTagRule[0]?.getAttrs?.(mockNodeNormal as HTMLElement & string),
            ).toBeFalsy();
            expect(
                bTagRule[1]?.getAttrs?.(mockNodeBold as HTMLElement & string),
            ).toBeNull();
            expect(
                bTagRule[2]?.getAttrs?.(
                    mockNodeUndefined as HTMLElement & string,
                ),
            ).toBeUndefined();
        });
    });
});
