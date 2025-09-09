import {
    IToolbarMenuItem,
    TOOLBAR_CLS,
    ToolbarIcon,
} from "@/plugins/toolbar-plugin";
import { ImageDOMAttrs } from "@/schema/nodes/image";
import clsx from "clsx";
import { ComponentChildren, RefObject } from "preact";
import { useRef } from "preact/hooks";
import { EditorView } from "prosemirror-view";

interface ToolbarButtonProps<
    D extends Record<string, unknown> = ImageDOMAttrs,
> {
    item: IToolbarMenuItem<D>;
    onItemClick: (item: IToolbarMenuItem<D>) => void;
    view: EditorView;
    onModalOpen?: (
        triggerRef: RefObject<HTMLElement>,
        item: IToolbarMenuItem<D>,
    ) => void;
}

export const ToolbarButton = <
    D extends Record<string, unknown> = ImageDOMAttrs,
>({
    item,
    onItemClick,
    view,
    onModalOpen,
}: ToolbarButtonProps<D>): ComponentChildren => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const active = item.isActive ? item.isActive(view) : false;
    const isEnabled = item.enabled ? item.enabled(view.state) : true;

    const handleClick = () => {
        if (item.modalFormProps && onModalOpen) onModalOpen(buttonRef, item);
        else onItemClick(item);
    };

    return (
        <button
            ref={buttonRef}
            type="button"
            onClick={handleClick}
            disabled={isEnabled === false}
            className={clsx(TOOLBAR_CLS.button, {
                [TOOLBAR_CLS.button__active]: active,
                [TOOLBAR_CLS.button__disabled]: isEnabled === false,
            })}
            title={item.title}
        >
            {item.icon && <ToolbarIcon icon={item.icon} />}
            {item.title && item.visibleTitle && <span>{item.title}</span>}
        </button>
    );
};
