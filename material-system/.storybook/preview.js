import type { Preview } from '@storybook/vue3'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
      color: /(background|color)$/i,
      date: /Date$/i,
    },
  },
  actions: { argTypesRegex: '^on[A-Z].*' },
  backgrounds: {
    default: 'light',
  },
  docs: {
    story: {
      inline: false,
    },
  },
},
}

export default preview
