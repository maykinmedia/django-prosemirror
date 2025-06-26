/// <reference types="vite/client" />
/// <reference types="vitest" />

// SCSS module declarations
declare module "*.scss" {
    const content: string;
    export default content;
}

declare module "*.sass" {
    const content: string;
    export default content;
}

declare module "*.css" {
    const content: string;
    export default content;
}
