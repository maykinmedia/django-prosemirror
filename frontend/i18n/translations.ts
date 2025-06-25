import {
    DjangoProsemirrorTranslations,
    LanguageCodeEnum,
} from "../types/types";
import { en } from "./locales/en";
import { nl } from "./locales/nl";

export const getTranslations = (
    language: LanguageCodeEnum,
): DjangoProsemirrorTranslations => {
    const map: Record<LanguageCodeEnum, DjangoProsemirrorTranslations> = {
        nl,
        en,
    };
    return map[language];
};

export const translate = (text: string) => {
    const translations = getTranslations(LanguageCodeEnum.NL);
    return translations[text as keyof DjangoProsemirrorTranslations] || text;
};
