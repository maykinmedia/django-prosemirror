import { describe, it, expect } from "vitest";
import { getTranslations, translate } from "@/i18n/translations";

import {
    DjangoProsemirrorTranslations,
    LanguageCodeEnum,
} from "../types/types";
import { en } from "../i18n/locales/en";
import { nl } from "../i18n/locales/nl";

describe("i18n/translations", () => {
    describe("getTranslations", () => {
        it("should return English translations when language is EN", () => {
            const translations = getTranslations(LanguageCodeEnum.EN);
            expect(translations).toBe(en);
        });

        it("should return Dutch translations when language is NL", () => {
            const translations = getTranslations(LanguageCodeEnum.NL);
            expect(translations).toBe(nl);
        });

        it("should have all required translation keys in English", () => {
            const translations = getTranslations(LanguageCodeEnum.EN);

            // Test some key translations
            expect(translations["Insert image"]).toBe("Insert image");
            expect(translations["Toggle strong style"]).toBe(
                "Toggle strong style",
            );
            expect(translations["Create a link"]).toBe("Create a link");
            expect(translations["OK"]).toBe("OK");
            expect(translations["Cancel"]).toBe("Cancel");
        });

        it("should have all required translation keys in Dutch", () => {
            const translations = getTranslations(LanguageCodeEnum.NL);

            // Test some key translations
            expect(translations["Insert image"]).toBe("Afbeelding invoegen");
            expect(translations["Toggle strong style"]).toBe("Vet aan/uit");
            expect(translations["Create a link"]).toBe("Link aanmaken");
            expect(translations["OK"]).toBe("OK");
            expect(translations["Cancel"]).toBe("Annuleer");
        });

        it("should have same keys in both English and Dutch translations", () => {
            const enKeys = Object.keys(en).sort();
            const nlKeys = Object.keys(nl).sort();

            expect(enKeys).toEqual(nlKeys);
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

    describe("translate", () => {
        it("should return Dutch translation for existing key", () => {
            const result = translate("Insert image");
            expect(result).toBe("Afbeelding invoegen");
        });

        it("should return Dutch translation for menu items", () => {
            expect(translate("Toggle strong style")).toBe("Vet aan/uit");
            expect(translate("Toggle emphasis")).toBe("Cursief aan/uit");
            expect(translate("Create a link")).toBe("Link aanmaken");
        });

        it("should return Dutch translation for form labels", () => {
            expect(translate("Location")).toBe("Locatie");
            expect(translate("Title")).toBe("Titel");
            expect(translate("Description")).toBe("Beschrijving");
        });

        it("should return Dutch translation for button labels", () => {
            expect(translate("OK")).toBe("OK");
            expect(translate("Cancel")).toBe("Annuleer");
        });

        it("should return original text when translation key does not exist", () => {
            const nonExistentKey = "This key does not exist";
            const result = translate(nonExistentKey);
            expect(result).toBe(nonExistentKey);
        });

        it("should handle empty string input", () => {
            const result = translate("");
            expect(result).toBe("");
        });

        it("should be case sensitive", () => {
            const result = translate("insert image"); // lowercase
            expect(result).toBe("insert image"); // Should return original since key doesn't exist
        });

        it("should handle special characters in translation keys", () => {
            const result = translate("Type...");
            expect(result).toBe("Tekstopmaak");
        });

        it("should translate all heading levels", () => {
            expect(translate("Level 1")).toBe("Kop 1");
            expect(translate("Level 2")).toBe("Kop 2");
            expect(translate("Level 3")).toBe("Kop 3");
            expect(translate("Level 4")).toBe("Kop 4");
            expect(translate("Level 5")).toBe("Kop 5");
            expect(translate("Level 6")).toBe("Kop 6");
        });

        it("should translate all heading change commands", () => {
            expect(translate("Change to heading 1")).toBe(
                "Wijzigen naar kop 1",
            );
            expect(translate("Change to heading 2")).toBe(
                "Wijzigen naar kop 2",
            );
            expect(translate("Change to heading 3")).toBe(
                "Wijzigen naar kop 3",
            );
            expect(translate("Change to heading 4")).toBe(
                "Wijzigen naar kop 4",
            );
            expect(translate("Change to heading 5")).toBe(
                "Wijzigen naar kop 5",
            );
            expect(translate("Change to heading 6")).toBe(
                "Wijzigen naar kop 6",
            );
        });

        it("should translate list operations", () => {
            expect(translate("Wrap in bullet list")).toBe(
                "In lijst met opsommingstekens",
            );
            expect(translate("Wrap in ordered list")).toBe(
                "In genummerde lijst",
            );
            expect(translate("Join with above block")).toBe(
                "Samenvoegen met vorige blok",
            );
            expect(translate("Lift out of enclosing block")).toBe(
                "Uit huidig blok halen",
            );
        });

        it("should translate text formatting operations", () => {
            expect(translate("Toggle underline")).toBe("Onderstrepen aan/uit");
            expect(translate("Toggle strikethrough")).toBe(
                "Doorstrepen aan/uit",
            );
            expect(translate("Toggle code font")).toBe(
                "Code lettertype aan/uit",
            );
        });
    });

    describe("Translation completeness", () => {
        it("should have translations for all common editor operations", () => {
            const commonOperations: Array<keyof DjangoProsemirrorTranslations> =
                [
                    "Undo last change",
                    "Redo last undone change",
                    "Select parent node",
                    "Insert horizontal rule",
                    "Change to paragraph",
                    "Change to code block",
                    "Wrap in block quote",
                ];

            commonOperations.forEach((operation) => {
                const enTranslation = en[operation];
                const nlTranslation = nl[operation];

                expect(enTranslation).toBeTruthy();
                expect(nlTranslation).toBeTruthy();
                expect(typeof enTranslation).toBe("string");
                expect(typeof nlTranslation).toBe("string");
            });
        });
    });
});
