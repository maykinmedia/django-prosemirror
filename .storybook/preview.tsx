import type { Preview } from "@storybook/preact-vite";

const preview: Preview = {
    decorators: [
        (Story, context) => {
            document.body.style = `
              font-family: "Arial";
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
