import {
    ClassMapping,
    MarkDefinition,
    NodeDefinition,
} from "@/conf/schema/abstract";
import {
    CodeMark,
    ItalicMark,
    LinkMark,
    StrikeThroughMark,
    StrongMark,
    UnderlineMark,
} from "@/conf/schema/marks";
import {
    BlockQuoteNode,
    BulletListNode,
    CodeBlockNode,
    HardBreakNode,
    HeadingNode,
    HorizontalRuleNode,
    ImageNode,
    ListItemNode,
    OrderedListNode,
    ParagraphNode,
    TableCellNode,
    TableHeaderNode,
    TableNode,
    TableRowNode,
} from "@/conf/schema/nodes";
import { IDPMSettings, MarkType, NodeType } from "@/conf/types";
import { MarkSpec, NodeSpec, Schema } from "prosemirror-model";

export class DPMSchema {
    settings: IDPMSettings;
    classMapping?: ClassMapping;

    constructor(settings: IDPMSettings) {
        this.settings = settings;
        try {
            this._validateSchema();
        } catch (e) {
            console.error(e);
        }
    }

    // Get the specs of all the nodes.
    _createNodes(): Record<NodeType, NodeDefinition> {
        return {
            // Required nodes
            [NodeType.DOC]: { spec: { content: "block+" } } as NodeDefinition,
            [NodeType.TEXT]: { spec: { group: "inline" } } as NodeDefinition,
            [NodeType.PARAGRAPH]: new ParagraphNode(this.classMapping!),

            // Default
            [NodeType.HEADING]: new HeadingNode(this.classMapping!),
            [NodeType.BLOCKQUOTE]: new BlockQuoteNode(this.classMapping!),
            [NodeType.IMAGE]: new ImageNode(this.classMapping!),
            [NodeType.HORIZONTAL_RULE]: new HorizontalRuleNode(
                this.classMapping!,
            ),
            [NodeType.CODE_BLOCK]: new CodeBlockNode(this.classMapping!),
            [NodeType.HARD_BREAK]: new HardBreakNode(this.classMapping!),

            // List
            [NodeType.BULLET_LIST]: new BulletListNode(this.classMapping!),
            [NodeType.ORDERED_LIST]: new OrderedListNode(this.classMapping!),
            [NodeType.LIST_ITEM]: new ListItemNode(this.classMapping!),

            // Table
            [NodeType.TABLE]: new TableNode(this.classMapping!),
            [NodeType.TABLE_CELL]: new TableCellNode(this.classMapping!),
            [NodeType.TABLE_HEADER]: new TableHeaderNode(this.classMapping!),
            [NodeType.TABLE_ROW]: new TableRowNode(this.classMapping!),
        };
    }

    _getNodes(): Record<NodeType, NodeSpec> {
        const nodes = this._createNodes();

        const requiredNodes = {
            [NodeType.DOC]: nodes[NodeType.DOC].spec,
            [NodeType.PARAGRAPH]: nodes[NodeType.PARAGRAPH].spec,
            [NodeType.TEXT]: nodes[NodeType.TEXT].spec,
        } as Record<NodeType, NodeSpec>;

        return this.settings.allowedNodes?.reduce((acc, cur) => {
            // Append node
            if (nodes[cur]) acc[cur] = nodes[cur].spec;

            // Execute some commands to make sure the table is set correct.
            if (cur === NodeType.TABLE) {
                document.execCommand?.("enableObjectResizing", false, "false");
                document.execCommand?.(
                    "enableInlineTableEditing",
                    false,
                    "false",
                );
            }

            // Append list_item if bullet/ordered list is appended
            if (NodeType.ORDERED_LIST === cur || NodeType.BULLET_LIST === cur)
                acc[NodeType.LIST_ITEM] = nodes[NodeType.LIST_ITEM].spec;
            return acc;
        }, requiredNodes);
    }

    // Helper method to get all mark specs
    _createMarks(): Record<MarkType, MarkDefinition> {
        return {
            [MarkType.LINK]: new LinkMark(this.classMapping!),
            [MarkType.STRONG]: new StrongMark(this.classMapping!),
            [MarkType.ITALIC]: new ItalicMark(this.classMapping!),
            [MarkType.CODE]: new CodeMark(this.classMapping!),
            [MarkType.STRIKETHROUGH]: new StrikeThroughMark(this.classMapping!),
            [MarkType.UNDERLINE]: new UnderlineMark(this.classMapping!),
        };
    }

    _getMarks(): Record<MarkType, MarkSpec> {
        const marks = this._createMarks();

        return this.settings.allowedMarks?.reduce(
            (acc, cur) => {
                if (marks[cur]) acc[cur] = marks[cur].spec;
                return acc;
            },
            {} as Record<MarkType, MarkSpec>,
        );
    }
    /**
     * Validate the schema to check if all nodes/marks are valid.
     * @throws {Error} no paragraph included
     * @throws {TypeError} Unsupported nodes/marks inside the schema or allowedNodes/allowedMarks is not an iterable
     */
    _validateSchema() {
        // Validate node types
        if (!this.settings.allowedNodes?.includes(NodeType.PARAGRAPH)) {
            throw new Error(
                `Your list of allowed node types must inlcude ${NodeType.PARAGRAPH}`,
            );
        }

        try {
            for (const nodeType of this.settings.allowedNodes) {
                if (!Object.values(NodeType).includes(nodeType)) {
                    throw new TypeError(
                        `Expected NodeType enum, got ${typeof nodeType}: ${nodeType}`,
                    );
                }
            }
        } catch (error) {
            if (error instanceof TypeError) {
                throw error;
            }
            throw new TypeError(
                "allowedNodeTypes must be an iterable of NodeType enums",
            );
        }

        // Validate mark types
        try {
            for (const markType of this.settings.allowedMarks) {
                if (!Object.values(MarkType).includes(markType)) {
                    throw new TypeError(
                        `Expected MarkType enum, got ${typeof markType}: ${markType}`,
                    );
                }
            }
        } catch (error) {
            if (error instanceof TypeError) {
                throw error;
            }
            throw new TypeError(
                "allowedMarkTypes must be an iterable of MarkType enums",
            );
        }
    }

    /**
     * Validate
     */
    get schema() {
        this.classMapping = new ClassMapping(this.settings?.classNames ?? {});

        return new Schema({
            nodes: this._getNodes(),
            marks: this._getMarks(),
        });
    }
}
