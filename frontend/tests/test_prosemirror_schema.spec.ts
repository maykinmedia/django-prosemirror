import { describe, it, expect } from "vitest";
import { Mark, Node, Schema, StyleParseRule } from "prosemirror-model";
import DjangoProsemirrorSchema from "@/schema/prosemirror-schema";
import { DjangoProsemirrorSettings, LanguageCodeEnum } from "@/types/types";
import { SchemaNodesEnum } from "@/schema/choices";

// Helper function for deep comparison of objects
const deepEqual = (actual: unknown, expected: unknown) => {
    expect(JSON.stringify(actual, null, 2)).toEqual(
        JSON.stringify(expected, null, 2),
    );
};

const basicsettings: DjangoProsemirrorSettings = {
    allowedNodes: [],
    classNames: {},
    history: true,
    debug: false,
    menubar: true,
    language: LanguageCodeEnum.NL,
    floatingMenu: false,
};

const DjangoProsemirrorSchemaCls = new DjangoProsemirrorSchema(basicsettings);

describe("DjangoProsemirrorSchema", () => {
    describe("Required Nodes", () => {
        it("should return correct doc node spec", () => {
            const docSpec = DjangoProsemirrorSchemaCls.doc;
            expect(docSpec).toEqual({
                content: "block+",
            });
        });

        it("should return correct text node spec", () => {
            const textSpec = DjangoProsemirrorSchemaCls.text;
            expect(textSpec).toEqual({
                group: "inline",
            });
        });

        it("should return correct paragraph node spec", () => {
            const paragraphSpec = DjangoProsemirrorSchemaCls.paragraph;
            expect(paragraphSpec.content).toBe("inline*");
            expect(paragraphSpec.group).toBe("block");
            expect(paragraphSpec.parseDOM).toEqual([{ tag: "p" }]);
            expect(paragraphSpec.toDOM?.()).toEqual(["p", 0]);
        });

        it("should return all required nodes", () => {
            const requiredNodes = DjangoProsemirrorSchemaCls.getRequiredNodes;
            expect(Object.keys(requiredNodes)).toEqual([
                SchemaNodesEnum.DOC,
                SchemaNodesEnum.TEXT,
                SchemaNodesEnum.PARAGRAPH,
            ]);
            expect(requiredNodes.doc).toEqual(DjangoProsemirrorSchemaCls.doc);
            expect(requiredNodes.text).toEqual(DjangoProsemirrorSchemaCls.text);
            deepEqual(
                requiredNodes.paragraph,
                DjangoProsemirrorSchemaCls.paragraph,
            );
        });
    });

    describe("Block Nodes", () => {
        it("should return correct blockquote node spec", () => {
            const blockquoteSpec = DjangoProsemirrorSchemaCls.blockquote;
            expect(blockquoteSpec.content).toBe("block+");
            expect(blockquoteSpec.group).toBe("block");
            expect(blockquoteSpec.defining).toBe(true);
            expect(blockquoteSpec.parseDOM).toEqual([{ tag: "blockquote" }]);
            expect(blockquoteSpec.toDOM?.()).toEqual(["blockquote", 0]);
        });

        it("should return correct horizontal_rule node spec", () => {
            const hrSpec = DjangoProsemirrorSchemaCls.horizontal_rule;
            expect(hrSpec.group).toBe("block");
            expect(hrSpec.parseDOM).toEqual([{ tag: "hr" }]);
            expect(hrSpec.toDOM?.()).toEqual(["hr"]);
        });

        it("should return correct heading node spec", () => {
            const headingSpec = DjangoProsemirrorSchemaCls.heading;
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
            expect(headingSpec.toDOM?.(mockNode as Node)).toEqual(["h3", 0]);

            // Test toDOM function
            mockNode = { attrs: { level: 2 } };
            expect(headingSpec.toDOM?.(mockNode as Node)).toEqual(["h2", 0]);

            // Test toDOM function
            mockNode = { attrs: { level: 6 } };
            expect(headingSpec.toDOM?.(mockNode as Node)).toEqual(["h6", 0]);
        });

        it("should return correct code_block node spec", () => {
            const codeBlockSpec = DjangoProsemirrorSchemaCls.code_block;
            expect(codeBlockSpec.content).toBe("text*");
            expect(codeBlockSpec.marks).toBe("");
            expect(codeBlockSpec.group).toBe("block");
            expect(codeBlockSpec.code).toBe(true);
            expect(codeBlockSpec.defining).toBe(true);
            expect(codeBlockSpec.parseDOM).toEqual([
                { tag: "pre", preserveWhitespace: "full" },
            ]);
            expect(codeBlockSpec.toDOM?.()).toEqual([
                "pre",
                { spellcheck: false },
                ["code", 0],
            ]);
        });
    });

    describe("Inline Nodes", () => {
        it("should return correct image node spec", () => {
            const imageSpec = DjangoProsemirrorSchemaCls.image;
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
            const hardBreakSpec = DjangoProsemirrorSchemaCls.hard_break;
            expect(hardBreakSpec.inline).toBe(true);
            expect(hardBreakSpec.group).toBe("inline");
            expect(hardBreakSpec.selectable).toBe(false);
            expect(hardBreakSpec.parseDOM).toEqual([{ tag: "br" }]);
            expect(hardBreakSpec.toDOM?.()).toEqual(["br"]);
        });
    });

    describe("List Nodes", () => {
        it("should return correct ordered_list node spec", () => {
            const orderedListSpec = DjangoProsemirrorSchemaCls.ordered_list;
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
            ).toEqual(["ol", 0]);
            expect(
                orderedListSpec?.toDOM?.(nodeWithCustomOrder as Node),
            ).toEqual(["ol", { start: 5 }, 0]);
        });

        it("should return correct unordered_list node spec", () => {
            const bulletListSpec = DjangoProsemirrorSchemaCls.unordered_list;
            expect(bulletListSpec.content).toBe("list_item+");
            expect(bulletListSpec.group).toBe("block");
            expect(bulletListSpec.parseDOM).toEqual([{ tag: "ul" }]);
            expect(bulletListSpec?.toDOM?.()).toEqual(["ul", 0]);
        });

        it("should return correct list_item node spec", () => {
            const listItemSpec = DjangoProsemirrorSchemaCls.list_item;
            expect(listItemSpec.content).toBe("paragraph block*");
            expect(listItemSpec.defining).toBe(true);
            expect(listItemSpec.parseDOM).toEqual([{ tag: "li" }]);
            expect(listItemSpec?.toDOM?.()).toEqual(["li", 0]);
        });
    });

    describe("Mark Specs", () => {
        it("should return correct link mark spec", () => {
            const linkSpec = DjangoProsemirrorSchemaCls.link;
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
            expect(linkSpec?.toDOM?.(mockNode as Mark)).toEqual([
                "a",
                { href: "https://example.com", title: "Example" },
                0,
            ]);
        });

        it("should return correct em mark spec", () => {
            const emSpec = DjangoProsemirrorSchemaCls.em;
            expect(emSpec.parseDOM).toEqual([
                { tag: "i" },
                { tag: "em" },
                { style: "font-style=italic" },
                {
                    style: "font-style=normal",
                    clearMark: expect.any(Function),
                },
            ]);
            expect(emSpec?.toDOM?.()).toEqual(["em", 0]);

            // Test clearMark function
            const clearMarkFn = (emSpec?.parseDOM?.[3] as StyleParseRule)
                .clearMark;
            const mockMark = { type: { name: "em" } };
            const mockOtherMark = { type: { name: "strong" } };
            expect(clearMarkFn?.(mockMark as Mark)).toBe(true);
            expect(clearMarkFn?.(mockOtherMark as Mark)).toBe(false);
        });

        it("should return correct strong mark spec", () => {
            const strongSpec = DjangoProsemirrorSchemaCls.strong;
            expect(strongSpec.parseDOM).toHaveLength(4);
            expect(strongSpec.parseDOM?.[0]).toEqual({ tag: "strong" });
            expect(strongSpec.toDOM?.()).toEqual(["strong", 0]);

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
            const codeSpec = DjangoProsemirrorSchemaCls.code;
            expect(codeSpec.parseDOM).toEqual([{ tag: "code" }]);
            expect(codeSpec.toDOM?.()).toEqual(["code", 0]);
        });

        it("should return correct underline mark spec", () => {
            const underlineSpec = DjangoProsemirrorSchemaCls.underline;
            expect(underlineSpec.parseDOM).toEqual([
                { tag: "u" },
                { style: "text-decoration=underline" },
            ]);
            expect(underlineSpec.toDOM?.()).toEqual(["u", 0]);
        });

        it("should return correct strikethrough mark spec", () => {
            const strikethroughSpec = DjangoProsemirrorSchemaCls.strikethrough;
            expect(strikethroughSpec.parseDOM).toEqual([
                { tag: "s" },
                { tag: "del" },
                { tag: "strike" },
                { style: "text-decoration=line-through" },
                { style: "text-decoration-line=line-through" },
            ]);
            expect(strikethroughSpec.toDOM?.()).toEqual(["s", 0]);
        });
    });

    describe("Schema Generation", () => {
        it("should return all node specs", () => {
            const nodeSpecs = DjangoProsemirrorSchemaCls.getNodeSpecs;
            const expectedKeys = [
                SchemaNodesEnum.DOC,
                SchemaNodesEnum.TEXT,
                SchemaNodesEnum.PARAGRAPH,
                SchemaNodesEnum.HEADING,
                SchemaNodesEnum.BLOCKQUOTE,
                SchemaNodesEnum.IMAGE,
                SchemaNodesEnum.ORDERED_LIST,
                SchemaNodesEnum.UNORDERED_LIST,
                SchemaNodesEnum.LIST_ITEM,
                SchemaNodesEnum.HORIZONTAL_RULE,
                SchemaNodesEnum.CODE_BLOCK,
                SchemaNodesEnum.HARD_BREAK,
            ];
            expect(Object.keys(nodeSpecs)).toEqual(expectedKeys);
        });

        it("should return all mark specs", () => {
            const markSpecs = DjangoProsemirrorSchemaCls.getMarkSpecs;
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
            const testSettings: DjangoProsemirrorSettings = {
                ...basicsettings,
                allowedNodes: [
                    SchemaNodesEnum.PARAGRAPH,
                    SchemaNodesEnum.BLOCKQUOTE,
                ],
            };
            const testSchema = new DjangoProsemirrorSchema(testSettings);
            const filteredSpecs = testSchema.getFilteredNodeSpecs;

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
            const testSettings: DjangoProsemirrorSettings = {
                ...basicsettings,
                allowedNodes: [SchemaNodesEnum.UNORDERED_LIST],
            };
            const testSchema = new DjangoProsemirrorSchema(testSettings);
            const filteredSpecs = testSchema.getFilteredNodeSpecs;

            expect(Object.keys(filteredSpecs)).toContain(
                SchemaNodesEnum.UNORDERED_LIST,
            );
            expect(Object.keys(filteredSpecs)).toContain(
                SchemaNodesEnum.LIST_ITEM,
            );
        });

        it("should include list_item when ordered_list is allowed", () => {
            const testSettings: DjangoProsemirrorSettings = {
                ...basicsettings,
                allowedNodes: [SchemaNodesEnum.ORDERED_LIST],
            };
            const testSchema = new DjangoProsemirrorSchema(testSettings);
            const filteredSpecs = testSchema.getFilteredNodeSpecs;

            expect(Object.keys(filteredSpecs)).toContain(
                SchemaNodesEnum.ORDERED_LIST,
            );
            expect(Object.keys(filteredSpecs)).toContain(
                SchemaNodesEnum.LIST_ITEM,
            );
        });

        it("should return all specs when empty array is passed to getFilteredNodeSpecs", () => {
            const filteredSpecs =
                DjangoProsemirrorSchemaCls.getFilteredNodeSpecs;
            const allSpecs = DjangoProsemirrorSchemaCls.getNodeSpecs;
            expect(Object.keys(filteredSpecs).sort()).toEqual(
                Object.keys(allSpecs).sort(),
            );

            // Check individual specs match by comparing JSON strings to handle functions
            (Object.keys(allSpecs) as SchemaNodesEnum[]).forEach((key) => {
                deepEqual(filteredSpecs[key], allSpecs[key]);
            });
        });

        it("should filter mark specs correctly", () => {
            const testSettings: DjangoProsemirrorSettings = {
                ...basicsettings,
                allowedNodes: [SchemaNodesEnum.ITALIC, SchemaNodesEnum.STRONG],
            };
            const testSchema = new DjangoProsemirrorSchema(testSettings);
            const filteredSpecs = testSchema.getFilteredMarkSpecs;

            expect(Object.keys(filteredSpecs)).toEqual([
                SchemaNodesEnum.ITALIC,
                SchemaNodesEnum.STRONG,
            ]);
            deepEqual(filteredSpecs.em, testSchema.em);
            deepEqual(filteredSpecs.strong, testSchema.strong);
        });

        it("should return all mark specs when empty array is passed to getFilteredMarkSpecs", () => {
            const filteredSpecs =
                DjangoProsemirrorSchemaCls.getFilteredMarkSpecs;
            const allSpecs = DjangoProsemirrorSchemaCls.getMarkSpecs;
            expect(Object.keys(filteredSpecs).sort()).toEqual(
                Object.keys(allSpecs).sort(),
            );

            // Check individual specs match by comparing JSON strings to handle functions
            (Object.keys(allSpecs) as SchemaNodesEnum[]).forEach((key) => {
                deepEqual(filteredSpecs[key], allSpecs[key]);
            });
        });

        it("should create a valid ProseMirror schema", () => {
            const testSettings: DjangoProsemirrorSettings = {
                ...basicsettings,
                allowedNodes: [
                    SchemaNodesEnum.HEADING,
                    SchemaNodesEnum.BLOCKQUOTE,
                    SchemaNodesEnum.UNORDERED_LIST,
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
            expect(schema.nodes.unordered_list).toBeDefined();
            expect(schema.nodes.list_item).toBeDefined(); // Auto-included with unordered_list

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

            // Should have all available marks since no marks were filtered
            expect(schema.marks.em).toBeDefined();
            expect(schema.marks.strong).toBeDefined();
            expect(schema.marks.link).toBeDefined();
            expect(schema.marks.code).toBeDefined();
        });
    });

    describe("Edge Cases and Error Handling", () => {
        it("should handle missing attributes gracefully in image parseDOM", () => {
            const imageSpec = DjangoProsemirrorSchemaCls.image;
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
            const linkSpec = DjangoProsemirrorSchemaCls.link;
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
            const strongSpec = DjangoProsemirrorSchemaCls.strong;
            const bTagRule = strongSpec.parseDOM?.[1];

            const mockNodeNormal = { style: { fontWeight: "normal" } };
            const mockNodeBold = { style: { fontWeight: "bold" } };
            const mockNodeUndefined = { style: {} };

            expect(
                bTagRule?.getAttrs?.(mockNodeNormal as HTMLElement & string),
            ).toBeFalsy();
            expect(
                bTagRule?.getAttrs?.(mockNodeBold as HTMLElement & string),
            ).toBeNull();
            expect(
                bTagRule?.getAttrs?.(mockNodeUndefined as HTMLElement & string),
            ).toBeNull();
        });
    });
});
