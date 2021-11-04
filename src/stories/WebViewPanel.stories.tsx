import * as React from 'react'
import { ComponentMeta, ComponentStory } from '@storybook/react'

import { Panel } from '../client/panel'
import * as HeaderStories from './Header.stories'
import { ConfigServiceContext } from '../client/services/config.service'
import { useDarkMode } from 'storybook-dark-mode'
import { mock } from './files.mock'

export default {
  title: 'WebView Panel',
  component: Panel,
} as ComponentMeta<typeof Panel>

const Template: ComponentStory<typeof Panel> = (args) => {
  const content = (
    <ConfigServiceContext.Provider value={mock}>
      <Panel {...args} />
    </ConfigServiceContext.Provider>
  )
  return useDarkMode() ? (
    <div style={{ color: '#FFF' }}>
      <>{content}</>
    </div>
  ) : (
    content
  )
}

export const LoggedIn = Template.bind({})
LoggedIn.args = {
  // More on composing args: https://storybook.js.org/docs/react/writing-stories/args#args-composition
  ...HeaderStories.LoggedIn.args,
}

export const LoggedOut = Template.bind({})
LoggedOut.args = {
  ...HeaderStories.LoggedOut.args,
}
