import { ToolbarIcon, TOOLBAR_CLS } from "../";
import { FunctionComponent as FC } from "preact";
import clsx from "clsx";
import { EditorView } from "prosemirror-view";
import { ButtonOrDropdown } from "@/components/table-toolbar";

interface ToolbarButtonProps {
    item: ButtonOrDropdown;
    onItemClick: (item: ButtonOrDropdown) => void;
    view: EditorView;
}

export const ToolbarButton: FC<ToolbarButtonProps> = ({
    item,
    onItemClick,
    view,
}) => {
    const active = item.isActive ? item.isActive(view) : false;
    const isEnabled = item.command ? item.command(view.state) : true;
    return (
        <button
            type="button"
            onClick={() => onItemClick(item)}
            disabled={isEnabled === false}
            className={clsx(TOOLBAR_CLS.button, {
                [TOOLBAR_CLS.button__active]: active,
                [TOOLBAR_CLS.button__disabled]: isEnabled === false,
            })}
            title={item.title}
        >
            {item.icon && <ToolbarIcon icon={item.icon} />}
            {item.title && <span>{item.title}</span>}
        </button>
    );
};
