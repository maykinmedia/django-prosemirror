import { ComponentChildren } from "preact";
import { PromptPreact as BasePrompt, BasePromptConfig } from "./PromptPreact";
import { PromptForm } from "./PromptForm";
import { TableField } from "./components/TableField";
import { useEffect, useRef } from "preact/hooks";

export type TablePromptConfig = BasePromptConfig;

/**
 * Table prompt component for inserting tables
 */
export class TablePrompt extends BasePrompt {
    private size: string = "[2, 2]"; // Default 3x3 table (0-indexed)

    constructor(config: TablePromptConfig) {
        super(config);
    }

    protected handleSubmit(): void {
        const attrs: Record<string, string> = {
            size: this.size,
        };

        this.destroy();
        this.config.callback(attrs);
    }

    protected renderContent(
        values?: Record<string, string>,
    ): ComponentChildren {
        return (
            <TablePromptComponent
                config={this.config}
                onDestroy={() => this.destroy()}
                onUpdate={(values) => this.update(values)}
                initialValues={values ?? { size: "[2, 2]" }}
                onSetFormRef={(ref) => this.setFormRef(ref)}
                onFocusFirstInput={() => this.focusFirstInput()}
                onSizeChange={(value) => {
                    this.size = value;
                    // For table prompt, we submit immediately when size changes (like original behavior)
                    setTimeout(() => this.handleSubmit(), 0);
                }}
                size={this.size}
            />
        );
    }
}

export interface TablePromptComponentProps {
    config: TablePromptConfig;
    onDestroy: () => void;
    onUpdate: (initialValues: Record<string, string>) => void;
    initialValues: Record<string, string>;
    onSetFormRef: (ref: HTMLFormElement | null) => void;
    onFocusFirstInput: () => void;
    onSizeChange: (value: string) => void;
    size: string;
}

function TablePromptComponent({
    config,
    onDestroy,
    onSetFormRef,
    onFocusFirstInput,
    onSizeChange,
    size,
}: TablePromptComponentProps) {
    const formRef = useRef<HTMLFormElement>(null);

    // Setup form ref and focus
    useEffect(() => {
        onSetFormRef(formRef.current);
        onFocusFirstInput();
    }, [onSetFormRef, onFocusFirstInput]);

    return (
        <div className="prompt">
            <PromptForm
                ref={formRef}
                title={config.title}
                handleSubmit={() => {}} // Handled by base class
                onDestroy={onDestroy}
                hideButtons={config.hideButtons}
            >
                <TableField
                    label="Table size"
                    value={size}
                    onChange={onSizeChange}
                    maxRows={8}
                    maxColumns={8}
                />
            </PromptForm>
        </div>
    );
}
