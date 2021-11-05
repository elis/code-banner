import * as React from 'react'
import * as Server from 'react-dom/server'
import { render } from 'react-dom'
import { Panel } from './panel'
import { CommService } from './services/comms.services'
import { ConfigService } from './services/config.service'

const App = () => {
  return (
    <CommService>
      <ConfigService>
        <Panel />
      </ConfigService>
    </CommService>
  )
}

render(<App />, document.getElementById('root'))
