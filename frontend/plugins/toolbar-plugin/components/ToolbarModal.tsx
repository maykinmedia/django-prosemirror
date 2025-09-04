import { useState, useRef, useEffect, useLayoutEffect } from "preact/hooks";
import { translate } from "@/i18n/translations";
import {
    ToolbarModalFormField,
    IToolbarModalFormProps,
} from "@/plugins/toolbar-plugin";
import { ImageDOMAttrs } from "@/schema/nodes/image";

export const ToolbarModalForm = <
    D extends Record<string, unknown> = ImageDOMAttrs,
>({
    isOpen,
    onClose,
    triggerRef,
    formProps,
    view,
}: IToolbarModalFormProps<D>) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: -9999, left: -9999 }); // Start offscreen to prevent flash

    // Form state
    const [formState, setFormState] = useState<D>({} as D);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Update form data when modal opens or initialData changes
    useEffect(() => {
        if (isOpen && formProps.initialData) {
            const fetchData = async () => {
                const data = await formProps.initialData?.(view.state);
                if (data) setFormState(data);
            };
            fetchData();
            calculatePosition();
        } else if (!isOpen) {
            // Clear form data when modal closes
            setFormState({} as D);
            setError(null);
        }
    }, [isOpen, formProps.initialData]);

    // Calculate position relative to trigger button
    const calculatePosition = () => {
        if (!triggerRef?.current || !modalRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const modalRect = modalRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const gap = 8;
        const padding = 16;

        // Default to placing below the trigger
        let top = triggerRect.bottom + gap;
        let left = triggerRect.left;

        // If not enough space below, place above
        if (top + modalRect.height > viewportHeight - padding) {
            top = triggerRect.top - modalRect.height - gap;
        }

        // Ensure modal stays within viewport horizontally
        if (left + modalRect.width > viewportWidth - padding) {
            left = viewportWidth - modalRect.width - padding;
        }
        if (left < padding) {
            left = padding;
        }

        // Add scroll offset to convert viewport coordinates to page coordinates
        top += window.scrollY;
        left += window.scrollX;

        setPosition({ top, left });
    };

    useEffect(() => {
        if (!isOpen) return;

        // Handle clicks outside modal to close it
        const handleClickOutside = (event: MouseEvent) => {
            if (
                modalRef.current &&
                !modalRef.current.contains(event.target as Node) &&
                triggerRef?.current &&
                !triggerRef.current.contains(event.target as Node)
            )
                onClose();
        };

        // Handle escape key to close modal
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscapeKey);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscapeKey);
        };
    }, [isOpen, onClose, triggerRef]);

    // Update position on scroll/resize
    useLayoutEffect(() => {
        if (!isOpen) return;

        // Calculate position immediately before browser paints to prevent flash at 0,0
        calculatePosition();

        let timeoutId: number | null = null;

        const throttledUpdatePosition = () => {
            if (timeoutId) return;

            timeoutId = window.setTimeout(() => {
                calculatePosition();
                timeoutId = null;
            }, 16); // ~60fps
        };

        window.addEventListener("scroll", throttledUpdatePosition, {
            passive: true,
        });
        window.addEventListener("resize", throttledUpdatePosition);

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            window.removeEventListener("scroll", throttledUpdatePosition);
            window.removeEventListener("resize", throttledUpdatePosition);
        };
    }, [isOpen]);

    const handleFormSubmit = async (e: Event) => {
        e.preventDefault();

        setIsSubmitting(true);
        setError(null);

        if (formProps.onSubmit) formProps.onSubmit(view?.state, formState);
        onClose();
        setIsSubmitting(false);
    };

    if (!isOpen) return null;

    return (
        <div
            ref={modalRef}
            className="prompt"
            style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
            <form onSubmit={handleFormSubmit}>
                {formProps.title && <h4>{formProps.title}</h4>}

                {formProps.fields.map((field, index) => (
                    <ToolbarModalFormField
                        key={index}
                        {...field}
                        value={(formState[field.name] || "") as string}
                        onChange={(value: string) => {
                            setFormState((prev) => ({
                                ...prev,
                                [field.name]: value,
                            }));
                        }}
                    />
                ))}

                {error && <div>{error}</div>}

                <div className="prompt-buttons">
                    <button
                        className="prompt-submit"
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {translate("OK")}
                    </button>
                    <button
                        className="prompt-cancel"
                        type="button"
                        onClick={onClose}
                    >
                        {translate("Cancel")}
                    </button>
                </div>
            </form>
        </div>
    );
};
