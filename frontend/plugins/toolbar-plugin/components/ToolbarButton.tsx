import {
    IToolbarMenuItem,
    TOOLBAR_CLS,
    ToolbarIcon,
} from "@/plugins/toolbar-plugin";
import clsx from "clsx";
import { FunctionComponent as FC } from "preact";
import { useRef } from "preact/hooks";
import { EditorView } from "prosemirror-view";

interface ToolbarButtonProps {
    item: IToolbarMenuItem;
    onItemClick: (item: IToolbarMenuItem) => void;
    view: EditorView;
    onModalOpen?: (
        triggerRef: React.RefObject<HTMLElement>,
        item: IToolbarMenuItem,
    ) => void;
}

export const ToolbarButton: FC<ToolbarButtonProps> = ({
    item,
    onItemClick,
    view,
    onModalOpen,
}) => {
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
