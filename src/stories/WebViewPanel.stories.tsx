import * as React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { Panel } from '../client/panel'
import * as HeaderStories from './Header.stories'

export default {
  title: 'WebView Panel',
  component: Panel,
} as ComponentMeta<typeof Panel>

const Template: ComponentStory<typeof Panel> = (args) => <Panel {...args} />

export const LoggedIn = Template.bind({})
LoggedIn.args = {
  // More on composing args: https://storybook.js.org/docs/react/writing-stories/args#args-composition
  ...HeaderStories.LoggedIn.args,
}

export const LoggedOut = Template.bind({})
LoggedOut.args = {
  ...HeaderStories.LoggedOut.args,
}
