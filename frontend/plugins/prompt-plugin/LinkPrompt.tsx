import { ComponentChildren } from "preact";
import { PromptPreact as BasePrompt, BasePromptConfig } from "./PromptPreact";
import { PromptForm } from "./PromptForm";
import { TextField } from "./components/TextField";
import { useEffect, useRef } from "preact/hooks";

export type LinkPromptConfig = BasePromptConfig;

/**
 * Link prompt component for adding/editing links
 */
export class LinkPrompt extends BasePrompt {
    private href: string = "";
    private title: string = "";
    private errors: { href?: string; title?: string } = {};

    constructor(config: LinkPromptConfig) {
        super(config);
    }

    protected handleSubmit(): void {
        if (this.validateForm()) {
            const attrs: Record<string, string> = {
                href: this.href,
            };
            if (this.title.trim()) {
                attrs.title = this.title;
            }

            this.destroy();
            this.config.callback(attrs);
        }
    }

    private validateForm(): boolean {
        this.errors = {};

        if (!this.href.trim()) {
            this.errors.href = "Link URL is required";
        } else if (!this.isValidUrl(this.href)) {
            this.errors.href = "Please enter a valid URL";
        }

        if (Object.keys(this.errors).length > 0) {
            this.update();
        }
        return Object.keys(this.errors).length === 0;
    }

    private isValidUrl(url: string): boolean {
        try {
            // Allow relative URLs or absolute URLs
            if (
                url.startsWith("/") ||
                url.startsWith("./") ||
                url.startsWith("../")
            ) {
                return true;
            }
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    protected renderContent(
        values?: Record<string, string>,
    ): ComponentChildren {
        return (
            <LinkPromptComponent
                config={this.config}
                onDestroy={() => this.destroy()}
                onUpdate={(values) => this.update(values)}
                initialValues={values ?? { href: "", title: "" }}
                onSetFormRef={(ref) => this.setFormRef(ref)}
                onFocusFirstInput={() => this.focusFirstInput()}
                onHrefChange={(value) => {
                    this.href = value;
                    if (this.errors.href) {
                        delete this.errors.href;
                        this.update();
                    }
                }}
                onTitleChange={(value) => {
                    this.title = value;
                    if (this.errors.title) {
                        delete this.errors.title;
                        this.update();
                    }
                }}
                href={this.href}
                title={this.title}
                errors={this.errors}
            />
        );
    }
}

export interface LinkPromptComponentProps {
    config: LinkPromptConfig;
    onDestroy: () => void;
    onUpdate: (initialValues: Record<string, string>) => void;
    initialValues: Record<string, string>;
    onSetFormRef: (ref: HTMLFormElement | null) => void;
    onFocusFirstInput: () => void;
    onHrefChange: (value: string) => void;
    onTitleChange: (value: string) => void;
    href: string;
    title: string;
    errors: { href?: string; title?: string };
}

function LinkPromptComponent({
    config,
    onDestroy,
    onSetFormRef,
    onFocusFirstInput,
    onHrefChange,
    onTitleChange,
    href,
    title,
    errors,
}: LinkPromptComponentProps) {
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
                <TextField
                    label="Link URL"
                    value={href}
                    onChange={onHrefChange}
                    placeholder="https://example.com"
                    required={true}
                    error={errors.href}
                />
                <TextField
                    label="Title (optional)"
                    value={title}
                    onChange={onTitleChange}
                    placeholder="Link title"
                    error={errors.title}
                />
            </PromptForm>
        </div>
    );
}
