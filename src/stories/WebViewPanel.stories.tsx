import * as React from 'react'
import styled from 'styled-components'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { Panel } from '../client/panel'
import * as HeaderStories from './Header.stories'
import { ConfigServiceContext } from '../client/services/config.service'
import { useDarkMode } from 'storybook-dark-mode'
import { mock } from './files.mock'

export default {
  title: 'WebView Panel',
  component: Panel,
} as ComponentMeta<typeof Panel>

const ThemedWrapper = styled.div`
  color: #fff;
`

const Template: ComponentStory<typeof Panel> = (args) => {
  const content = (
    <ConfigServiceContext.Provider value={mock}>
      <Panel {...args} />
    </ConfigServiceContext.Provider>
  )
  return useDarkMode() ? <ThemedWrapper>{content}</ThemedWrapper> : content
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
