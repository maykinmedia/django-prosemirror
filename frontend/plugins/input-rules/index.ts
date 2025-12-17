/**
 * This is a controled version of:
 *
 * ```
 * import { buildKeymap } from "prosemirror-example-setup";
 * ```
 *
 * Build with the same code, but this version excludes the heading rules.
 */

import {
    ellipsis,
    emDash,
    inputRules,
    smartQuotes,
} from "prosemirror-inputrules";

import { Schema } from "prosemirror-model";
import {
    blockQuoteRule,
    bulletListRule,
    codeBlockRule,
    headingRule,
    orderedListRule,
} from "./input-rules";
import { DPMSettings } from "@/schema/settings";

/// A set of input rules for creating the basic block quotes, lists,
/// code blocks, and heading.
export function buildInputRules(
    schema: Schema,
    settings: Partial<DPMSettings> = { minHeadingLevel: 1, maxHeadingLevel: 6 },
) {
    const rules = smartQuotes.concat(ellipsis, emDash);
    let type;
    if ((type = schema.nodes.blockquote)) rules.push(blockQuoteRule(type));
    if ((type = schema.nodes.ordered_list)) rules.push(orderedListRule(type));
    if ((type = schema.nodes.bullet_list)) rules.push(bulletListRule(type));
    if ((type = schema.nodes.code_block)) rules.push(codeBlockRule(type));
    if ((type = schema.nodes.heading))
        rules.push(
            headingRule(
                type,
                settings.minHeadingLevel,
                settings.maxHeadingLevel,
            ),
        );
    return inputRules({ rules });
}
