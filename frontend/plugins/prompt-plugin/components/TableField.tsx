import { JSX } from "preact";
import { useState } from "preact/hooks";

export interface TableFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    maxRows?: number;
    maxColumns?: number;
}

/**
 * Table size selection field for prompts
 */
export function TableField({
    label,
    value,
    onChange,
    maxRows = 8,
    maxColumns = 8,
}: TableFieldProps): JSX.Element {
    const [hoveredCell, setHoveredCell] = useState<[number, number] | null>(
        null,
    );

    // Parse current value to get selected dimensions
    const parseValue = (val: string): [number, number] => {
        const match = val.match(/\[(\d+),\s*(\d+)\]/);
        if (match) {
            return [parseInt(match[1], 10), parseInt(match[2], 10)];
        }
        return [0, 0];
    };

    const [selectedRows, selectedCols] = parseValue(value);
    const [displayRows, displayCols] = hoveredCell || [
        selectedRows,
        selectedCols,
    ];

    const handleCellClick = (row: number, col: number) => {
        onChange(`[${row}, ${col}]`);
    };

    const handleCellHover = (row: number, col: number) => {
        setHoveredCell([row, col]);
    };

    const handleMouseLeave = () => {
        setHoveredCell(null);
    };

    const renderGrid = () => {
        const cells = [];
        for (let row = 0; row < maxRows; row++) {
            for (let col = 0; col < maxColumns; col++) {
                const isHighlighted = row <= displayRows && col <= displayCols;
                cells.push(
                    <div
                        key={`${row}-${col}`}
                        className={`table-field__cell ${isHighlighted ? "table-field__cell--highlight" : ""}`}
                        onClick={() => handleCellClick(row, col)}
                        onMouseEnter={() => handleCellHover(row, col)}
                    />,
                );
            }
        }
        return cells;
    };

    return (
        <div className="table-field">
            <label>{label}</label>
            <div
                className="table-field__grid"
                style={{ gridTemplateColumns: `repeat(${maxColumns}, 1fr)` }}
                onMouseLeave={handleMouseLeave}
            >
                {renderGrid()}
            </div>
            <p>
                {displayRows + 1} × {displayCols + 1} table
            </p>
        </div>
    );
}
