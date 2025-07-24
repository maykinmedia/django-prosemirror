/**
 * Declation file for bem.js to allow us to use this dependency inside typescript.
 */

declare module "bem.js" {
    export class BEM {
        static getBEMNode(
            block: string,
            element?: string,
            modifier?: string,
        ): HTMLElement | null;

        static getBEMNodes(
            block: string,
            element?: string,
            modifier?: string,
        ): NodeListOf<HTMLElement>;

        static getChildBEMNode(
            node: HTMLElement,
            block: string,
            element?: string,
            modifier?: string,
        ): HTMLElement | null;

        static getChildBEMNodes(
            node: HTMLElement,
            block: string,
            element?: string,
            modifier?: string,
        ): NodeListOf<HTMLElement>;

        static getBEMSelector(
            block: string,
            element?: string,
            modifier?: string,
        ): string;

        static getBEMClassName(
            block: string,
            element?: string,
            modifier?: string,
        ): string;

        static addModifier(
            node: HTMLElement,
            modifier: string,
            exp?: boolean,
        ): void;

        static removeModifier(
            node: HTMLElement,
            modifier: string,
            exp?: boolean,
        ): void;

        static toggleModifier(
            node: HTMLElement,
            modifier: string,
            exp?: boolean,
        ): void;

        static hasModifier(node: HTMLElement, modifier: string): boolean;
    }

    export default BEM;
}
