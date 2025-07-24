// import { Fragment, Node, NodeType, Schema } from "prosemirror-model";
// import { EditorState, TextSelection } from "prosemirror-state";
// import { tableNodeTypes } from "prosemirror-tables";

// // function createTable(
// //     schema: Schema,
// //     rowsCount: number,
// //     colsCount: number,
// //     withHeaderRow: boolean,
// //     cellContent: Fragment | Node | Array<Node>,
// // ) {
// //     const types = tableNodeTypes(schema);
// //     const headerCells = [];
// //     const cells = [];
// //     const createCell = (
// //         cellType: NodeType,
// //         cellContent: Fragment | Node | Array<Node>,
// //     ) =>
// //         cellContent
// //             ? cellType.createChecked(null, cellContent)
// //             : cellType.createAndFill();

// //     for (let index = 0; index < colsCount; index += 1) {
// //         const cell = createCell(types.cell, cellContent);

// //         if (cell) {
// //             cells.push(cell);
// //         }

// //         if (withHeaderRow) {
// //             const headerCell = createCell(types.header_cell, cellContent);

// //             if (headerCell) {
// //                 headerCells.push(headerCell);
// //             }
// //         }
// //     }

// //     const rows = [];

// //     for (let index = 0; index < rowsCount; index += 1) {
// //         rows.push(
// //             types.row.createChecked(
// //                 null,
// //                 withHeaderRow && index === 0 ? headerCells : cells,
// //             ),
// //         );
// //     }

// //     return types.table.createChecked(null, rows);
// // }

// // function addTable(
// //     state: EditorState,
// //     dispatch,
// //     {
// //         rowsCount,
// //         colsCount,
// //         withHeaderRow,
// //         cellContent,
// //     }: {
// //         rowsCount: number;
// //         colsCount: number;
// //         withHeaderRow: boolean;
// //         cellContent: Fragment | Node | Array<Node>;
// //     },
// // ) {
// //     const offset = state.tr.selection.anchor + 1;

// //     const nodes = createTable(
// //         state.schema,
// //         rowsCount,
// //         colsCount,
// //         withHeaderRow,
// //         cellContent,
// //     );
// //     const tr = state.tr
// //         .replaceSelectionWith(nodes)
// //         .scrollIntoView()
// //         .setSelection(TextSelection.near(state.tr.doc.resolve(offset)));

// //     dispatch(tr);
// // }

// // add table to a new paragraph
// // function addTableToEnd(
// //     state,
// //     dispatch,
// //     {
// //         rowsCount,
// //         colsCount,
// //         withHeaderRow,
// //         cellContent,
// //     }: {
// //         rowsCount: number;
// //         colsCount: number;
// //         withHeaderRow: boolean;
// //         cellContent: Fragment | Node | Array<Node>;
// //     },
// // ) {
// //     let tr = state.tr;

// //     // get block end position
// //     const end = tr.selection.$head.end(1); // param 1 is node deep
// //     const resolvedEnd = tr.doc.resolve(end);

// //     // move cursor to the end, then insert table
// //     const nodes = createTable(
// //         state,
// //         rowsCount,
// //         colsCount,
// //         withHeaderRow,
// //         cellContent,
// //     );
// //     tr.setSelection(TextSelection.near(resolvedEnd));
// //     tr = tr.replaceSelectionWith(nodes).scrollIntoView();

// //     // move cursor into table
// //     const offset = end + 1;
// //     const resolvedPos = tr.doc.resolve(offset);
// //     tr.setSelection(TextSelection.near(resolvedPos));

// //     dispatch(tr);
// // }
