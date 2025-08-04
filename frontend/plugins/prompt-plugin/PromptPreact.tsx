import { render, ComponentChildren } from "preact";
import { Attrs } from "prosemirror-model";
import { EditorView } from "prosemirror-view";

export interface BasePromptConfig {
    title: string;
    dom: EditorView["dom"];
    callback: (attrs: Attrs) => void;
    hideButtons?: boolean;
}

export interface BasePromptProps {
    title: string;
    dom: HTMLElement;
    onDestroy: () => void;
    hideButtons?: boolean;
}

/**
 * Abstract base class for all prompt components
 * Handles the boilerplate of DOM creation, positioning, and cleanup
 */
export abstract class PromptPreact {
    protected readonly container: Element | null;
    protected root: Element | null = null;
    protected config: BasePromptConfig;
    private formRef: HTMLFormElement | null = null;

    constructor(
        config: BasePromptConfig,
        initialValues?: Record<string, string>,
    ) {
        this.container = config.dom.previousElementSibling;
        this.config = config;
        if (this.container) {
            this.root = document.createElement("div");
            this.container.appendChild(this.root);
            this.render(initialValues);
        }
    }

    /**
     * Set the form reference for event handling and setup listeners
     */
    protected setFormRef(formRef: HTMLFormElement | null) {
        this.formRef = formRef;
        if (formRef && !this.cleanupEventListeners) {
            this.setupEventListeners();
        }
    }

    /**
     * Setup common event listeners for all prompts
     */
    private setupEventListeners() {
        const handleOutsideClick = (e: MouseEvent) => {
            if (
                this.formRef &&
                !this.formRef.contains(e.target as HTMLElement)
            ) {
                this.destroy();
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case "Escape":
                    e.preventDefault();
                    this.destroy();
                    break;
                case "Enter":
                    if (!(e.ctrlKey || e.metaKey || e.shiftKey)) {
                        e.preventDefault();
                        this.handleSubmit();
                    }
                    break;
            }
        };

        setTimeout(
            () => window.addEventListener("mousedown", handleOutsideClick),
            50,
        );
        document.addEventListener("keydown", handleKeyDown);

        // Store cleanup functions
        this.cleanupEventListeners = () => {
            window.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }

    private cleanupEventListeners: (() => void) | null = null;

    /**
     * Handle form submission - must be implemented by subclasses
     */
    protected abstract handleSubmit(): void;

    /**
     * Focus the first input element
     */
    protected focusFirstInput() {
        if (this.formRef) {
            const firstInput = this.formRef.elements[0] as HTMLElement;
            firstInput?.focus();
        }
    }

    /**
     * Abstract method that must be implemented by subclasses
     * Should return the JSX content for the prompt
     */
    protected abstract renderContent(
        values?: Record<string, string>,
    ): ComponentChildren;

    /**
     * Render the prompt content
     */
    private render(values?: Record<string, string>) {
        if (this.root) {
            render(this.renderContent(values), this.root);
        }
    }

    /**
     * Destroy the prompt and clean up DOM
     */
    protected destroy() {
        if (this.cleanupEventListeners) {
            this.cleanupEventListeners();
        }
        if (this.root?.parentNode) {
            render(null, this.root);
            this.root.parentNode.removeChild(this.root);
        }
    }

    /**
     * Re-render the prompt (useful for state updates)
     */
    protected update(values?: Record<string, string>) {
        this.render(values);
    }
}
