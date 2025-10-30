import { Meta, StoryObj } from "@storybook/preact-vite";
import { MarkType, NodeType } from "../frontend/schema/types";
import { defaultArgs, defaultMeta } from "./constants";
import { DjangoProsemirrorWidget } from "./Widget";

const meta: Meta<typeof DjangoProsemirrorWidget> = {
    ...defaultMeta,
    title: "Django ProseMirror/Examples",
};

export default meta;

type Story = StoryObj<typeof DjangoProsemirrorWidget>;

// Complete Web Page - Grandma's Secret Spaghetti Recipe (Dutch)
export const FullWebPageEditor: Story = {
    args: {
        ...defaultArgs,
        storyTitle: "Complete Recipe Blog Post",
        storyDescription:
            "Full-featured editor with all nodes and marks enabled for rich content creation.",
        storyInteractions: [
            "Use all formatting tools: headings, lists, blockquotes, tables",
            "Insert images with captions and alt text",
            "Create links to external resources",
            "Format text with bold, italic, code, and other marks",
            "Build complex content structures with nested elements",
        ],
        // Enable all nodes for a complete web page experience
        initialContent: {
            type: "doc",
            content: [
                {
                    type: "heading",
                    attrs: { level: 1 },
                    content: [
                        {
                            type: "text",
                            text: "Oma's Geheime Spaghetti Recept",
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Gepubliceerd op 15 maart 2024 door ",
                        },
                        {
                            type: "text",
                            marks: [{ type: "strong" }],
                            text: "Maria van der Berg",
                        },
                        {
                            type: "text",
                            text: " | Bereidingstijd: 45 minuten | Porties: 4-6",
                        },
                    ],
                },
                {
                    type: "horizontal_rule",
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Na 60 jaar bewaren, deel ik eindelijk oma's ",
                        },
                        {
                            type: "text",
                            marks: [{ type: "em" }],
                            text: "legendarische",
                        },
                        {
                            type: "text",
                            text: " spaghetti recept met jullie. Dit recept is al generaties lang in onze familie en wordt beschouwd als de ",
                        },
                        {
                            type: "text",
                            marks: [{ type: "strong" }],
                            text: "allerlekkerste spaghetti",
                        },
                        {
                            type: "text",
                            text: " die je ooit zult proeven!",
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "image",
                            attrs: {
                                src: "https://picsum.photos/600/400?random=5",
                                alt: "Dampende spaghetti met verse tomatensaus",
                                title: "Oma's Geheime Spaghetti",
                                caption:
                                    "Het perfecte familiediner - precies zoals oma het maakte",
                                imageId: "grandmas-spaghetti",
                            },
                        },
                    ],
                },
                {
                    type: "heading",
                    attrs: { level: 2 },
                    content: [
                        {
                            type: "text",
                            text: "Waarom Dit Recept Zo Bijzonder Is",
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Oma's spaghetti was niet zomaar pasta met saus. Het geheim zat in de liefde en de speciale technieken die ze gebruikte:",
                        },
                    ],
                },
                {
                    type: "bullet_list",
                    content: [
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            marks: [{ type: "strong" }],
                                            text: "Verse ingrediënten",
                                        },
                                        {
                                            type: "text",
                                            text: " - alleen de beste tomaten van de lokale markt",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            marks: [{ type: "strong" }],
                                            text: "Langzaam sudderen",
                                        },
                                        {
                                            type: "text",
                                            text: " - minimaal 3 uur voor de perfecte smaak",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            marks: [{ type: "strong" }],
                                            text: "Het geheime ingrediënt",
                                        },
                                        {
                                            type: "text",
                                            text: " - een snufje kaneel (psst, vertel het niet door!)",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "blockquote",
                    content: [
                        {
                            type: "paragraph",
                            content: [
                                {
                                    type: "text",
                                    text: '"Het belangrijkste ingrediënt is liefde. Zonder liefde is het gewoon pasta met saus, maar met liefde wordt het een warme omhelzing op een bord." - ',
                                },
                                {
                                    type: "text",
                                    marks: [{ type: "em" }],
                                    text: "Oma Pietje, 1924-2018",
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "heading",
                    attrs: { level: 2 },
                    content: [
                        {
                            type: "text",
                            text: "Benodigdheden",
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Zorg ervoor dat je de volgende ingrediënten in huis hebt voordat je begint:",
                        },
                    ],
                },
                {
                    type: "heading",
                    attrs: { level: 3 },
                    content: [
                        {
                            type: "text",
                            text: "Voor de Pasta:",
                        },
                    ],
                },
                {
                    type: "bullet_list",
                    content: [
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "500g ",
                                        },
                                        {
                                            type: "text",
                                            marks: [{ type: "strong" }],
                                            text: "spaghetti",
                                        },
                                        {
                                            type: "text",
                                            text: " (bij voorkeur Italiaans merk)",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "Ruim water voor het koken",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "Grofkorrelig zeezout",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "heading",
                    attrs: { level: 3 },
                    content: [
                        {
                            type: "text",
                            text: "Voor de Geheime Saus:",
                        },
                    ],
                },
                {
                    type: "bullet_list",
                    content: [
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "800g verse tomaten ",
                                        },
                                        {
                                            type: "text",
                                            marks: [{ type: "em" }],
                                            text: "(of 2 blikken San Marzano tomaten)",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "6 tenen knoflook, fijngehakt",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "2 grote uien, gesnipperd",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "500g ",
                                        },
                                        {
                                            type: "text",
                                            marks: [{ type: "strong" }],
                                            text: "gehakt",
                                        },
                                        {
                                            type: "text",
                                            text: " (half rund, half varken)",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "1 wortel, fijn gesneden",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "1 stengel bleekselderij, fijngehakt",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "150ml ",
                                        },
                                        {
                                            type: "text",
                                            marks: [{ type: "strong" }],
                                            text: "rode wijn",
                                        },
                                        {
                                            type: "text",
                                            text: " (Chianti of Sangiovese)",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "Een snufje ",
                                        },
                                        {
                                            type: "text",
                                            marks: [
                                                { type: "underline" },
                                                { type: "strong" },
                                            ],
                                            text: "kaneel",
                                        },
                                        {
                                            type: "text",
                                            text: " (het geheime ingrediënt!)",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "Verse basilicum en peterselie",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "Extra vergine olijfolie",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "Zout en vers gemalen peper",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "heading",
                    attrs: { level: 2 },
                    content: [
                        {
                            type: "text",
                            text: "Stap-voor-Stap Bereiding",
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Volg deze stappen ",
                        },
                        {
                            type: "text",
                            marks: [{ type: "em" }],
                            text: "precies",
                        },
                        {
                            type: "text",
                            text: " zoals oma dat deed. Haast je niet - goede spaghetti heeft tijd nodig!",
                        },
                    ],
                },
                {
                    type: "ordered_list",
                    attrs: { start: 1 },
                    content: [
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            marks: [{ type: "strong" }],
                                            text: "Voorbereiding:",
                                        },
                                        {
                                            type: "text",
                                            text: ' Snijd alle groenten fijn en zorg dat alles klaarstaat. Oma zei altijd: "Een goede ',
                                        },
                                        {
                                            type: "text",
                                            marks: [{ type: "em" }],
                                            text: "mise en place",
                                        },
                                        {
                                            type: "text",
                                            text: ' is het halve werk."',
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            marks: [{ type: "strong" }],
                                            text: "Basis saus maken:",
                                        },
                                        {
                                            type: "text",
                                            text: " Verhit olijfolie in een grote, zware pan en bak de ui, wortel en selderij 10 minuten op laag vuur tot ze zacht zijn.",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            marks: [{ type: "strong" }],
                                            text: "Knoflook toevoegen:",
                                        },
                                        {
                                            type: "text",
                                            text: " Voeg de knoflook toe en bak nog 2 minuten. Let op dat het niet verbrandt!",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            marks: [{ type: "strong" }],
                                            text: "Gehakt bakken:",
                                        },
                                        {
                                            type: "text",
                                            text: " Verhoog het vuur en voeg het gehakt toe. Bak tot het mooi bruin is en alle vocht verdampt is.",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            marks: [{ type: "strong" }],
                                            text: "Wijn toevoegen:",
                                        },
                                        {
                                            type: "text",
                                            text: " Giet de rode wijn erbij en laat het 5 minuten inkoken. Dit geeft de saus een rijke smaak.",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            marks: [{ type: "strong" }],
                                            text: "Tomaten en het geheime ingrediënt:",
                                        },
                                        {
                                            type: "text",
                                            text: " Voeg de tomaten toe, breek ze met een houten lepel. Nu komt het geheim: voeg een ",
                                        },
                                        {
                                            type: "text",
                                            marks: [{ type: "underline" }],
                                            text: "kleine",
                                        },
                                        {
                                            type: "text",
                                            text: " snufje kaneel toe!",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            marks: [{ type: "strong" }],
                                            text: "Langzaam sudderen:",
                                        },
                                        {
                                            type: "text",
                                            text: " Laat de saus minimaal 3 uur op heel laag vuur sudderen. Roer af en toe om. Dit is ",
                                        },
                                        {
                                            type: "text",
                                            marks: [{ type: "em" }],
                                            text: "cruciaal",
                                        },
                                        {
                                            type: "text",
                                            text: " voor de smaak!",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            marks: [{ type: "strong" }],
                                            text: "Spaghetti koken:",
                                        },
                                        {
                                            type: "text",
                                            text: " Kook de spaghetti ",
                                        },
                                        {
                                            type: "text",
                                            marks: [{ type: "strong" }],
                                            text: "al dente",
                                        },
                                        {
                                            type: "text",
                                            text: " volgens de verpakking. Bewaar een kopje pastawater!",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            marks: [{ type: "strong" }],
                                            text: "Combineren:",
                                        },
                                        {
                                            type: "text",
                                            text: " Meng de pasta door de saus. Voeg eventueel wat pastawater toe voor de perfecte consistentie.",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            marks: [{ type: "strong" }],
                                            text: "Serveren:",
                                        },
                                        {
                                            type: "text",
                                            text: " Garneer met verse basilicum en geraspte Parmezaan. Serveer ",
                                        },
                                        {
                                            type: "text",
                                            marks: [{ type: "em" }],
                                            text: "onmiddellijk",
                                        },
                                        {
                                            type: "text",
                                            text: " met warme borden!",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "heading",
                    attrs: { level: 2 },
                    content: [
                        {
                            type: "text",
                            text: "Tijdschema en Tips",
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Voor het beste resultaat, plan je tijd goed in:",
                        },
                    ],
                },
                {
                    type: "table",
                    content: [
                        {
                            type: "table_row",
                            content: [
                                {
                                    type: "table_header",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [
                                                {
                                                    type: "text",
                                                    text: "Tijdstip",
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: "table_header",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [
                                                {
                                                    type: "text",
                                                    text: "Activiteit",
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: "table_header",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [
                                                {
                                                    type: "text",
                                                    text: "Tip",
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "table_row",
                            content: [
                                {
                                    type: "table_cell",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [
                                                {
                                                    type: "text",
                                                    text: "14:00",
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: "table_cell",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [
                                                {
                                                    type: "text",
                                                    text: "Start met de saus",
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: "table_cell",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [
                                                {
                                                    type: "text",
                                                    text: "Zorg voor rustige middag",
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "table_row",
                            content: [
                                {
                                    type: "table_cell",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [
                                                {
                                                    type: "text",
                                                    text: "17:00",
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: "table_cell",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [
                                                {
                                                    type: "text",
                                                    text: "Saus is klaar, pasta koken",
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: "table_cell",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [
                                                {
                                                    type: "text",
                                                    text: "Warm de borden voor",
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "table_row",
                            content: [
                                {
                                    type: "table_cell",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [
                                                {
                                                    type: "text",
                                                    text: "17:30",
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: "table_cell",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [
                                                {
                                                    type: "text",
                                                    text: "Serveren!",
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: "table_cell",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [
                                                {
                                                    type: "text",
                                                    marks: [{ type: "strong" }],
                                                    text: "Geniet ervan!",
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "heading",
                    attrs: { level: 2 },
                    content: [
                        {
                            type: "text",
                            text: "Veelgemaakte Fouten",
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Let goed op deze punten om teleurstellingen te voorkomen:",
                        },
                    ],
                },
                {
                    type: "bullet_list",
                    content: [
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            marks: [{ type: "strikethrough" }],
                                            text: "Niet te veel kaneel",
                                        },
                                        {
                                            type: "text",
                                            text: " - een snufje is genoeg!",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "Laat de saus ",
                                        },
                                        {
                                            type: "text",
                                            marks: [{ type: "underline" }],
                                            text: "echt",
                                        },
                                        {
                                            type: "text",
                                            text: " 3 uur sudderen - dit is geen modern recept waarbij alles snel moet",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "Kook de pasta nooit te lang - al dente is perfect",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "Gebruik verse kruiden waar mogelijk",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "horizontal_rule",
                },
                {
                    type: "heading",
                    attrs: { level: 2 },
                    content: [
                        {
                            type: "text",
                            text: "Variaties en Bewaren",
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Oma maakte ook verschillende variaties van dit recept. Hier zijn enkele ideeën voor als je het recept onder de knie hebt:",
                        },
                    ],
                },
                {
                    type: "ordered_list",
                    attrs: { start: 1 },
                    content: [
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            marks: [{ type: "strong" }],
                                            text: "Vegetarische versie:",
                                        },
                                        {
                                            type: "text",
                                            text: " Vervang het gehakt door fijngehakte champignons en aubergine",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            marks: [{ type: "strong" }],
                                            text: "Extra rijke versie:",
                                        },
                                        {
                                            type: "text",
                                            text: " Voeg wat room toe in de laatste 10 minuten",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            marks: [{ type: "strong" }],
                                            text: "Bewaren:",
                                        },
                                        {
                                            type: "text",
                                            text: " De saus wordt zelfs nog lekkerder na een dag. Bewaar in de koelkast en warm op",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "code_block",
                    content: [
                        {
                            type: "text",
                            text: "💡 Oma's Tip: Maak dubbele portie saus!\n\nVries de helft in voor drukke dagen.\nDe saus blijft 3 maanden goed in de vriezer.\nOntdooi langzaam in de koelkast voor beste smaak.",
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Heb je dit recept geprobeerd? Deel je foto's op ",
                        },
                        {
                            type: "text",
                            marks: [
                                {
                                    type: "link",
                                    attrs: {
                                        href: "https://instagram.com/omasrecepten",
                                        target: "_blank",
                                    },
                                },
                            ],
                            text: "Instagram",
                        },
                        {
                            type: "text",
                            text: " met ",
                        },
                        {
                            type: "text",
                            marks: [{ type: "code" }],
                            text: "#omasgeheimespaghetti",
                        },
                        {
                            type: "text",
                            text: " of stuur me een berichtje op ",
                        },
                        {
                            type: "text",
                            marks: [
                                {
                                    type: "link",
                                    attrs: {
                                        href: "mailto:maria@familiebergen.nl",
                                        target: "_blank",
                                    },
                                },
                            ],
                            text: "maria@familiebergen.nl",
                        },
                        {
                            type: "text",
                            text: "!",
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            marks: [{ type: "em" }],
                            text: "Smakelijk eten! En vergeet niet: het geheim zit in de liefde. 🍝❤️",
                        },
                    ],
                },
            ],
        },
    },
    tags: ["schema:full"],
};

// Simple Blog Editor Configuration
export const BlogEditor: Story = {
    args: {
        ...defaultArgs,
        storyTitle: "Simple Blog Editor",
        storyDescription:
            "Blog-style editor with essential formatting tools for article writing.",
        storyInteractions: [
            "Create article structure with headings (H1-H4)",
            "Write paragraphs with basic text formatting",
            "Add blockquotes for excerpts or citations",
            "Create bullet and numbered lists",
            "Insert links and images for blog content",
        ],
        allowedNodes: [
            NodeType.DOC,
            NodeType.TEXT,
            NodeType.PARAGRAPH,
            NodeType.HEADING,
            NodeType.BLOCKQUOTE,
            NodeType.BULLET_LIST,
            NodeType.ORDERED_LIST,
            NodeType.LIST_ITEM,
            NodeType.FILER_IMAGE,
            NodeType.HORIZONTAL_RULE,
            NodeType.HARD_BREAK,
        ],
        allowedMarks: [
            MarkType.STRONG,
            MarkType.ITALIC,
            MarkType.LINK,
            MarkType.CODE,
        ],
        initialContent: {
            type: "doc",
            content: [
                {
                    type: "heading",
                    attrs: { level: 1 },
                    content: [
                        {
                            type: "text",
                            text: "Welcome to My Blog",
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "This is a ",
                        },
                        {
                            type: "text",
                            marks: [{ type: "strong" }],
                            text: "blog-style editor",
                        },
                        {
                            type: "text",
                            text: " perfect for content creation. It includes all the essential formatting tools you need for writing articles.",
                        },
                    ],
                },
                {
                    type: "heading",
                    attrs: { level: 2 },
                    content: [
                        {
                            type: "text",
                            text: "Features included:",
                        },
                    ],
                },
                {
                    type: "bullet_list",
                    content: [
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "Headings (H1-H6)",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "Rich text formatting (bold, italic, links)",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "Lists and blockquotes",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "Image support",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    },
    name: "Blog editor",
    tags: ["schema:partial"],
};

// Documentation Editor Configuration
export const DocumentationEditor: Story = {
    args: {
        ...defaultArgs,
        storyTitle: "Technical Documentation",
        storyDescription:
            "Documentation editor with code blocks, tables, and technical formatting.",
        storyInteractions: [
            "Write structured documentation with headings",
            "Insert code blocks with syntax highlighting",
            "Create tables for data and comparisons",
            "Use inline code for technical terms",
            "Add links to API references and external docs",
        ],
        allowedNodes: [
            NodeType.DOC,
            NodeType.TEXT,
            NodeType.PARAGRAPH,
            NodeType.HEADING,
            NodeType.CODE_BLOCK,
            NodeType.BLOCKQUOTE,
            NodeType.BULLET_LIST,
            NodeType.ORDERED_LIST,
            NodeType.LIST_ITEM,
            NodeType.TABLE,
            NodeType.TABLE_ROW,
            NodeType.TABLE_CELL,
            NodeType.TABLE_HEADER,
            NodeType.HORIZONTAL_RULE,
        ],
        allowedMarks: [
            MarkType.STRONG,
            MarkType.ITALIC,
            MarkType.LINK,
            MarkType.CODE,
            MarkType.STRIKETHROUGH,
        ],
        initialContent: {
            type: "doc",
            content: [
                {
                    type: "heading",
                    attrs: { level: 1 },
                    content: [
                        {
                            type: "text",
                            text: "API Documentation",
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "This editor is configured for technical documentation with support for code blocks, tables, and comprehensive formatting.",
                        },
                    ],
                },
                {
                    type: "heading",
                    attrs: { level: 2 },
                    content: [
                        {
                            type: "text",
                            text: "Code Example",
                        },
                    ],
                },
                {
                    type: "code_block",
                    content: [
                        {
                            type: "text",
                            text: "function getUserData(id) {\n  return fetch(`/api/users/${id}`)\n    .then(response => response.json())\n    .catch(error => console.error(error));\n}",
                        },
                    ],
                },
                {
                    type: "heading",
                    attrs: { level: 2 },
                    content: [
                        {
                            type: "text",
                            text: "API Endpoints",
                        },
                    ],
                },
                {
                    type: "table",
                    content: [
                        {
                            type: "table_row",
                            content: [
                                {
                                    type: "table_header",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [
                                                {
                                                    type: "text",
                                                    text: "Method",
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: "table_header",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [
                                                {
                                                    type: "text",
                                                    text: "Endpoint",
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: "table_header",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [
                                                {
                                                    type: "text",
                                                    text: "Description",
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "table_row",
                            content: [
                                {
                                    type: "table_cell",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [
                                                {
                                                    type: "text",
                                                    marks: [{ type: "code" }],
                                                    text: "GET",
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: "table_cell",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [
                                                {
                                                    type: "text",
                                                    marks: [{ type: "code" }],
                                                    text: "/api/users",
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: "table_cell",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [
                                                {
                                                    type: "text",
                                                    text: "Retrieve all users",
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    },
    tags: ["schema:partial"],
};

// Minimal Note-Taking Editor
export const MinimalNoteEditor: Story = {
    args: {
        ...defaultArgs,
        storyTitle: "Note Taking",
        storyDescription:
            "Minimal editor for quick notes with basic formatting and lists.",
        storyInteractions: [
            "Quickly jot down thoughts in paragraphs",
            "Create bullet and numbered lists for organization",
            "Use basic text formatting (bold, italic)",
            "Simple interface focused on content over formatting",
            "Perfect for rapid note-taking and brainstorming",
        ],
        allowedNodes: [
            NodeType.DOC,
            NodeType.TEXT,
            NodeType.PARAGRAPH,
            NodeType.BULLET_LIST,
            NodeType.ORDERED_LIST,
            NodeType.LIST_ITEM,
            NodeType.HARD_BREAK,
        ],
        allowedMarks: [
            MarkType.STRONG,
            MarkType.ITALIC,
            MarkType.STRIKETHROUGH,
        ],
        resize: "vertical",
        initialContent: {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Quick Notes",
                        },
                    ],
                },
                {
                    type: "bullet_list",
                    content: [
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "Simple text formatting",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "Lists for organization",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            marks: [{ type: "strikethrough" }],
                                            text: "Cross out completed tasks",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    },
    tags: ["schema:partial"],
};

// Rich Content Editor (Full Features)
export const RichContentEditor: Story = {
    args: {
        ...defaultArgs,
        storyTitle: "Rich Content Creation",
        storyDescription:
            "Full-featured editor demonstrating all available formatting capabilities.",
        storyInteractions: [
            "Explore every formatting option available",
            "Combine multiple marks (bold + italic + underline)",
            "Create complex nested structures",
            "Test all node types and their interactions",
            "Experiment with advanced layout options",
        ],
        // All nodes and marks enabled
        allowedNodes: Object.values(NodeType),
        allowedMarks: Object.values(MarkType),
        resize: "both",
        initialContent: {
            type: "doc",
            content: [
                {
                    type: "heading",
                    attrs: { level: 1 },
                    content: [
                        {
                            type: "text",
                            text: "Rich Content Editor Showcase",
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "This editor demonstrates the full capabilities of Django ProseMirror with all features enabled.",
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "image",
                            attrs: {
                                src: "https://picsum.photos/500/200?random=2",
                                alt: "Sample content image",
                                title: "Rich Content Example",
                                caption: "Images with captions",
                                imageId: "rich-content-img",
                            },
                        },
                    ],
                },
                {
                    type: "blockquote",
                    content: [
                        {
                            type: "paragraph",
                            content: [
                                {
                                    type: "text",
                                    text: '"The best way to find out if you can trust somebody is to trust them." - ',
                                },
                                {
                                    type: "text",
                                    marks: [{ type: "em" }],
                                    text: "Ernest Hemingway",
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Advanced features include ",
                        },
                        {
                            type: "text",
                            marks: [{ type: "strong" }, { type: "underline" }],
                            text: "combined formatting",
                        },
                        {
                            type: "text",
                            text: ", ",
                        },
                        {
                            type: "text",
                            marks: [
                                {
                                    type: "link",
                                    attrs: {
                                        href: "https://example.com",
                                        target: "_blank",
                                    },
                                },
                            ],
                            text: "hyperlinks",
                        },
                        {
                            type: "text",
                            text: ", and ",
                        },
                        {
                            type: "text",
                            marks: [{ type: "code" }],
                            text: "inline code",
                        },
                        {
                            type: "text",
                            text: ".",
                        },
                    ],
                },
            ],
        },
    },
    tags: ["schema:partial"],
};

// Comment System Editor
export const CommentEditor: Story = {
    args: {
        ...defaultArgs,
        storyTitle: "Comment System",
        storyDescription:
            "Simple editor for user comments with basic formatting options.",
        storyInteractions: [
            "Write simple comments with paragraph breaks",
            "Add basic lists for structured feedback",
            "Use limited formatting appropriate for comments",
            "Focus on content rather than complex formatting",
            "Designed for user-generated content scenarios",
        ],
        allowedNodes: [
            NodeType.DOC,
            NodeType.TEXT,
            NodeType.PARAGRAPH,
            NodeType.BULLET_LIST,
            NodeType.ORDERED_LIST,
            NodeType.LIST_ITEM,
        ],
        allowedMarks: [MarkType.STRONG, MarkType.ITALIC, MarkType.LINK],
        resize: "none",
        initialContent: {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "This looks great! I especially like the way you handled the user interface.",
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "A few suggestions:",
                        },
                    ],
                },
                {
                    type: "bullet_list",
                    content: [
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "Consider adding error handling for edge cases",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "The documentation could be more detailed",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Overall, ",
                        },
                        {
                            type: "text",
                            marks: [{ type: "strong" }],
                            text: "excellent work!",
                        },
                    ],
                },
            ],
        },
    },
    tags: ["schema:partial"],
};

// Email Composer Editor
export const EmailEditor: Story = {
    args: {
        ...defaultArgs,
        storyTitle: "Email Composition",
        storyDescription:
            "Email-style editor with formatting suitable for professional communication.",
        storyInteractions: [
            "Write professional emails with proper structure",
            "Use basic formatting for emphasis and clarity",
            "Create lists for bullet points and action items",
            "Add blockquotes for replies or citations",
            "Format content suitable for business communication",
        ],
        allowedNodes: [
            NodeType.DOC,
            NodeType.TEXT,
            NodeType.PARAGRAPH,
            NodeType.BULLET_LIST,
            NodeType.ORDERED_LIST,
            NodeType.LIST_ITEM,
            NodeType.BLOCKQUOTE,
            NodeType.HORIZONTAL_RULE,
            NodeType.HARD_BREAK,
        ],
        allowedMarks: [
            MarkType.STRONG,
            MarkType.ITALIC,
            MarkType.UNDERLINE,
            MarkType.LINK,
        ],
        resize: "vertical",
        initialContent: {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Dear Team,",
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "I hope this email finds you well. I wanted to update you on our project progress and upcoming milestones.",
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            marks: [{ type: "strong" }],
                            text: "Completed this week:",
                        },
                    ],
                },
                {
                    type: "bullet_list",
                    content: [
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "User authentication system",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "Database migration scripts",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Please let me know if you have any questions.",
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Best regards,",
                        },
                        {
                            type: "hard_break",
                        },
                        {
                            type: "text",
                            text: "Project Manager",
                        },
                    ],
                },
            ],
        },
    },
    tags: ["schema:partial"],
};
