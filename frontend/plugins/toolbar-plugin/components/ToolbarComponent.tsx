import {
    TOOLBAR_CLS,
    ToolbarButton,
    ToolbarDropdown,
    ToolbarModalForm,
    type IToolbarMenuItem,
    type IToolbarPosition,
    type IToolbarProps,
} from "@/plugins/toolbar-plugin";
import { ImageDOMAttrs } from "@/schema/nodes/image";
import { NodeType } from "@/schema/types";
import clsx from "clsx";
import { ComponentChildren, Fragment, RefObject } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { NodeSelection } from "prosemirror-state";

export const ToolbarComponent = <
    D extends Record<string, unknown> = ImageDOMAttrs,
>({
    view,
    target,
    isVisible,
    menuItems,
    onItemClick,
    onModalOpen,
    id,
}: IToolbarProps<D>): ComponentChildren => {
    const viewState = view?.value,
        targetState = target?.value,
        menuItemsState = menuItems?.value,
        isVisibleState = isVisible?.value;

    const [position, setPosition] = useState<IToolbarPosition>({
        top: -9999,
        left: -9999,
    });

    const modalTrigRef = useRef<HTMLElement | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentModalItem, setCurrentModalItem] =
        useState<IToolbarMenuItem<D> | null>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);

    const calculatePosition = (): IToolbarPosition => {
        if (!toolbarRef.current || !isVisibleState || !viewState)
            return { top: -9999, left: -9999 };

        const selection = viewState.state.selection;

        if (!selection) return { top: -9999, left: -9999 };
        let targetRect: DOMRect;

        // Get target element - image or table
        if (
            selection instanceof NodeSelection &&
            selection.node.type.name === NodeType.FILER_IMAGE &&
            id === "image-toolbar"
        ) {
            const nodeDOM = viewState.nodeDOM(selection.from);
            targetRect = (nodeDOM as HTMLElement).getBoundingClientRect();
        } else {
            // Find table (direct selection, cell, header, or text within)
            const $pos = viewState.state.doc?.resolve(selection.from);
            let tablePos = null;

            if (!$pos) return { top: -9999, left: -9999 };

            for (let depth = $pos.depth; depth >= 0; depth--) {
                if ($pos.node(depth).type.name === "table") {
                    tablePos = $pos.start(depth);
                    break;
                }
            }

            if (!tablePos) return { top: -9999, left: -9999 };

            const tableDOM = viewState.nodeDOM(tablePos) as HTMLElement;
            const wrapper = tableDOM.parentElement;
            const tableRect = tableDOM.getBoundingClientRect();
            const wrapperRect = wrapper?.getBoundingClientRect();

            // Use wrapper positioning if available
            targetRect =
                wrapper && wrapperRect
                    ? new DOMRect(
                          wrapperRect.left,
                          tableRect.top,
                          Math.min(wrapperRect.width, tableRect.width),
                          tableRect.height,
                      )
                    : tableRect;
        }
        const toolbarRect = toolbarRef.current.getBoundingClientRect();
        const gap = 8;
        const padding = 16;

        // Position above if space, otherwise below
        const top =
            targetRect.top >= toolbarRect.height + gap
                ? targetRect.top - toolbarRect.height - gap
                : targetRect.bottom + gap;

        // Center horizontally with viewport bounds
        const centerLeft =
            targetRect.left + targetRect.width / 2 - toolbarRect.width / 2;
        const left = Math.max(
            padding,
            Math.min(
                centerLeft,
                window.innerWidth - toolbarRect.width - padding,
            ),
        );

        return {
            top: top + window.scrollY,
            left: left + window.scrollX,
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
        triggerRef: RefObject<HTMLElement>,
        item: IToolbarMenuItem<D>,
    ) => {
        modalTrigRef.current = triggerRef.current;
        setCurrentModalItem(item);
        setIsModalOpen(true);
        onModalOpen?.(triggerRef);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setCurrentModalItem(null);
        modalTrigRef.current = null;
    };

    return (
        <>
            {isModalOpen && currentModalItem?.modalFormProps && (
                <ToolbarModalForm
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    triggerRef={modalTrigRef}
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
