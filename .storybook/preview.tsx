import type { Preview } from "@storybook/preact-vite";
import { StoryStore } from "storybook/internal/preview-api";

const preview: Preview = {
    decorators: [
        (Story, context) => {
            document.body.style = `
              font-family: "Nunito Sans", -apple-system, ".SFNSText-Regular", "San Francisco", BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif;
              margin: 40px;
            `;
            return Story(context);
        },
    ],
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
    },
};

export default preview;
