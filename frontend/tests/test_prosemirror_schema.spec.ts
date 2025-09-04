import { describe, it, expect, vi } from "vitest";
import { Mark, Node, Schema, StyleParseRule } from "prosemirror-model";
import { MarkType, NodeType } from "@/schema/types";
import { IDPMSettings, LanguageCodeEnum } from "@/types/types";
import { ClassMapping } from "@/schema/abstract";
import DPMSchema from "@/schema/prosemirror-schema";
import { DPMSettings } from "@/schema/settings";
import { BlockQuoteNode } from "@/schema/nodes/blockquote";
import { CodeBlockNode } from "@/schema/nodes/code_block";
import { HeadingNode } from "@/schema/nodes/heading";
import { ImageNode } from "@/schema/nodes/image";
import { HardBreakNode } from "@/schema/nodes/hard_break";
import { OrderedListNode } from "@/schema/nodes/ordered_list";
import { BulletListNode } from "@/schema/nodes/bullet_list";
import { ListItemNode } from "@/schema/nodes/list_item";
import { TableNode } from "@/schema/nodes/table";
import { TableHeaderNode } from "@/schema/nodes/table_header";
import { TableRowNode } from "@/schema/nodes/table_row";
import { TableCellNode } from "@/schema/nodes/table_cell";
import { ParagraphNode } from "@/schema/nodes/paragraph";
import { HorizontalRuleNode } from "@/schema/nodes/horizontal_rule";

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

