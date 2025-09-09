import { useState, useRef, useEffect } from "preact/hooks";
import { TOOLBAR_CLS } from "../config";
import { ToolbarIcon } from "./ToolbarIcon";
import clsx from "clsx";
import { IToolbarMenuItem, IToolbarDropdownProps } from "../";
import { type MouseEventHandler } from "preact/compat";
import { ComponentChildren } from "preact";
import { ImageDOMAttrs } from "@/schema/nodes/image";

export const ToolbarDropdown = <
    D extends Record<string, unknown> = ImageDOMAttrs,
>({
    item,
    view,
    onItemClick,
}: IToolbarDropdownProps<D>): ComponentChildren => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const active = item.isActive ? item.isActive(view) : false;
    const isEnabled = item.command ? item.command(view.state) : true;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) document.addEventListener("mousedown", handleClickOutside);

        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const toggleDropdown: MouseEventHandler<HTMLButtonElement> = (e) => {
        e.preventDefault();
        e.stopPropagation();

        // If this is a simple button (no dropdown items), execute the command
        if (!item.items && item.command) {
            if (item.command(view.state, view.dispatch, view)) {
                view.focus();
            }
            return;
        }

        // Close all other dropdowns first
        const container = (e.target as HTMLElement)?.closest(
            `.${TOOLBAR_CLS.toolbar}`,
        );
        if (container) {
            container
                .querySelectorAll(`.${TOOLBAR_CLS.dropdown__open}`)
                .forEach((el) => {
                    if (el !== dropdownRef.current) {
                        el.classList.remove(TOOLBAR_CLS.dropdown__open);
                    }
                });
        }

        setIsOpen(!isOpen);
    };

    const handleItemClick = (subItem: IToolbarMenuItem<D>) => {
        setIsOpen(false); // Close dropdown after selection
        onItemClick(subItem);
    };

    return (
        <div
            ref={dropdownRef}
            className={clsx(TOOLBAR_CLS.dropdown, {
                [TOOLBAR_CLS.dropdown__open]: isOpen,
            })}
        >
            <button
                className={clsx(
                    TOOLBAR_CLS.button,
                    TOOLBAR_CLS.dropdown_button,
                    {
                        [TOOLBAR_CLS.button__active]: active,
                        [TOOLBAR_CLS.button__disabled]: isEnabled === false,
                    },
                )}
                onClick={toggleDropdown}
                title={item.title}
            >
                {item.icon && <ToolbarIcon icon={item.icon} />}
                {item.title && item.visibleTitle && <span>{item.title}</span>}
            </button>

            {isOpen && item.items && (
                <div className={TOOLBAR_CLS.dropdown_menu}>
                    {item.items.map((subItem) => {
                        // Check individual sub-item states, not parent item states
                        const subItemActive = subItem.isActive
                            ? subItem.isActive(view)
                            : false;
                        const subItemEnabled =
                            view?.state && subItem.command
                                ? subItem.command(view.state)
                                : !subItem.command;
                        return (
                            <div
                                className={clsx(TOOLBAR_CLS.dropdown_item, {
                                    [TOOLBAR_CLS.dropdown_item__active]:
                                        subItemActive,
                                    [TOOLBAR_CLS.dropdown_item__disabled]:
                                        subItemEnabled === false,
                                })}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleItemClick(subItem);
                                }}
                            >
                                {subItem.title}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
