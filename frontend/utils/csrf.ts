import { getCookie } from "./cookie";

declare global {
    interface Window {
        PROSEMIRROR_CSRF_CONFIG?: CSRFConfig;
    }
}

export type CSRFConfig = {
    csrf_token_source:
        | "django_form"
        | "meta_tag"
        | "cookie"
        | "auto"
        | "custom";
    csrf_token_selector?: string;
    csrf_token_attribute?: string;
};

export const getCSRFToken = () => {
    const config = {
        csrf_token_source: "auto",
        csrf_token_attribute: "",
        csrf_token_selector: "",
        ...window.PROSEMIRROR_CSRF_CONFIG,
    };

    return {
        getToken(): string | null {
            switch (config.csrf_token_source) {
                case "django_form":
                    return this.djangoFormToken ?? null;
                case "meta_tag":
                    return this.metaTagToken ?? null;
                case "cookie":
                    return this.cookieToken ?? null;
                case "custom":
                    return this.customToken ?? null;
                case "auto":
                default:
                    return this.autoToken ?? null;
            }
        },

        get djangoFormToken() {
            return document.querySelector<HTMLInputElement>(
                "[name=csrfmiddlewaretoken]",
            )?.value;
        },

        get metaTagToken() {
            return document.querySelector<HTMLMetaElement>(
                "meta[name=csrf-token]",
            )?.content;
        },

        get cookieToken() {
            return getCookie("csrftoken");
        },

        get customToken() {
            return document
                .querySelector<HTMLElement>(config.csrf_token_selector)
                ?.getAttribute(config.csrf_token_attribute);
        },

        get autoToken() {
            return (
                this.djangoFormToken || this.metaTagToken || this.cookieToken
            );
        },
    }.getToken();
};
