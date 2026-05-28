import type { Meta, StoryObj } from '@storybook/vue3'
import PageTitle from './PageTitle.vue'

const meta = {
  title: 'Components/PageTitle',
  component: PageTitle,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
  },
} satisfies Meta<typeof PageTitle>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: '页面标题示例',
  },
}

export const LongTitle: Story = {
  args: {
    title: '这是一个比较长的页面标题，用来测试标题显示效果',
  },
}
