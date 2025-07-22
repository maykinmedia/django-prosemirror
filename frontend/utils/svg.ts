import { IconData } from "@/plugins/icons";

export function createSVG(iconData?: IconData) {
    if (!iconData) return;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", iconData.width.toString());
    svg.setAttribute("height", iconData.height.toString());
    svg.setAttribute("viewBox", `0 0 ${iconData.width} ${iconData.height}`);
    svg.setAttribute("fill", "currentColor");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", iconData.path);

    svg.appendChild(path);
    return svg;
}