describe("DjangoProsemirrorSchema", () => {
    const classMapping = new ClassMapping({});
    const mockNode = {} as Node;
    const mockMark = {} as Mark;
    const settings: IDPMSettings = {
        allowedNodes: [NodeType.PARAGRAPH],
        allowedMarks: [],
        classNames: {},
        history: true,
        debug: false,
        menubar: true,
        language: LanguageCodeEnum.NL,
        floatingMenu: false,
        uploadEndpoint: "/",
    };
    let DPMSchemaCls = new DPMSchema(settings as DPMSettings);

    describe("Required Nodes", () => {
        it("should return correct doc node spec", () => {
            expect(DPMSchemaCls.schema.nodes.doc.spec).toEqual({
                content: "block+",
            });
        });

        it("should return correct text node spec", () => {
            expect(DPMSchemaCls.schema.nodes.text.spec).toEqual({
                group: "inline",
            });
        });

        it("should return correct paragraph node spec", () => {
            const paragraphSpec = DPMSchemaCls.schema.nodes.paragraph.spec;
            expect(paragraphSpec.content).toBe("inline*");
            expect(paragraphSpec.group).toBe("block");
            expect(paragraphSpec.parseDOM).toEqual([{ tag: "p" }]);
            expect(paragraphSpec.toDOM?.(mockNode)).toEqual(["p", {}, 0]);
            deepEqual(new ParagraphNode(classMapping).spec, paragraphSpec);
        });

        it("should return all required nodes", () => {
            const requiredNodes = DPMSchemaCls.schema.nodes;
            expect(Object.keys(requiredNodes)).toEqual([
                NodeType.DOC,
                NodeType.PARAGRAPH,
                NodeType.TEXT,
            ]);
        });
    });

    describe("Block Nodes", () => {
        it("should return correct blockquote node spec", () => {
            settings.allowedNodes = [NodeType.PARAGRAPH, NodeType.BLOCKQUOTE];
            DPMSchemaCls = new DPMSchema(settings as DPMSettings);
            const blockquoteSpec = DPMSchemaCls.schema.nodes.blockquote.spec;
            expect(blockquoteSpec.content).toBe("block+");
            expect(blockquoteSpec.group).toBe("block");
            expect(blockquoteSpec.defining).toBe(true);
            expect(blockquoteSpec.parseDOM).toEqual([{ tag: "blockquote" }]);
            expect(blockquoteSpec.toDOM?.(mockNode)).toEqual([
                "blockquote",
                {},
                0,
            ]);
            deepEqual(new BlockQuoteNode(classMapping).spec, blockquoteSpec);
        });

        it("should return correct horizontal_rule node spec", () => {
            settings.allowedNodes = [
                NodeType.PARAGRAPH,
                NodeType.HORIZONTAL_RULE,
            ];
            DPMSchemaCls = new DPMSchema(settings as DPMSettings);
            const hrSpec = DPMSchemaCls.schema.nodes.horizontal_rule.spec;
            expect(hrSpec.group).toBe("block");
            expect(hrSpec.parseDOM).toEqual([{ tag: "hr" }]);
            expect(hrSpec.toDOM?.(mockNode)).toEqual(["hr", {}]);
            deepEqual(new HorizontalRuleNode(classMapping).spec, hrSpec);
        });

        it("should return correct heading node spec", () => {
            settings.allowedNodes = [NodeType.PARAGRAPH, NodeType.HEADING];
            DPMSchemaCls = new DPMSchema(settings as DPMSettings);

            const headingSpec = DPMSchemaCls.schema.nodes.heading.spec;
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

            // Test toDOM function for h1 - h6.
            for (let i = 1; i <= 6; i++) {
                expect(
                    headingSpec.toDOM?.({
                        attrs: { level: i },
                    } as unknown as Node),
                ).toEqual([`h${i}`, {}, 0]);
            }

            // Test toDOM function without level
            expect(
                headingSpec.toDOM?.({
                    attrs: {},
                } as unknown as Node),
            ).toEqual(["h1", {}, 0]);

            deepEqual(new HeadingNode(classMapping).spec, headingSpec);
        });

        it("should return correct code_block node spec", () => {
            settings.allowedNodes = [NodeType.PARAGRAPH, NodeType.CODE_BLOCK];
            DPMSchemaCls = new DPMSchema(settings as DPMSettings);
            const codeBlockSpec = DPMSchemaCls.schema.nodes.code_block.spec;
            expect(codeBlockSpec.content).toBe("text*");
            expect(codeBlockSpec.marks).toBe("");
            expect(codeBlockSpec.group).toBe("block");
            expect(codeBlockSpec.code).toBe(true);
            expect(codeBlockSpec.defining).toBe(true);
            expect(codeBlockSpec.parseDOM).toEqual([
                { tag: "pre", preserveWhitespace: "full" },
            ]);
            expect(codeBlockSpec.toDOM?.(mockNode)).toEqual([
                "pre",
                { spellcheck: false },
                ["code", {}, 0],
            ]);
            deepEqual(new CodeBlockNode(classMapping).spec, codeBlockSpec);
        });
    });

    describe("Inline Nodes", () => {
        it("should return correct image node spec", () => {
            settings.allowedNodes = [NodeType.PARAGRAPH, NodeType.IMAGE];
            DPMSchemaCls = new DPMSchema(settings as DPMSettings);
            const imageSpec = DPMSchemaCls.schema.nodes.image.spec;
            expect(imageSpec.inline).toBe(true);
            expect(imageSpec.group).toBe("inline");
            expect(imageSpec.draggable).toBe(true);
            expect(imageSpec.attrs).toEqual({
                alt: { default: "", validate: "string|null" },
                caption: { default: null, validate: "string|null" },
                imageId: { default: null, validate: "string" },
                src: { validate: "string" },
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
                dataset: { caption: "caption" },
            };
            const parseDOMRule = imageSpec.parseDOM?.[0];
            const attrs = parseDOMRule?.getAttrs?.(mockDOM as HTMLElement);
            expect(attrs).toEqual({
                src: "test.jpg",
                alt: "Test image",
                title: "Test title",
                caption: "caption",
                imageId: undefined,
            });

            expect(
                imageSpec.toDOM?.({
                    attrs: {
                        src: "test.jpg",
                        alt: "Test alt",
                        title: "Test title",
                        caption: "test caption",
                    },
                } as unknown as Node),
            ).toEqual([
                "img",
                {
                    src: "test.jpg",
                    alt: "Test alt",
                    title: "Test title",
                    "data-caption": "test caption",
                },
            ]);

            deepEqual(new ImageNode(classMapping).spec, imageSpec);
        });

        it("should return correct hard_break node spec", () => {
            settings.allowedNodes = [NodeType.PARAGRAPH, NodeType.HARD_BREAK];
            DPMSchemaCls = new DPMSchema(settings as DPMSettings);
            const hardBreakSpec = DPMSchemaCls.schema.nodes.hard_break.spec;
            expect(hardBreakSpec.inline).toBe(true);
            expect(hardBreakSpec.group).toBe("inline");
            expect(hardBreakSpec.selectable).toBe(false);
            expect(hardBreakSpec.parseDOM).toEqual([{ tag: "br" }]);
            expect(hardBreakSpec.toDOM?.(mockNode)).toEqual(["br", {}]);

            deepEqual(new HardBreakNode(classMapping).spec, hardBreakSpec);
        });
    });

    describe("List Nodes", () => {
        it("should return correct ordered_list node spec", () => {
            settings.allowedNodes = [NodeType.PARAGRAPH, NodeType.ORDERED_LIST];
            DPMSchemaCls = new DPMSchema(settings as DPMSettings);
            const orderedListSpec = DPMSchemaCls.schema.nodes.ordered_list.spec;
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
            expect(orderedListSpec?.toDOM?.(mockNode)).toEqual([
                "ol",
                { start: 1 },
                0,
            ]);
            expect(
                orderedListSpec?.toDOM?.({
                    attrs: { order: 1 },
                } as unknown as Node),
            ).toEqual(["ol", { start: 1 }, 0]);
            expect(
                orderedListSpec?.toDOM?.({
                    attrs: { order: 5 },
                } as unknown as Node),
            ).toEqual(["ol", { start: 5 }, 0]);

            deepEqual(new OrderedListNode(classMapping).spec, orderedListSpec);
        });

        it("should return correct bullet_list node spec", () => {
            settings.allowedNodes = [NodeType.PARAGRAPH, NodeType.BULLET_LIST];
            DPMSchemaCls = new DPMSchema(settings as DPMSettings);
            const bulletListSpec = DPMSchemaCls.schema.nodes.bullet_list.spec;
            expect(bulletListSpec.content).toBe("list_item+");
            expect(bulletListSpec.group).toBe("block");
            expect(bulletListSpec.parseDOM).toEqual([{ tag: "ul" }]);
            expect(bulletListSpec?.toDOM?.(mockNode)).toEqual(["ul", {}, 0]);
            deepEqual(new BulletListNode(classMapping).spec, bulletListSpec);
        });

        it("should return correct list_item node spec", () => {
            settings.allowedNodes = [NodeType.PARAGRAPH, NodeType.LIST_ITEM];
            DPMSchemaCls = new DPMSchema(settings as DPMSettings);
            const listItemSpec = DPMSchemaCls.schema.nodes.list_item.spec;
            expect(listItemSpec.content).toBe("paragraph block*");
            expect(listItemSpec.defining).toBe(true);
            expect(listItemSpec.parseDOM).toEqual([{ tag: "li" }]);
            expect(listItemSpec?.toDOM?.(mockNode)).toEqual(["li", {}, 0]);
            deepEqual(new ListItemNode(classMapping).spec, listItemSpec);
        });
    });

    describe("Table nodes", () => {
        it("should return correct table node spec", () => {
            settings.allowedNodes = [
                NodeType.PARAGRAPH,
                NodeType.TABLE,
                NodeType.TABLE_HEADER,
                NodeType.TABLE_ROW,
                NodeType.TABLE_CELL,
            ];

            DPMSchemaCls = new DPMSchema(settings as DPMSettings);

            // Table
            const tableSpec = DPMSchemaCls.schema.nodes.table.spec;
            const tableNode = new TableNode(classMapping);

            deepEqual(tableNode.spec, tableSpec);
            expect(tableNode.isolating).toBe(true);
            expect(tableNode.toDOM()).toEqual(["table", {}, ["tbody", 0]]);

            // Table header
            const tableHeaderSpec = DPMSchemaCls.schema.nodes.table_header.spec;
            deepEqual(new TableHeaderNode(classMapping).spec, tableHeaderSpec);

            // Table row
            const tableRowSpec = DPMSchemaCls.schema.nodes.table_row.spec;
            deepEqual(new TableRowNode(classMapping).spec, tableRowSpec);

            // Table cell
            const tableCellSpec = DPMSchemaCls.schema.nodes.table_cell.spec;
            deepEqual(new TableCellNode(classMapping).spec, tableCellSpec);
        });

        describe("test table_cell attrs", () => {
            it("should set correct attrs", () => {
                // @ts-expect-error this is a valid statement, but the ts type is incorrect.
                const defaultCell = new Node("table_cell", {
                    colspan: 1,
                    rowspan: 1,
                });
                expect(
                    new TableCellNode(classMapping).toDOM(defaultCell),
                ).toEqual(["td", {}, 0]);

                // Col-span
                // @ts-expect-error this is a valid statement, but the ts type is incorrect.
                const cellWithColspan = new Node("table_cell", {
                    colspan: 4,
                    rowspan: 1,
                });
                expect(
                    new TableCellNode(classMapping).toDOM(cellWithColspan),
                ).toEqual(["td", { colspan: 4 }, 0]);

                // Row-span
                // @ts-expect-error this is a valid statement, but the ts type is incorrect.
                const cellWithRowspan = new Node("table_cell", {
                    colspan: 1,
                    rowspan: 3,
                });
                expect(
                    new TableCellNode(classMapping).toDOM(cellWithRowspan),
                ).toEqual(["td", { rowspan: 3 }, 0]);

                // Both
                // @ts-expect-error this is a valid statement, but the ts type is incorrect.
                const cellWithBothSpans = new Node("table_cell", {
                    colspan: 2,
                    rowspan: 2,
                });
                expect(
                    new TableCellNode(classMapping).toDOM(cellWithBothSpans),
                ).toEqual(["td", { rowspan: 2, colspan: 2 }, 0]);

                // Colwidth
                // @ts-expect-error this is a valid statement, but the ts type is incorrect.
                const cellWithColwidth = new Node("table_cell", {
                    colspan: 2,
                    rowspan: 2,
                    colwidth: ["10"],
                });
                expect(
                    new TableCellNode(classMapping).toDOM(cellWithColwidth),
                ).toEqual([
                    "td",
                    { rowspan: 2, colspan: 2, "data-colwidth": "10" },
                    0,
                ]);
            });

            it("should get correct attrs", () => {
                const node = new TableCellNode(classMapping);

                // element is a string
                const stringAttrs = node.parseDOM[0].getAttrs?.(
                    "" as unknown as HTMLElement,
                );
                expect(stringAttrs).toEqual({});

                // Return only once a value for getAttribute so the next time it returns null.
                const mockElement = {
                    getAttribute: vi.fn().mockReturnValueOnce("10"),
                };
                const attrWithColwidth = node.parseDOM[0].getAttrs?.(
                    mockElement as unknown as HTMLElement,
                );
                expect(attrWithColwidth).toEqual({
                    colspan: 1,
                    colwidth: [10],
                    rowspan: 1,
                });

                const attrWithoutColwidth = node.parseDOM[0].getAttrs?.(
                    mockElement as unknown as HTMLElement,
                );
                expect(attrWithoutColwidth).toEqual({
                    colspan: 1,
                    colwidth: null,
                    rowspan: 1,
                });
            });
        });

        describe("test table_header attrs", () => {
            it("should set correct attrs", () => {
                // @ts-expect-error this is a valid statement, but the ts type is incorrect.
                const defaultCell = new Node("table_header", {
                    colspan: 1,
                    rowspan: 1,
                });
                expect(
                    new TableHeaderNode(classMapping).toDOM(defaultCell),
                ).toEqual(["th", {}, 0]);

                // Col-span
                // @ts-expect-error this is a valid statement, but the ts type is incorrect.
                const cellWithColspan = new Node("table_cell", {
                    colspan: 4,
                    rowspan: 1,
                });
                expect(
                    new TableHeaderNode(classMapping).toDOM(cellWithColspan),
                ).toEqual(["th", { colspan: 4 }, 0]);

                // Row-span
                // @ts-expect-error this is a valid statement, but the ts type is incorrect.
                const cellWithRowspan = new Node("table_cell", {
                    colspan: 1,
                    rowspan: 3,
                });
                expect(
                    new TableHeaderNode(classMapping).toDOM(cellWithRowspan),
                ).toEqual(["th", { rowspan: 3 }, 0]);

                // Both
                // @ts-expect-error this is a valid statement, but the ts type is incorrect.
                const cellWithBothSpans = new Node("table_cell", {
                    colspan: 2,
                    rowspan: 2,
                });
                expect(
                    new TableHeaderNode(classMapping).toDOM(cellWithBothSpans),
                ).toEqual(["th", { rowspan: 2, colspan: 2 }, 0]);

                // Colwidth
                // @ts-expect-error this is a valid statement, but the ts type is incorrect.
                const cellWithColwidth = new Node("table_cell", {
                    colspan: 2,
                    rowspan: 2,
                    colwidth: ["10"],
                });
                expect(
                    new TableHeaderNode(classMapping).toDOM(cellWithColwidth),
                ).toEqual([
                    "th",
                    { rowspan: 2, colspan: 2, "data-colwidth": "10" },
                    0,
                ]);
            });

            it("should get correct attrs", () => {
                const node = new TableHeaderNode(classMapping);

                // element is a string
                const stringAttrs = node.parseDOM[0].getAttrs?.(
                    "" as unknown as HTMLElement,
                );
                expect(stringAttrs).toEqual({});

                // Return only once a value for getAttribute so the next time it returns null.
                const mockElement = {
                    getAttribute: vi.fn().mockReturnValueOnce("10"),
                };
                const attrWithColwidth = node.parseDOM[0].getAttrs?.(
                    mockElement as unknown as HTMLElement,
                );
                expect(attrWithColwidth).toEqual({
                    colspan: 1,
                    colwidth: [10],
                    rowspan: 1,
                });

                const attrWithoutColwidth = node.parseDOM[0].getAttrs?.(
                    mockElement as unknown as HTMLElement,
                );
                expect(attrWithoutColwidth).toEqual({
                    colspan: 1,
                    colwidth: null,
                    rowspan: 1,
                });
            });
        });

        describe("test table_row attrs", () => {
            it("should set correct attrs", () => {
                expect(new TableRowNode(classMapping).toDOM()).toEqual([
                    "tr",
                    {},
                    0,
                ]);
            });
        });
    });

    describe("Mark Specs", () => {
        it("should return correct link mark spec", () => {
            settings.allowedMarks = [MarkType.LINK];
            DPMSchemaCls = new DPMSchema(settings as DPMSettings);

            const linkSpec = DPMSchemaCls.schema.marks.link.spec;
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

            expect(linkSpec?.toDOM?.(mockNode as Mark, true)).toEqual([
                "a",
                { href: "https://example.com", title: "Example" },
                0,
            ]);
        });

        it("should return correct em mark spec", () => {
            settings.allowedMarks = [MarkType.ITALIC];
            DPMSchemaCls = new DPMSchema(settings as DPMSettings);
            const emSpec = DPMSchemaCls.schema.marks.em.spec;
            expect(emSpec.parseDOM).toEqual([
                { tag: "i" },
                { tag: "em" },
                { style: "font-style=italic" },
                {
                    style: "font-style=normal",
                    clearMark: expect.any(Function),
                },
            ]);
            expect(emSpec?.toDOM?.(mockMark, true)).toEqual(["em", {}, 0]);

            // Test clearMark function
            const parseRule: StyleParseRule = emSpec
                .parseDOM?.[3] as StyleParseRule;
            const clearMarkFn = parseRule.clearMark;
            expect(clearMarkFn?.({ type: { name: "em" } } as Mark)).toBe(true);
            expect(clearMarkFn?.({ type: { name: "strong" } } as Mark)).toBe(
                false,
            );
        });

        it("should return correct strong mark spec", () => {
            settings.allowedMarks = [MarkType.STRONG];
            DPMSchemaCls = new DPMSchema(settings as DPMSettings);
            const strongSpec = DPMSchemaCls.schema.marks.strong.spec;
            expect(strongSpec.parseDOM).toHaveLength(4);
            expect(strongSpec.parseDOM?.[0]).toEqual({ tag: "strong" });
            expect(strongSpec.toDOM?.(mockMark, false)).toEqual([
                "strong",
                {},
                0,
            ]);

            // Test getAttrs fn in parseDOM[1]
            const getAttrsFn2 = strongSpec.parseDOM?.[1].getAttrs;
            expect(
                getAttrsFn2?.({
                    style: { fontWeight: "normal" },
                } as unknown as HTMLElement & string),
            ).toBe(false);
            expect(
                getAttrsFn2?.({
                    style: { fontWeight: "bold" },
                } as unknown as HTMLElement & string),
            ).toBe(null);
            expect(
                getAttrsFn2?.({
                    style: { fontWeight: null },
                } as unknown as HTMLElement & string),
            ).toBe(null);

            // Test clearMark fn in parseDOM[2]
            const clearMark = (strongSpec.parseDOM?.[2] as StyleParseRule)
                .clearMark;
            expect(clearMark?.({ type: { name: "strong" } } as Mark)).toBe(
                true,
            );
            expect(clearMark?.({ type: { name: "normal" } } as Mark)).toBe(
                false,
            );

            // Test getAttrs fn in parseDOM[3]
            const getAttrsFn = strongSpec.parseDOM?.[3].getAttrs;
            expect(getAttrsFn?.("bold" as HTMLElement & string)).toBeNull();
            expect(getAttrsFn?.("bolder" as HTMLElement & string)).toBeNull();
            expect(getAttrsFn?.("600" as HTMLElement & string)).toBeNull();
            expect(getAttrsFn?.("700" as HTMLElement & string)).toBeNull();
            expect(getAttrsFn?.("normal" as HTMLElement & string)).toBeFalsy();
            expect(getAttrsFn?.("400" as HTMLElement & string)).toBeFalsy();

            // Test clearMarkFn
        });

        it("should return correct code mark spec", () => {
            settings.allowedMarks = [MarkType.CODE];
            DPMSchemaCls = new DPMSchema(settings as DPMSettings);
            const codeSpec = DPMSchemaCls.schema.marks.code.spec;
            expect(codeSpec.parseDOM).toEqual([{ tag: "code" }]);
            expect(codeSpec.toDOM?.(mockMark, false)).toEqual(["code", {}, 0]);
        });

        it("should return correct underline mark spec", () => {
            settings.allowedMarks = [MarkType.UNDERLINE];
            DPMSchemaCls = new DPMSchema(settings as DPMSettings);
            const underlineSpec = DPMSchemaCls.schema.marks.underline.spec;
            expect(underlineSpec.parseDOM).toEqual([
                { tag: "u" },
                { style: "text-decoration=underline" },
            ]);
            expect(underlineSpec.toDOM?.(mockMark, false)).toEqual([
                "u",
                {},
                0,
            ]);
        });

        it("should return correct strikethrough mark spec", () => {
            settings.allowedMarks = [MarkType.STRIKETHROUGH];
            DPMSchemaCls = new DPMSchema(settings as DPMSettings);
            const strikethroughSpec =
                DPMSchemaCls.schema.marks.strikethrough.spec;
            expect(strikethroughSpec.parseDOM).toEqual([
                { tag: "s" },
                { tag: "del" },
                { tag: "strike" },
                { style: "text-decoration=line-through" },
                { style: "text-decoration-line=line-through" },
            ]);
            expect(strikethroughSpec.toDOM?.(mockMark, false)).toEqual([
                "s",
                {},
                0,
            ]);
        });
    });

    describe("Schema Generation", () => {
        it("should return all node specs", () => {
            settings.allowedNodes = [
                NodeType.DOC,
                NodeType.PARAGRAPH,
                NodeType.TEXT,
                NodeType.BLOCKQUOTE,
                NodeType.BULLET_LIST,
                NodeType.LIST_ITEM,
                NodeType.CODE_BLOCK,
                NodeType.HARD_BREAK,
                NodeType.HEADING,
                NodeType.HORIZONTAL_RULE,
                NodeType.IMAGE,
                NodeType.ORDERED_LIST,
            ];
            DPMSchemaCls = new DPMSchema(settings as DPMSettings);

            const nodeSpecs = DPMSchemaCls.schema.nodes;
            expect(Object.keys(nodeSpecs).length).toBe(
                settings.allowedNodes.length,
            );
            expect(Object.keys(nodeSpecs)).toEqual(settings.allowedNodes);
        });

        it("should return all mark specs", () => {
            settings.allowedMarks = [
                MarkType.LINK,
                MarkType.ITALIC,
                MarkType.STRONG,
                MarkType.CODE,
                MarkType.STRIKETHROUGH,
                MarkType.UNDERLINE,
            ];
            DPMSchemaCls = new DPMSchema(settings as DPMSettings);
            const markSpecs = DPMSchemaCls.schema.marks;
            expect(Object.keys(markSpecs)).toEqual(settings.allowedMarks);
            expect(Object.keys(markSpecs).length).toBe(
                settings.allowedMarks.length,
            );
        });

        it("should filter node specs correctly", () => {
            settings.allowedNodes = [NodeType.PARAGRAPH, NodeType.BLOCKQUOTE];
            DPMSchemaCls = new DPMSchema(settings as DPMSettings);
            const filteredSpecs = DPMSchemaCls.schema.nodes;

            // Should include required nodes plus allowed ones
            const expectedKeys = [
                NodeType.DOC,
                NodeType.TEXT,
                NodeType.BLOCKQUOTE,
                NodeType.PARAGRAPH,
            ];
            expect(Object.keys(filteredSpecs).sort()).toEqual(
                expectedKeys.sort(),
            );
        });

        it("should include list_item when list nodes are allowed", () => {
            settings.allowedNodes = [NodeType.PARAGRAPH, NodeType.BULLET_LIST];
            DPMSchemaCls = new DPMSchema(settings as DPMSettings);
            const filteredSpecs = DPMSchemaCls.schema.nodes;
            expect(Object.keys(filteredSpecs)).toContain(NodeType.BULLET_LIST);
            expect(Object.keys(filteredSpecs)).toContain(NodeType.LIST_ITEM);
        });

        it("should include list_item when ordered_list is allowed", () => {
            const testSettings: IDPMSettings = {
                ...basicsettings,
                allowedNodes: [NodeType.PARAGRAPH, NodeType.ORDERED_LIST],
            };
            const testSchema = new DPMSchema(testSettings as DPMSettings);
            const filteredSpecs = testSchema.schema.nodes;

            expect(Object.keys(filteredSpecs)).toContain(NodeType.ORDERED_LIST);
            expect(Object.keys(filteredSpecs)).toContain(NodeType.LIST_ITEM);
        });

        it("should create a valid ProseMirror schema", () => {
            settings.allowedNodes = [
                NodeType.PARAGRAPH,
                NodeType.HEADING,
                NodeType.BLOCKQUOTE,
                NodeType.BULLET_LIST,
            ];
            settings.allowedMarks = [
                MarkType.ITALIC,
                MarkType.STRONG,
                MarkType.LINK,
            ];
            DPMSchemaCls = new DPMSchema(settings as DPMSettings);
            const testSchema = new DPMSchema(settings as DPMSettings);
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
            settings.allowedNodes = [NodeType.PARAGRAPH];
            expect(DPMSchemaCls).toBeInstanceOf(DPMSchema);
            expect(DPMSchemaCls.schema).toBeInstanceOf(Schema);
            expect(DPMSchemaCls.schema.nodes.doc).toBeDefined();
            expect(DPMSchemaCls.schema.nodes.text).toBeDefined();
            expect(DPMSchemaCls.schema.nodes.paragraph).toBeDefined();
            expect(Object.keys(DPMSchemaCls.schema.nodes).length).toBe(3);
        });
    });

    describe("Edge Cases and Error Handling", () => {
        it("should handle missing attributes gracefully in image parseDOM", () => {
            settings.allowedNodes = [NodeType.PARAGRAPH, NodeType.IMAGE];
            settings.allowedMarks = [];
            DPMSchemaCls = new DPMSchema(settings as DPMSettings);
            const imageSpec = DPMSchemaCls.schema.nodes.image.spec;
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
                caption: null,
                imageId: null,
            });
        });

        it("should handle missing attributes gracefully in link parseDOM", () => {
            settings.allowedNodes = [NodeType.PARAGRAPH];
            settings.allowedMarks = [MarkType.LINK];

            DPMSchemaCls = new DPMSchema(settings as DPMSettings);
            const linkSpec = DPMSchemaCls.schema.marks.link.spec;
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
            settings.allowedNodes = [NodeType.PARAGRAPH, NodeType.BLOCKQUOTE];
            settings.allowedMarks = [MarkType.STRONG];
            DPMSchemaCls = new DPMSchema(settings as DPMSettings);
            const strongSpec = DPMSchemaCls.schema.marks.strong;
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
