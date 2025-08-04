import { useEffect, useState, useRef } from "preact/hooks";
import { EditorView } from "prosemirror-view";
import { Node } from "prosemirror-model";
import clsx from "clsx";
import { ToolbarButton } from "./ToolbarButton";
import { ToolbarDropdown } from "./ToolbarDropdown";
import { TOOLBAR_CLS } from "../config";
import { ButtonOrDropdown } from "@/components/table-toolbar";

export interface ToolbarPosition {
    top: number;
    left: number;
    visible: boolean;
}

/**
 * A Preact component that handles toolbar positioning and visibility
 */
export interface DynamicToolbarProps {
    view: EditorView;
    target: Node | HTMLElement;
    menuItems: ButtonOrDropdown[];
    isVisible: boolean;
    className?: string;
    onItemClick: (item: ButtonOrDropdown) => void;
    onPositionUpdate?: (position: ToolbarPosition) => void;
}

/**
 * DynamicToolbar component
 */
export function DynamicToolbar({
    view,
    target,
    isVisible,
    onPositionUpdate,
    className,
    menuItems,
    onItemClick,
}: DynamicToolbarProps) {
    const [position, setPosition] = useState<ToolbarPosition>({
        top: 0,
        left: 0,
        visible: false,
    });
    const toolbarRef = useRef<HTMLDivElement>(null);

    const calculatePosition = (): ToolbarPosition => {
        if (!toolbarRef.current || !isVisible) {
            return { top: 0, left: 0, visible: false };
        }

        let targetRect: DOMRect;

        // Get target element based on type
        if (target instanceof Node) {
            // For ProseMirror nodes, find the actual DOM element
            const { from } = view.state.selection;

            // Use ProseMirror's nodeDOM to find the actual HTML element
            const nodeDOM = view.nodeDOM(from);
            if (nodeDOM instanceof HTMLElement) {
                targetRect = nodeDOM.getBoundingClientRect();
            } else {
                // Fallback: try to find image by src attribute
                const imgElement = view.dom.querySelector(
                    `img[src="${target.attrs.src}"]`,
                ) as HTMLElement;
                if (imgElement) {
                    targetRect = imgElement.getBoundingClientRect();
                } else {
                    // Last resort: use ProseMirror coordinates but they won't have proper width
                    const coords = view.coordsAtPos(from);
                    targetRect = new DOMRect(
                        coords.left,
                        coords.top,
                        coords.right - coords.left,
                        coords.bottom - coords.top,
                    );
                }
            }
        } else if (target instanceof HTMLElement) {
            targetRect = target.getBoundingClientRect();
        } else {
            return { top: 0, left: 0, visible: false };
        }

        const toolbarRect = toolbarRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;

        let top: number;
        let left: number;

        const toolbarHeight = toolbarRect.height || 40; // fallback for initial render
        const toolbarWidth = toolbarRect.width || 200; // fallback for initial render
        const gap = 8;

        // Try to place 8px above the image first
        const spaceAbove = targetRect.top;
        if (spaceAbove >= toolbarHeight + gap) {
            // Place 8px above the image
            top = targetRect.top - toolbarHeight - gap;
        } else {
            // Fallback: place 8px below the image
            top = targetRect.bottom + gap;
        }

        // Center horizontally on the image
        const targetCenter = targetRect.left + targetRect.width / 2;
        left = targetCenter - toolbarWidth / 2;

        // Ensure toolbar stays within viewport horizontally with padding
        const horizontalPadding = 16;
        const maxLeft = viewportWidth - toolbarWidth - horizontalPadding;
        left = Math.max(horizontalPadding, Math.min(left, maxLeft));

        // Add scroll offset to convert viewport coordinates to page coordinates
        top += window.scrollY;
        left += window.scrollX;

        return {
            top,
            left,
            visible: isVisible,
        };
    };

    // Update position when dependencies change
    useEffect(() => {
        if (!isVisible) {
            setPosition({ top: 0, left: 0, visible: false });
            return;
        }

        // Initial position calculation
        const updatePosition = () => {
            const newPosition = calculatePosition();
            setPosition(newPosition);
            onPositionUpdate?.(newPosition);
        };

        // Update immediately
        updatePosition();

        // Also update after a short delay to handle cases where
        // the toolbar dimensions aren't available on first render
        const timeoutId = setTimeout(updatePosition, 10);

        return () => clearTimeout(timeoutId);
    }, [view, target, isVisible]);

    // Update position when toolbar size changes
    useEffect(() => {
        if (!isVisible || !toolbarRef.current || !window.ResizeObserver) return;

        const resizeObserver = new ResizeObserver(() => {
            const newPosition = calculatePosition();
            setPosition(newPosition);
            onPositionUpdate?.(newPosition);
        });

        resizeObserver.observe(toolbarRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, [isVisible]);

    // Update position on scroll/resize with throttling
    useEffect(() => {
        if (!isVisible) return;

        let timeoutId: number | null = null;

        const throttledUpdatePosition = () => {
            if (timeoutId) return;

            timeoutId = window.setTimeout(() => {
                const newPosition = calculatePosition();
                setPosition(newPosition);
                onPositionUpdate?.(newPosition);
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
    }, [view, target, isVisible]);

    return (
        <div
            ref={toolbarRef}
            className={clsx(className, {
                [`${className}--visible`]: position.visible && menuItems,
            })}
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
            hidden={!position.visible}
        >
            {menuItems?.map((item, index, arr) => {
                if (item.items) {
                    return (
                        <>
                            <ToolbarDropdown
                                key={index}
                                item={item}
                                view={view}
                                onItemClick={onItemClick}
                            />
                            {arr.length - 1 === index && (
                                <div
                                    key={index}
                                    className={TOOLBAR_CLS.separator}
                                />
                            )}
                        </>
                    );
                }

                // Button type
                return (
                    <>
                        <ToolbarButton
                            key={index}
                            item={item}
                            onItemClick={onItemClick}
                            view={view}
                        />
                        {arr.length - 1 === index && (
                            <div
                                key={index}
                                className={TOOLBAR_CLS.separator}
                            />
                        )}
                    </>
                );
            })}
        </div>
    );
}
