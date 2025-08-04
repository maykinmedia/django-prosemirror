import { DOMOutputSpec, TagParseRule } from "prosemirror-model";
import { type ClassMapping, NodeDefinition } from "@/schema/abstract";
import { NodeType } from "@/schema/types";
import { CodeMark } from "../marks/code";

/**
 * Class that returns the spec of an code_block node.
 * Prosemirror processes this node like -> `<pre><code>{ content }<code></pre>`
 */
export class CodeBlockNode extends NodeDefinition {
    /** Code block node. */
    constructor(classes: ClassMapping) {
        super(classes);
    }
    override name = NodeType.CODE_BLOCK;
    override code = true;
    override content = "text*";
    override defining = true;
    override group = "block";
    override marks = "";
    override parseDOM: TagParseRule[] = [
        { tag: "pre", preserveWhitespace: "full" },
    ];
    override toDOM(): DOMOutputSpec {
        const attrs = this.classMapping.apply_to_attrs(
            { spellcheck: false },
            this.name,
        );
        return attrs ? ["pre", attrs, this.codeToDOM] : ["pre", this.codeToDOM];
    }
    /**
     * Helper property to get the correct toDOM of the inner code mark.
     */
    get codeToDOM() {
        return new CodeMark(this.classMapping).toDOM();
    }
}
