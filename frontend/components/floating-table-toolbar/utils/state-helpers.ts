import { EditorState } from "prosemirror-state";

export function isHeaderRowActive(state: EditorState): boolean {
    const { selection } = state;
    const { $anchor } = selection;
    const cell = $anchor.node(-1);
    return cell && cell.type.name === "table_header";
}

export function isHeaderColumnActive(state: EditorState): boolean {
    const { selection } = state;
    const { $anchor } = selection;
    const table = $anchor.node(-2);
    if (!table || table.type.name !== "table") return false;

    const cellPos = $anchor.pos - $anchor.parentOffset;
    const tableStart = $anchor.start(-2);
    let colIndex = 0;

    for (let i = tableStart; i < cellPos; i++) {
        const node = state.doc.nodeAt(i);
        if (
            node &&
            (node.type.name === "table_cell" ||
                node.type.name === "table_header")
        ) {
            colIndex++;
        }
    }

    return colIndex === 0;
}
