/**
 * These input rules are the same as used in `buildKeymap` from
 * `prosemirror-example-setup`,
 *
 * All are the same functions except:
 * * HeadingRule - accepts now a minLevel from settings.
 */

import {
    textblockTypeInputRule,
    wrappingInputRule,
} from "prosemirror-inputrules";

import { NodeType } from "prosemirror-model";

/// Given a blockquote node type, returns an input rule that turns `"> "`
/// at the start of a textblock into a blockquote.
export function blockQuoteRule(nodeType: NodeType) {
    return wrappingInputRule(/^\s*>\s$/, nodeType);
}

/// Given a list node type, returns an input rule that turns a number
/// followed by a dot at the start of a textblock into an ordered list.
export function orderedListRule(nodeType: NodeType) {
    return wrappingInputRule(
        /^(\d+)\.\s$/,
        nodeType,
        (match) => ({ order: +match[1] }),
        (match, node) => node.childCount + node.attrs.order == +match[1],
    );
}

/// Given a list node type, returns an input rule that turns a bullet
/// (dash, plush, or asterisk) at the start of a textblock into a
/// bullet list.
export function bulletListRule(nodeType: NodeType) {
    return wrappingInputRule(/^\s*([-+*])\s$/, nodeType);
}

/// Given a code block node type, returns an input rule that turns a
/// textblock starting with three backticks into a code block.
export function codeBlockRule(nodeType: NodeType) {
    return textblockTypeInputRule(/^```$/, nodeType);
}

/// Given a node type and a maximum level, creates an input rule that
/// turns up to that number of `#` characters followed by a space at
/// the start of a textblock into a heading whose level corresponds to
/// the number of `#` signs.
export function headingRule(
    nodeType: NodeType,
    minLevel: number = 1,
    maxLevel: number = 6,
) {
    return textblockTypeInputRule(
        new RegExp("^(#{" + minLevel + "," + maxLevel + "})\\s$"),
        nodeType,
        (match) => ({ level: match[1].length }),
    );
}
