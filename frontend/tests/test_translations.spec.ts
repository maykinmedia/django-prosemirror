import { describe, it, expect, beforeAll } from "vitest";
import { getTranslations, translate } from "../i18n/translations";

import { IDPMTranslations, LanguageCodeEnum } from "../types/types";
import { en } from "../i18n/locales/en";
import { nl } from "../i18n/locales/nl";

describe("i18n/translations", () => {
    beforeAll(() => {
        document.documentElement.lang = "nl";
    });

    describe("getTranslations", () => {
        it("should return English translations when language is EN", () => {
            const translations = getTranslations(LanguageCodeEnum.EN);
            expect(translations).toBe(en);
        });

        it("should return Dutch translations when language is NL", () => {
            const translations = getTranslations(LanguageCodeEnum.NL);
            expect(translations).toBe(nl);
        });

        it("should return English translations for unknown language", () => {
            let translations = getTranslations("unknown-language");
            expect(translations).toBe(en);

            translations = getTranslations("");
            expect(translations).toBe(en);

            translations = getTranslations(undefined!);
            expect(translations).toBe(en);

            translations = getTranslations(null!);
            expect(translations).toBe(en);

            translations = getTranslations([] as unknown as string);
            expect(translations).toBe(en);

            translations = getTranslations({} as LanguageCodeEnum);
            expect(translations).toBe(en);
        });
    });

    describe("translate", () => {
        document.documentElement.lang = "nl";

        it("should return Dutch translation for existing key", () => {
            const result = translate("Insert image");
            expect(result).toBe("Afbeelding invoegen");
        });

        it("should return correct translations", () => {
            // Some random translation
            expect(translate("Toggle strong style")).toBe("Vet aan/uit");
            expect(translate("Toggle emphasis")).toBe("Cursief aan/uit");
            expect(translate("Create a link")).toBe("Link aanmaken");

            expect(translate("Location")).toBe("Locatie");
            expect(translate("Title")).toBe("Titel");
            expect(translate("Description")).toBe("Beschrijving");

            expect(translate("OK")).toBe("OK");
            expect(translate("Cancel")).toBe("Annuleer");

            // Empty - return key
            let result = translate("" as keyof IDPMTranslations);
            expect(result).toBe("");

            // Case sensitive - return key
            result = translate("insert image" as keyof IDPMTranslations); // lowercase
            expect(result).toBe("insert image"); // Should return original since key doesn't exist

            // Language is EN - return translation
            document.documentElement.lang = "en";
            result = translate("Insert image");
            expect(result).toBe("Insert image");

            // Language is NL - return translation
            document.documentElement.lang = "nl";
            result = translate("Insert image");
            expect(result).toBe("Afbeelding invoegen");

            // Language is unsupported - return english translation
            document.documentElement.lang = "fr"; // French not supported
            result = translate("Insert image");
            expect(result).toBe("Insert image"); // Should fallback to English

            // Key does not exist - return key
            const nonExistentKey = "This key does not exist";
            result = translate(nonExistentKey as keyof IDPMTranslations);
            expect(result).toBe(nonExistentKey);
        });
    });

    describe("Translation completeness", () => {
        it("should have translations for all common editor operations", () => {
            // TS `tsc --noEmit` handles the validation of completeness.
            // This test works as a fallback.
            expect(Object.keys(nl)).toEqual(Object.keys(en));
            expect(Object.keys(nl).length).toEqual(Object.keys(en).length);
        });

        it("should have no empty translation values", () => {
            const enValues = Object.values(en);
            const nlValues = Object.values(nl);

            enValues.forEach((value) => {
                expect(value).toBeTruthy();
                expect(typeof value).toBe("string");
                expect((value as string).trim()).not.toBe("");
            });

            nlValues.forEach((value) => {
                expect(value).toBeTruthy();
                expect(typeof value).toBe("string");
                expect((value as string).trim()).not.toBe("");
            });
        });
    });
});
