import { IDPMTranslations, LanguageCodeEnum } from "@/conf";
import { en } from "@/conf/i18n/locales/en";
import { nl } from "@/conf/i18n/locales/nl";

export const getTranslations = (language: string): IDPMTranslations => {
    const map: Record<string, IDPMTranslations> = { nl, en };
    return map[language] ?? map.en;
};

export const translate = (text: keyof IDPMTranslations) => {
    const language = document?.documentElement?.lang ?? LanguageCodeEnum.NL;
    const translations = getTranslations(language);
    return translations[text] || text;
};

export { en, nl };
