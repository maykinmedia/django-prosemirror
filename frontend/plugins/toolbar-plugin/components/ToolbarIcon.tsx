import { IconData, IconKeys, icons } from "@/plugins/icons";
import { FunctionComponent as FC } from "preact";

interface ToolbarIconProps {
    icon?: IconKeys;
}

export const ToolbarIcon: FC<ToolbarIconProps> = ({ icon }) => {
    // Return null if no icon is provided
    if (!icon || !icons[icon]) {
        return null;
    }

    const iconData = icons[icon] as IconData;

    const viewBox = iconData.viewPort
        ? iconData.viewPort
        : `0 0 ${iconData.width} ${iconData.height}`;

    return (
        <svg
            width="16"
            height="16"
            viewBox={viewBox}
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d={iconData.path} />
        </svg>
    );
};
