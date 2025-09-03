import {
    TOOLBAR_CLS,
    ToolbarButton,
    ToolbarDropdown,
    ToolbarModalForm,
    type IToolbarMenuItem,
    type IToolbarPosition,
    type IToolbarProps,
} from "@/plugins/toolbar-plugin";
import clsx from "clsx";
import { FunctionComponent as FC, Fragment } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { Node } from "prosemirror-model";

export const ToolbarComponent: FC<IToolbarProps> = ({
    view,
    target,
    isVisible,
    menuItems,
    onItemClick,
    onModalOpen,
}) => {
    const viewState = view?.value,
        targetState = target?.value,
        menuItemsState = menuItems?.value,
        isVisibleState = isVisible?.value;

    const [position, setPosition] = useState<IToolbarPosition>({
        top: -9999,
        left: -9999,
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTriggerRef, setModalTriggerRef] =
        useState<React.RefObject<HTMLElement> | null>(null);
    const [currentModalItem, setCurrentModalItem] =
        useState<IToolbarMenuItem | null>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);

    const calculatePosition = (): IToolbarPosition => {
        if (!toolbarRef.current || !isVisibleState || !viewState)
            return { top: -9999, left: -9999 };
        let targetRect: DOMRect;

        // Get target element based on type
        if (targetState instanceof Node) {
            // For ProseMirror nodes, find the actual DOM element
            const from = viewState.state.selection.from;

            // Use ProseMirror's nodeDOM to find the actual HTML element
            const nodeDOM = view.value?.nodeDOM(from);
            if (
                typeof window !== "undefined" &&
                nodeDOM instanceof window.HTMLElement
            ) {
                targetRect = nodeDOM.getBoundingClientRect();
            } else {
                // Fallback: try to find image by src attribute
                const imgElement = viewState.dom.querySelector(
                    `img[src$="${targetState.attrs.src}"]`,
                ) as HTMLElement;
                if (imgElement) {
                    targetRect = imgElement.getBoundingClientRect();
                } else {
                    // Last resort: use ProseMirror coordinates but they won't have proper width
                    const coords = viewState.coordsAtPos(from);
                    targetRect = new DOMRect(
                        coords.left,
                        coords.top,
                        coords.right - coords.left,
                        coords.bottom - coords.top,
                    );
                }
            }
        } else if (
            typeof window !== "undefined" &&
            targetState instanceof window.HTMLElement
        ) {
            targetRect = targetState.getBoundingClientRect();
        } else {
            return { top: -9999, left: -9999 };
        }

        const toolbarRect = toolbarRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;

        let top: number;
        let left: number;

        const toolbarHeight = toolbarRect.height || 40; // fallback for initial render
        const toolbarWidth = toolbarRect.width || 200; // fallback for initial render
        const gap = 8;
        const horizontalPadding = 16;

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
        const maxLeft = viewportWidth - toolbarWidth - horizontalPadding;
        left = Math.max(horizontalPadding, Math.min(left, maxLeft));

        // Add scroll offset to convert viewport coordinates to page coordinates
        top += window.scrollY;
        left += window.scrollX;

        return {
            top,
            left,
        };
    };

    // Update position when dependencies change
    useEffect(() => {
        if (!isVisibleState) {
            setPosition({ top: 0, left: 0 });
            return;
        }

        // Initial position calculation
        const updatePosition = () => {
            const newPosition = calculatePosition();
            setPosition(newPosition);
        };

        // Update immediately
        updatePosition();

        // Also update after a short delay to handle cases where
        // the toolbar dimensions aren't available on first render
        const timeoutId = setTimeout(updatePosition, 10);

        return () => clearTimeout(timeoutId);
    }, [viewState, targetState, isVisibleState]);

    // Update position when toolbar size changes
    useEffect(() => {
        if (!isVisibleState || !toolbarRef.current || !window?.ResizeObserver)
            return;

        const resizeObserver = new ResizeObserver(() => {
            const newPosition = calculatePosition();
            setPosition(newPosition);
        });

        resizeObserver.observe(toolbarRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, [isVisibleState]);

    // Update position on scroll/resize with throttling
    useEffect(() => {
        if (!isVisibleState) return;

        let timeoutId: number | null = null;

        const throttledUpdatePosition = () => {
            if (timeoutId && typeof window !== "undefined") return;

            timeoutId = window?.setTimeout(() => {
                const newPosition = calculatePosition();
                setPosition(newPosition);
                timeoutId = null;
            }, 16); // ~60fps
        };

        if (typeof window !== "undefined" && window) {
            window?.addEventListener("scroll", throttledUpdatePosition, {
                passive: true,
            });
            window?.addEventListener("resize", throttledUpdatePosition);
        }

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            if (typeof window !== "undefined" && window) {
                window?.removeEventListener("scroll", throttledUpdatePosition);
                window?.removeEventListener("resize", throttledUpdatePosition);
            }
        };
    }, [viewState, targetState, isVisibleState]);

    const handleModalOpen = (
        triggerRef: React.RefObject<HTMLElement>,
        item: IToolbarMenuItem,
    ) => {
        setModalTriggerRef(triggerRef);
        setCurrentModalItem(item);
        setIsModalOpen(true);
        onModalOpen?.(triggerRef);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setModalTriggerRef(null);
        setCurrentModalItem(null);
    };

    return (
        <>
            {isModalOpen && currentModalItem?.modalFormProps && (
                <ToolbarModalForm
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    triggerRef={modalTriggerRef}
                    formProps={currentModalItem.modalFormProps}
                    view={viewState!}
                />
            )}
            <div
                ref={toolbarRef}
                className={clsx("generic-toolbar", {
                    ["generic-toolbar--visible"]:
                        isVisibleState && menuItemsState,
                })}
                style={{
                    top: `${position.top}px`,
                    left: `${position.left}px`,
                }}
                hidden={!isVisibleState}
            >
                {menuItemsState?.map((item, index, arr) => (
                    <Fragment key={index}>
                        {item.items ? (
                            <ToolbarDropdown
                                key={index}
                                item={item}
                                view={viewState!}
                                onItemClick={onItemClick}
                            />
                        ) : (
                            <ToolbarButton
                                key={index}
                                item={item}
                                onItemClick={onItemClick}
                                view={viewState!}
                                onModalOpen={handleModalOpen}
                            />
                        )}
                        {arr.length - 1 !== index && (
                            <div
                                key={index}
                                className={TOOLBAR_CLS.separator}
                            />
                        )}
                    </Fragment>
                ))}
            </div>
        </>
    );
};
