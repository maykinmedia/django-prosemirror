import { IDPMTranslations, LanguageCodeEnum } from "../types/types";
import { en } from "./locales/en";
import { nl } from "./locales/nl";

export const getTranslations = (language: string): IDPMTranslations => {
    const map: Record<string, IDPMTranslations> = { nl, en };
    return map[language] ?? map.en;
};

export const translate = (text: keyof IDPMTranslations) => {
    const language = document?.documentElement?.lang ?? LanguageCodeEnum.NL;
    const translations = getTranslations(language);
    return translations[text as keyof IDPMTranslations] || text;
};
